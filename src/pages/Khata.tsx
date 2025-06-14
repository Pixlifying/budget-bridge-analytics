
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { formatCurrency } from '@/utils/calculateUtils';
import { format } from 'date-fns';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  opening_balance: number;
  opening_date: string;
  created_at: string;
  updated_at: string;
  transactions: KhataTransaction[];
}

interface KhataTransaction {
  id: string;
  customer_id: string;
  type: 'debit' | 'credit';
  amount: number;
  date: string;
  description?: string;
  created_at: string;
}

const Khata = () => {
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'customer' | 'transaction'>('customer');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<KhataTransaction | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    opening_balance: 0,
    opening_date: new Date().toISOString().split('T')[0],
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'credit' as 'credit' | 'debit',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const fetchCustomers = async () => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('khata_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      const customersWithTransactions = await Promise.all(
        (customersData || []).map(async (customer) => {
          const { data: transactionsData, error: transactionsError } = await supabase
            .from('khata_transactions')
            .select('*')
            .eq('customer_id', customer.id)
            .order('date', { ascending: false });

          if (transactionsError) throw transactionsError;

          return {
            ...customer,
            transactions: transactionsData || []
          };
        })
      );

      setCustomers(customersWithTransactions);
    } catch (error) {
      console.error('Error fetching khata data:', error);
      toast.error('Failed to load khata data');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async () => {
    if (!customerForm.name || !customerForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('khata_customers')
        .insert({
          name: customerForm.name,
          phone: customerForm.phone,
          opening_balance: customerForm.opening_balance,
          opening_date: customerForm.opening_date,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newCustomer = { ...data[0], transactions: [] };
        setCustomers(prev => [newCustomer, ...prev]);
        setCustomerForm({
          name: '',
          phone: '',
          opening_balance: 0,
          opening_date: new Date().toISOString().split('T')[0],
        });
        setShowAddCustomer(false);
        toast.success('Customer added successfully');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer || !customerForm.name || !customerForm.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('khata_customers')
        .update({
          name: customerForm.name,
          phone: customerForm.phone,
          opening_balance: customerForm.opening_balance,
          opening_date: customerForm.opening_date,
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      setCustomers(prev =>
        prev.map(customer =>
          customer.id === selectedCustomer.id
            ? {
                ...customer,
                name: customerForm.name,
                phone: customerForm.phone,
                opening_balance: customerForm.opening_balance,
                opening_date: customerForm.opening_date,
              }
            : customer
        )
      );

      if (selectedCustomer.id === selectedCustomer?.id) {
        setSelectedCustomer(prev => prev ? {
          ...prev,
          name: customerForm.name,
          phone: customerForm.phone,
          opening_balance: customerForm.opening_balance,
          opening_date: customerForm.opening_date,
        } : null);
      }

      setShowEditCustomer(false);
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  const handleDeleteCustomer = async () => {
    if (!itemToDelete) return;

    try {
      // First delete all transactions for this customer
      await supabase
        .from('khata_transactions')
        .delete()
        .eq('customer_id', itemToDelete);

      // Then delete the customer
      const { error } = await supabase
        .from('khata_customers')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== itemToDelete));
      if (selectedCustomer?.id === itemToDelete) {
        setSelectedCustomer(null);
      }
      toast.success('Customer deleted successfully');
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleAddTransaction = async () => {
    if (!selectedCustomer || !transactionForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('khata_transactions')
        .insert({
          customer_id: selectedCustomer.id,
          type: transactionForm.type,
          amount: transactionForm.amount,
          date: transactionForm.date,
          description: transactionForm.description || null,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newTransaction = data[0];
        setCustomers(prev =>
          prev.map(customer =>
            customer.id === selectedCustomer.id
              ? { ...customer, transactions: [newTransaction, ...customer.transactions] }
              : customer
          )
        );

        setSelectedCustomer(prev => prev ? {
          ...prev,
          transactions: [newTransaction, ...prev.transactions]
        } : null);

        setTransactionForm({
          type: 'credit',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          description: '',
        });
        setShowAddTransaction(false);
        toast.success('Transaction added successfully');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction || !transactionForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .update({
          type: transactionForm.type,
          amount: transactionForm.amount,
          date: transactionForm.date,
          description: transactionForm.description || null,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      const updatedTransaction = {
        ...editingTransaction,
        type: transactionForm.type,
        amount: transactionForm.amount,
        date: transactionForm.date,
        description: transactionForm.description,
      };

      setCustomers(prev =>
        prev.map(customer => ({
          ...customer,
          transactions: customer.transactions.map(transaction =>
            transaction.id === editingTransaction.id ? updatedTransaction : transaction
          )
        }))
      );

      if (selectedCustomer) {
        setSelectedCustomer(prev => prev ? {
          ...prev,
          transactions: prev.transactions.map(transaction =>
            transaction.id === editingTransaction.id ? updatedTransaction : transaction
          )
        } : null);
      }

      setShowEditTransaction(false);
      setEditingTransaction(null);
      toast.success('Transaction updated successfully');
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;

      setCustomers(prev =>
        prev.map(customer => ({
          ...customer,
          transactions: customer.transactions.filter(transaction => transaction.id !== itemToDelete)
        }))
      );

      if (selectedCustomer) {
        setSelectedCustomer(prev => prev ? {
          ...prev,
          transactions: prev.transactions.filter(transaction => transaction.id !== itemToDelete)
        } : null);
      }

      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const openEditCustomer = (customer: KhataCustomer) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      opening_balance: customer.opening_balance,
      opening_date: customer.opening_date,
    });
    setShowEditCustomer(true);
  };

  const openEditTransaction = (transaction: KhataTransaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description || '',
    });
    setShowEditTransaction(true);
  };

  const initiateDelete = (id: string, type: 'customer' | 'transaction') => {
    setItemToDelete(id);
    setDeleteType(type);
    setDeleteConfirmOpen(true);
  };

  const calculateBalance = (customer: KhataCustomer) => {
    const totalCredits = customer.transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalDebits = customer.transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    return customer.opening_balance + totalCredits - totalDebits;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  if (selectedCustomer) {
    const balance = calculateBalance(selectedCustomer);
    
    return (
      <div className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCustomer(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Customers
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{selectedCustomer.name}</h1>
            <p className="text-muted-foreground">{selectedCustomer.phone}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditCustomer(selectedCustomer)}
            >
              <Edit size={16} className="mr-2" />
              Edit Customer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddTransaction(true)}
            >
              <Plus size={16} className="mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Account Summary</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="text-lg font-semibold">{formatCurrency(selectedCustomer.opening_balance)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Opening Date</p>
                <p className="text-lg font-semibold">{format(new Date(selectedCustomer.opening_date), 'dd/MM/yyyy')}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p className={`text-lg font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Transactions</h3>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCustomer.transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedCustomer.transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{transaction.description || '-'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          transaction.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTransaction(transaction)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => initiateDelete(transaction.id, 'transaction')}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Transaction Dialog */}
        <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="transaction_type">Type</Label>
                <Select
                  value={transactionForm.type}
                  onValueChange={(value: 'credit' | 'debit') => 
                    setTransactionForm(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transaction_amount">Amount</Label>
                <Input
                  id="transaction_amount"
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="Enter amount"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transaction_date">Date</Label>
                <Input
                  id="transaction_date"
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="transaction_description">Description</Label>
                <Input
                  id="transaction_description"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                />
              </div>
              <Button onClick={handleAddTransaction}>Add Transaction</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Transaction Dialog */}
        <Dialog open={showEditTransaction} onOpenChange={setShowEditTransaction}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Transaction</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_transaction_type">Type</Label>
                <Select
                  value={transactionForm.type}
                  onValueChange={(value: 'credit' | 'debit') => 
                    setTransactionForm(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_transaction_amount">Amount</Label>
                <Input
                  id="edit_transaction_amount"
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="Enter amount"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_transaction_date">Date</Label>
                <Input
                  id="edit_transaction_date"
                  type="date"
                  value={transactionForm.date}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_transaction_description">Description</Label>
                <Input
                  id="edit_transaction_description"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                />
              </div>
              <Button onClick={handleEditTransaction}>Update Transaction</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_customer_name">Name</Label>
                <Input
                  id="edit_customer_name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_customer_phone">Phone</Label>
                <Input
                  id="edit_customer_phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_customer_opening_balance">Opening Balance</Label>
                <Input
                  id="edit_customer_opening_balance"
                  type="number"
                  value={customerForm.opening_balance}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_balance: Number(e.target.value) }))}
                  placeholder="Opening balance"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_customer_opening_date">Opening Date</Label>
                <Input
                  id="edit_customer_opening_date"
                  type="date"
                  value={customerForm.opening_date}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_date: e.target.value }))}
                />
              </div>
              <Button onClick={handleEditCustomer}>Update Customer</Button>
            </div>
          </DialogContent>
        </Dialog>

        <DeleteConfirmation
          isOpen={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={deleteType === 'customer' ? handleDeleteCustomer : handleDeleteTransaction}
          title={`Delete ${deleteType === 'customer' ? 'Customer' : 'Transaction'}`}
          description={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        />
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Khata Management</h1>
        <Button onClick={() => setShowAddCustomer(true)}>
          <Plus size={16} className="mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search by name or phone..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No customers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => {
            const balance = calculateBalance(customer);
            return (
              <Card key={customer.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1" onClick={() => setSelectedCustomer(customer)}>
                      <h3 className="font-semibold">{customer.name}</h3>
                      <p className="text-sm text-muted-foreground">{customer.phone}</p>
                      <p className="text-xs text-muted-foreground">
                        Opening: {formatCurrency(customer.opening_balance)} | 
                        Date: {format(new Date(customer.opening_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className={`font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(balance)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditCustomer(customer);
                          }}
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            initiateDelete(customer.id, 'customer');
                          }}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <ArrowRight size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Name</Label>
              <Input
                id="customer_name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_opening_balance">Opening Balance</Label>
              <Input
                id="customer_opening_balance"
                type="number"
                value={customerForm.opening_balance}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_balance: Number(e.target.value) }))}
                placeholder="Opening balance"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customer_opening_date">Opening Date</Label>
              <Input
                id="customer_opening_date"
                type="date"
                value={customerForm.opening_date}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_date: e.target.value }))}
              />
            </div>
            <Button onClick={handleAddCustomer}>Add Customer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_customer_name">Name</Label>
              <Input
                id="edit_customer_name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_customer_phone">Phone</Label>
              <Input
                id="edit_customer_phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_customer_opening_balance">Opening Balance</Label>
              <Input
                id="edit_customer_opening_balance"
                type="number"
                value={customerForm.opening_balance}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_balance: Number(e.target.value) }))}
                placeholder="Opening balance"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_customer_opening_date">Opening Date</Label>
              <Input
                id="edit_customer_opening_date"
                type="date"
                value={customerForm.opening_date}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_date: e.target.value }))}
              />
            </div>
            <Button onClick={handleEditCustomer}>Update Customer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={deleteType === 'customer' ? handleDeleteCustomer : handleDeleteTransaction}
        title={`Delete ${deleteType === 'customer' ? 'Customer' : 'Transaction'}`}
        description={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
      />
    </div>
  );
};

export default Khata;
