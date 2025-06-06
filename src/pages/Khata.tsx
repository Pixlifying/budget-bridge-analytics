import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from "sonner";
import PageHeader from '@/components/layout/PageHeader';
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
import DateRangePicker from '@/components/ui/DateRangePicker';

interface KhataTransaction {
  id: string;
  amount: number;
  type: 'debit' | 'credit';
  description?: string;
  date: string;
  created_at: string;
}

interface KhataCustomerWithTransactions {
  id: string;
  name: string;
  phone: string;
  opening_balance: number;
  opening_date: string;
  created_at: string;
  updated_at: string;
  transactions: KhataTransaction[];
}

const Khata = () => {
  const [customers, setCustomers] = useState<KhataCustomerWithTransactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomerDialog, setShowAddCustomerDialog] = useState(false);
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomerWithTransactions | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  const [editingTransaction, setEditingTransaction] = useState<KhataTransaction | null>(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    opening_balance: 0
  });

  const [newTransactionForms, setNewTransactionForms] = useState<{[key: string]: {
    date: string;
    amount: number;
    type: 'debit' | 'credit';
    description: string;
  }}>({});

  const [editTransactionForm, setEditTransactionForm] = useState({
    date: '',
    amount: 0,
    type: 'debit' as 'debit' | 'credit',
    description: ''
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data: customersData, error } = await supabase
        .from('khata_customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customersWithTransactions = await Promise.all(
        (customersData || []).map(async (customer) => {
          let transactionQuery = supabase
            .from('khata_transactions')
            .select('*')
            .eq('customer_id', customer.id);

          if (viewMode === 'day') {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            transactionQuery = transactionQuery.eq('date', dateStr);
          } else if (viewMode === 'month') {
            const monthStr = format(selectedDate, 'yyyy-MM');
            transactionQuery = transactionQuery.like('date', `${monthStr}%`);
          }

          const { data: transactionsData, error: transactionsError } = await transactionQuery
            .order('date', { ascending: false })
            .order('created_at', { ascending: false });

          if (transactionsError) {
            console.error('Error fetching transactions:', transactionsError);
            return {
              ...customer,
              transactions: []
            };
          }

          const typedTransactions = (transactionsData || []).map(transaction => ({
            ...transaction,
            type: transaction.type as 'debit' | 'credit'
          }));

          return {
            ...customer,
            transactions: typedTransactions
          };
        })
      );

      console.log('Khata customers fetched:', customersWithTransactions);
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
  }, [selectedDate, viewMode]);

  const handleAddCustomer = async () => {
    try {
      const { data, error } = await supabase
        .from('khata_customers')
        .insert({
          name: customerForm.name,
          phone: customerForm.phone,
          opening_balance: customerForm.opening_balance,
        })
        .select();

      if (error) throw error;

      toast.success("Customer added successfully");
      setShowAddCustomerDialog(false);
      setCustomerForm({ name: '', phone: '', opening_balance: 0 });
      await fetchCustomers();
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error("Failed to add customer");
    }
  };

  const handleEditCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const { error } = await supabase
        .from('khata_customers')
        .update({
          name: customerForm.name,
          phone: customerForm.phone,
          opening_balance: customerForm.opening_balance,
        })
        .eq('id', selectedCustomer.id);

      if (error) throw error;

      toast.success("Customer updated successfully");
      setShowEditCustomerDialog(false);
      setSelectedCustomer(null);
      setCustomerForm({ name: '', phone: '', opening_balance: 0 });
      await fetchCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error("Failed to update customer");
    }
  };

  const handleAddTransaction = async (customerId: string) => {
    const form = newTransactionForms[customerId];
    if (!form || !form.amount || !form.date) return;

    try {
      const { error } = await supabase
        .from('khata_transactions')
        .insert({
          customer_id: customerId,
          amount: form.amount,
          type: form.type,
          description: form.description || null,
          date: form.date,
        });

      if (error) throw error;

      toast.success("Transaction added successfully");
      setNewTransactionForms(prev => ({ ...prev, [customerId]: {
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'debit',
        description: ''
      }}));
      await fetchCustomers();
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
          amount: editTransactionForm.amount,
          type: editTransactionForm.type,
          description: editTransactionForm.description || null,
          date: editTransactionForm.date,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      toast.success("Transaction updated successfully");
      setEditingTransaction(null);
      setEditTransactionForm({ date: '', amount: 0, type: 'debit', description: '' });
      await fetchCustomers();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error("Failed to update transaction");
    }
  };

  const initializeTransactionForm = (customerId: string) => {
    if (!newTransactionForms[customerId]) {
      setNewTransactionForms(prev => ({
        ...prev,
        [customerId]: {
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          type: 'debit',
          description: ''
        }
      }));
    }
  };

  const updateTransactionForm = (customerId: string, field: string, value: any) => {
    setNewTransactionForms(prev => ({
      ...prev,
      [customerId]: {
        ...prev[customerId],
        [field]: value
      }
    }));
  };

  const calculateBalance = (customer: KhataCustomerWithTransactions, upToIndex?: number) => {
    let balance = customer.opening_balance;
    const transactionsToProcess = upToIndex !== undefined 
      ? customer.transactions.slice(0, upToIndex + 1) 
      : customer.transactions;
    
    // Sort transactions by date and creation time for proper balance calculation
    const sortedTransactions = [...transactionsToProcess].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare === 0) {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return dateCompare;
    });

    sortedTransactions.forEach(transaction => {
      if (transaction.type === 'credit') {
        balance += transaction.amount;
      } else {
        balance -= transaction.amount;
      }
    });

    return balance;
  };

  const getCurrentBalance = (customer: KhataCustomerWithTransactions) => {
    return calculateBalance(customer);
  };

  const openEditCustomer = (customer: KhataCustomerWithTransactions) => {
    setSelectedCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      opening_balance: customer.opening_balance
    });
    setShowEditCustomerDialog(true);
  };

  const openEditTransaction = (transaction: KhataTransaction) => {
    setEditingTransaction(transaction);
    setEditTransactionForm({
      date: transaction.date,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description || ''
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Khata Report</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .customer-section { margin-bottom: 30px; border: 1px solid #000; padding: 15px; }
            .customer-header { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 5px; text-align: left; font-size: 10px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .balance { font-weight: bold; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Khata Report</h1>
          ${filteredCustomers.map((customer) => `
            <div class="customer-section">
              <div class="customer-header">
                ${customer.name} (${customer.phone})
              </div>
              <div>Opening Balance: ₹${customer.opening_balance.toFixed(2)}</div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${customer.transactions.map((transaction, index) => {
                    const reversedIndex = customer.transactions.length - 1 - index;
                    const balanceAfterTransaction = calculateBalance(customer, reversedIndex);
                    return `
                      <tr>
                        <td>${format(new Date(transaction.date), 'dd/MM/yyyy')}</td>
                        <td>${transaction.description || '-'}</td>
                        <td>${transaction.type === 'debit' ? '₹' + transaction.amount.toFixed(2) : '-'}</td>
                        <td>${transaction.type === 'credit' ? '₹' + transaction.amount.toFixed(2) : '-'}</td>
                        <td>₹${balanceAfterTransaction.toFixed(2)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
              <div class="balance">Grand Total: ₹${getCurrentBalance(customer).toFixed(2)}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Khata Management"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name or phone..."
      >
        <DateRangePicker
          date={selectedDate}
          onDateChange={setSelectedDate}
          mode={viewMode}
          onModeChange={setViewMode}
        />
        
        <Button variant="outline" onClick={handlePrint}>
          <Printer size={16} className="mr-2" />
          Print
        </Button>
        
        <Dialog open={showAddCustomerDialog} onOpenChange={setShowAddCustomerDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
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
              <Button onClick={handleAddCustomer}>Save Customer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-8">Loading customers...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              initializeTransactionForm(customer.id);
              const currentForm = newTransactionForms[customer.id];
              
              return (
                <div key={customer.id} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div 
                      className="cursor-pointer hover:text-primary"
                      onClick={() => setSelectedCustomer(selectedCustomer?.id === customer.id ? null : customer)}
                    >
                      <h3 className="text-xl font-semibold">{customer.name}</h3>
                      <p className="text-muted-foreground">{customer.phone}</p>
                      <p className="text-sm">
                        Opening Balance: ₹{customer.opening_balance.toFixed(2)}
                      </p>
                      <p className="text-lg font-medium text-green-600">
                        Grand Total: ₹{getCurrentBalance(customer).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditCustomer(customer)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Transaction Form */}
                  <div className="border-t pt-4 mb-4 bg-gray-50 dark:bg-slate-700 p-4 rounded">
                    <h4 className="font-medium mb-3">Add Transaction</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      <div>
                        <Label htmlFor={`date-${customer.id}`}>Date</Label>
                        <Input
                          id={`date-${customer.id}`}
                          type="date"
                          value={currentForm?.date || ''}
                          onChange={(e) => updateTransactionForm(customer.id, 'date', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`description-${customer.id}`}>Description</Label>
                        <Input
                          id={`description-${customer.id}`}
                          value={currentForm?.description || ''}
                          onChange={(e) => updateTransactionForm(customer.id, 'description', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`amount-${customer.id}`}>Amount</Label>
                        <Input
                          id={`amount-${customer.id}`}
                          type="number"
                          value={currentForm?.amount || 0}
                          onChange={(e) => updateTransactionForm(customer.id, 'amount', Number(e.target.value))}
                          placeholder="Amount"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`type-${customer.id}`}>Type</Label>
                        <Select 
                          value={currentForm?.type || 'debit'} 
                          onValueChange={(value) => updateTransactionForm(customer.id, 'type', value)}
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
                      <Button 
                        onClick={() => handleAddTransaction(customer.id)}
                        disabled={!currentForm?.date || !currentForm?.amount}
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  {selectedCustomer?.id === customer.id && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Transactions</h4>
                      {customer.transactions.length === 0 ? (
                        <p className="text-muted-foreground">No transactions found</p>
                      ) : (
                        <div className="space-y-2">
                          {customer.transactions.map((transaction, index) => {
                            // Calculate running balance for display (reverse order since we show latest first)
                            const reversedIndex = customer.transactions.length - 1 - index;
                            const balanceAfterTransaction = calculateBalance(customer, reversedIndex);
                            
                            return (
                              <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-700 rounded">
                                <div>
                                  <p className="font-medium">
                                    {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {transaction.description || 'No description'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(transaction.date), 'dd/MM/yyyy')}
                                  </p>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <div>
                                    <p className="text-sm font-medium">
                                      Balance: ₹{balanceAfterTransaction.toFixed(2)}
                                    </p>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      transaction.type === 'credit' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                      {transaction.type}
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditTransaction(transaction)}
                                  >
                                    <Edit size={12} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditCustomerDialog} onOpenChange={setShowEditCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_name">Name</Label>
              <Input
                id="edit_name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_opening_balance">Opening Balance</Label>
              <Input
                id="edit_opening_balance"
                type="number"
                value={customerForm.opening_balance}
                onChange={(e) => setCustomerForm(prev => ({ ...prev, opening_balance: Number(e.target.value) }))}
                placeholder="Opening balance"
              />
            </div>
            <Button onClick={handleEditCustomer}>Update Customer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_transaction_date">Date</Label>
              <Input
                id="edit_transaction_date"
                type="date"
                value={editTransactionForm.date}
                onChange={(e) => setEditTransactionForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_transaction_amount">Amount</Label>
              <Input
                id="edit_transaction_amount"
                type="number"
                value={editTransactionForm.amount}
                onChange={(e) => setEditTransactionForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="Transaction amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_transaction_type">Type</Label>
              <Select value={editTransactionForm.type} onValueChange={(value: 'debit' | 'credit') => setEditTransactionForm(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select transaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Debit</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_transaction_description">Description</Label>
              <Input
                id="edit_transaction_description"
                value={editTransactionForm.description}
                onChange={(e) => setEditTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Transaction description"
              />
            </div>
            <Button onClick={handleEditTransaction}>Update Transaction</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Khata;
