import { useState, useEffect } from 'react';
import { Globe, Plus, Edit, Printer } from 'lucide-react';
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
import { formatCurrency, filterByDate, filterByMonth } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import { format, startOfDay, endOfDay } from 'date-fns';

interface OnlineServiceEntry {
  id: string;
  date: Date;
  service: string;
  custom_service?: string;
  customer_name?: string;
  amount: number;
  expense: number;
  total: number;
  created_at?: string;
}

const OnlineServices = () => {
  const [onlineServices, setOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredServices, setFilteredServices] = useState<OnlineServiceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<OnlineServiceEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterMode, setFilterMode] = useState<'day' | 'month'>('day');

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    service: '',
    custom_service: '',
    amount: 0,
    expense: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    customer_name: '',
    service: '',
    custom_service: '',
    amount: 0,
    expense: 0,
  });

  const serviceOptions = [
    { label: 'Income Certificate', value: 'Income Certificate' },
    { label: 'Birth Certificate', value: 'Birth Certificate' },
    { label: 'Ladli Beti', value: 'Ladli Beti' },
    { label: 'Insurance Car/Bike', value: 'Insurance Car/Bike' },
    { label: 'Marriage Certificate', value: 'Marriage Certificate' },
    { label: 'Railway Tickets', value: 'Railway Tickets' },
    { label: 'Pension Form', value: 'Pension Form' },
    { label: 'Domicile', value: 'Domicile' },
    { label: 'Marriage Assistance Form', value: 'Marriage Assistance Form' },
    { label: 'Other', value: 'Other' }
  ];

  const fetchOnlineServices = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('online_services')
        .select('*')
        .order('date', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        service: entry.service,
        custom_service: entry.custom_service,
        customer_name: entry.customer_name || '',
        amount: Number(entry.amount),
        expense: Number(entry.expense || 0),
        total: Number(entry.total),
        created_at: entry.created_at
      }));

      console.log('All online services:', formattedData.length);
      setOnlineServices(formattedData);
      applyDateFilter(formattedData, selectedDate, filterMode);
    } catch (error) {
      console.error('Error fetching online services:', error);
      toast.error('Failed to load online services data');
    } finally {
      setIsLoading(false);
    }
  };

  const applyDateFilter = (data: OnlineServiceEntry[], date: Date, mode: 'day' | 'month') => {
    console.log('Applying filter:', mode, 'for date:', date);
    if (mode === 'day') {
      const filtered = filterByDate(data, date);
      console.log('Filtered services by day:', filtered.length);
      setFilteredServices(filtered);
    } else {
      const filtered = filterByMonth(data, date);
      console.log('Filtered services by month:', filtered.length);
      setFilteredServices(filtered);
    }
  };

  useEffect(() => {
    fetchOnlineServices();
  }, []);

  useEffect(() => {
    applyDateFilter(onlineServices, selectedDate, filterMode);
  }, [selectedDate, filterMode, onlineServices]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleModeChange = (mode: 'day' | 'month') => {
    setFilterMode(mode);
  };

  const handleAddEntry = async () => {
    if (!newEntry.customer_name || !newEntry.service || !newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('Adding online service:', newEntry);
      const total = newEntry.amount - newEntry.expense;
      const serviceName = newEntry.service === 'Other' && newEntry.custom_service 
        ? newEntry.custom_service 
        : newEntry.service;
      
      const { data, error } = await supabase
        .from('online_services')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          service: newEntry.service,
          custom_service: newEntry.service === 'Other' ? newEntry.custom_service : null,
          customer_name: newEntry.customer_name,
          amount: newEntry.amount,
          expense: newEntry.expense,
          total: total,
        })
        .select();

      if (error) {
        console.error('Error adding online service:', error);
        throw error;
      }

      // Save expense to expenses table
      if (newEntry.expense > 0) {
        await supabase
          .from('expenses')
          .insert({
            date: new Date(newEntry.date).toISOString(),
            name: `Online Service - ${serviceName}`,
            amount: newEntry.expense,
          });
      }

      if (data && data.length > 0) {
        const newServiceEntry: OnlineServiceEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          service: data[0].service,
          custom_service: data[0].custom_service,
          customer_name: data[0].customer_name || '',
          amount: Number(data[0].amount),
          expense: Number(data[0].expense || 0),
          total: Number(data[0].total),
          created_at: data[0].created_at
        };

        setOnlineServices(prev => [newServiceEntry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          customer_name: '',
          service: '',
          custom_service: '',
          amount: 0,
          expense: 0,
        });
        toast.success('Online service added successfully');
      }
    } catch (error) {
      console.error('Error adding online service:', error);
      toast.error('Failed to add online service');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    try {
      const total = editForm.amount - editForm.expense;
      const serviceName = editForm.service === 'Other' && editForm.custom_service 
        ? editForm.custom_service 
        : editForm.service;

      const { error } = await supabase
        .from('online_services')
        .update({
          date: new Date(editForm.date).toISOString(),
          service: editForm.service,
          custom_service: editForm.service === 'Other' ? editForm.custom_service : null,
          customer_name: editForm.customer_name,
          amount: editForm.amount,
          expense: editForm.expense,
          total: total,
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      // Update or insert expense
      if (editForm.expense > 0) {
        await supabase
          .from('expenses')
          .upsert({
            date: new Date(editForm.date).toISOString(),
            name: `Online Service - ${serviceName}`,
            amount: editForm.expense,
          });
      }

      const updatedEntry: OnlineServiceEntry = {
        ...editingEntry,
        date: new Date(editForm.date),
        service: editForm.service,
        custom_service: editForm.service === 'Other' ? editForm.custom_service : null,
        customer_name: editForm.customer_name,
        amount: editForm.amount,
        expense: editForm.expense,
        total: total,
      };

      setOnlineServices(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      toast.success('Online service updated successfully');
    } catch (error) {
      console.error('Error updating online service:', error);
      toast.error('Failed to update online service');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('online_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOnlineServices(prev => prev.filter(entry => entry.id !== id));
      toast.success('Online service deleted successfully');
    } catch (error) {
      console.error('Error deleting online service:', error);
      toast.error('Failed to delete online service');
    }
  };

  const openEditEntry = (entry: OnlineServiceEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      customer_name: entry.customer_name || '',
      service: entry.service,
      custom_service: entry.custom_service || '',
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
          <title>Online Services Report</title>
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
          <h1>Online Services Report</h1>
          <div class="total">Total Services: ${totalServices} | Total Amount: ₹${totalAmount.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Expense</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredServices.map((service) => `
                <tr>
                  <td>${escapeHtml(format(service.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(service.customer_name)}</td>
                  <td>${escapeHtml(service.service === 'Other' && service.custom_service ? service.custom_service : service.service)}</td>
                  <td>₹${escapeHtml(service.amount.toFixed(2))}</td>
                  <td>₹${escapeHtml(service.expense.toFixed(2))}</td>
                  <td>₹${escapeHtml(service.total.toFixed(2))}</td>
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

  const totalServices = filteredServices.length;
  const totalAmount = filteredServices.reduce((sum, service) => sum + service.total, 0);

  return (
    <PageWrapper
      title="Online Services"
      subtitle="Manage your online services"
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
              data={onlineServices}
              filename="online-services"
              currentData={filteredServices}
            />
          </div>
        </div>
      }
    >
      {/* Add Service Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Online Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
            <Label htmlFor="service">Service Type</Label>
            <Select value={newEntry.service} onValueChange={(value) => setNewEntry(prev => ({ ...prev, service: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {newEntry.service === 'Other' && (
            <div>
              <Label htmlFor="custom_service">Custom Service</Label>
              <Input
                id="custom_service"
                value={newEntry.custom_service}
                onChange={(e) => setNewEntry(prev => ({ ...prev, custom_service: e.target.value }))}
                placeholder="Enter service name"
              />
            </div>
          )}
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
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ServiceCard 
          id="summary-services"
          title="Total Services"
          date={selectedDate}
          data={{ 
            value: totalServices,
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
          title="Total Margin"
          date={selectedDate}
          data={{ 
            value: formatCurrency(totalAmount),
          }}
          labels={{ 
            value: "Margin",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-emerald-50"
          showActions={false}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading online services data...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Online Services</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {onlineServices.length > 0 
              ? `No services found for the selected ${filterMode === 'day' ? 'day' : 'month'}.` 
              : 'Add a new online service to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.service === 'Other' && entry.custom_service ? entry.custom_service : entry.service}
              date={entry.date}
              data={{
                customer: entry.customer_name || 'Not specified',
                amount: formatCurrency(entry.amount),
                expense: formatCurrency(entry.expense),
                margin: formatCurrency(entry.total),
              }}
              labels={{
                customer: 'Customer',
                amount: 'Amount',
                expense: 'Expense',
                margin: 'Margin',
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
            <DialogTitle>Edit Online Service</DialogTitle>
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
              <Label htmlFor="edit_service">Service Type</Label>
              <Select value={editForm.service} onValueChange={(value) => setEditForm(prev => ({ ...prev, service: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.service === 'Other' && (
              <div className="grid gap-2">
                <Label htmlFor="edit_custom_service">Custom Service</Label>
                <Input
                  id="edit_custom_service"
                  value={editForm.custom_service}
                  onChange={(e) => setEditForm(prev => ({ ...prev, custom_service: e.target.value }))}
                  placeholder="Enter service name"
                />
              </div>
            )}
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
            <Button onClick={handleEditEntry}>Update Service</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default OnlineServices;
