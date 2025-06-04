
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';

interface BankingService {
  id: string;
  date: string;
  amount: number;
  margin: number;
  transaction_count: number;
  created_at: string;
}

const BankingServices = () => {
  const [services, setServices] = useState<BankingService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const [newService, setNewService] = useState({
    amount: 0,
    margin: 0,
    transaction_count: 1
  });

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const addService = async () => {
    try {
      const { error } = await supabase
        .from('banking_services')
        .insert([newService]);

      if (error) throw error;

      toast.success('Banking service added successfully');
      setNewService({
        amount: 0,
        margin: 0,
        transaction_count: 1
      });
      setShowAddDialog(false);
      fetchServices();
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    }
  };

  const deleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('banking_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      
      toast.success('Service deleted successfully');
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Date', 'Amount', 'Margin', 'Transaction Count', 'Total Margin']
    ];

    filteredServices.forEach(service => {
      csvData.push([
        new Date(service.date).toLocaleDateString(),
        service.amount.toString(),
        service.margin.toString(),
        service.transaction_count.toString(),
        (service.margin * service.transaction_count).toString()
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'banking_services_report.csv';
    link.click();
  };

  const filteredServices = services.filter(service =>
    service.amount.toString().includes(searchTerm) ||
    service.margin.toString().includes(searchTerm)
  );

  const totalRevenue = filteredServices.reduce((sum, service) => sum + (service.margin * service.transaction_count), 0);
  const totalTransactions = filteredServices.reduce((sum, service) => sum + service.transaction_count, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Banking Services"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by amount or margin..."
      >
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Banking Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Transaction Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={newService.amount}
                  onChange={(e) => setNewService({ ...newService, amount: Number(e.target.value) })}
                  placeholder="Transaction amount"
                />
              </div>

              <div>
                <Label htmlFor="margin">Margin per Transaction</Label>
                <Input
                  id="margin"
                  type="number"
                  step="0.01"
                  value={newService.margin}
                  onChange={(e) => setNewService({ ...newService, margin: Number(e.target.value) })}
                  placeholder="Margin amount"
                />
              </div>

              <div>
                <Label htmlFor="transaction_count">Number of Transactions</Label>
                <Input
                  id="transaction_count"
                  type="number"
                  value={newService.transaction_count}
                  onChange={(e) => setNewService({ ...newService, transaction_count: Number(e.target.value) })}
                  placeholder="Transaction count"
                />
              </div>

              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium">
                  Total Margin: ₹{(newService.margin * newService.transaction_count).toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addService}>Add Service</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Summary Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold">{filteredServices.length}</h3>
              <p className="text-muted-foreground">Service Entries</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{totalTransactions}</h3>
              <p className="text-muted-foreground">Total Transactions</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</h3>
              <p className="text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Banking Services Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-6 gap-4 font-semibold border-b pb-2">
              <div>Date</div>
              <div>Amount</div>
              <div>Margin</div>
              <div>Transactions</div>
              <div>Total Margin</div>
              <div>Actions</div>
            </div>
            
            {/* Table Rows */}
            {filteredServices.map((service) => (
              <div key={service.id} className="grid grid-cols-6 gap-4 items-center border-b pb-2">
                <div className="text-sm">
                  {new Date(service.date).toLocaleDateString()}
                </div>
                <div>₹{service.amount.toFixed(2)}</div>
                <div>₹{service.margin.toFixed(2)}</div>
                <div>{service.transaction_count}</div>
                <div className="font-semibold text-green-600">
                  ₹{(service.margin * service.transaction_count).toFixed(2)}
                </div>
                <div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteService(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredServices.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-8">
                No banking services found. Add a new service to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BankingServices;
