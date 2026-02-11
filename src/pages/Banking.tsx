import { useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, Edit, Trash2, Printer, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, filterByDate, filterByMonth, filterByQuarter, calculateBankingServicesMargin } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/ui/ServiceCard';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface BankingEntry {
  id: string;
  date: Date;
  amount: number;
  margin: number;
  transaction_count: number;
  extra_amount: number;
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

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    transaction_count: 1,
    extra_amount: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    amount: 0,
    transaction_count: 1,
    extra_amount: 0,
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
    if (viewMode === 'day') {
      setFilteredEntries(filterByDate(bankingEntries, date));
    } else if (viewMode === 'month') {
      setFilteredEntries(filterByMonth(bankingEntries, date));
    } else {
      setFilteredEntries(filterByQuarter(bankingEntries, date));
    }
  }, [date, viewMode, bankingEntries]);

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

      // Find AMOUNT and TRANSACTION ID columns (case-insensitive)
      const headers = Object.keys(rows[0]);
      const amountKey = headers.find(h => h.toUpperCase().includes('AMOUNT'));
      const transactionIdKey = headers.find(h => 
        h.toUpperCase().includes('TRANSACTION') || 
        h.toUpperCase().includes('TXN') ||
        h.toUpperCase().includes('ID')
      );

      if (!amountKey) {
        toast.error('AMOUNT column not found in file');
        return;
      }

      // Process each row and calculate amounts
      let totalAmount = 0;
      let extraAmount = 0;
      let transactionCount = 0;

      rows.forEach((row) => {
        let amount = 0;
        const amountValue = row[amountKey];
        
        if (typeof amountValue === 'number') {
          amount = amountValue;
        } else if (typeof amountValue === 'string') {
          const cleanedAmount = amountValue.replace(/[₹$,\s]/g, '');
          amount = parseFloat(cleanedAmount) || 0;
        }

        if (amount <= 0) return;

        // If amount > 10000, cap at 10000 and add excess to extra_amount
        if (amount > 10000) {
          totalAmount += 10000;
          extraAmount += (amount - 10000);
        } else {
          totalAmount += amount;
        }

        transactionCount++;
      });

      if (transactionCount === 0) {
        toast.error('No valid transactions found in file');
        return;
      }

      // Calculate margin only on the capped amount (not extra_amount)
      const margin = calculateBankingServicesMargin(totalAmount);

      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        amount: totalAmount,
        transaction_count: transactionCount,
        extra_amount: extraAmount,
      });

      toast.success(`Extracted ${transactionCount} transactions. Total: ₹${totalAmount.toLocaleString()}, Extra: ₹${extraAmount.toLocaleString()}`);

      // Auto-save the entry
      const { data, error } = await supabase
        .from('banking_services')
        .insert({
          date: new Date().toISOString(),
          amount: totalAmount,
          margin: margin,
          transaction_count: transactionCount,
          extra_amount: extraAmount,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newBankingEntry: BankingEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          amount: Number(data[0].amount),
          margin: Number(data[0].margin),
          transaction_count: Number(data[0].transaction_count),
          extra_amount: Number(data[0].extra_amount || 0),
          created_at: data[0].created_at
        };

        setBankingEntries(prev => [newBankingEntry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          transaction_count: 1,
          extra_amount: 0,
        });
        toast.success('Banking entry saved successfully');
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
    if (!newEntry.amount || !newEntry.transaction_count) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const margin = calculateBankingServicesMargin(newEntry.amount);
      
      const { data, error } = await supabase
        .from('banking_services')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          amount: newEntry.amount,
          margin: margin,
          transaction_count: newEntry.transaction_count,
          extra_amount: newEntry.extra_amount,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newBankingEntry: BankingEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          amount: Number(data[0].amount),
          margin: Number(data[0].margin),
          transaction_count: Number(data[0].transaction_count),
          extra_amount: Number(data[0].extra_amount || 0),
          created_at: data[0].created_at
        };

        setBankingEntries(prev => [newBankingEntry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          transaction_count: 1,
          extra_amount: 0,
        });
        toast.success('Banking entry added successfully');
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
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      const updatedEntry: BankingEntry = {
        ...editingEntry,
        date: new Date(editForm.date),
        amount: editForm.amount,
        margin: margin,
        transaction_count: editForm.transaction_count,
        extra_amount: editForm.extra_amount,
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

  const totalEntries = filteredEntries.length;
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalTransactions = filteredEntries.reduce((sum, entry) => sum + entry.transaction_count, 0);
  const totalExtraAmount = filteredEntries.reduce((sum, entry) => sum + (entry.extra_amount || 0), 0);
  const totalMargin = filteredEntries.reduce((sum, entry) => sum + entry.margin, 0);

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
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton
              data={bankingEntries}
              filename="banking-data"
              currentData={filteredEntries}
            />
          </div>
        </div>
      }
    >
      {/* Add Banking Entry Form */}
      <div className="mb-6 p-4 bg-card backdrop-blur-sm rounded-lg shadow-lg border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Add Banking Entry</h3>
          <div className="flex items-center gap-2">
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
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1"
            >
              <Upload size={14} />
              Browse CSV/Excel
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="transaction_count">Transaction Count</Label>
            <Input
              id="transaction_count"
              type="number"
              value={newEntry.transaction_count}
              onChange={(e) => setNewEntry(prev => ({ ...prev, transaction_count: Number(e.target.value) }))}
              placeholder="Transaction count"
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (Max ₹10,000/txn)</Label>
            <Input
              id="amount"
              type="number"
              value={newEntry.amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="Amount"
            />
          </div>
          <div>
            <Label htmlFor="extra_amount">Extra Amount</Label>
            <Input
              id="extra_amount"
              type="number"
              value={newEntry.extra_amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, extra_amount: Number(e.target.value) }))}
              placeholder="Extra Amount"
            />
          </div>
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          * Margin is calculated only on Amount (capped at ₹10,000 per transaction). Extra amount is saved separately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard 
          title="Total Entries"
          value={totalEntries.toString()}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Transactions"
          value={totalTransactions.toString()}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Extra Amount"
          value={formatCurrency(totalExtraAmount)}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          icon={<CreditCard size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEntries.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No banking entries found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredEntries.map(entry => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Banking Entry"
              date={entry.date}
              data={{
                transactions: entry.transaction_count,
                amount: formatCurrency(entry.amount),
                extra_amount: formatCurrency(entry.extra_amount),
                margin: formatCurrency(entry.margin)
              }}
              labels={{
                transactions: 'Transactions',
                amount: 'Amount',
                extra_amount: 'Extra Amount',
                margin: 'Margin'
              }}
              onEdit={() => openEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))
        )}
      </div>

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
