
import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
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
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { exportToExcel } from '@/utils/calculateUtils';

interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  opening_balance: number;
  opening_date: string;
  created_at: string;
  updated_at: string;
}

interface KhataTransaction {
  id: string;
  customer_id: string;
  type: 'debit' | 'credit';
  amount: number;
  description?: string;
  date: string;
  created_at: string;
}

interface KhataCustomerWithTransactions extends KhataCustomer {
  transactions: KhataTransaction[];
}

const Khata = () => {
  const [customers, setCustomers] = useState<KhataCustomerWithTransactions[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<KhataCustomer | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<KhataTransaction | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<KhataCustomerWithTransactions | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'customer' | 'transaction'>('customer');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    opening_balance: 0,
    opening_date: new Date().toISOString().split('T')[0]
  });

  const [transactionForm, setTransactionForm] = useState({
    type: 'debit' as 'debit' | 'credit',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
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
            return {
              ...customer,
              transactions: []
            };
          }

          // Type cast the transactions to ensure proper typing
          const typedTransactions: KhataTransaction[] = (transactionsData || []).map(t => ({
            ...t,
            type: t.type as 'debit' | 'credit'
          }));

          return {
            ...customer,
            transactions: typedTransactions
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
      // First delete all transactions for this customer
      const { error: transactionError } = await supabase
        .from('khata_transactions')
        .delete()
        .eq('customer_id', deleteId);

      if (transactionError) throw transactionError;

      // Then delete the customer
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
    if (!selectedCustomer) return;

    try {
      const { data, error } = await supabase
        .from('khata_transactions')
        .insert({
          customer_id: selectedCustomer.id,
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
      opening_date: new Date().toISOString().split('T')[0]
    });
  };

  const resetTransactionForm = () => {
    setTransactionForm({
      type: 'debit',
      amount: 0,
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const openEditCustomer = (customer: KhataCustomer) => {
    setEditingCustomer(customer);
    setCustomerForm({
      name: customer.name,
      phone: customer.phone,
      opening_balance: customer.opening_balance,
      opening_date: customer.opening_date
    });
    setShowCustomerDialog(true);
  };

  const openEditTransaction = (transaction: KhataTransaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description || '',
      date: transaction.date
    });
    setShowTransactionDialog(true);
  };

  const initiateDeleteCustomer = (id: string) => {
    setDeleteId(id);
    setDeleteType('customer');
    setShowDeleteConfirm(true);
  };

  const initiateDeleteTransaction = (id: string) => {
    setDeleteId(id);
    setDeleteType('transaction');
    setShowDeleteConfirm(true);
  };

  const handleDownloadCSV = () => {
    const csvData = filteredCustomers.map(customer => {
      const balance = calculateBalance(customer);
      return {
        'Name': customer.name,
        'Phone': customer.phone,
        'Opening Balance': customer.opening_balance,
        'Current Balance': balance,
        'Opening Date': format(new Date(customer.opening_date), 'dd/MM/yyyy'),
        'Total Transactions': customer.transactions.length
      };
    });
    
    exportToExcel(csvData, 'khata-customers');
    toast.success("Khata data exported successfully");
  };

  const calculateBalance = (customer: KhataCustomerWithTransactions) => {
    const transactionTotal = customer.transactions.reduce((sum, transaction) => {
      return transaction.type === 'credit' 
        ? sum + transaction.amount 
        : sum - transaction.amount;
    }, 0);
    
    return customer.opening_balance + transactionTotal;
  };

  const toggleCustomerExpansion = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
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
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                  required
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
              <Button 
                onClick={editingCustomer ? handleEditCustomer : handleAddCustomer}
                disabled={!customerForm.name || !customerForm.phone}
              >
                {editingCustomer ? 'Update Customer' : 'Save Customer'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handleDownloadCSV}>
          <Download size={16} className="mr-2" />
          Download CSV
        </Button>
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Opening Date</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredCustomers.map((customer) => {
                    const balance = calculateBalance(customer);
                    const isExpanded = expandedCustomer === customer.id;
                    return (
                      <>
                        <TableRow key={customer.id}>
                          <TableCell 
                            className="font-medium cursor-pointer"
                            onClick={() => toggleCustomerExpansion(customer.id)}
                          >
                            {customer.name}
                          </TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>₹{customer.opening_balance}</TableCell>
                          <TableCell className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ₹{balance}
                          </TableCell>
                          <TableCell>{format(new Date(customer.opening_date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowTransactionDialog(true);
                                resetTransactionForm();
                                setEditingTransaction(null);
                              }}
                            >
                              Add Transaction ({customer.transactions.length})
                            </Button>
                          </TableCell>
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
                                onClick={() => initiateDeleteCustomer(customer.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && customer.transactions.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/50">
                              <div className="p-4">
                                <h4 className="font-semibold mb-3">Transactions for {customer.name}</h4>
                                <div className="space-y-2">
                                  {customer.transactions.map((transaction) => (
                                    <div key={transaction.id} className="flex justify-between items-center p-2 bg-white rounded border">
                                      <div className="flex items-center gap-4">
                                        <span className="text-sm">{format(new Date(transaction.date), 'dd/MM/yyyy')}</span>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                          transaction.type === 'credit' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {transaction.type.toUpperCase()}
                                        </span>
                                        <span className="font-medium">₹{transaction.amount}</span>
                                        <span className="text-sm text-muted-foreground">{transaction.description || '-'}</span>
                                      </div>
                                      <div className="flex gap-2">
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
                                          onClick={() => initiateDeleteTransaction(transaction.id)}
                                        >
                                          <Trash2 size={12} />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Transaction Dialog */}
      <Dialog open={showTransactionDialog} onOpenChange={setShowTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? 'Edit Transaction' : `Add Transaction for ${selectedCustomer?.name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={transactionForm.type}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, type: e.target.value as 'debit' | 'credit' }))}
                className="w-full p-2 border rounded"
                required
              >
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="Transaction amount"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={transactionForm.description}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Transaction description (optional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={transactionForm.date}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <Button 
              onClick={editingTransaction ? handleEditTransaction : handleAddTransaction}
              disabled={!transactionForm.amount}
            >
              {editingTransaction ? 'Update Transaction' : 'Save Transaction'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
