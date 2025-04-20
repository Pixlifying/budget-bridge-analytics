
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types/customer';
import { formatCurrency } from '@/utils/calculateUtils';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Get transactions for each customer
        const customersWithTransactions = await Promise.all(
          (data || []).map(async (customer) => {
            const { data: transactions, error: transactionsError } = await supabase
              .from('customer_transactions')
              .select('*')
              .eq('customer_id', customer.id);
              
            if (transactionsError) throw transactionsError;
            
            return {
              ...customer,
              transactions: transactions || []
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

    fetchCustomers();
  }, []);

  const handleViewCustomer = (customerId: string) => {
    navigate(`/customers/${customerId}`);
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

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button size="sm">
          <Plus size={16} className="mr-1" /> Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Search by name or phone number..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
            
            return (
              <Card 
                key={customer.id} 
                className="border shadow-sm hover:shadow cursor-pointer"
                onClick={() => handleViewCustomer(customer.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{customer.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone size={12} />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                    <div className={`text-right ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="font-semibold">{formatCurrency(balance)}</p>
                    </div>
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
