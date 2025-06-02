
import React, { useState, useEffect } from 'react';
import { Plus, Download, Eye, Trash2, Edit, DollarSign, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useNotification } from '@/contexts/NotificationContext';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import { KhataCustomer, KhataTransaction } from '@/types/khata';

const Khata = () => {
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [transactions, setTransactions] = useState<KhataTransaction[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const { showNotification } = useNotification();

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    opening_balance: 0,
    opening_date: new Date().toISOString().split('T')[0]
  });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    type: 'credit' as 'debit' | 'credit',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('khata_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showNotification('Failed to load customers', 'error');
    }
  };

  const fetchTransactions = async (customerId?: string) => {
    try {
      let query = supabase.from('khata_transactions').select('*');
      
      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      
      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure proper typing
      const typedTransactions = (data || []).map(transaction => ({
        ...transaction,
        type: transaction.type as 'debit' | 'credit'
      }));
      
      setTransactions(typedTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('Failed to load transactions', 'error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchCustomers();
      await fetchTransactions();
      setLoading(false);
    };

    loadData();

    // Set up real-time subscriptions
    const customersChannel = supabase
      .channel('khata_customers_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'khata_customers' }, (payload) => {
        console.log('Customer change:', payload);
        fetchCustomers();
        
        if (payload.eventType === 'INSERT') {
          showNotification('New customer added successfully!', 'success');
        } else if (payload.eventType === 'DELETE') {
          showNotification('Customer deleted successfully!', 'info');
        }
      })
      .subscribe();

    const transactionsChannel = supabase
      .channel('khata_transactions_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'khata_transactions' }, (payload) => {
        console.log('Transaction change:', payload);
        fetchTransactions(selectedCustomer?.id);
        
        if (payload.eventType === 'INSERT') {
          showNotification('New transaction recorded!', 'success');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [selectedCustomer?.id]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('khata_customers')
        .insert([customerForm]);

      if (error) throw error;

      setCustomerForm({
        name: '',
        phone: '',
        opening_balance: 0,
        opening_date: new Date().toISOString().split('T')[0]
      });
      setShowAddCustomer(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      showNotification('Failed to add customer', 'error');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .insert([{
          ...transactionForm,
          customer_id: selectedCustomer.id
        }]);

      if (error) throw error;

      setTransactionForm({
        type: 'credit',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddTransaction(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      showNotification('Failed to add transaction', 'error');
    }
  };

  const calculateBalance = (customer: KhataCustomer) => {
    const customerTransactions = transactions.filter(t => t.customer_id === customer.id);
    const transactionTotal = customerTransactions.reduce((sum, t) => {
      return sum + (t.type === 'credit' ? t.amount : -t.amount);
    }, 0);
    return customer.opening_balance + transactionTotal;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const totalBalance = customers.reduce((sum, customer) => sum + calculateBalance(customer), 0);
  const totalTransactions = transactions.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Khata Management"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search customers..."
      >
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-white/10">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({...customerForm, name: e.target.value})}
                  required
                  className="bg-white/50 dark:bg-white/10 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({...customerForm, phone: e.target.value})}
                  required
                  className="bg-white/50 dark:bg-white/10 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  value={customerForm.opening_balance}
                  onChange={(e) => setCustomerForm({...customerForm, opening_balance: Number(e.target.value)})}
                  className="bg-white/50 dark:bg-white/10 backdrop-blur-sm"
                />
              </div>
              <div>
                <Label htmlFor="opening_date">Opening Date</Label>
                <Input
                  id="opening_date"
                  type="date"
                  value={customerForm.opening_date}
                  onChange={(e) => setCustomerForm({...customerForm, opening_date: e.target.value})}
                  required
                  className="bg-white/50 dark:bg-white/10 backdrop-blur-sm"
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                Add Customer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-3">
          <StatCard
            title="Total Customers"
            value={customers.length}
            icon={<Users className="h-5 w-5" />}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50"
          />
          <StatCard
            title="Total Transactions"
            value={totalTransactions}
            icon={<TrendingUp className="h-5 w-5" />}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/50"
          />
          <StatCard
            title="Net Balance"
            value={`₹${totalBalance.toFixed(2)}`}
            icon={<DollarSign className="h-5 w-5" />}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-200/50 dark:border-orange-800/50"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 shadow-xl">
              <div className="p-4 border-b border-white/20 dark:border-white/10">
                <h3 className="font-semibold text-lg">Customers</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className={`p-4 border-b border-white/10 cursor-pointer transition-all duration-200 hover:bg-white/50 dark:hover:bg-white/5 ${
                      selectedCustomer?.id === customer.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      fetchTransactions(customer.id);
                    }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${calculateBalance(customer) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{calculateBalance(customer).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl border border-white/20 dark:border-white/10 shadow-xl">
              <div className="p-4 border-b border-white/20 dark:border-white/10 flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                  {selectedCustomer ? `${selectedCustomer.name}'s Ledger` : 'Select a Customer'}
                </h3>
                {selectedCustomer && (
                  <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 dark:border-white/10">
                      <DialogHeader>
                        <DialogTitle>Add Transaction</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAddTransaction} className="space-y-4">
                        <div>
                          <Label>Type</Label>
                          <Select value={transactionForm.type} onValueChange={(value: 'debit' | 'credit') => setTransactionForm({...transactionForm, type: value})}>
                            <SelectTrigger className="bg-white/50 dark:bg-white/10 backdrop-blur-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="credit">Credit</SelectItem>
                              <SelectItem value="debit">Debit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            value={transactionForm.amount}
                            onChange={(e) => setTransactionForm({...transactionForm, amount: Number(e.target.value)})}
                            required
                            className="bg-white/50 dark:bg-white/10 backdrop-blur-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={transactionForm.description}
                            onChange={(e) => setTransactionForm({...transactionForm, description: e.target.value})}
                            className="bg-white/50 dark:bg-white/10 backdrop-blur-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={transactionForm.date}
                            onChange={(e) => setTransactionForm({...transactionForm, date: e.target.value})}
                            required
                            className="bg-white/50 dark:bg-white/10 backdrop-blur-sm"
                          />
                        </div>
                        <Button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                          Add Transaction
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              
              {selectedCustomer ? (
                <div className="p-4">
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Opening Balance</p>
                        <p className="text-lg font-semibold">₹{selectedCustomer.opening_balance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className={`text-lg font-semibold ${calculateBalance(selectedCustomer) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{calculateBalance(selectedCustomer).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {transactions.filter(t => t.customer_id === selectedCustomer.id).map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-white/50 dark:bg-white/5 rounded-lg border border-white/20 dark:border-white/10 hover:bg-white/70 dark:hover:bg-white/10 transition-colors duration-200">
                        <div>
                          <p className="font-medium">{transaction.description || 'No description'}</p>
                          <p className="text-sm text-muted-foreground">{transaction.date}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground uppercase">{transaction.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a customer to view their transaction history</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Khata;
