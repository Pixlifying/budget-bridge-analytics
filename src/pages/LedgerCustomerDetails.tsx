
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import CustomerDetailsForm from '@/components/customers/CustomerDetailsForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface LedgerCustomer {
  id: string;
  name: string;
  account_number: string;
  adhar_number: string;
  mobile_number?: string;
  created_at: string;
  updated_at: string;
}

const LedgerCustomerDetails = () => {
  const [customers, setCustomers] = useState<LedgerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<LedgerCustomer | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ledger_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const formatAccountNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : '';
  };

  const formatAdharNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : '';
  };

  const handleAddCustomer = async (values: any) => {
    try {
      const { error } = await supabase
        .from('ledger_customers')
        .insert({
          name: values.name,
          account_number: values.account_number.replace(/\s+/g, ''),
          adhar_number: values.adhar_number.replace(/\s+/g, ''),
          mobile_number: values.mobile_number || null,
        });

      if (error) throw error;
      
      toast.success('Customer added successfully');
      setShowAddForm(false);
      await fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const handleEditCustomer = async (values: any) => {
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from('ledger_customers')
        .update({
          name: values.name,
          account_number: values.account_number.replace(/\s+/g, ''),
          adhar_number: values.adhar_number.replace(/\s+/g, ''),
          mobile_number: values.mobile_number || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;
      
      toast.success('Customer updated successfully');
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const { error } = await supabase
        .from('ledger_customers')
        .delete()
        .eq('id', customerToDelete);

      if (error) throw error;
      
      toast.success('Customer deleted successfully');
      setShowDeleteConfirm(false);
      setCustomerToDelete(null);
      await fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const initiateDelete = (customerId: string) => {
    setCustomerToDelete(customerId);
    setShowDeleteConfirm(true);
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Account Number', 'Adhar Number', 'Mobile Number', 'Created At'],
      ...filteredCustomers.map(customer => [
        customer.name,
        formatAccountNumber(customer.account_number),
        formatAdharNumber(customer.adhar_number),
        customer.mobile_number || '',
        new Date(customer.created_at).toLocaleDateString()
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Customer data exported successfully');
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.account_number.includes(searchTerm.replace(/\s+/g, '')) ||
    customer.adhar_number.includes(searchTerm.replace(/\s+/g, '')) ||
    (customer.mobile_number && customer.mobile_number.includes(searchTerm))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Customer Details"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, account number, Adhar, or mobile..."
      >
        <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
          <Download size={16} />
          Export CSV
        </Button>
        <Button onClick={() => setShowAddForm(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Add Customer
        </Button>
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-lg border border-white/20 dark:border-slate-700/50 shadow-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Adhar Number</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{formatAccountNumber(customer.account_number)}</TableCell>
                    <TableCell>{formatAdharNumber(customer.adhar_number)}</TableCell>
                    <TableCell>{customer.mobile_number || '-'}</TableCell>
                    <TableCell>{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCustomer(customer)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => initiateDelete(customer.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CustomerDetailsForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddCustomer}
        title="Add Customer"
      />

      <CustomerDetailsForm
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        onSubmit={handleEditCustomer}
        title="Edit Customer"
        initialValues={editingCustomer ? {
          name: editingCustomer.name,
          account_number: formatAccountNumber(editingCustomer.account_number),
          adhar_number: formatAdharNumber(editingCustomer.adhar_number),
          mobile_number: editingCustomer.mobile_number || ''
        } : undefined}
      />

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        description="Do you really want to delete this customer data? This action cannot be undone."
      />
    </div>
  );
};

export default LedgerCustomerDetails;
