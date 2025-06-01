
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types/customer';
import { format } from 'date-fns';
import DownloadButton from '@/components/ui/DownloadButton';
import { toast } from "sonner";

import CustomerList from '@/components/customers/CustomerList';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerDateFilter from '@/components/customers/CustomerDateFilter';
import DeleteCustomerDialog from '@/components/customers/DeleteCustomerDialog';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCustomers = async (filterDate?: Date | null) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const customersWithTransactions = await Promise.all(
        (data || []).map(async (customer) => {
          let transactionQuery = supabase
            .from('customer_transactions')
            .select('*')
            .eq('customer_id', customer.id);
          
          if (filterDate) {
            const dateString = format(filterDate, 'yyyy-MM-dd');
            transactionQuery = transactionQuery.like('date', `${dateString}%`);
          }
              
          const { data: transactionsData, error: transactionsError } = await transactionQuery;
              
          if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError);
            return {
              ...customer,
              transactions: []
            };
          }
          
          // Ensure transactions have the correct type
          const typedTransactions = (transactionsData || []).map(transaction => ({
            ...transaction,
            type: transaction.type as 'debit' | 'credit'
          }));
            
          return {
            ...customer,
            transactions: typedTransactions
          };
        })
      );
        
      setCustomers(customersWithTransactions);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(dateFilter);
    // eslint-disable-next-line
  }, [dateFilter]);

  const handleViewCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handleDateFilterChange = (date: Date | undefined) => {
    setDateFilter(date || null);
  };

  const handleAddCustomer = async (values: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: values.name,
          phone: values.phone,
          address: values.address,
          description: values.description || null,
        })
        .select();

      if (error) throw error;
      
      toast.success("Customer added successfully");
      await fetchCustomers(dateFilter);
      return true;
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error("Failed to add customer");
      return false;
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomerId) return;
    
    try {
      const { error: transactionError } = await supabase
        .from('customer_transactions')
        .delete()
        .eq('customer_id', selectedCustomerId);

      if (transactionError) throw transactionError;
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomerId);

      if (error) throw error;
      
      toast.success("Customer deleted successfully");
      await fetchCustomers(dateFilter);
      setShowDeleteConfirm(false);
      setSelectedCustomerId(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error("Failed to delete customer");
    }
  };

  const initiateDelete = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowDeleteConfirm(true);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="container px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <CustomerForm onSubmit={handleAddCustomer} />
          <DownloadButton
            data={customers}
            filename="customers"
            currentData={filteredCustomers}
            label="Export"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search by name or phone..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <CustomerDateFilter dateFilter={dateFilter} onChange={handleDateFilterChange} />
      </div>

      <div className="grid gap-4">
        <CustomerList
          customers={filteredCustomers}
          loading={loading}
          searchTerm={searchTerm}
          onView={handleViewCustomer}
          onDelete={(id, e) => {
            e.stopPropagation();
            initiateDelete(id);
          }}
        />
      </div>

      <DeleteCustomerDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedCustomerId(null);
        }}
        onConfirm={handleDeleteCustomer}
      />
    </div>
  );
};

export default Customers;

