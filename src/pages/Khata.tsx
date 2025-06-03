
import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { KhataCustomer, KhataTransaction } from '@/types/khata';
import { format } from 'date-fns';
import DownloadButton from '@/components/ui/DownloadButton';
import { toast } from "sonner";
import PageHeader from '@/components/layout/PageHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';

const Khata = () => {
  const [customers, setCustomers] = useState<KhataCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<KhataCustomer | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<KhataTransaction | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'customer' | 'transaction'>('customer');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    opening_balance: 0,
    opening_date: format(new Date(), 'yyyy-MM-dd')
  });

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    customer_id: '',
    type: 'debit' as 'debit' | 'credit',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
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

          if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError);
            return { ...customer, transactions: [] };
          }

          return {
            ...customer,
            transactions: transactionsData || []
          };
        })
      );

      setCustomers(customersWithTransactions);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAddCustomer = async () => {
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
      
      toast.success("Customer added successfully");
      await fetchCustomers();
      setShowCustomerDialog(false);
      resetCustomerForm();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error("Failed to add customer");
    }
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from('khata_customers')
        .update({
          name: customerForm.name,
          phone: customerForm.phone,
          opening_balance: customerForm.opening_balance,
          opening_date: customerForm.opening_date,
        })
        .eq('id', editingCustomer.id);

      if (error) throw error;
      
      toast.success("Customer updated successfully");
      await fetchCustomers();
      setShowCustomerDialog(false);
      setEditingCustomer(null);
      resetCustomerForm();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error("Failed to update customer");
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteId) return;

    try {
      // Delete all transactions first
      const { error: transactionError } = await supabase
        .from('khata_transactions')
        .delete()
        .eq('customer_id', deleteId);

      if (transactionError) throw transactionError;

      // Delete customer
      const { error } = await supabase
        .from('khata_customers')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      toast.success("Customer deleted successfully");
      await fetchCustomers();
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error("Failed to delete customer");
    }
  };

  const handleAddTransaction = async () => {
    try {
      const { data, error } = await supabase
        .from('khata_transactions')
        .insert({
          customer_id: transactionForm.customer_id,
          type: transactionForm.type,
          amount: transactionForm.amount,
          description: transactionForm.description,
          date: transactionForm.date,
        })
        .select();

      if (error) throw error;
      
      toast.success("Transaction added successfully");
      await fetchCustomers();
      setShowTransactionDialog(false);
      resetTransactionForm();
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error("Failed to add transaction");
    }
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .update({
          type: transactionForm.type,
          amount: transactionForm.amount,
          description: transactionForm.description,
          date: transactionForm.date,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;
      
      toast.success("Transaction updated successfully");
      await fetchCustomers();
      setShowTransactionDialog(false);
      setEditingTransaction(null);
      resetTransactionForm();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error("Failed to update transaction");
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      toast.success("Transaction deleted successfully");
      await fetchCustomers();
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error("Failed to delete transaction");
    }
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      name: '',
      phone: '',
      opening_balance: 0,
      opening_date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      customer_id: '',
      type: 'debit',
      amount: 0,
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const openEditCustomer = (customer: KhataCustomer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      opening_balance: customer.opening_balance,
      opening_date: format(new Date(customer.opening_date), 'yyyy-MM-dd')
    });
    setShowCustomerDialog(true);
  };

  const openEditTransaction = (transaction: KhataTransaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      customer_id: transaction.customer_id,
      type: transaction.type as 'debit' | 'credit',
      amount: transaction.amount,
      description: transaction.description || '',
      date: format(new Date(transaction.date), 'yyyy-MM-dd')
    });
    setShowTransactionDialog(true);
  };

  const initiateDelete = (id: string, type: 'customer' | 'transaction') => {
    setDeleteId(id);
    setDeleteType(type);
    setShowDeleteConfirm(true);
  };

  const calculateBalance = (customer: KhataCustomer) => {
    let balance = customer.opening_balance;
    customer.transactions?.forEach(transaction => {
      if (transaction.type === 'credit') {
        balance += transaction.amount;
      } else {
        balance -= transaction.amount;
      }
    });
    return balance;
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Khata Book"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name or phone..."
      >
        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetCustomerForm(); setEditingCustomer(null); }}>
              <Plus size={16} className="mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="opening_balance">Opening Balance</Label>
                <Input
                  id="opening_balance"
                  type="number"
                  value={customerForm.opening_balance}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_balance: Number(e.target.value) }))}
                  placeholder="Opening balance"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="opening_date">Opening Date</Label>
                <Input
                  id="opening_date"
                  type="date"
                  value={customerForm.opening_date}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_date: e.target.value }))}
                />
              </div>
              <Button onClick={editingCustomer ? handleEditCustomer : handleAddCustomer}>
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => { resetTransactionForm(); setEditingTransaction(null); }}>
              <Plus size={16} className="mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Customer</Label>
                <Select
                  value={transactionForm.customer_id}
                  onValueChange={(value) => setTransactionForm(prev => ({ ...prev, customer_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={transactionForm.type}
                  onValueChange={(value: 'debit' | 'credit') => setTransactionForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="Transaction amount"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Transaction description"
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
              <Button onClick={editingTransaction ? handleEditTransaction : handleAddTransaction}>
                {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <DownloadButton
          data={customers}
          filename="khata-customers"
          currentData={filteredCustomers}
          label="Export"
        />
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Opening Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <>
                    <TableRow key={customer.id} className="border-b">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>₹{customer.opening_balance.toFixed(2)}</TableCell>
                      <TableCell className={calculateBalance(customer) >= 0 ? "text-green-600" : "text-red-600"}>
                        ₹{calculateBalance(customer).toFixed(2)}
                      </TableCell>
                      <TableCell>{format(new Date(customer.opening_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditCustomer(customer)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => initiateDelete(customer.id, 'customer')}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {customer.transactions && customer.transactions.length > 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="p-0">
                          <div className="bg-slate-50 dark:bg-slate-700">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-32">Date</TableHead>
                                  <TableHead className="w-32">Type</TableHead>
                                  <TableHead className="w-32">Amount</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="w-32">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {customer.transactions.map((transaction) => (
                                  <TableRow key={transaction.id}>
                                    <TableCell>{format(new Date(transaction.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>
                                      <span className={transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                                        {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                                      </span>
                                    </TableCell>
                                    <TableCell>₹{transaction.amount.toFixed(2)}</TableCell>
                                    <TableCell>{transaction.description || '-'}</TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => openEditTransaction(transaction)}
                                        >
                                          <Edit size={12} />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => initiateDelete(transaction.id, 'transaction')}
                                        >
                                          <Trash2 size={12} />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        onConfirm={deleteType === 'customer' ? handleDeleteCustomer : handleDeleteTransaction}
        title={`Delete ${deleteType === 'customer' ? 'Customer' : 'Transaction'}?`}
        description={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
      />
    </div>
  );
};

export default Khata;
