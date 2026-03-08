import { useState, useEffect } from 'react';
import { useHighlight } from '@/hooks/useHighlight';
import { FileText, Printer, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, filterByDate, filterByMonth, filterByQuarter } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface DocumentationEntry {
  id: string;
  date: Date;
  name: string;
  service_type: string;
  custom_service: string | null;
  mobile: string | null;
  amount: number;
  expense: number;
  created_at?: string;
}

const SERVICE_TYPES = ['Deceased', 'Car', 'PCL', 'Other'];

const Documentation = () => {
  const [entries, setEntries] = useState<DocumentationEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DocumentationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<DocumentationEntry | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'quarter'>('day');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
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

  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    service_type: 'Deceased',
    custom_service: '',
    mobile: '',
    amount: 0,
    expense: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    name: '',
    service_type: 'Deceased',
    custom_service: '',
    mobile: '',
    amount: 0,
    expense: 0,
  });

  const fetchEntries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documentation')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        service_type: entry.service_type,
        custom_service: entry.custom_service,
        mobile: entry.mobile,
        amount: Number(entry.amount),
        expense: Number(entry.expense),
        created_at: entry.created_at,
      }));

      setEntries(formattedData);
    } catch (error) {
      console.error('Error fetching documentation entries:', error);
      toast.error('Failed to load documentation entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  useEffect(() => {
    let filtered: DocumentationEntry[];
    if (viewMode === 'day') {
      filtered = filterByDate(entries, date);
    } else if (viewMode === 'month') {
      filtered = filterByMonth(entries, date);
    } else {
      filtered = filterByQuarter(entries, date);
    }

    if (serviceFilter !== 'all') {
      filtered = filtered.filter(e => e.service_type === serviceFilter);
    }

    setFilteredEntries(filtered);
  }, [date, viewMode, entries, serviceFilter]);

  const handleAddEntry = async () => {
    if (!newEntry.name || !newEntry.service_type) {
      toast.error('Please fill in Name and Service Type');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('documentation')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          name: newEntry.name,
          service_type: newEntry.service_type,
          custom_service: newEntry.service_type === 'Other' ? newEntry.custom_service : null,
          mobile: newEntry.mobile || null,
          amount: newEntry.amount,
          expense: newEntry.expense,
        })
        .select();

      if (error) throw error;

      // Also save expense
      if (newEntry.expense > 0) {
        await supabase.from('expenses').insert({
          date: new Date(newEntry.date).toISOString(),
          name: `Documentation - ${newEntry.name}`,
          amount: newEntry.expense,
        });
      }

      if (data && data.length > 0) {
        const newDoc: DocumentationEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          name: data[0].name,
          service_type: data[0].service_type,
          custom_service: data[0].custom_service,
          mobile: data[0].mobile,
          amount: Number(data[0].amount),
          expense: Number(data[0].expense),
          created_at: data[0].created_at,
        };
        setEntries(prev => [newDoc, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          name: '',
          service_type: 'Deceased',
          custom_service: '',
          mobile: '',
          amount: 0,
          expense: 0,
        });
        toast.success('Documentation entry added successfully');
      }
    } catch (error) {
      console.error('Error adding documentation entry:', error);
      toast.error('Failed to add documentation entry');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('documentation')
        .update({
          date: new Date(editForm.date).toISOString(),
          name: editForm.name,
          service_type: editForm.service_type,
          custom_service: editForm.service_type === 'Other' ? editForm.custom_service : null,
          mobile: editForm.mobile || null,
          amount: editForm.amount,
          expense: editForm.expense,
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      // Update or insert expense - prevent double entry
      if (editForm.expense > 0) {
        const oldExpenseName = `Documentation - ${editingEntry.name}`;
        const newExpenseName = `Documentation - ${editForm.name}`;
        
        const { data: existingExpense } = await supabase
          .from('expenses')
          .select('id')
          .eq('name', oldExpenseName)
          .gte('date', format(editingEntry.date, 'yyyy-MM-dd'))
          .lt('date', format(editingEntry.date, 'yyyy-MM-dd') + 'T23:59:59.999')
          .limit(1);
        
        if (existingExpense && existingExpense.length > 0) {
          await supabase
            .from('expenses')
            .update({ name: newExpenseName, amount: editForm.expense, date: new Date(editForm.date).toISOString() })
            .eq('id', existingExpense[0].id);
        } else {
          await supabase
            .from('expenses')
            .insert({
              date: new Date(editForm.date).toISOString(),
              name: newExpenseName,
              amount: editForm.expense,
            });
        }
      }

      const updatedEntry: DocumentationEntry = {
        ...editingEntry,
        date: new Date(editForm.date),
        name: editForm.name,
        service_type: editForm.service_type,
        custom_service: editForm.service_type === 'Other' ? editForm.custom_service : null,
        mobile: editForm.mobile || null,
        amount: editForm.amount,
        expense: editForm.expense,
      };

      setEntries(prev => prev.map(e => e.id === editingEntry.id ? updatedEntry : e));
      setEditingEntry(null);
      toast.success('Documentation entry updated successfully');
    } catch (error) {
      console.error('Error updating documentation entry:', error);
      toast.error('Failed to update documentation entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documentation')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Documentation entry deleted successfully');
    } catch (error) {
      console.error('Error deleting documentation entry:', error);
      toast.error('Failed to delete documentation entry');
    }
  };

  const openEditEntry = (entry: DocumentationEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      name: entry.name,
      service_type: entry.service_type,
      custom_service: entry.custom_service || '',
      mobile: entry.mobile || '',
      amount: entry.amount,
      expense: entry.expense,
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Documentation Report</title>
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
          <h1>Documentation Report</h1>
          <div class="total">Total Entries: ${filteredEntries.length} | Total Amount: ₹${totalAmount.toFixed(2)} | Total Expense: ₹${totalExpense.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Service Type</th>
                <th>Mobile</th>
                <th>Amount</th>
                <th>Expense</th>
              </tr>
            </thead>
            <tbody>
              ${filteredEntries.map(entry => `
                <tr>
                  <td>${escapeHtml(format(entry.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(entry.name)}</td>
                  <td>${escapeHtml(entry.service_type === 'Other' ? (entry.custom_service || 'Other') : entry.service_type)}</td>
                  <td>${escapeHtml(entry.mobile || '-')}</td>
                  <td>₹${escapeHtml(entry.amount.toFixed(2))}</td>
                  <td>₹${escapeHtml(entry.expense.toFixed(2))}</td>
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
  const totalAmount = filteredEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalExpense = filteredEntries.reduce((sum, e) => sum + e.expense, 0);

  return (
    <PageWrapper
      title="Documentation"
      subtitle="Manage documentation services"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker
            date={date}
            onDateChange={setDate}
            mode={viewMode}
            onModeChange={setViewMode}
          />
          <div className="flex gap-2">
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {SERVICE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton
              data={entries}
              filename="documentation-data"
              currentData={filteredEntries}
            />
          </div>
        </div>
      }
    >
      {/* Add Entry Form */}
      <div className="mb-6 p-4 bg-card backdrop-blur-sm rounded-lg shadow-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Add Documentation Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
          <div>
            <Label htmlFor="doc_date">Date</Label>
            <Input
              id="doc_date"
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="doc_name">Name</Label>
            <Input
              id="doc_name"
              value={newEntry.name}
              onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Name"
            />
          </div>
          <div>
            <Label htmlFor="doc_service">Service Type</Label>
            <Select
              value={newEntry.service_type}
              onValueChange={(val) => setNewEntry(prev => ({ ...prev, service_type: val, custom_service: val !== 'Other' ? '' : prev.custom_service }))}
            >
              <SelectTrigger id="doc_service">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {newEntry.service_type === 'Other' && (
            <div>
              <Label htmlFor="doc_custom">Custom Service</Label>
              <Input
                id="doc_custom"
                value={newEntry.custom_service}
                onChange={(e) => setNewEntry(prev => ({ ...prev, custom_service: e.target.value }))}
                placeholder="Service name"
              />
            </div>
          )}
          <div>
            <Label htmlFor="doc_mobile">Mobile</Label>
            <Input
              id="doc_mobile"
              value={newEntry.mobile}
              onChange={(e) => setNewEntry(prev => ({ ...prev, mobile: e.target.value }))}
              placeholder="Mobile"
            />
          </div>
          <div>
            <Label htmlFor="doc_amount">Amount</Label>
            <Input
              id="doc_amount"
              type="number"
              value={newEntry.amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="Amount"
            />
          </div>
          <div>
            <Label htmlFor="doc_expense">Expense</Label>
            <Input
              id="doc_expense"
              type="number"
              value={newEntry.expense}
              onChange={(e) => setNewEntry(prev => ({ ...prev, expense: Number(e.target.value) }))}
              placeholder="Expense"
            />
          </div>
          <Button onClick={handleAddEntry}>Save</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Entries" value={totalEntries.toString()} icon={<FileText size={20} />} />
        <StatCard title="Total Amount" value={formatCurrency(totalAmount)} icon={<FileText size={20} />} />
        <StatCard title="Total Expense" value={formatCurrency(totalExpense)} icon={<FileText size={20} />} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mobile</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Expense</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filteredEntries.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No entries found for this {viewMode === 'day' ? 'day' : viewMode === 'month' ? 'month' : 'quarter'}.</td></tr>
            ) : (
              filteredEntries.map(entry => (
                <tr key={entry.id} data-record-id={entry.id} className={`border-b border-border hover:bg-muted/30 ${isHighlighted(entry.id) ? 'search-highlight' : ''}`}>
                  <td className="px-4 py-3">{format(entry.date, 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3">{entry.name}</td>
                  <td className="px-4 py-3">{entry.service_type === 'Other' ? (entry.custom_service || 'Other') : entry.service_type}</td>
                  <td className="px-4 py-3">{entry.mobile || '-'}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(entry.amount)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(entry.expense)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditEntry(entry)}>
                        <Edit size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)} className="text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Documentation Entry</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={editForm.date} onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Service Type</Label>
              <Select value={editForm.service_type} onValueChange={(val) => setEditForm(prev => ({ ...prev, service_type: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.service_type === 'Other' && (
              <div className="grid gap-2">
                <Label>Custom Service</Label>
                <Input value={editForm.custom_service} onChange={(e) => setEditForm(prev => ({ ...prev, custom_service: e.target.value }))} />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Mobile</Label>
              <Input value={editForm.mobile} onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Amount</Label>
              <Input type="number" value={editForm.amount} onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))} />
            </div>
            <div className="grid gap-2">
              <Label>Expense</Label>
              <Input type="number" value={editForm.expense} onChange={(e) => setEditForm(prev => ({ ...prev, expense: Number(e.target.value) }))} />
            </div>
            <Button onClick={handleEditEntry}>Update Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Documentation;
