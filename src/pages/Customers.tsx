import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ServiceForm from '@/components/ui/ServiceForm';
import { useToast } from '@/hooks/use-toast';
import CustomerCard from '@/components/ui/CustomerCard';
import { Customer, Transaction } from '@/types/customer';
import TransactionDialog from '@/components/ui/TransactionDialog';
import DownloadButton from '@/components/ui/DownloadButton';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit');
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState<number>(-1);
  const [date, setDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<'day' | 'month'>('month');
  const { toast } = useToast();

  // Fetch customers from Supabase
  const fetchCustomers = async () => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('customer_transactions')
        .select('*');

      if (customersError || transactionsError) {
        throw new Error(customersError?.message || transactionsError?.message);
      }

      const enrichedCustomers = customersData.map(customer => ({
        ...customer,
        transactions: transactionsData.filter(t => t.customer_id === customer.id)
      }));

      setCustomers(enrichedCustomers);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch customers: ${error}`,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async (values: any) => {
    try {
      // Insert customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: values.name,
          description: values.description,
          phone: values.phone,
          address: values.address
        })
        .select();

      if (customerError) throw customerError;

      // Insert first transaction
      const { error: transactionError } = await supabase
        .from('customer_transactions')
        .insert({
          customer_id: customerData[0].id,
          type: values.transactionType,
          amount: values.amount
        });

      if (transactionError) throw transactionError;

      // Refetch customers to update the list
      await fetchCustomers();

      toast({
        title: "Customer added",
        description: `${values.name} has been added successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to add customer: ${error}`,
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (customer: Customer) => {
    setDraggedCustomer(customer);
  };

  const handleDragOver = (e: React.DragEvent, section: 'debit' | 'credit') => {
    e.preventDefault();
    if (draggedCustomer) {
      // Only allow dropping if the section is different from the customer's current transaction
      if (draggedCustomer.transactions.some(t => t.type !== section)) {
        e.dataTransfer.dropEffect = "move";
      }
    }
  };

  const handleDrop = (e: React.DragEvent, section: 'debit' | 'credit') => {
    e.preventDefault();
    if (draggedCustomer) {
      const draggedIndex = customers.findIndex(c => c.id === draggedCustomer.id);
      if (draggedIndex !== -1) {
        // Check if this customer already has transactions of the opposite type
        const hasOppositeType = draggedCustomer.transactions.some(t => t.type === section);
        if (!hasOppositeType) {
          setTransactionType(section);
          setCurrentCustomerIndex(draggedIndex);
          setShowTransactionDialog(true);
        }
      }
    }
    setDraggedCustomer(null);
  };

  const handleTransactionComplete = (amount: number) => {
    if (currentCustomerIndex !== -1 && transactionType) {
      const updatedCustomers = [...customers];
      const customer = updatedCustomers[currentCustomerIndex];
      
      customer.transactions.push({
        id: Date.now().toString(),
        type: transactionType,
        amount: amount,
        date: new Date().toISOString()
      });

      updatedCustomers[currentCustomerIndex] = customer;
      setCustomers(updatedCustomers);
      
      toast({
        title: "Transaction added",
        description: `${transactionType === 'credit' ? 'Credit' : 'Debit'} of ${amount} added for ${customer.name}`
      });
    }
    
    setShowTransactionDialog(false);
    setTransactionType('debit');
    setCurrentCustomerIndex(-1);
  };

  const getCustomersByTransactionType = (type: 'debit' | 'credit') => {
    return customers.filter(customer => 
      customer.transactions.some(transaction => transaction.type === type)
    );
  };

  const getCustomerBalance = (customer: Customer): number => {
    const debitTotal = customer.transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const creditTotal = customer.transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);
      
    return debitTotal - creditTotal;
  };

  const formFields: FormField[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'phone', label: 'Mobile Number', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: false },
    { name: 'amount', label: 'Amount', type: 'number', required: true, min: 0 },
    { 
      name: 'transactionType', 
      label: 'Transaction Type', 
      type: 'select', 
      required: true,
      options: [
        { label: 'Debit (They Owe You)', value: 'debit' },
        { label: 'Credit (You Owe Them)', value: 'credit' }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Transactions</h1>
        <div className="flex items-center space-x-4">
          <DateRangePicker 
            date={date}
            onDateChange={setDate}
            mode={mode}
            onModeChange={setMode}
          />
          <DownloadButton 
            data={customers} 
            currentData={customers} 
            filename="customer-transactions" 
          />
          <ServiceForm
            title="Add New Customer"
            fields={formFields}
            initialValues={{
              name: '',
              phone: '',
              address: '',
              description: '',
              amount: '',
              transactionType: 'debit'
            }}
            onSubmit={handleAddCustomer}
            trigger={
              <Button>
                <Plus size={16} className="mr-1" />
                Add Customer
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Debit Section */}
        <Card className="shadow-md border-l-4 border-l-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Debit (They Owe You)</span>
              <span className="text-red-600">₹{customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent 
            className="p-4 min-h-[50vh]" 
            onDragOver={(e) => handleDragOver(e, 'debit')}
            onDrop={(e) => handleDrop(e, 'debit')}
          >
            <div className="space-y-4">
              {getCustomersByTransactionType('debit').map(customer => (
                <CustomerCard 
                  key={customer.id}
                  customer={customer}
                  balance={getCustomerBalance(customer)}
                  onDragStart={() => handleDragStart(customer)}
                />
              ))}
              {getCustomersByTransactionType('debit').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No debit transactions</p>
                  <p className="text-sm">Drag customers here to add debit</p>
                  <ArrowLeft className="mx-auto mt-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Credit Section */}
        <Card className="shadow-md border-r-4 border-r-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Credit (You Owe Them)</span>
              <span className="text-green-600">₹{customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent 
            className="p-4 min-h-[50vh]" 
            onDragOver={(e) => handleDragOver(e, 'credit')}
            onDrop={(e) => handleDrop(e, 'credit')}
          >
            <div className="space-y-4">
              {getCustomersByTransactionType('credit').map(customer => (
                <CustomerCard 
                  key={customer.id}
                  customer={customer}
                  balance={-getCustomerBalance(customer)}
                  onDragStart={() => handleDragStart(customer)}
                />
              ))}
              {getCustomersByTransactionType('credit').length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No credit transactions</p>
                  <p className="text-sm">Drag customers here to add credit</p>
                  <ArrowRight className="mx-auto mt-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Total Balance Section */}
        <Card className="shadow-md border-t-4 border-t-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Total Balance</span>
              <span className={`${customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-4">
              <div className="py-2">
                <h3 className="text-lg font-medium">Debit Total</h3>
                <p className="text-2xl text-red-600">₹{customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0)}</p>
              </div>
              
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <ArrowRight className="text-gray-500" />
                </div>
              </div>
              
              <div className="py-2">
                <h3 className="text-lg font-medium">Credit Total</h3>
                <p className="text-2xl text-green-600">₹{customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0)}</p>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium">Balance</h3>
                <p className={`text-3xl font-bold ${customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - customers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) >= 0 ? 'Net amount to receive' : 'Net amount to pay'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showTransactionDialog && currentCustomerIndex !== -1 && (
        <TransactionDialog 
          customer={customers[currentCustomerIndex]}
          type={transactionType}
          open={showTransactionDialog}
          onOpenChange={setShowTransactionDialog}
          onComplete={handleTransactionComplete}
        />
      )}
    </div>
  );
};

export default Customers;
