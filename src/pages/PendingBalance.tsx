
import { useState, useEffect } from 'react';
import { Edit, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { format } from 'date-fns';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';

interface PendingBalanceEntry {
  id: string;
  date: Date;
  name: string;
  address: string;
  phone: string;
  service: string;
  amount: number;
}

const PendingBalance = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [pendingBalances, setPendingBalances] = useState<PendingBalanceEntry[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<PendingBalanceEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PendingBalanceEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inline form state
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    address: '',
    phone: '',
    service: '',
    amount: 0,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    date: '',
    name: '',
    address: '',
    phone: '',
    service: '',
    amount: 0,
  });
  
  const fetchPendingBalances = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pending_balances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        address: entry.address,
        phone: entry.phone,
        service: entry.service,
        amount: Number(entry.amount)
      }));
      
      setPendingBalances(formattedData);
    } catch (error) {
      console.error('Error fetching pending balances:', error);
      toast.error('Failed to load pending balances data');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPendingBalances();
  }, []);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredBalances(filterByDate(pendingBalances, date));
    } else {
      setFilteredBalances(filterByMonth(pendingBalances, date));
    }
  }, [date, viewMode, pendingBalances]);

  const handleAddEntry = async () => {
    if (!newEntry.name || !newEntry.address || !newEntry.phone || !newEntry.service || !newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const amount = Number(newEntry.amount);
      
      const { data, error } = await supabase
        .from('pending_balances')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          name: newEntry.name,
          address: newEntry.address,
          phone: newEntry.phone,
          service: newEntry.service,
          amount
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newPendingEntry: PendingBalanceEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          name: data[0].name,
          address: data[0].address,
          phone: data[0].phone,
          service: data[0].service,
          amount: Number(data[0].amount)
        };
        
        setPendingBalances(prev => [newPendingEntry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          name: '',
          address: '',
          phone: '',
          service: '',
          amount: 0,
        });
        toast.success('Pending balance added successfully');
      }
    } catch (error) {
      console.error('Error adding pending balance:', error);
      toast.error('Failed to add pending balance');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;
    
    try {
      const amount = Number(editForm.amount);
      
      const { error } = await supabase
        .from('pending_balances')
        .update({
          date: new Date(editForm.date).toISOString(),
          name: editForm.name,
          address: editForm.address,
          phone: editForm.phone,
          service: editForm.service,
          amount
        })
        .eq('id', editingEntry.id);
      
      if (error) {
        throw error;
      }
      
      const updatedEntry: PendingBalanceEntry = {
        ...editingEntry,
        date: new Date(editForm.date),
        name: editForm.name,
        address: editForm.address,
        phone: editForm.phone,
        service: editForm.service,
        amount
      };
      
      setPendingBalances(prev => 
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );
      
      setEditingEntry(null);
      toast.success('Pending balance updated successfully');
    } catch (error) {
      console.error('Error updating pending balance:', error);
      toast.error('Failed to update pending balance');
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    
    try {
      const { error } = await supabase
        .from('pending_balances')
        .delete()
        .eq('id', entryToDelete);
      
      if (error) {
        throw error;
      }
      
      setPendingBalances(prev => prev.filter(entry => entry.id !== entryToDelete));
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      toast.success('Pending balance deleted successfully');
    } catch (error) {
      console.error('Error deleting pending balance:', error);
      toast.error('Failed to delete pending balance');
    }
  };

  const openEditEntry = (entry: PendingBalanceEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      name: entry.name,
      address: entry.address,
      phone: entry.phone,
      service: entry.service,
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
          <title>Pending Balances Report</title>
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
          <h1>Pending Balances Report</h1>
          <div class="total">Total Amount: ₹${totalAmount.toFixed(2)} | Total Balances: ${totalBalances}</div>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Date</th>
                <th>Name</th>
                <th>Address</th>
                <th>Phone</th>
                <th>Service</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBalances.map((entry, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(entry.date, 'dd/MM/yyyy')}</td>
                  <td>${entry.name}</td>
                  <td>${entry.address}</td>
                  <td>${entry.phone}</td>
                  <td>${entry.service}</td>
                  <td>₹${entry.amount.toFixed(2)}</td>
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

  const totalAmount = filteredBalances.reduce((sum, entry) => sum + entry.amount, 0);
  const totalBalances = filteredBalances.length;

  return (
    <PageWrapper
      title="Pending Balances"
      subtitle={`Manage pending balances for ${viewMode === 'day' ? 'today' : 'this month'}`}
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
              data={pendingBalances}
              filename="pending-balances"
              currentData={filteredBalances}
            />
          </div>
        </div>
      }
    >
      {/* Inline Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Pending Balance</h3>
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newEntry.name}
              onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={newEntry.address}
              onChange={(e) => setNewEntry(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Address"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={newEntry.phone}
              onChange={(e) => setNewEntry(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone number"
            />
          </div>
          <div>
            <Label htmlFor="service">Service</Label>
            <Input
              id="service"
              value={newEntry.service}
              onChange={(e) => setNewEntry(prev => ({ ...prev, service: e.target.value }))}
              placeholder="Service type"
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

      {/* Summary cards showing totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Total Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{totalBalances}</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50">
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading pending balances data...</p>
        </div>
      ) : filteredBalances.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <h3 className="mt-4 text-lg font-medium">No Pending Balances</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new pending balance to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBalances.map((entry, index) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardHeader className="bg-blue-50 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{entry.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditEntry(entry)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setEntryToDelete(entry.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(entry.date, 'MMMM d, yyyy')}
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                {editingEntry?.id === entry.id ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`edit-date-${entry.id}`}>Date</Label>
                      <Input
                        id={`edit-date-${entry.id}`}
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-name-${entry.id}`}>Name</Label>
                      <Input
                        id={`edit-name-${entry.id}`}
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-address-${entry.id}`}>Address</Label>
                      <Input
                        id={`edit-address-${entry.id}`}
                        value={editForm.address}
                        onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-phone-${entry.id}`}>Phone</Label>
                      <Input
                        id={`edit-phone-${entry.id}`}
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-service-${entry.id}`}>Service</Label>
                      <Input
                        id={`edit-service-${entry.id}`}
                        value={editForm.service}
                        onChange={(e) => setEditForm(prev => ({ ...prev, service: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-amount-${entry.id}`}>Amount</Label>
                      <Input
                        id={`edit-amount-${entry.id}`}
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleEditEntry} size="sm">Save</Button>
                      <Button onClick={() => setEditingEntry(null)} variant="outline" size="sm">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{entry.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{entry.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-medium">{entry.service}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(entry.amount)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmation 
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteEntry}
        title="Delete Pending Balance"
        description="Are you sure you want to delete this pending balance? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default PendingBalance;
