
import React, { useState, useEffect } from 'react';
import { Plus, Download, Trash2, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';

interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  opening_balance: number;
  opening_date: string;
  balance?: number;
}

interface KhataTransaction {
  id: string;
  customer_id: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  date: string;
}

const Khata = () => {
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [transactions, setTransactions] = useState<KhataTransaction[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    opening_balance: '',
    opening_date: format(new Date(), 'yyyy-MM-dd')
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'debit' as 'debit' | 'credit',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('khata_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate balances for each customer
      const customersWithBalances = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: transactionsData } = await supabase
            .from('khata_transactions')
            .select('*')
            .eq('customer_id', customer.id);

          const balance = (transactionsData || []).reduce((acc, transaction) => {
            return transaction.type === 'credit' 
              ? acc + Number(transaction.amount)
              : acc - Number(transaction.amount);
          }, Number(customer.opening_balance));

          return { ...customer, balance };
        })
      );

      setCustomers(customersWithBalances);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('khata_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      fetchTransactions(selectedCustomer.id);
    }
  }, [selectedCustomer]);

  const handleAddCustomer = async () => {
    try {
      const { error } = await supabase
        .from('khata_customers')
        .insert({
          name: customerForm.name,
          phone: customerForm.phone,
          opening_balance: Number(customerForm.opening_balance),
          opening_date: customerForm.opening_date
        });

      if (error) throw error;

      toast.success('Customer added successfully');
      setShowAddCustomer(false);
      setCustomerForm({ name: '', phone: '', opening_balance: '', opening_date: format(new Date(), 'yyyy-MM-dd') });
      fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .insert({
          customer_id: selectedCustomer.id,
          type: transactionForm.type,
          amount: Number(transactionForm.amount),
          description: transactionForm.description,
          date: transactionForm.date
        });

      if (error) throw error;

      toast.success('Transaction added successfully');
      setShowAddTransaction(false);
      setTransactionForm({ type: 'debit', amount: '', description: '', date: format(new Date(), 'yyyy-MM-dd') });
      fetchCustomers();
      fetchTransactions(selectedCustomer.id);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const exportToCSV = () => {
    if (!selectedCustomer) return;

    const csvData = [
      ['Date', 'Description', 'Debit', 'Credit', 'Balance'],
      ['', 'Opening Balance', '', '', selectedCustomer.opening_balance.toString()],
      ...transactions.map(transaction => [
        transaction.date,
        transaction.description,
        transaction.type === 'debit' ? transaction.amount.toString() : '',
        transaction.type === 'credit' ? transaction.amount.toString() : '',
        ''
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedCustomer.name}_ledger.csv`;
    link.click();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const getRunningBalance = (index: number) => {
    let balance = selectedCustomer?.opening_balance || 0;
    for (let i = transactions.length - 1; i >= index; i--) {
      const transaction = transactions[i];
      balance += transaction.type === 'credit' ? Number(transaction.amount) : -Number(transaction.amount);
    }
    return balance;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Customer Sidebar */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Customers</h2>
            <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
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
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opening_balance">Opening Balance</Label>
                    <Input
                      id="opening_balance"
                      type="number"
                      value={customerForm.opening_balance}
                      onChange={(e) => setCustomerForm({ ...customerForm, opening_balance: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="opening_date">Opening Date</Label>
                    <Input
                      id="opening_date"
                      type="date"
                      value={customerForm.opening_date}
                      onChange={(e) => setCustomerForm({ ...customerForm, opening_date: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddCustomer} className="w-full">
                    Add Customer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">{customers.length}</div>
              <div className="text-xs text-muted-foreground">Customers</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">{transactions.length}</div>
              <div className="text-xs text-muted-foreground">Transactions</div>
            </div>
            <div className="text-center p-2 bg-muted rounded">
              <div className="font-semibold">
                {customers.reduce((sum, customer) => sum + (customer.balance || 0), 0).toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Net Balance</div>
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                selectedCustomer?.id === customer.id ? 'bg-muted' : ''
              }`}
              onClick={() => setSelectedCustomer(customer)}
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm text-muted-foreground">{customer.phone}</div>
              <div className={`text-sm font-medium ${
                (customer.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                Balance: ₹{(customer.balance || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <PageHeader
          title="Khata Management"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search customers..."
        >
          {selectedCustomer && (
            <>
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Transaction
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Transaction for {selectedCustomer.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select value={transactionForm.type} onValueChange={(value: 'debit' | 'credit') => 
                        setTransactionForm({ ...transactionForm, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="debit">Debit</SelectItem>
                          <SelectItem value="credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={transactionForm.amount}
                        onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={transactionForm.description}
                        onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={transactionForm.date}
                        onChange={(e) => setTransactionForm({ ...transactionForm, date: e.target.value })}
                      />
                    </div>
                    <Button onClick={handleAddTransaction} className="w-full">
                      Add Transaction
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </PageHeader>

        <div className="flex-1 p-6">
          {selectedCustomer ? (
            <Card>
              <CardHeader>
                <CardTitle>Ledger for {selectedCustomer.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-4 font-semibold border-b pb-2">
                    <div>Date</div>
                    <div>Description</div>
                    <div>Debit</div>
                    <div>Credit</div>
                    <div>Balance</div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-4 py-2 bg-muted/50">
                    <div>{selectedCustomer.opening_date}</div>
                    <div>Opening Balance</div>
                    <div></div>
                    <div></div>
                    <div className="font-medium">₹{selectedCustomer.opening_balance.toFixed(2)}</div>
                  </div>

                  {transactions.map((transaction, index) => (
                    <div key={transaction.id} className="grid grid-cols-5 gap-4 py-2 border-b">
                      <div>{transaction.date}</div>
                      <div>{transaction.description}</div>
                      <div className="text-red-600">
                        {transaction.type === 'debit' ? `₹${transaction.amount.toFixed(2)}` : ''}
                      </div>
                      <div className="text-green-600">
                        {transaction.type === 'credit' ? `₹${transaction.amount.toFixed(2)}` : ''}
                      </div>
                      <div className="font-medium">₹{getRunningBalance(index).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Select a customer to view their ledger
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Khata;
