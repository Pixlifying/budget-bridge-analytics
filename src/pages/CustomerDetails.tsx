import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Download, Plus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Customer, Transaction } from '@/types/customer';
import { formatCurrency } from '@/utils/calculateUtils';
import { Skeleton } from '@/components/ui/skeleton';
import DownloadButton from '@/components/ui/DownloadButton';
import ServiceForm from '@/components/ui/ServiceForm';
import { toast } from "sonner";
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';

const CustomerDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("balance");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
    navigate('/ledger');
  };

  const handleAddTransaction = async (values: Record<string, any>) => {
    try {
      if (!id) return false;

      const newTransaction = {
        customer_id: id,
        type: values.type as 'debit' | 'credit',
        amount: Number(values.amount),
        date: values.date,
        description: values.description || null
      };

      console.log("Saving transaction to Supabase:", newTransaction);

      const { data, error } = await supabase
        .from('customer_transactions')
        .insert(newTransaction)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (data && data.length > 0) {
        const typedTransaction = {
          ...data[0],
          type: data[0].type as 'debit' | 'credit'
        };
        
        setTransactions(prevTransactions => [typedTransaction, ...prevTransactions]);
        
        setCustomer(prevCustomer => {
          if (!prevCustomer) return null;
          
          return {
            ...prevCustomer,
            transactions: [typedTransaction, ...(prevCustomer.transactions || [])]
          };
        });
        
        toast.success("Transaction added successfully");
        fetchCustomerData();
      } else {
        toast.error("Transaction was saved but data wasn't returned properly");
      }
      
      return true;
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error("Failed to add transaction");
      return false;
    }
  };

  const handleDeleteTransaction = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const { error } = await supabase
        .from('customer_transactions')
        .delete()
        .eq('id', transactionToDelete);

      if (error) throw error;

      setTransactions(prevTransactions => 
        prevTransactions.filter(t => t.id !== transactionToDelete)
      );

      setCustomer(prevCustomer => {
        if (!prevCustomer) return null;
        return {
          ...prevCustomer,
          transactions: prevCustomer.transactions.filter(t => t.id !== transactionToDelete)
        };
      });

      toast.success("Transaction deleted successfully");
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error("Failed to delete transaction");
    } finally {
      setTransactionToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const totalDebits = transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const totalCredits = transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const balance = totalCredits - totalDebits;

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction =>
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format(new Date(transaction.date), 'dd MMM yyyy').toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.amount.toString().includes(searchTerm)
  );

  const debitTransactions = filteredTransactions.filter(t => t.type === 'debit');
  const creditTransactions = filteredTransactions.filter(t => t.type === 'credit');

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
      type: 'text' as const,
      required: false,
    }
  ];

  const TransactionTable = ({ transactions, type }: { transactions: Transaction[], type?: 'credit' | 'debit' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Balance</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction, index) => {
          // Calculate running balance
          let runningBalance = 0;
          for (let i = transactions.length - 1; i >= transactions.length - 1 - index; i--) {
            const t = transactions[i];
            if (t.type === 'credit') {
              runningBalance += Number(t.amount);
            } else {
              runningBalance -= Number(t.amount);
            }
          }

          return (
            <TableRow key={transaction.id}>
              <TableCell>{format(new Date(transaction.date), 'dd MMM yyyy')}</TableCell>
              <TableCell>{transaction.description || `${transaction.type === 'credit' ? 'Credit' : 'Debit'} Transaction`}</TableCell>
              <TableCell className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
              </TableCell>
              <TableCell className={runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(Math.abs(runningBalance))} {runningBalance >= 0 ? 'CR' : 'DR'}
              </TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteTransaction(transaction.id)}
                >
                  <Trash2 size={16} />
                  <span className="sr-only">Delete transaction</span>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  return (
    <div className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        size="sm" 
        className="flex items-center gap-1 -ml-2"
        onClick={handleBack}
      >
        <ArrowLeft size={16} /> Back to Ledger
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
                              filteredTransactions}
                    label="Export"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mt-4 p-4 bg-white rounded-lg">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Credits</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(totalCredits)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total Debits</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(totalDebits)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Current Balance</p>
                  <p className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(balance))} {balance >= 0 ? 'CR' : 'DR'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search transactions..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="balance">All Transactions</TabsTrigger>
              <TabsTrigger value="credit">Credit</TabsTrigger>
              <TabsTrigger value="debit">Debit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="balance" className="mt-4">
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-semibold">Transaction History</h3>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      No transactions found
                    </div>
                  ) : (
                    <TransactionTable transactions={filteredTransactions} />
                  )}
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
                    <TransactionTable transactions={creditTransactions} type="credit" />
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
                    <TransactionTable transactions={debitTransactions} type="debit" />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DeleteConfirmation
            isOpen={deleteConfirmOpen}
            onClose={() => {
              setDeleteConfirmOpen(false);
              setTransactionToDelete(null);
            }}
            onConfirm={confirmDeleteTransaction}
            title="Delete Transaction"
            description="Are you sure you want to delete this transaction? This action cannot be undone."
          />
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg">Customer not found</p>
          <Button variant="outline" onClick={handleBack} className="mt-4">
            Go back to ledger
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
