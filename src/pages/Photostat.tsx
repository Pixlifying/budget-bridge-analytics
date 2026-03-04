
import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, filterByDate, filterByMonth, filterByQuarter } from '@/utils/calculateUtils';
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

interface PhotostatEntry {
  id: string;
  date: Date;
  amount: number;
  expense: number;
  margin: number;
}

const Photostat = () => {
  const [photostats, setPhotostats] = useState<PhotostatEntry[]>([]);
  const [filteredPhotostats, setFilteredPhotostats] = useState<PhotostatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<PhotostatEntry | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'quarter'>('day');

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    expense: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    amount: 0,
    expense: 0,
  });

  const fetchPhotostats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('photostats')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount: Number(entry.amount),
        expense: Number(entry.expense || 0),
        margin: Number(entry.margin)
      }));

      setPhotostats(formattedData);
    } catch (error) {
      console.error('Error fetching photostats:', error);
      toast.error('Failed to load photostat entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotostats();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredPhotostats(filterByDate(photostats, date));
    } else if (viewMode === 'month') {
      setFilteredPhotostats(filterByMonth(photostats, date));
    } else {
      setFilteredPhotostats(filterByQuarter(photostats, date));
    }
  }, [date, viewMode, photostats]);

  const handleAddPhotostat = async () => {
    if (!newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const margin = newEntry.amount - newEntry.expense;
      
      const { data, error } = await supabase
        .from('photostats')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          amount: newEntry.amount,
          expense: newEntry.expense,
          margin: margin
        })
        .select();

      if (error) throw error;

      // Save expense to expenses table
      if (newEntry.expense > 0) {
        await supabase
          .from('expenses')
          .insert({
            date: new Date(newEntry.date).toISOString(),
            name: 'Photostat Service',
            amount: newEntry.expense,
          });
      }

      const newPhotostat: PhotostatEntry = {
        id: data[0].id,
        date: new Date(data[0].date),
        amount: Number(data[0].amount),
        expense: Number(data[0].expense || 0),
        margin: Number(data[0].margin)
      };

      setPhotostats(prev => [newPhotostat, ...prev]);
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        expense: 0,
      });
      toast.success('Photostat entry added successfully');
    } catch (error) {
      console.error('Error adding photostat:', error);
      toast.error('Failed to add photostat entry');
    }
  };

  const handleEditPhotostat = async () => {
    if (!editingEntry) return;

    try {
      const margin = editForm.amount - editForm.expense;
      
      const { error } = await supabase
        .from('photostats')
        .update({
          date: new Date(editForm.date).toISOString(),
          amount: editForm.amount,
          expense: editForm.expense,
          margin: margin
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      // Update or insert expense
      if (editForm.expense > 0) {
        await supabase
          .from('expenses')
          .upsert({
            date: new Date(editForm.date).toISOString(),
            name: 'Photostat Service',
            amount: editForm.expense,
          });
      }

      setPhotostats(prev => 
        prev.map(item => 
          item.id === editingEntry.id
            ? {
                ...item,
                date: new Date(editForm.date),
                amount: editForm.amount,
                expense: editForm.expense,
                margin: margin
              }
            : item
        )
      );

      toast.success('Photostat entry updated successfully');
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating photostat:', error);
      toast.error('Failed to update photostat entry');
    }
  };

  const handleDeletePhotostat = async (id: string) => {
    try {
      const { error } = await supabase
        .from('photostats')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPhotostats(prev => prev.filter(item => item.id !== id));
      toast.success('Photostat entry deleted successfully');
    } catch (error) {
      console.error('Error deleting photostat:', error);
      toast.error('Failed to delete photostat entry');
    }
  };

  const openEditForm = (entry: PhotostatEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      amount: entry.amount,
      expense: entry.expense
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print / Photostat Services Report</title>
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
          <h1>Print / Photostat Services Report</h1>
          <div class="total">Total Entries: ${filteredPhotostats.length} | Total Margin: ₹${totalAmount.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Expense</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPhotostats.map((photostat) => `
                <tr>
                  <td>${format(photostat.date, 'dd/MM/yyyy')}</td>
                  <td>₹${photostat.amount.toFixed(2)}</td>
                  <td>₹${photostat.expense.toFixed(2)}</td>
                  <td>₹${photostat.margin.toFixed(2)}</td>
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

  const totalAmount = filteredPhotostats.reduce((sum, entry) => sum + entry.margin, 0);

  return (
    <PageWrapper
      title="Print / Photostat Services"
      subtitle="Manage print and photostat services and view analytics"
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
              data={photostats}
              filename="photostat-data"
              currentData={filteredPhotostats}
            />
          </div>
        </div>
      }
    >
      {/* Add Print / Photostat Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Print / Photostat Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={newEntry.amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="Amount"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="expense">Expense</Label>
            <Input
              id="expense"
              type="number"
              value={newEntry.expense}
              onChange={(e) => setNewEntry(prev => ({ ...prev, expense: Number(e.target.value) }))}
              placeholder="Expense"
              min="0"
            />
          </div>
          <Button onClick={handleAddPhotostat}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard 
          title="Total Entries"
          value={filteredPhotostats.length.toString()}
          icon={<FileText size={20} />}
        />
        <StatCard 
          title="Total Margin"
          value={formatCurrency(totalAmount)}
          icon={<FileText size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotostats.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No print / photostat entries found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredPhotostats.map(entry => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Print / Photostat Entry"
              date={entry.date}
              data={{
                'Amount': formatCurrency(entry.amount),
                'Expense': formatCurrency(entry.expense),
                'Margin': formatCurrency(entry.margin)
              }}
              labels={{
                'Amount': 'Amount',
                'Expense': 'Expense',
                'Margin': 'Margin'
              }}
              onEdit={() => openEditForm(entry)}
              onDelete={() => handleDeletePhotostat(entry.id)}
            />
          ))
        )}
      </div>

      {/* Edit Entry Dialog */}
      {editingEntry && (
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Print / Photostat Entry</DialogTitle>
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
                <Label htmlFor="edit_amount">Amount</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="Amount"
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_expense">Expense</Label>
                <Input
                  id="edit_expense"
                  type="number"
                  value={editForm.expense}
                  onChange={(e) => setEditForm(prev => ({ ...prev, expense: Number(e.target.value) }))}
                  placeholder="Expense"
                  min="0"
                />
              </div>
              <Button onClick={handleEditPhotostat}>Update Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageWrapper>
  );
};

export default Photostat;
