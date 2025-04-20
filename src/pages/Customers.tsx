
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone, Download, CalendarRange } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types/customer';
import { formatCurrency } from '@/utils/calculateUtils';
import ServiceForm from '@/components/ui/ServiceForm';
import DownloadButton from '@/components/ui/DownloadButton';
import { format } from 'date-fns';
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

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const handleEditCustomer = async (customerId: string, values: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: values.name,
          phone: values.phone,
          address: values.address,
          description: values.description || null,
        })
        .eq('id', customerId);

      if (error) throw error;
      
      await fetchCustomers(dateFilter);
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Calculate balance for each customer
  const calculateBalance = (customer: Customer) => {
    const credits = customer.transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    const debits = customer.transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
      
    return credits - debits;
  };

  // Form fields for adding/editing customers
  const customerFormFields = [
    {
      name: 'name',
      label: 'Customer Name',
      type: 'text',
      required: true,
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'text',
      required: true,
    },
    {
      name: 'address',
      label: 'Address',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
    },
  ];

  return (
    <div className="container px-4 py-6 space-y-6">
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
                <Plus size={16} className="mr-1" /> Add Customer
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
            placeholder="Search by name or phone number..."
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
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
                <div className="h-5 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const balance = calculateBalance(customer);
            const latestTransaction = customer.transactions.length > 0 
              ? customer.transactions.sort((a, b) => 
                  new Date(b.date).getTime() - new Date(a.date).getTime()
                )[0]
              : null;
            
            return (
              <Card 
                key={customer.id} 
                className="border shadow-sm hover:shadow"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h3 className="font-semibold">{customer.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone size={12} />
                        <span>{customer.phone}</span>
                      </div>
                      {latestTransaction && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Latest transaction: {format(new Date(latestTransaction.date), 'dd MMM yyyy')}
                        </p>
                      )}
                    </div>
                    <div className={`text-right ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-semibold">{formatCurrency(balance)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 pt-3 border-t">
                    <ServiceForm
                      title="Edit Customer"
                      fields={customerFormFields}
                      initialValues={{
                        name: customer.name,
                        phone: customer.phone,
                        address: customer.address,
                        description: customer.description || '',
                      }}
                      onSubmit={(values) => handleEditCustomer(customer.id, values)}
                      trigger={
                        <Button variant="outline" size="sm">Edit</Button>
                      }
                      isEdit={true}
                    />
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleViewCustomer(customer.id)}
                    >
                      View Details
                    </Button>
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
    </div>
  );
};

export default Customers;
