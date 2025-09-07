
import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, filterByDate, filterByMonth } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import { format } from 'date-fns';

interface ApplicationEntry {
  id: string;
  date: Date;
  customer_name: string;
  pages_count: number;
  amount: number;
  created_at?: string;
}

const Applications = () => {
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<ApplicationEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterMode, setFilterMode] = useState<'day' | 'month'>('day');

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    pages_count: 1,
    amount: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    customer_name: '',
    pages_count: 1,
    amount: 0,
  });

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('applications')
        .select('*')
        .order('date', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        customer_name: entry.customer_name,
        pages_count: Number(entry.pages_count),
        amount: Number(entry.amount),
        created_at: entry.created_at
      }));

      console.log('Applications data fetched:', formattedData.length, 'for date:', selectedDate, 'mode:', filterMode);
      setApplications(formattedData);
      applyDateFilter(formattedData, selectedDate, filterMode);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications data');
    } finally {
      setIsLoading(false);
    }
  };

  const applyDateFilter = (data: ApplicationEntry[], date: Date, mode: 'day' | 'month') => {
    if (mode === 'day') {
      const filtered = filterByDate(data, date);
      setFilteredApplications(filtered);
    } else {
      const filtered = filterByMonth(data, date);
      setFilteredApplications(filtered);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyDateFilter(applications, selectedDate, filterMode);
  }, [selectedDate, filterMode, applications]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleModeChange = (mode: 'day' | 'month') => {
    setFilterMode(mode);
  };

  const handleAddEntry = async () => {
    if (!newEntry.customer_name || !newEntry.pages_count || !newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          customer_name: newEntry.customer_name,
          pages_count: newEntry.pages_count,
          amount: newEntry.amount,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newApplicationEntry: ApplicationEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          customer_name: data[0].customer_name,
          pages_count: Number(data[0].pages_count),
          amount: Number(data[0].amount),
          created_at: data[0].created_at
        };

        setApplications(prev => [newApplicationEntry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          customer_name: '',
          pages_count: 1,
          amount: 0,
        });
        toast.success('Application added successfully');
      }
    } catch (error) {
      console.error('Error adding application:', error);
      toast.error('Failed to add application');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          date: new Date(editForm.date).toISOString(),
          customer_name: editForm.customer_name,
          pages_count: editForm.pages_count,
          amount: editForm.amount,
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      const updatedEntry: ApplicationEntry = {
        ...editingEntry,
        date: new Date(editForm.date),
        customer_name: editForm.customer_name,
        pages_count: editForm.pages_count,
        amount: editForm.amount,
      };

      setApplications(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      toast.success('Application updated successfully');
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => prev.filter(entry => entry.id !== id));
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const openEditEntry = (entry: ApplicationEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      customer_name: entry.customer_name,
      pages_count: entry.pages_count,
      amount: entry.amount,
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Applications Report</title>
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
          <h1>Applications Report</h1>
          <div class="total">Total Applications: ${totalApplications} | Total Amount: ₹${totalAmount.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Pages</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredApplications.map((application) => `
                <tr>
                  <td>${escapeHtml(format(application.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(application.customer_name)}</td>
                  <td>${escapeHtml(application.pages_count.toString())}</td>
                  <td>₹${escapeHtml(application.amount.toFixed(2))}</td>
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

  const totalApplications = filteredApplications.length;
  const totalAmount = filteredApplications.reduce((sum, app) => sum + app.amount, 0);

  return (
    <PageWrapper
      title="Applications"
      subtitle="Manage your application services"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker
            date={selectedDate}
            onDateChange={handleDateChange}
            mode={filterMode}
            onModeChange={handleModeChange}
          />
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton 
              data={applications}
              filename="applications"
              currentData={filteredApplications}
            />
          </div>
        </div>
      }
    >
      {/* Add Application Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Application</h3>
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
            <Label htmlFor="customer">Customer Name</Label>
            <Input
              id="customer"
              value={newEntry.customer_name}
              onChange={(e) => setNewEntry(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label htmlFor="pages">Number of Pages</Label>
            <Input
              id="pages"
              type="number"
              value={newEntry.pages_count}
              onChange={(e) => setNewEntry(prev => ({ ...prev, pages_count: Number(e.target.value) }))}
              placeholder="Pages"
              min="1"
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
            />
          </div>
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ServiceCard 
          id="summary-applications"
          title="Total Applications"
          date={selectedDate}
          data={{ 
            value: totalApplications,
          }}
          labels={{ 
            value: "Count",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-blue-50"
          showActions={false}
        />
        <ServiceCard 
          id="summary-amount"
          title="Total Amount"
          date={selectedDate}
          data={{ 
            value: formatCurrency(totalAmount),
          }}
          labels={{ 
            value: "Amount",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-emerald-50"
          showActions={false}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading applications data...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Applications</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {applications.length > 0 
              ? `No applications found for the selected ${filterMode === 'day' ? 'day' : 'month'}.` 
              : 'Add a new application to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={`Application - ${entry.customer_name}`}
              date={entry.date}
              data={{
                customer: entry.customer_name,
                pages: entry.pages_count,
                amount: formatCurrency(entry.amount),
              }}
              labels={{
                customer: 'Customer',
                pages: 'Pages',
                amount: 'Amount',
              }}
              onEdit={() => openEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
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
              <Label htmlFor="edit_customer">Customer Name</Label>
              <Input
                id="edit_customer"
                value={editForm.customer_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_pages">Number of Pages</Label>
              <Input
                id="edit_pages"
                type="number"
                value={editForm.pages_count}
                onChange={(e) => setEditForm(prev => ({ ...prev, pages_count: Number(e.target.value) }))}
                placeholder="Pages"
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
            <Button onClick={handleEditEntry}>Update Application</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Applications;
