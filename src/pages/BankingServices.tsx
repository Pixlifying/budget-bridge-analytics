
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Printer, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DateRangePicker from '@/components/ui/DateRangePicker';
import PageWrapper from '@/components/layout/PageWrapper';
import DownloadButton from '@/components/ui/DownloadButton';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { formatCurrency, filterByDate, filterByMonth } from '@/utils/calculateUtils';

interface BankingService {
  id: string;
  date: string;
  amount: number;
  margin: number;
  transaction_count: number;
}

const BankingServices = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [allServices, setAllServices] = useState<BankingService[]>([]);
  const [filteredServices, setFilteredServices] = useState<BankingService[]>([]);
  const [editingService, setEditingService] = useState<BankingService | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    transaction_count: 1,
  });

  // Form state for editing
  const [editForm, setEditForm] = useState({
    date: '',
    amount: 0,
    transaction_count: 1,
  });

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = (data || []).map(service => ({
        ...service,
        date: service.date,
        amount: Number(service.amount),
        margin: Number(service.margin),
        transaction_count: Number(service.transaction_count)
      }));
      
      setAllServices(formattedData);
    } catch (error) {
      console.error('Error fetching banking services:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load banking services",
      });
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const servicesWithDate = allServices.map(service => ({
      ...service,
      date: new Date(service.date)
    }));

    if (viewMode === 'day') {
      setFilteredServices(filterByDate(servicesWithDate, selectedDate));
    } else {
      setFilteredServices(filterByMonth(servicesWithDate, selectedDate));
    }
  }, [selectedDate, viewMode, allServices]);

  const handleAddEntry = async () => {
    if (!newEntry.amount || !newEntry.transaction_count) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      const calculatedMargin = (newEntry.amount * 0.5) / 100;
      
      const { data, error } = await supabase
        .from('banking_services')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          amount: newEntry.amount,
          margin: calculatedMargin,
          transaction_count: newEntry.transaction_count,
        })
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        const newService: BankingService = {
          id: data[0].id,
          date: data[0].date,
          amount: Number(data[0].amount),
          margin: Number(data[0].margin),
          transaction_count: Number(data[0].transaction_count)
        };

        setAllServices(prev => [newService, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          transaction_count: 1,
        });
        
        toast({
          title: "Success",
          description: "Banking service added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding banking service:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add banking service",
      });
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;

    try {
      const calculatedMargin = (editForm.amount * 0.5) / 100;
      
      const { error } = await supabase
        .from('banking_services')
        .update({
          date: new Date(editForm.date).toISOString(),
          amount: editForm.amount,
          margin: calculatedMargin,
          transaction_count: editForm.transaction_count,
        })
        .eq('id', editingService.id);

      if (error) throw error;

      setAllServices(prev => 
        prev.map(service => 
          service.id === editingService.id 
            ? {
                ...service,
                date: new Date(editForm.date).toISOString(),
                amount: editForm.amount,
                margin: calculatedMargin,
                transaction_count: editForm.transaction_count
              }
            : service
        )
      );

      setEditingService(null);
      toast({
        title: "Success",
        description: "Banking service updated successfully",
      });
    } catch (error) {
      console.error('Error updating banking service:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update banking service",
      });
    }
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;
    
    try {
      const { error } = await supabase
        .from('banking_services')
        .delete()
        .eq('id', serviceToDelete);

      if (error) throw error;

      setAllServices(prev => prev.filter(service => service.id !== serviceToDelete));
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      
      toast({
        title: "Success",
        description: "Banking service deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting banking service:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete banking service",
      });
    }
  };

  const openEditService = (service: BankingService) => {
    setEditingService(service);
    setEditForm({
      date: format(new Date(service.date), 'yyyy-MM-dd'),
      amount: service.amount,
      transaction_count: service.transaction_count,
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Banking Services Report</title>
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
          <h1>Banking Services Report</h1>
          <div class="total">Total Amount: ₹${totalAmount.toFixed(2)} | Total Transactions: ${totalTransactions} | Total Margin: ₹${totalMargin.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Transactions</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredServices.map((service, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(new Date(service.date), 'dd/MM/yyyy')}</td>
                  <td>₹${service.amount.toFixed(2)}</td>
                  <td>${service.transaction_count}</td>
                  <td>₹${service.margin.toFixed(2)}</td>
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

  const totalAmount = filteredServices.reduce((sum, service) => sum + service.amount, 0);
  const totalTransactions = filteredServices.reduce((sum, service) => sum + service.transaction_count, 0);
  const totalMargin = filteredServices.reduce((sum, service) => sum + service.margin, 0);

  return (
    <PageWrapper
      title="Banking Services"
      subtitle="Manage banking transactions"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={selectedDate}
            onDateChange={setSelectedDate}
            mode={viewMode}
            onModeChange={setViewMode}
          />
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton
              data={allServices}
              filename="banking-services"
              currentData={filteredServices}
            />
          </div>
        </div>
      }
    >
      {/* Add Banking Service Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Banking Service</h3>
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
            />
          </div>
          <div>
            <Label htmlFor="transactions">Number of Transactions</Label>
            <Input
              id="transactions"
              type="number"
              value={newEntry.transaction_count}
              onChange={(e) => setNewEntry(prev => ({ ...prev, transaction_count: Number(e.target.value) }))}
              placeholder="Transactions"
              min="1"
            />
          </div>
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{totalTransactions}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardHeader>
            <CardTitle>Total Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-700">{formatCurrency(totalMargin)}</p>
          </CardContent>
        </Card>
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <h3 className="mt-4 text-lg font-medium">No Banking Services</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewMode === 'day' 
              ? `No banking services found for ${format(selectedDate, 'MMMM d, yyyy')}.` 
              : `No banking services found for ${format(selectedDate, 'MMMM yyyy')}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, index) => (
            <Card key={service.id} className="overflow-hidden">
              <CardHeader className="bg-blue-50 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">Banking Service #{index + 1}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditService(service)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setServiceToDelete(service.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(service.date), 'MMMM d, yyyy')}
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                {editingService?.id === service.id ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor={`edit-date-${service.id}`}>Date</Label>
                      <Input
                        id={`edit-date-${service.id}`}
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-amount-${service.id}`}>Amount</Label>
                      <Input
                        id={`edit-amount-${service.id}`}
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-transactions-${service.id}`}>Transactions</Label>
                      <Input
                        id={`edit-transactions-${service.id}`}
                        type="number"
                        value={editForm.transaction_count}
                        onChange={(e) => setEditForm(prev => ({ ...prev, transaction_count: Number(e.target.value) }))}
                        min="1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleEditService} size="sm">Save</Button>
                      <Button onClick={() => setEditingService(null)} variant="outline" size="sm">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-bold text-blue-700">{formatCurrency(service.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transactions</p>
                      <p className="text-lg font-bold">{service.transaction_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Margin</p>
                      <p className="text-lg font-bold text-green-700">{formatCurrency(service.margin)}</p>
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
        onConfirm={handleDeleteService}
        title="Delete Banking Service"
        description="Are you sure you want to delete this banking service? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default BankingServices;
