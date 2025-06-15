
import { useState, useEffect } from 'react';
import { Plus, Search, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PageWrapper from '@/components/layout/PageWrapper';
import CustomerCard from '@/components/customers/CustomerCard';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerDateFilter from '@/components/customers/CustomerDateFilter';
import DeleteCustomerDialog from '@/components/customers/DeleteCustomerDialog';
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

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  description?: string;
  created_at: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCustomerForPrint, setSelectedCustomerForPrint] = useState<string>('all');
  const [showPrintDialog, setShowPrintDialog] = useState(false);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    const filtered = customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          customer.phone.includes(searchTerm) ||
                          customer.address.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      const customerDate = new Date(customer.created_at);
      
      if (viewMode === 'day') {
        return format(customerDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      } else if (viewMode === 'month') {
        return customerDate.getMonth() === selectedDate.getMonth() && 
               customerDate.getFullYear() === selectedDate.getFullYear();
      } else {
        return customerDate.getFullYear() === selectedDate.getFullYear();
      }
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, viewMode, selectedDate]);

  const handleCustomerAdded = () => {
    fetchCustomers();
    setShowForm(false);
  };

  const handleCustomerUpdated = () => {
    fetchCustomers();
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete.id);

      if (error) throw error;

      await fetchCustomers();
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setCustomerToDelete(null);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customersToPrint = selectedCustomerForPrint === 'all' 
      ? filteredCustomers 
      : filteredCustomers.filter(c => c.id === selectedCustomerForPrint);

    const periodText = viewMode === 'day' 
      ? format(selectedDate, 'dd MMM yyyy')
      : viewMode === 'month'
      ? format(selectedDate, 'MMMM yyyy')
      : format(selectedDate, 'yyyy');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customers Report - ${periodText}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }
            .customer { margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; }
            .customer-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
            .customer-detail { margin-bottom: 3px; }
            .print-date { text-align: right; margin-bottom: 10px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="print-date">Printed on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
          <h1>Customers Report - ${periodText}</h1>
          <div class="summary">
            <p><strong>Total Customers:</strong> ${customersToPrint.length}</p>
            <p><strong>Filter:</strong> ${selectedCustomerForPrint === 'all' ? 'All Customers' : 'Selected Customer'}</p>
          </div>
          ${customersToPrint.map(customer => `
            <div class="customer">
              <div class="customer-name">${customer.name}</div>
              <div class="customer-detail"><strong>Phone:</strong> ${customer.phone}</div>
              <div class="customer-detail"><strong>Address:</strong> ${customer.address}</div>
              ${customer.description ? `<div class="customer-detail"><strong>Description:</strong> ${customer.description}</div>` : ''}
              <div class="customer-detail"><strong>Added on:</strong> ${format(new Date(customer.created_at), 'dd MMM yyyy')}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setShowPrintDialog(false);
  };

  const handleDownload = () => {
    const csvContent = [
      'Name,Phone,Address,Description,Created Date',
      ...filteredCustomers.map(customer => 
        `"${customer.name}","${customer.phone}","${customer.address}","${customer.description || ''}","${format(new Date(customer.created_at), 'yyyy-MM-dd')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully');
  };

  return (
    <PageWrapper
      title="Customers"
      subtitle="Manage your customer database"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <CustomerDateFilter
            viewMode={viewMode}
            selectedDate={selectedDate}
            onViewModeChange={setViewMode}
            onDateChange={setSelectedDate}
          />
          <div className="flex gap-2">
            <Button onClick={() => setShowPrintDialog(true)} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
      }
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search customers by name, phone, or address..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || viewMode !== 'year' ? 'No customers found matching your criteria' : 'No customers added yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map(customer => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onEdit={setEditingCustomer}
              onDelete={setCustomerToDelete}
            />
          ))}
        </div>
      )}

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print Customers</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="customer-select" className="text-sm font-medium">
                Select Customer to Print
              </label>
              <Select value={selectedCustomerForPrint} onValueChange={setSelectedCustomerForPrint}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers ({filteredCustomers.length})</SelectItem>
                  {filteredCustomers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPrintDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handlePrint}>
                <Printer size={16} className="mr-2" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Form Dialog */}
      {showForm && (
        <CustomerForm
          onSuccess={handleCustomerAdded}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Edit Customer Dialog */}
      {editingCustomer && (
        <CustomerForm
          customer={editingCustomer}
          onSuccess={handleCustomerUpdated}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {customerToDelete && (
        <DeleteCustomerDialog
          customer={customerToDelete}
          onConfirm={handleDeleteCustomer}
          onCancel={() => setCustomerToDelete(null)}
        />
      )}
    </PageWrapper>
  );
};

export default Customers;
