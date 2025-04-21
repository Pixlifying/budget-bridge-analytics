
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Customer, Transaction } from '@/types/customer';
import { formatCurrency } from '@/utils/calculateUtils';
import { Skeleton } from '@/components/ui/skeleton';
import DownloadButton from '@/components/ui/DownloadButton';
import ServiceForm from '@/components/ui/ServiceForm';
import { toast } from "sonner";

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("balance");

  const fetchCustomerData = async () => {
    if (!id) return;

    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();

      if (customerError) throw customerError;

      const { data: transactionData, error: transactionError } = await supabase
        .from('customer_transactions')
        .select('*')
        .eq('customer_id', id)
        .order('date', { ascending: false });

      if (transactionError) throw transactionError;

      const typedTransactions = (transactionData || []).map(transaction => ({
        ...transaction,
        type: transaction.type as 'debit' | 'credit'
      }));

      setCustomer({
        ...customerData,
        transactions: typedTransactions
      });
      setTransactions(typedTransactions);
    } catch (error) {
      console.error('Error fetching customer details:', error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const handleBack = () => {
    navigate('/customers');
  };

  const handleAddTransaction = async (values: Record<string, any>) => {
    try {
      if (!id) return false;

      const newTransaction = {
        customer_id: id,
        type: values.type as 'debit' | 'credit',
        amount: Number(values.amount),
        date: values.date,
        description: values.description || null,
      };

      const { error } = await supabase
        .from('customer_transactions')
        .insert(newTransaction);

      if (error) throw error;
      
      toast.success("Transaction added successfully");
      await fetchCustomerData();
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error("Failed to add transaction");
      return false;
    }
  };

  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalCredits = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const balance = totalCredits - totalDebits;

  const debitTransactions = transactions.filter(t => t.type === 'debit');
  const creditTransactions = transactions.filter(t => t.type === 'credit');

  const transactionFormFields = [
    {
      name: 'type',
      label: 'Transaction Type',
      type: 'select' as const,
      options: [
        { value: 'credit', label: 'Credit' },
        { value: 'debit', label: 'Debit' },
      ],
      required: true,
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'number' as const,
      required: true,
      min: 0,
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
    },
  ];

  return (
    <div className="container px-4 py-6 space-y-6 max-w-lg mx-auto">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-1 -ml-2"
        onClick={handleBack}
      >
        <ArrowLeft size={16} /> Back
      </Button>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : customer ? (
        <>
          <Card className="border-0 shadow-md bg-purple-50">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-purple-900">{customer.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-purple-700">
                    <Phone size={14} />
                    <span>{customer.phone}</span>
                  </div>
                  {customer.address && (
                    <p className="text-sm text-muted-foreground mt-1">{customer.address}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ServiceForm
                    title="Add New Transaction"
                    fields={transactionFormFields}
                    initialValues={{ date: new Date().toISOString().split('T')[0] }}
                    onSubmit={handleAddTransaction}
                    trigger={
                      <Button size="sm" variant="outline">
                        <Plus size={16} className="mr-1" /> Add Transaction
                      </Button>
                    }
                  />
                  <DownloadButton
                    data={transactions}
                    filename={`customer-${customer.name}-transactions`}
                    currentData={activeTab === 'credit' ? creditTransactions : 
                              activeTab === 'debit' ? debitTransactions : 
                              transactions}
                    label="Export"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Credits</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(totalCredits)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Debits</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(totalDebits)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Balance</p>
                  <p className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="credit">Credit</TabsTrigger>
              <TabsTrigger value="debit">Debit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="balance" className="mt-4">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Total Balance</h3>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
                    <p className={`text-4xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(balance)}
                    </p>
                  </div>
                  <div className="flex justify-between mt-4 border-t pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Credits</p>
                      <p className="text-lg font-semibold text-green-600">{formatCurrency(totalCredits)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Debits</p>
                      <p className="text-lg font-semibold text-red-600">{formatCurrency(totalDebits)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="credit" className="mt-4">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Credit Transactions</h3>
                </CardHeader>
                <CardContent className="p-0">
                  {creditTransactions.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      No credit transactions found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {creditTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{format(new Date(transaction.date), 'dd MMM yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.description || "Credit Transaction"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-green-600 font-semibold">
                              +{formatCurrency(Number(transaction.amount))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="debit" className="mt-4">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Debit Transactions</h3>
                </CardHeader>
                <CardContent className="p-0">
                  {debitTransactions.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      No debit transactions found
                    </div>
                  ) : (
                    <div className="divide-y">
                      {debitTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4 flex justify-between items-center">
                          <div>
                            <p className="font-medium">{format(new Date(transaction.date), 'dd MMM yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.description || "Debit Transaction"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-red-600 font-semibold">
                              -{formatCurrency(Number(transaction.amount))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg">Customer not found</p>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            Go back to customers
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
