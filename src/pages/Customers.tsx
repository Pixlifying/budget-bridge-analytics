
import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft, ArrowRight, Trash2, Edit } from 'lucide-react';
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
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { isSameDay, isSameMonth, startOfDay } from 'date-fns';

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'debit' | 'credit'>('debit');
  const [currentCustomerIndex, setCurrentCustomerIndex] = useState<number>(-1);
  const [date, setDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<'day' | 'month'>('month');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();

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

      const enrichedCustomers: Customer[] = customersData.map(customer => ({
        ...customer,
        transactions: transactionsData
          .filter(t => t.customer_id === customer.id)
          .map(t => ({
            ...t,
            type: t.type as 'debit' | 'credit'
          }))
      }));

      setCustomers(enrichedCustomers);
      filterCustomersByDate(enrichedCustomers, date, mode);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch customers: ${error}`,
        variant: "destructive"
      });
    }
  };

  // Function to filter customers based on date and mode
  const filterCustomersByDate = (customersList: Customer[], filterDate: Date, filterMode: 'day' | 'month') => {
    const filtered = customersList.map(customer => {
      const filteredTransactions = customer.transactions.filter(t => {
        const transactionDate = new Date(t.date);
        if (filterMode === 'day') {
          return isSameDay(transactionDate, filterDate);
        } else {
          return isSameMonth(transactionDate, filterDate);
        }
      });
      
      return {
        ...customer,
        transactions: filteredTransactions
      };
    }).filter(customer => customer.transactions.length > 0);
    
    setFilteredCustomers(filtered);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Apply filters whenever date or mode changes
  useEffect(() => {
    if (customers.length > 0) {
      filterCustomersByDate(customers, date, mode);
    }
  }, [date, mode, customers]);

  const handleAddCustomer = async (values: any) => {
    try {
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

      const { error: transactionError } = await supabase
        .from('customer_transactions')
        .insert({
          customer_id: customerData[0].id,
          type: values.transactionType,
          amount: values.amount,
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString()
        });

      if (transactionError) throw transactionError;

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

  const handleEditCustomer = async (values: any) => {
    if (!selectedCustomer) return;

    try {
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          name: values.name,
          description: values.description,
          phone: values.phone,
          address: values.address
        })
        .eq('id', selectedCustomer.id);

      if (customerError) throw customerError;

      await fetchCustomers();
      setIsEditMode(false);
      setSelectedCustomer(null);

      toast({
        title: "Customer updated",
        description: `${values.name} has been updated successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update customer: ${error}`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const { error: transactionError } = await supabase
        .from('customer_transactions')
        .delete()
        .eq('customer_id', selectedCustomer.id);

      if (transactionError) throw transactionError;

      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', selectedCustomer.id);

      if (customerError) throw customerError;

      await fetchCustomers();
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);

      toast({
        title: "Customer deleted",
        description: `${selectedCustomer.name} has been deleted successfully.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete customer: ${error}`,
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
      if (draggedCustomer.transactions.some(t => t.type !== section)) {
        e.dataTransfer.dropEffect = "move";
      }
    }
  };

  const handleDrop = (e: React.DragEvent, section: 'debit' | 'credit') => {
    e.preventDefault();
    if (draggedCustomer) {
      const draggedIndex = filteredCustomers.findIndex(c => c.id === draggedCustomer.id);
      if (draggedIndex !== -1) {
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

  const handleTransactionComplete = async (amount: number) => {
    if (currentCustomerIndex !== -1 && transactionType) {
      const customer = filteredCustomers[currentCustomerIndex];
      
      try {
        const { error: transactionError } = await supabase
          .from('customer_transactions')
          .insert({
            customer_id: customer.id,
            type: transactionType,
            amount: amount,
            date: new Date().toISOString()
          });

        if (transactionError) throw transactionError;

        await fetchCustomers();
        
        toast({
          title: "Transaction added",
          description: `${transactionType === 'credit' ? 'Credit' : 'Debit'} of ${amount} added for ${customer.name}`
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to add transaction: ${error}`,
          variant: "destructive"
        });
      }
    }
    
    setShowTransactionDialog(false);
    setTransactionType('debit');
    setCurrentCustomerIndex(-1);
  };

  const getCustomersByTransactionType = (type: 'debit' | 'credit') => {
    return filteredCustomers.filter(customer => 
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

  const formFields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'phone', label: 'Mobile Number', type: 'text' as const, required: true },
    { name: 'address', label: 'Address', type: 'text' as const, required: true },
    { name: 'description', label: 'Description', type: 'textarea' as const, required: false },
    { name: 'amount', label: 'Amount', type: 'number' as const, required: true, min: 0 },
    { name: 'date', label: 'Date', type: 'date' as const, required: true },
    { 
      name: 'transactionType', 
      label: 'Transaction Type', 
      type: 'select' as const, 
      required: true,
      options: [
        { label: 'Debit (They Owe You)', value: 'debit' },
        { label: 'Credit (You Owe Them)', value: 'credit' }
      ]
    }
  ];

  const editFormFields = [
    { name: 'name', label: 'Name', type: 'text' as const, required: true },
    { name: 'phone', label: 'Mobile Number', type: 'text' as const, required: true },
    { name: 'address', label: 'Address', type: 'text' as const, required: true },
    { name: 'description', label: 'Description', type: 'textarea' as const, required: false }
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
            data={filteredCustomers} 
            currentData={filteredCustomers} 
            filename="customer-transactions" 
          />
          <ServiceForm
            title={isEditMode ? "Edit Customer" : "Add New Customer"}
            fields={isEditMode ? editFormFields : formFields}
            initialValues={isEditMode && selectedCustomer ? {
              name: selectedCustomer.name,
              phone: selectedCustomer.phone,
              address: selectedCustomer.address,
              description: selectedCustomer.description || '',
            } : {
              name: '',
              phone: '',
              address: '',
              description: '',
              date: new Date(),
              amount: '',
              transactionType: 'debit'
            }}
            onSubmit={isEditMode ? handleEditCustomer : handleAddCustomer}
            trigger={
              <Button>
                <Plus size={16} className="mr-1" />
                {isEditMode ? 'Edit Customer' : 'Add Customer'}
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md border-l-4 border-l-red-500">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Debit (They Owe You)</span>
              <span className="text-red-600">₹{filteredCustomers.reduce((sum, customer) => 
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
                <div key={customer.id} className="relative group">
                  <CustomerCard 
                    customer={customer}
                    balance={getCustomerBalance(customer)}
                    onDragStart={() => handleDragStart(customer)}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsEditMode(true);
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
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

        <Card className="shadow-md border-r-4 border-r-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Credit (You Owe Them)</span>
              <span className="text-green-600">₹{filteredCustomers.reduce((sum, customer) => 
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
                <div key={customer.id} className="relative group">
                  <CustomerCard 
                    key={customer.id}
                    customer={customer}
                    balance={getCustomerBalance(customer)}
                    onDragStart={() => handleDragStart(customer)}
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsEditMode(true);
                      }}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
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

        <Card className="shadow-md border-t-4 border-t-purple-500">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-xl flex justify-between items-center">
              <span>Total Balance</span>
              <span className={`${filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) >= 0 ? '' : '-'}
                ₹{Math.abs(filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0))}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-4">
              <div className="py-2">
                <h3 className="text-lg font-medium">Debit Total</h3>
                <p className="text-2xl text-red-600">₹{filteredCustomers.reduce((sum, customer) => 
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
                <p className="text-2xl text-green-600">₹{filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0)}</p>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-medium">Balance</h3>
                <p className={`text-3xl font-bold ${filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) >= 0 ? '' : '-'}
                  ₹{Math.abs(filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'credit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0))}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredCustomers.reduce((sum, customer) => 
                sum + customer.transactions
                  .filter(t => t.type === 'debit')
                  .reduce((tSum, t) => tSum + t.amount, 0), 0) - filteredCustomers.reduce((sum, customer) => 
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
          customer={filteredCustomers[currentCustomerIndex]}
          type={transactionType}
          open={showTransactionDialog}
          onOpenChange={setShowTransactionDialog}
          onComplete={handleTransactionComplete}
        />
      )}

      <DeleteConfirmation
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedCustomer(null);
        }}
        onConfirm={handleDeleteCustomer}
        title={`Delete ${selectedCustomer?.name}`}
        description="Are you sure you want to delete this customer? This will also delete all their transactions."
      />
    </div>
  );
};

export default Customers;
