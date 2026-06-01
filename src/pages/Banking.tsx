import { useState, useEffect, useRef } from 'react';
import { useHighlight } from '@/hooks/useHighlight';
import { CreditCard, Plus, Edit, Trash2, Printer, Upload, ArrowDownCircle, ArrowUpCircle, Send, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, filterByDate, filterByMonth, filterByQuarter, calculateBankingServicesMargin } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/ui/ServiceCard';
import PageSkeleton from '@/components/ui/PageSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const TRANSACTION_TYPES = [
  'Withdrawal',
  'AEPS Cash Withdrawal',
  'AEPS Cash Deposit',
  'Savings Deposit By Cash',
  'IMPS Transaction',
  'Electricity Bill',
] as const;

type Category = 'Deposit' | 'Withdrawal' | 'IMPS' | 'Electricity';

const categorize = (type?: string | null): Category | null => {
  if (!type) return null;
  const t = type.toLowerCase();
  if (t.includes('deposit')) return 'Deposit';
  if (t.includes('withdraw')) return 'Withdrawal';
  if (t.includes('imps')) return 'IMPS';
  if (t.includes('electric')) return 'Electricity';
  return null;
};

const CATEGORY_DEFAULT_TYPE: Record<Category, string> = {
  Deposit: 'Savings Deposit By Cash',
  Withdrawal: 'Withdrawal',
  IMPS: 'IMPS Transaction',
  Electricity: 'Electricity Bill',
};

interface BankingEntry {
  id: string;
  date: Date;
  amount: number;
  margin: number;
  transaction_count: number;
  extra_amount: number;
  transaction_type?: string | null;
  created_at?: string;
}

const Banking = () => {
  const [bankingEntries, setBankingEntries] = useState<BankingEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<BankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<BankingEntry | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'quarter'>('day');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');
  const { isHighlighted, dateParam } = useHighlight();

  useEffect(() => {
    if (dateParam) {
      const navDate = new Date(dateParam);
      if (!isNaN(navDate.getTime())) {
        setDate(navDate);
        setViewMode('month');
      }
    }
  }, [dateParam]);

  // Form state for inline entry (single transaction entry)
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    transaction_type: 'Savings Deposit By Cash' as string,
    transaction_count: 1,
    amount: 0,
    extra_amount: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    amount: 0,
    transaction_count: 1,
    extra_amount: 0,
    transaction_type: '',
  });

  const fetchBankingEntries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount: Number(entry.amount),
        margin: Number(entry.margin),
        transaction_count: Number(entry.transaction_count),
        extra_amount: Number(entry.extra_amount || 0),
        transaction_type: (entry as any).transaction_type ?? null,
        created_at: entry.created_at
      }));

      setBankingEntries(formattedData);
    } catch (error) {
      console.error('Error fetching banking entries:', error);
      toast.error('Failed to load banking entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingEntries();
  }, []);

  useEffect(() => {
    let filtered: BankingEntry[];
    if (viewMode === 'day') {
      filtered = filterByDate(bankingEntries, date);
    } else if (viewMode === 'month') {
      filtered = filterByMonth(bankingEntries, date);
    } else {
      filtered = filterByQuarter(bankingEntries, date);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        String(e.amount).includes(q) ||
        String(e.transaction_count).includes(q) ||
        String(e.margin).includes(q)
      );
    }

    setFilteredEntries(filtered);
  }, [date, viewMode, bankingEntries, searchQuery]);

  // Category-aggregated stats from filtered entries
  const categoryStats: Record<Category, { count: number; amount: number; margin: number }> = {
    Deposit: { count: 0, amount: 0, margin: 0 },
    Withdrawal: { count: 0, amount: 0, margin: 0 },
    IMPS: { count: 0, amount: 0, margin: 0 },
    Electricity: { count: 0, amount: 0, margin: 0 },
  };
  filteredEntries.forEach(e => {
    const c = categorize(e.transaction_type);
    if (!c) return;
    categoryStats[c].count += e.transaction_count;
    categoryStats[c].amount += e.amount;
    categoryStats[c].margin += e.margin;
  });

  const visibleEntries = categoryFilter === 'All'
    ? filteredEntries
    : filteredEntries.filter(e => categorize(e.transaction_type) === categoryFilter);

  // Group visible entries by date (yyyy-MM-dd) so each date shows as a single row
  interface GroupedRow {
    dateKey: string;
    date: Date;
    ids: string[];
    cats: Record<Category, number>;
    transaction_count: number;
    amount: number;
    extra_amount: number;
    margin: number;
  }
  const groupedRows: GroupedRow[] = (() => {
    const map = new Map<string, GroupedRow>();
    visibleEntries.forEach(e => {
      const key = format(e.date, 'yyyy-MM-dd');
      let row = map.get(key);
      if (!row) {
        row = {
          dateKey: key,
          date: e.date,
          ids: [],
          cats: { Deposit: 0, Withdrawal: 0, IMPS: 0, Electricity: 0 },
          transaction_count: 0,
          amount: 0,
          extra_amount: 0,
          margin: 0,
        };
        map.set(key, row);
      }
      row.ids.push(e.id);
      const c = categorize(e.transaction_type);
      if (c) row.cats[c] += e.amount;
      row.transaction_count += e.transaction_count;
      row.amount += e.amount;
      row.extra_amount += e.extra_amount || 0;
      row.margin += e.margin;
    });
    return Array.from(map.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  })();

  const handleDeleteGroup = async (ids: string[]) => {
    try {
      const { error } = await supabase.from('banking_services').delete().in('id', ids);
      if (error) throw error;
      setBankingEntries(prev => prev.filter(e => !ids.includes(e.id)));
      toast.success(`Deleted ${ids.length} entr${ids.length === 1 ? 'y' : 'ies'}`);
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast.error('Failed to delete entries');
    }
  };

  // Process CSV/Excel file using PapaParse
  const processFile = async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let rows: any[] = [];
      
      if (fileExtension === 'csv') {
        const result = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject,
          });
        });
        rows = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      } else {
        toast.error('Please upload a CSV or Excel file');
        return;
      }

      if (rows.length === 0) {
        toast.error('No data found in file');
        return;
      }

      // Find AMOUNT, TRANSACTION TYPE, and BBPS columns (case-insensitive)
      const headers = Object.keys(rows[0]);
      const amountKey = headers.find(h => h.toUpperCase().includes('AMOUNT'));
      const typeKey = headers.find(h => h.toUpperCase().replace(/\s+/g, '').includes('TRANSACTIONTYPE'))
        || headers.find(h => h.toUpperCase() === 'TYPE');
      const bbpsKey = headers.find(h => h.toUpperCase().includes('BBPS'))
        || headers.find(h => h.toUpperCase().includes('ELECTRIC'));

      if (!amountKey) {
        toast.error('AMOUNT column not found in file');
        return;
      }

      // Group rows by category
      const groups: Record<Category, { amount: number; extra: number; count: number }> = {
        Deposit: { amount: 0, extra: 0, count: 0 },
        Withdrawal: { amount: 0, extra: 0, count: 0 },
        IMPS: { amount: 0, extra: 0, count: 0 },
        Electricity: { amount: 0, extra: 0, count: 0 },
      };
      let uncategorized = 0;

      const parseNum = (v: any): number => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') return parseFloat(v.replace(/[₹$,\s]/g, '')) || 0;
        return 0;
      };

      rows.forEach((row) => {
        const amount = parseNum(row[amountKey]);
        const rawType = typeKey ? String(row[typeKey] ?? '') : '';
        let cat = categorize(rawType);

        // BBPS column → Electricity (count entry; amount may be 0, margin nil)
        const bbpsAmount = bbpsKey ? parseNum(row[bbpsKey]) : 0;
        if (bbpsKey && (bbpsAmount > 0 || /bbps|electric/i.test(rawType))) {
          groups.Electricity.amount += bbpsAmount;
          groups.Electricity.count++;
          return;
        }

        if (amount <= 0) return;
        if (!cat) { uncategorized++; return; }

        if (amount > 10000) {
          groups[cat].amount += 10000;
          groups[cat].extra += (amount - 10000);
        } else {
          groups[cat].amount += amount;
        }
        groups[cat].count++;
      });

      const inserts = (Object.keys(groups) as Category[])
        .filter(c => groups[c].count > 0)
        .map(c => ({
          date: new Date().toISOString(),
          amount: groups[c].amount,
          // Electricity has no margin
          margin: c === 'Electricity' ? 0 : calculateBankingServicesMargin(groups[c].amount),
          transaction_count: groups[c].count,
          extra_amount: groups[c].extra,
          transaction_type: CATEGORY_DEFAULT_TYPE[c],
        }));

      if (inserts.length === 0) {
        toast.error('No valid categorized transactions found' + (uncategorized ? ` (${uncategorized} skipped)` : ''));
        return;
      }

      const { data, error } = await supabase
        .from('banking_services')
        .insert(inserts as any)
        .select();

      if (error) throw error;

      if (data) {
        const newEntries: BankingEntry[] = data.map((d: any) => ({
          id: d.id,
          date: new Date(d.date),
          amount: Number(d.amount),
          margin: Number(d.margin),
          transaction_count: Number(d.transaction_count),
          extra_amount: Number(d.extra_amount || 0),
          transaction_type: d.transaction_type ?? null,
          created_at: d.created_at,
        }));
        setBankingEntries(prev => [...newEntries, ...prev]);
        toast.success(`Imported ${inserts.length} category groups${uncategorized ? ` (${uncategorized} uncategorized skipped)` : ''}`);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.amount || newEntry.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      const cat = categorize(newEntry.transaction_type);
      const isElectricity = cat === 'Electricity';
      const margin = isElectricity ? 0 : calculateBankingServicesMargin(newEntry.amount);
      const insertRow = {
        date: new Date(newEntry.date).toISOString(),
        amount: newEntry.amount,
        margin,
        transaction_count: newEntry.transaction_count || 1,
        extra_amount: newEntry.extra_amount || 0,
        transaction_type: newEntry.transaction_type || null,
      };
      const { data, error } = await supabase.from('banking_services').insert(insertRow as any).select();
      if (error) throw error;
      if (data && data.length > 0) {
        const d: any = data[0];
        setBankingEntries(prev => [{
          id: d.id,
          date: new Date(d.date),
          amount: Number(d.amount),
          margin: Number(d.margin),
          transaction_count: Number(d.transaction_count),
          extra_amount: Number(d.extra_amount || 0),
          transaction_type: d.transaction_type ?? null,
          created_at: d.created_at,
        }, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          transaction_type: 'Savings Deposit By Cash',
          transaction_count: 1,
          amount: 0,
          extra_amount: 0,
        });
        toast.success('Banking entry added');
      }
    } catch (error) {
      console.error('Error adding banking entry:', error);
      toast.error('Failed to add banking entry');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    try {
      const margin = calculateBankingServicesMargin(editForm.amount);
      
      const { error } = await supabase
        .from('banking_services')
        .update({
          date: new Date(editForm.date).toISOString(),
          amount: editForm.amount,
          margin: margin,
          transaction_count: editForm.transaction_count,
          extra_amount: editForm.extra_amount,
          transaction_type: editForm.transaction_type || null,
        } as any)
        .eq('id', editingEntry.id);

      if (error) throw error;

      const updatedEntry: BankingEntry = {
        ...editingEntry,
        date: new Date(editForm.date),
        amount: editForm.amount,
        margin: margin,
        transaction_count: editForm.transaction_count,
        extra_amount: editForm.extra_amount,
        transaction_type: editForm.transaction_type || null,
      };

      setBankingEntries(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      toast.success('Banking entry updated successfully');
    } catch (error) {
      console.error('Error updating banking entry:', error);
      toast.error('Failed to update banking entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banking_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBankingEntries(prev => prev.filter(entry => entry.id !== id));
      toast.success('Banking entry deleted successfully');
    } catch (error) {
      console.error('Error deleting banking entry:', error);
      toast.error('Failed to delete banking entry');
    }
  };

  const openEditEntry = (entry: BankingEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      amount: entry.amount,
      transaction_count: entry.transaction_count,
      extra_amount: entry.extra_amount || 0,
      transaction_type: entry.transaction_type || '',
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Banking Report</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Banking Report</h1>
          <div class="total">Total Entries: ${totalEntries} | Total Amount: ₹${totalAmount.toFixed(2)} | Total Margin: ₹${totalMargin.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction Count</th>
                <th>Amount</th>
                <th>Extra Amount</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries.map((entry) => `
                <tr>
                  <td>${escapeHtml(format(entry.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(entry.transaction_count.toString())}</td>
                  <td>₹${escapeHtml(entry.amount.toFixed(2))}</td>
                  <td>₹${escapeHtml((entry.extra_amount || 0).toFixed(2))}</td>
                  <td>₹${escapeHtml(entry.margin.toFixed(2))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  // Count distinct dates rather than raw row count
  const totalEntries = new Set(filteredEntries.map(e => format(e.date, 'yyyy-MM-dd'))).size;
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalTransactions = filteredEntries.reduce((sum, entry) => sum + entry.transaction_count, 0);
  const totalExtraAmount = filteredEntries.reduce((sum, entry) => sum + (entry.extra_amount || 0), 0);
  const totalMargin = filteredEntries.reduce((sum, entry) => sum + entry.margin, 0);

  if (isLoading) return <PageSkeleton type="cards" />;

  return (
    <PageWrapper
      title="Banking"
      subtitle="Manage banking transactions and view analytics"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Search by amount, count..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[180px] h-9 bg-sidebar-accent text-sidebar-accent-foreground placeholder:text-sidebar-accent-foreground/50 border-sidebar-border"
            />
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton
              data={bankingEntries}
              filename="banking-data"
              currentData={filteredEntries}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} className="mr-2" />
              Browse
            </Button>
          </div>
        </div>
      }
    >
      {/* Add Banking Entry Form */}
      <div className="mb-6 p-4 bg-card backdrop-blur-sm rounded-lg shadow-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Add Banking Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" value={newEntry.date}
              onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="entry_type">Transaction Type</Label>
            <Select value={newEntry.transaction_type}
              onValueChange={(v) => setNewEntry(prev => ({ ...prev, transaction_type: v }))}>
              <SelectTrigger id="entry_type"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="t_count">Transactions</Label>
            <Input id="t_count" type="number" min="1" value={newEntry.transaction_count}
              onChange={(e) => setNewEntry(prev => ({ ...prev, transaction_count: Number(e.target.value) }))} />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" min="0" value={newEntry.amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))} />
          </div>
          <div>
            <Label htmlFor="extra">Extra Amount</Label>
            <Input id="extra" type="number" min="0" value={newEntry.extra_amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, extra_amount: Number(e.target.value) }))} />
          </div>
          <Button onClick={handleAddEntry}>Save</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          * Margin is auto-calculated (Electricity has no margin). Extra amount is saved separately.
        </p>
      </div>

      {/* Category blocks — click to filter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {([
          { key: 'Deposit' as Category, icon: <ArrowDownCircle size={20} /> },
          { key: 'Withdrawal' as Category, icon: <ArrowUpCircle size={20} /> },
          { key: 'IMPS' as Category, icon: <Send size={20} /> },
          { key: 'Electricity' as Category, icon: <Zap size={20} /> },
        ]).map(({ key, icon }) => {
          const s = categoryStats[key];
          const active = categoryFilter === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategoryFilter(active ? 'All' : key)}
              className={`text-left rounded-xl border p-4 transition-all hover:scale-[1.02] ${active ? 'border-primary ring-2 ring-primary/40 bg-primary/5' : 'border-border bg-card'}`}
            >
              <div className="flex items-center justify-between mb-2 text-muted-foreground">
                <span className="text-sm font-medium">{key}</span>
                {icon}
              </div>
              <div className="text-2xl font-bold text-foreground">{s.count}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatCurrency(s.amount)} · margin {formatCurrency(s.margin)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard title="Total Entries" value={totalEntries.toString()} icon={<CreditCard size={20} />} />
        <StatCard title="Total Transactions" value={totalTransactions.toString()} icon={<CreditCard size={20} />} />
        <StatCard title="Total Amount" value={formatCurrency(totalAmount)} icon={<CreditCard size={20} />} />
        <StatCard title="Extra Amount" value={formatCurrency(totalExtraAmount)} icon={<CreditCard size={20} />} />
        <StatCard title="Total Margin" value={formatCurrency(totalMargin)} icon={<CreditCard size={20} />} />
      </div>

      {visibleEntries.length === 0 ? (
        <EmptyState
          icon="data"
          title="No Banking Entries"
          description={`No banking entries found for this ${viewMode === 'day' ? 'day' : viewMode === 'month' ? 'month' : 'quarter'}. Add your first entry above.`}
          actionLabel="Add Entry"
          onAction={() => document.getElementById('amount')?.focus()}
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Withdrawal</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">IMPS</TableHead>
                <TableHead className="text-right">Electricity</TableHead>
                <TableHead className="text-right">Transaction</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Extra Amount</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedRows.map(row => {
                const cell = (k: Category) => row.cats[k] > 0 ? formatCurrency(row.cats[k]) : '-';
                const singleEntry = row.ids.length === 1
                  ? bankingEntries.find(e => e.id === row.ids[0])
                  : null;
                const highlighted = row.ids.some(id => isHighlighted(id));
                return (
                <TableRow
                  key={row.dateKey}
                  data-record-id={row.ids[0]}
                  className={highlighted ? 'search-highlight' : ''}
                >
                  <TableCell>{format(row.date, 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-right">{cell('Withdrawal')}</TableCell>
                  <TableCell className="text-right">{cell('Deposit')}</TableCell>
                  <TableCell className="text-right">{cell('IMPS')}</TableCell>
                  <TableCell className="text-right">{cell('Electricity')}</TableCell>
                  <TableCell className="text-right">{row.transaction_count}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.extra_amount)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(row.margin)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {singleEntry && (
                        <Button size="sm" variant="outline" onClick={() => openEditEntry(singleEntry)}>
                          <Edit size={14} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200"
                        onClick={() => handleDeleteGroup(row.ids)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Banking Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_date">Date</Label>
              <Input
                id="edit_date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_transaction_type">Transaction Type</Label>
              <Select
                value={editForm.transaction_type || ''}
                onValueChange={(v) => setEditForm(prev => ({ ...prev, transaction_type: v }))}
              >
                <SelectTrigger id="edit_transaction_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSACTION_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_transaction_count">Transaction Count</Label>
              <Input
                id="edit_transaction_count"
                type="number"
                value={editForm.transaction_count}
                onChange={(e) => setEditForm(prev => ({ ...prev, transaction_count: Number(e.target.value) }))}
                placeholder="Transaction count"
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_amount">Amount</Label>
              <Input
                id="edit_amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="Amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_extra_amount">Extra Amount</Label>
              <Input
                id="edit_extra_amount"
                type="number"
                value={editForm.extra_amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, extra_amount: Number(e.target.value) }))}
                placeholder="Extra Amount"
              />
            </div>
            <Button onClick={handleEditEntry}>Update Banking Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Banking;
