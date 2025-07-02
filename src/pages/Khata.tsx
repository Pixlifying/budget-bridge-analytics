import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, Download, ArrowLeft, ArrowRight, Printer, Filter } from 'lucide-react';
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
  const [showEditCustomer, setShowEditCustomer] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showEditTransaction, setShowEditTransaction] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'customer' | 'transaction'>('customer');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<KhataTransaction | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'credit' | 'debit'>('all');

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

          // Properly type cast the transactions
          const typedTransactions: KhataTransaction[] = (transactionsData || []).map(transaction => ({
            id: transaction.id,
            customer_id: transaction.customer_id,
            type: transaction.type as 'debit' | 'credit',
            amount: Number(transaction.amount),
            date: transaction.date,
            description: transaction.description || undefined,
            created_at: transaction.created_at
          }));

          return {
            ...customer,
            transactions: typedTransactions
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

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        const newCustomer: KhataCustomer = { ...data[0], transactions: [] };
        setCustomers(prev => [newCustomer, ...prev]);
        setCustomerForm({
          name: '',
          phone: '',
          opening_balance: 0,
          opening_date: new Date().toISOString().split('T')[0],
        });
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
        const newTransaction: KhataTransaction = {
          id: data[0].id,
          customer_id: data[0].customer_id,
          type: data[0].type as 'debit' | 'credit',
          amount: Number(data[0].amount),
          date: data[0].date,
          description: data[0].description || undefined,
          created_at: data[0].created_at
        };

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

      const updatedTransaction: KhataTransaction = {
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

  // Calculate running balance for transactions
  const calculateRunningBalance = (transactions: KhataTransaction[], openingBalance: number) => {
    let runningBalance = openingBalance;
    return transactions.map(transaction => {
      if (transaction.type === 'credit') {
        runningBalance += Number(transaction.amount);
      } else {
        runningBalance -= Number(transaction.amount);
      }
      return { ...transaction, runningBalance };
    });
  };

  const handlePrintCustomer = () => {
    if (!selectedCustomer) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const balance = calculateBalance(selectedCustomer);
    const transactionsWithBalance = calculateRunningBalance(
      [...selectedCustomer.transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      selectedCustomer.opening_balance
    );

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Khata Report - ${selectedCustomer.name}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .print-date { text-align: right; margin-bottom: 10px; font-size: 10px; }
            .credit { color: green; }
            .debit { color: red; }
            .balance { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="print-date">Printed on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}</div>
          <h1>Khata Report - ${selectedCustomer.name}</h1>
          <div class="customer-info">
            <p><strong>Customer Name:</strong> ${selectedCustomer.name}</p>
            <p><strong>Phone:</strong> ${selectedCustomer.phone}</p>
            <p><strong>Opening Balance:</strong> ${formatCurrency(selectedCustomer.opening_balance)}</p>
            <p><strong>Opening Date:</strong> ${format(new Date(selectedCustomer.opening_date), 'dd MMM yyyy')}</p>
            <p><strong>Current Balance:</strong> <span class="${balance >= 0 ? 'credit' : 'debit'}">${formatCurrency(balance)}</span></p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th class="text-right">Amount</th>
                <th class="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${format(new Date(selectedCustomer.opening_date), 'dd/MM/yyyy')}</td>
                <td>Opening Balance</td>
                <td class="text-center">-</td>
                <td class="text-center">-</td>
                <td class="text-right balance">${formatCurrency(selectedCustomer.opening_balance)}</td>
              </tr>
              ${transactionsWithBalance.map(transaction => `
                <tr>
                  <td>${format(new Date(transaction.date), 'dd/MM/yyyy')}</td>
                  <td>${transaction.description || '-'}</td>
                  <td class="text-center ${transaction.type}">${transaction.type.toUpperCase()}</td>
                  <td class="text-right ${transaction.type}">
                    ${transaction.type === 'credit' ? '+' : '-'}${formatCurrency(transaction.amount)}
                  </td>
                  <td class="text-right balance">${formatCurrency(transaction.runningBalance)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  // Filter transactions based on the selected filter
  const getFilteredTransactions = (transactions: KhataTransaction[]) => {
    if (transactionFilter === 'all') return transactions;
    return transactions.filter(t => t.type === transactionFilter);
  };

  if (selectedCustomer) {
    const balance = calculateBalance(selectedCustomer);
    const filteredTransactions = getFilteredTransactions(selectedCustomer.transactions);
    const transactionsWithBalance = calculateRunningBalance(
      [...filteredTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      selectedCustomer.opening_balance
    );
    
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
              onClick={handlePrintCustomer}
            >
              <Printer size={16} className="mr-2" />
              Print Report
            </Button>
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Transactions</h3>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-muted-foreground" />
                <Select value={transactionFilter} onValueChange={(value: 'all' | 'credit' | 'debit') => setTransactionFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({selectedCustomer.transactions.length})</SelectItem>
                    <SelectItem value="credit">Credits ({selectedCustomer.transactions.filter(t => t.type === 'credit').length})</SelectItem>
                    <SelectItem value="debit">Debits ({selectedCustomer.transactions.filter(t => t.type === 'debit').length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsWithBalance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactionsWithBalance.map((transaction) => (
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
                        <span className={`font-semibold ${transaction.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(transaction.runningBalance)}
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
      </div>

      {/* Inline Add Customer Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Add New Customer</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCustomer} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="customer_name">Name</Label>
              <Input
                id="customer_name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
                required
              />
            </div>
            <div>
              <Label htmlFor="customer_phone">Phone</Label>
              <Input
                id="customer_phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
                required
              />
            </div>
            <div>
              <Label htmlFor="customer_opening_balance">Opening Balance</Label>
              <Input
                id="customer_opening_balance"
                type="number"
                value={customerForm.opening_balance}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_balance: Number(e.target.value) }))}
                placeholder="Opening balance"
              />
            </div>
            <div>
              <Label htmlFor="customer_opening_date">Opening Date</Label>
              <Input
                id="customer_opening_date"
                type="date"
                value={customerForm.opening_date}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_date: e.target.value }))}
              />
            </div>
            <Button type="submit">
              <Plus size={16} className="mr-2" />
              Add Customer
            </Button>
          </form>
        </CardContent>
      </Card>

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
