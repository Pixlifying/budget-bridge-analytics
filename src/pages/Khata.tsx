
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';

interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  opening_balance: number;
  opening_date: string;
  created_at: string;
  current_balance?: number;
}

interface KhataTransaction {
  id: string;
  customer_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description?: string;
  date: string;
  created_at: string;
  running_balance?: number;
}

const Khata = () => {
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [transactions, setTransactions] = useState<KhataTransaction[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // Form states
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    opening_balance: 0
  });

  const [newTransaction, setNewTransaction] = useState({
    amount: 0,
    type: 'credit' as 'credit' | 'debit',
    description: ''
  });

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('khata_customers')
        .select('*')
        .order('name');

      if (error) throw error;

      // Calculate current balance for each customer
      const customersWithBalance = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: txData } = await supabase
            .from('khata_transactions')
            .select('amount, type')
            .eq('customer_id', customer.id);

          const totalCredits = txData?.filter(tx => tx.type === 'credit').reduce((sum, tx) => sum + tx.amount, 0) || 0;
          const totalDebits = txData?.filter(tx => tx.type === 'debit').reduce((sum, tx) => sum + tx.amount, 0) || 0;
          
          return {
            ...customer,
            current_balance: customer.opening_balance + totalCredits - totalDebits
          };
        })
      );

      setCustomers(customersWithBalance);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchTransactions = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('khata_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: true });

      if (error) throw error;

      // Calculate running balance for each transaction
      const customer = customers.find(c => c.id === customerId);
      let runningBalance = customer?.opening_balance || 0;

      const transactionsWithBalance = (data || []).map(transaction => {
        if (transaction.type === 'credit') {
          runningBalance += transaction.amount;
        } else {
          runningBalance -= transaction.amount;
        }
        
        return {
          ...transaction,
          running_balance: runningBalance
        };
      });

      setTransactions(transactionsWithBalance);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  useEffect(() => {
    fetchCustomers();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchTransactions(selectedCustomer);
    }
  }, [selectedCustomer, customers]);

  const addCustomer = async () => {
    try {
      const { error } = await supabase
        .from('khata_customers')
        .insert([newCustomer]);

      if (error) throw error;

      toast.success('Customer added successfully');
      setNewCustomer({ name: '', phone: '', opening_balance: 0 });
      setShowAddCustomer(false);
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const addTransaction = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .insert([{
          customer_id: selectedCustomer,
          ...newTransaction
        }]);

      if (error) throw error;

      toast.success('Transaction added successfully');
      setNewTransaction({ amount: 0, type: 'credit', description: '' });
      setShowAddTransaction(false);
      fetchCustomers(); // Refresh to update current balance
      fetchTransactions(selectedCustomer);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const deleteCustomer = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('khata_customers')
        .delete()
        .eq('id', customerId);

      if (error) throw error;

      toast.success('Customer deleted successfully');
      if (selectedCustomer === customerId) {
        setSelectedCustomer(null);
        setTransactions([]);
      }
      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  const deleteTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from('khata_transactions')
        .delete()
        .eq('id', transactionId);

      if (error) throw error;

      toast.success('Transaction deleted successfully');
      fetchCustomers(); // Refresh to update current balance
      if (selectedCustomer) {
        fetchTransactions(selectedCustomer);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const selectedCustomerData = customers.find(c => c.id === selectedCustomer);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeader
        title="Khata Management"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customers..."
      >
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  step="0.01"
                  value={newCustomer.opening_balance}
                  onChange={(e) => setNewCustomer({ ...newCustomer, opening_balance: Number(e.target.value) })}
                  placeholder="Opening balance"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                  Cancel
                </Button>
                <Button onClick={addCustomer}>Add Customer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customers List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredCustomers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedCustomer === customer.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedCustomer(customer.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          (customer.current_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ₹{Math.abs(customer.current_balance || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(customer.current_balance || 0) >= 0 ? 'Credit' : 'Debit'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomer(customer.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCustomers.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No customers found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>{selectedCustomerData?.name}'s Transactions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Opening Balance: ₹{selectedCustomerData?.opening_balance.toFixed(2)}
                    </p>
                    <p className={`text-lg font-bold ${
                      (selectedCustomerData?.current_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Current Balance: ₹{Math.abs(selectedCustomerData?.current_balance || 0).toFixed(2)} 
                      {(selectedCustomerData?.current_balance || 0) >= 0 ? ' (Credit)' : ' (Debit)'}
                    </p>
                  </div>
                  <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={newTransaction.amount}
                            onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                            placeholder="Amount"
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Type</Label>
                          <Select value={newTransaction.type} onValueChange={(value: 'credit' | 'debit') => setNewTransaction({ ...newTransaction, type: value })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="credit">Credit (Money In)</SelectItem>
                              <SelectItem value="debit">Debit (Money Out)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newTransaction.description}
                            onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                            placeholder="Transaction description"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowAddTransaction(false)}>
                            Cancel
                          </Button>
                          <Button onClick={addTransaction}>Add Transaction</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 font-semibold border-b pb-2">
                    <div>Date</div>
                    <div>Type</div>
                    <div>Amount</div>
                    <div>Description</div>
                    <div>Balance</div>
                    <div>Actions</div>
                  </div>
                  
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="grid grid-cols-6 gap-4 items-center border-b pb-2">
                      <div className="text-sm">{new Date(transaction.date).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1">
                        {transaction.type === 'credit' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                        </span>
                      </div>
                      <div className={`font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.description || '-'}
                      </div>
                      <div className={`font-bold ${
                        (transaction.running_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ₹{Math.abs(transaction.running_balance || 0).toFixed(2)}
                        <span className="text-xs ml-1">
                          {(transaction.running_balance || 0) >= 0 ? '(Credit)' : '(Debit)'}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTransaction(transaction.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {transactions.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      No transactions found. Add a transaction to get started.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4" />
                  <p>Select a customer to view their transactions</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Khata;
