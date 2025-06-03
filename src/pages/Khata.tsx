
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/calculateUtils';
import { KhataCustomer, KhataTransaction } from '@/types/khata';
import PageWrapper from '@/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';

const Khata = () => {
  const [customers, setCustomers] = useState<(KhataCustomer & { currentBalance: number })[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomer | null>(null);
  const [transactions, setTransactions] = useState<KhataTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<KhataCustomer | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<KhataTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'customer' | 'transaction'; id: string } | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    opening_balance: '',
    opening_date: new Date().toISOString().split('T')[0]
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'debit' as 'debit' | 'credit',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('khata_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customersWithBalance = await Promise.all(
        (data || []).map(async (customer) => {
          const { data: transactionsData } = await supabase
            .from('khata_transactions')
            .select('amount, type')
            .eq('customer_id', customer.id);

          const totalDebits = transactionsData
            ?.filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const totalCredits = transactionsData
            ?.filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

          const currentBalance = Number(customer.opening_balance) + totalCredits - totalDebits;

          return {
            ...customer,
            currentBalance
          };
        })
      );

      setCustomers(customersWithBalance);
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
      toast.error('Failed to load transactions');
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

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setShowCustomerForm(false);
      setCustomerForm({ name: '', phone: '', opening_balance: '', opening_date: new Date().toISOString().split('T')[0] });
      await fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from('khata_customers')
        .update({
          name: customerForm.name,
          phone: customerForm.phone,
          opening_balance: Number(customerForm.opening_balance),
          opening_date: customerForm.opening_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;

      toast.success('Customer updated successfully');
      setEditingCustomer(null);
      setShowCustomerForm(false);
      setCustomerForm({ name: '', phone: '', opening_balance: '', opening_date: new Date().toISOString().split('T')[0] });
      await fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setShowTransactionForm(false);
      setTransactionForm({ type: 'debit', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      await fetchTransactions(selectedCustomer.id);
      await fetchCustomers();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .update({
          type: transactionForm.type,
          amount: Number(transactionForm.amount),
          description: transactionForm.description,
          date: transactionForm.date
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      toast.success('Transaction updated successfully');
      setEditingTransaction(null);
      setShowTransactionForm(false);
      setTransactionForm({ type: 'debit', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      await fetchTransactions(selectedCustomer.id);
      await fetchCustomers();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      if (deleteTarget.type === 'customer') {
        await supabase.from('khata_transactions').delete().eq('customer_id', deleteTarget.id);
        const { error } = await supabase.from('khata_customers').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        
        if (selectedCustomer?.id === deleteTarget.id) {
          setSelectedCustomer(null);
          setTransactions([]);
        }
        await fetchCustomers();
        toast.success('Customer deleted successfully');
      } else {
        const { error } = await supabase.from('khata_transactions').delete().eq('id', deleteTarget.id);
        if (error) throw error;
        
        if (selectedCustomer) {
          await fetchTransactions(selectedCustomer.id);
          await fetchCustomers();
        }
        toast.success('Transaction deleted successfully');
      }

      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to delete');
    }
  };

  const openEditCustomer = (customer: KhataCustomer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      opening_balance: customer.opening_balance.toString(),
      opening_date: customer.opening_date
    });
    setShowCustomerForm(true);
  };

  const openEditTransaction = (transaction: KhataTransaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description || '',
      date: transaction.date
    });
    setShowTransactionForm(true);
  };

  const initiateDelete = (type: 'customer' | 'transaction', id: string) => {
    setDeleteTarget({ type, id });
    setShowDeleteConfirm(true);
  };

  return (
    <PageWrapper
      title="Khata Book"
      subtitle="Manage customer accounts and transactions"
      action={
        <div className="flex gap-2">
          <Button onClick={() => setShowCustomerForm(true)}>
            <Plus className="mr-2" size={16} />
            Add Customer
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCustomer?.id === customer.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      <p className={`text-sm font-medium ${
                        customer.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Balance: {formatCurrency(customer.currentBalance)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCustomer(customer);
                        }}
                      >
                        <Edit size={12} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          initiateDelete('customer', customer.id);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedCustomer ? `${selectedCustomer.name}'s Transactions` : 'Select a Customer'}
            </CardTitle>
            {selectedCustomer && (
              <Button onClick={() => setShowTransactionForm(true)} size="sm">
                <Plus className="mr-2" size={16} />
                Add Transaction
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedCustomer ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-3 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            transaction.type === 'credit'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditTransaction(transaction)}
                        >
                          <Edit size={12} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => initiateDelete('transaction', transaction.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Select a customer to view transactions
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customer Form Dialog */}
      <Dialog open={showCustomerForm} onOpenChange={setShowCustomerForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingCustomer ? handleEditCustomer : handleAddCustomer}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  value={customerForm.opening_balance}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_balance: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="opening_date">Opening Date</Label>
                <Input
                  id="opening_date"
                  type="date"
                  value={customerForm.opening_date}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setShowCustomerForm(false);
                setEditingCustomer(null);
                setCustomerForm({ name: '', phone: '', opening_balance: '', opening_date: new Date().toISOString().split('T')[0] });
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCustomer ? 'Update' : 'Add'} Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transaction Form Dialog */}
      <Dialog open={showTransactionForm} onOpenChange={setShowTransactionForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={transactionForm.type} onValueChange={(value: 'debit' | 'credit') => 
                  setTransactionForm(prev => ({ ...prev, type: value }))
                }>
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
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => {
                setShowTransactionForm(false);
                setEditingTransaction(null);
                setTransactionForm({ type: 'debit', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        title={`Delete ${deleteTarget?.type === 'customer' ? 'Customer' : 'Transaction'}`}
        description={`Do you really want to delete this ${deleteTarget?.type}? This action cannot be undone.`}
      />
    </PageWrapper>
  );
};

export default Khata;
