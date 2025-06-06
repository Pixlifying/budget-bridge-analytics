
import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, filterByDate, filterByMonth } from '@/utils/calculateUtils';
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
  pages_count: number;
  amount_per_page: number;
  total_amount: number;
  margin: number;
}

const Photostat = () => {
  const [photostats, setPhotostats] = useState<PhotostatEntry[]>([]);
  const [filteredPhotostats, setFilteredPhotostats] = useState<PhotostatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<PhotostatEntry | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    pages_count: 1,
    amount_per_page: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    pages_count: 1,
    amount_per_page: 0,
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
        pages_count: entry.pages_count,
        amount_per_page: Number(entry.amount_per_page),
        total_amount: Number(entry.total_amount),
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
    } else {
      setFilteredPhotostats(filterByMonth(photostats, date));
    }
  }, [date, viewMode, photostats]);

  const handleAddPhotostat = async () => {
    if (!newEntry.pages_count || !newEntry.amount_per_page) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const totalAmount = newEntry.pages_count * newEntry.amount_per_page;
      
      const { data, error } = await supabase
        .from('photostats')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          pages_count: newEntry.pages_count,
          amount_per_page: newEntry.amount_per_page,
          total_amount: totalAmount,
          margin: totalAmount // 100% margin as specified
        })
        .select();

      if (error) throw error;

      const newPhotostat: PhotostatEntry = {
        id: data[0].id,
        date: new Date(data[0].date),
        pages_count: data[0].pages_count,
        amount_per_page: Number(data[0].amount_per_page),
        total_amount: Number(data[0].total_amount),
        margin: Number(data[0].margin)
      };

      setPhotostats(prev => [newPhotostat, ...prev]);
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        pages_count: 1,
        amount_per_page: 0,
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
      const totalAmount = editForm.pages_count * editForm.amount_per_page;
      
      const { error } = await supabase
        .from('photostats')
        .update({
          date: new Date(editForm.date).toISOString(),
          pages_count: editForm.pages_count,
          amount_per_page: editForm.amount_per_page,
          total_amount: totalAmount,
          margin: totalAmount // 100% margin as specified
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      setPhotostats(prev => 
        prev.map(item => 
          item.id === editingEntry.id
            ? {
                ...item,
                date: new Date(editForm.date),
                pages_count: editForm.pages_count,
                amount_per_page: editForm.amount_per_page,
                total_amount: totalAmount,
                margin: totalAmount
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
      pages_count: entry.pages_count,
      amount_per_page: entry.amount_per_page
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Photostat Services Report</title>
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
          <h1>Photostat Services Report</h1>
          <div class="total">Total Pages: ${totalPages} | Total Amount: ₹${totalAmount.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Pages Count</th>
                <th>Amount per Page</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPhotostats.map((photostat) => `
                <tr>
                  <td>${format(photostat.date, 'dd/MM/yyyy')}</td>
                  <td>${photostat.pages_count}</td>
                  <td>₹${photostat.amount_per_page.toFixed(2)}</td>
                  <td>₹${photostat.total_amount.toFixed(2)}</td>
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

  const totalPages = filteredPhotostats.reduce((sum, entry) => sum + entry.pages_count, 0);
  const totalAmount = filteredPhotostats.reduce((sum, entry) => sum + entry.total_amount, 0);

  return (
    <PageWrapper
      title="Photostat Services"
      subtitle="Manage photostat services and view analytics"
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
      {/* Add Photostat Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Photostat Entry</h3>
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
            <Label htmlFor="pages_count">Number of Pages</Label>
            <Input
              id="pages_count"
              type="number"
              value={newEntry.pages_count}
              onChange={(e) => setNewEntry(prev => ({ ...prev, pages_count: Number(e.target.value) }))}
              placeholder="Pages"
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="amount_per_page">Amount per Page</Label>
            <Input
              id="amount_per_page"
              type="number"
              value={newEntry.amount_per_page}
              onChange={(e) => setNewEntry(prev => ({ ...prev, amount_per_page: Number(e.target.value) }))}
              placeholder="Amount per page"
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
          title="Total Pages"
          value={totalPages.toString()}
          icon={<FileText size={20} />}
        />
        <StatCard 
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={<FileText size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotostats.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No photostat entries found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredPhotostats.map(entry => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Photostat Entry"
              date={entry.date}
              data={{
                'Pages': entry.pages_count,
                'Amount per Page': formatCurrency(entry.amount_per_page),
                'Total Amount': formatCurrency(entry.total_amount)
              }}
              labels={{
                'Pages': 'Pages',
                'Amount per Page': 'Amount per Page',
                'Total Amount': 'Total Amount'
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
              <DialogTitle>Edit Photostat Entry</DialogTitle>
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
                <Label htmlFor="edit_pages_count">Number of Pages</Label>
                <Input
                  id="edit_pages_count"
                  type="number"
                  value={editForm.pages_count}
                  onChange={(e) => setEditForm(prev => ({ ...prev, pages_count: Number(e.target.value) }))}
                  placeholder="Pages"
                  min="1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_amount_per_page">Amount per Page</Label>
                <Input
                  id="edit_amount_per_page"
                  type="number"
                  value={editForm.amount_per_page}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount_per_page: Number(e.target.value) }))}
                  placeholder="Amount per page"
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
