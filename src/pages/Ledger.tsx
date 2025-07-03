
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
import PageHeader from '@/components/layout/PageHeader';

import CustomerList from '@/components/customers/CustomerList';
import CustomerForm from '@/components/customers/CustomerForm';
import CustomerDateFilter from '@/components/customers/CustomerDateFilter';
import DeleteCustomerDialog from '@/components/customers/DeleteCustomerDialog';

const Ledger = () => {
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
    navigate(`/ledger/${customerId}`);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Customer Ledger"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name or phone..."
      >
        <CustomerDateFilter selectedDate={dateFilter || new Date()} onChange={handleDateFilterChange} />
        <CustomerForm onSubmit={handleAddCustomer} />
        <DownloadButton
          data={customers}
          filename="ledger"
          currentData={filteredCustomers}
          label="Export"
        />
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading customers...</div>
            </div>
          ) : (
            <CustomerList
              customers={filteredCustomers}
              onEdit={() => {}} // Not used in Ledger
              onDelete={(customer) => {
                initiateDelete(customer.id);
              }}
              onCustomerClick={(id) => handleViewCustomer(id)}
            />
          )}
        </div>
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

export default Ledger;
