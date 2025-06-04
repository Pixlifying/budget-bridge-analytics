
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';

interface OnlineService {
  id: string;
  date: string;
  service: string;
  custom_service?: string;
  customer_name?: string;
  amount: number;
  count: number;
  total: number;
  created_at: string;
}

const OnlineServices = () => {
  const [services, setServices] = useState<OnlineService[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });
  
  // Date filtering
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateMode, setDateMode] = useState<'day' | 'month'>('day');

  const [newService, setNewService] = useState({
    service: '',
    custom_service: '',
    customer_name: '',
    amount: 0,
    count: 1
  });

  const predefinedServices = [
    'Passport Application',
    'PAN Card',
    'Aadhar Update',
    'Ration Card',
    'Income Certificate',
    'Domicile Certificate',
    'Birth Certificate',
    'Death Certificate',
    'Other'
  ];

  const fetchServices = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('online_services')
        .select('*');

      // Apply date filtering
      if (dateMode === 'day') {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query
          .gte('date', startOfDay.toISOString())
          .lte('date', endOfDay.toISOString());
      } else {
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        query = query
          .gte('date', startOfMonth.toISOString())
          .lte('date', endOfMonth.toISOString());
      }

      const { data, error } = await query.order('date', { ascending: false });

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
  }, [selectedDate, dateMode]);

  const addService = async () => {
    try {
      const total = newService.amount * newService.count;
      
      const { error } = await supabase
        .from('online_services')
        .insert([{
          ...newService,
          total
        }]);

      if (error) throw error;

      toast.success('Service added successfully');
      setNewService({
        service: '',
        custom_service: '',
        customer_name: '',
        amount: 0,
        count: 1
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
        .from('online_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      
      toast.success('Service deleted successfully');
      fetchServices();
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Date', 'Service', 'Customer Name', 'Amount per Service', 'Count', 'Total Amount']
    ];

    filteredServices.forEach(service => {
      csvData.push([
        new Date(service.date).toLocaleDateString(),
        service.service === 'Other' ? service.custom_service || 'Other' : service.service,
        service.customer_name || '',
        service.amount.toString(),
        service.count.toString(),
        service.total.toString()
      ]);
    });

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'online_services_report.csv';
    link.click();
  };

  const filteredServices = services.filter(service =>
    service.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.custom_service && service.custom_service.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (service.customer_name && service.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalRevenue = filteredServices.reduce((sum, service) => sum + service.total, 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Online Services"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search services..."
      >
        <DateRangePicker
          date={selectedDate}
          onDateChange={setSelectedDate}
          mode={dateMode}
          onModeChange={setDateMode}
        />
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
              <DialogTitle>Add New Service</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service">Service Type</Label>
                <Select value={newService.service} onValueChange={(value) => setNewService({ ...newService, service: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedServices.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {newService.service === 'Other' && (
                <div>
                  <Label htmlFor="custom_service">Custom Service</Label>
                  <Input
                    id="custom_service"
                    value={newService.custom_service}
                    onChange={(e) => setNewService({ ...newService, custom_service: e.target.value })}
                    placeholder="Enter custom service name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="customer_name">Customer Name (Optional)</Label>
                <Input
                  id="customer_name"
                  value={newService.customer_name}
                  onChange={(e) => setNewService({ ...newService, customer_name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount per Service</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={newService.amount}
                    onChange={(e) => setNewService({ ...newService, amount: Number(e.target.value) })}
                    placeholder="Amount"
                  />
                </div>
                <div>
                  <Label htmlFor="count">Count</Label>
                  <Input
                    id="count"
                    type="number"
                    value={newService.count}
                    onChange={(e) => setNewService({ ...newService, count: Number(e.target.value) })}
                    placeholder="Count"
                  />
                </div>
              </div>

              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium">
                  Total: ₹{(newService.amount * newService.count).toFixed(2)}
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
              <p className="text-muted-foreground">Total Services</p>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold">{filteredServices.reduce((sum, s) => sum + s.count, 0)}</h3>
              <p className="text-muted-foreground">Total Count</p>
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
          <CardTitle>Services Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-4 font-semibold border-b pb-2">
              <div>Date</div>
              <div>Service Type</div>
              <div>Customer Name</div>
              <div>Amount</div>
              <div>Count</div>
              <div>Total</div>
              <div>Actions</div>
            </div>
            
            {filteredServices.map((service) => (
              <div key={service.id} className="grid grid-cols-7 gap-4 items-center border-b pb-2">
                <div className="text-sm">
                  {new Date(service.date).toLocaleDateString()}
                </div>
                <div className="font-medium">
                  {service.service === 'Other' ? service.custom_service || 'Other' : service.service}
                </div>
                <div className="text-muted-foreground">
                  {service.customer_name || '-'}
                </div>
                <div>₹{service.amount.toFixed(2)}</div>
                <div>{service.count}</div>
                <div className="font-semibold text-green-600">
                  ₹{service.total.toFixed(2)}
                </div>
                <div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmation({
                      isOpen: true,
                      id: service.id,
                      name: service.service === 'Other' ? service.custom_service || 'Other' : service.service
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredServices.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-8">
                No services found for the selected {dateMode === 'day' ? 'date' : 'month'}.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, id: '', name: '' })}
        onConfirm={() => deleteService(deleteConfirmation.id)}
        title="Delete Service"
        description={`Are you sure you want to delete "${deleteConfirmation.name}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default OnlineServices;
