import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Download, CalendarRange, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types/customer';
import { formatCurrency } from '@/utils/calculateUtils';
import ServiceForm from '@/components/ui/ServiceForm';
import DownloadButton from '@/components/ui/DownloadButton';
import { format } from 'date-fns';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

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
      
      // Get transactions for each customer
      const customersWithTransactions = await Promise.all(
        (data || []).map(async (customer) => {
          let transactionQuery = supabase
            .from('customer_transactions')
            .select('*')
            .eq('customer_id', customer.id);
          
          // Apply date filtering if specified
          if (filterDate) {
            const dateString = format(filterDate, 'yyyy-MM-dd');
            transactionQuery = transactionQuery.like('date', `${dateString}%`);
          }
              
          const { data: transactionsData, error: transactionsError } = await transactionQuery;
              
          if (transactionsError) throw transactionsError;
          
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
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
  };

  const handleDateFilterChange = (date: Date | undefined) => {
    setDateFilter(date || null);
    fetchCustomers(date || null);
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
      
      await fetchCustomers(dateFilter);
      return true;
    } catch (error) {
      console.error('Error adding customer:', error);
      return false;
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomerId) return;
    
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomerId);

      if (error) throw error;
      
      await fetchCustomers(dateFilter);
      setShowDeleteConfirm(false);
      setSelectedCustomerId(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
    }
  };

  const initiateDelete = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowDeleteConfirm(true);
  };

  // Form fields for adding/editing customers
  const customerFormFields = [
    {
      name: 'name',
      label: 'Customer Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
    },
  ];

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="container px-4 py-6 space-y-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <div className="flex gap-2">
          <ServiceForm
            title="Add New Customer"
            fields={customerFormFields}
            initialValues={{}}
            onSubmit={handleAddCustomer}
            trigger={
              <Button size="sm">
                <Plus size={16} className="mr-1" /> Add
              </Button>
            }
          />
          
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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <CalendarRange size={16} />
              {dateFilter ? format(dateFilter, 'PPP') : 'Filter by date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={dateFilter || undefined}
              onSelect={handleDateFilterChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4">
        {loading ? (
          Array(3).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const balance = customer.transactions
              ? customer.transactions.reduce((sum, t) => 
                  sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount)), 0
                )
              : 0;
            
            return (
              <Card 
                key={customer.id} 
                className="border shadow-sm hover:shadow transition-shadow"
                onClick={() => handleViewCustomer(customer.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Phone size={14} />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        initiateDelete(customer.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <div className={`mt-2 text-right ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <p className="text-sm font-medium">{formatCurrency(balance)}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No customers found matching your search." : "No customers found. Add your first customer!"}
          </div>
        )}
      </div>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedCustomerId(null);
        }}
        onConfirm={handleDeleteCustomer}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone and will remove all associated transactions."
      />
    </div>
  );
};

export default Customers;
