
import { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, filterByDate, filterByMonth } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/ui/ServiceCard';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface BankingAccount {
  id: string;
  date: Date;
  customer_name: string;
  account_type: string;
  account_number?: string;
  insurance_type?: string;
  amount: number;
  expense: number;
  margin: number;
  created_at?: string;
}

const accountTypes = [
  'Savings Account',
  'Current Account',
  'Fixed Deposit',
  'Recurring Deposit',
  'PPF Account',
  'NPS Account',
  'Sukanya Samriddhi',
  'Other'
];

const insuranceTypes = [
  'Life Insurance',
  'Health Insurance',
  'Vehicle Insurance',
  'Home Insurance',
  'Term Insurance',
  'ULIP',
  'Other'
];

const OtherBankingServices = () => {
  const [bankingAccounts, setBankingAccounts] = useState<BankingAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<BankingAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<BankingAccount | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    account_type: '',
    account_number: '',
    insurance_type: '',
    amount: 0,
    expense: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    customer_name: '',
    account_type: '',
    account_number: '',
    insurance_type: '',
    amount: 0,
    expense: 0,
  });

  const fetchBankingAccounts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banking_accounts')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        customer_name: entry.customer_name,
        account_type: entry.account_type,
        account_number: entry.account_number || '',
        insurance_type: entry.insurance_type || '',
        amount: Number(entry.amount),
        expense: Number(entry.expense || 0),
        margin: Number(entry.margin || 0),
        created_at: entry.created_at
      }));

      setBankingAccounts(formattedData);
    } catch (error) {
      console.error('Error fetching banking accounts:', error);
      toast.error('Failed to load banking accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingAccounts();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredAccounts(filterByDate(bankingAccounts, date));
    } else {
      setFilteredAccounts(filterByMonth(bankingAccounts, date));
    }
  }, [date, viewMode, bankingAccounts]);

  const handleAddEntry = async () => {
    if (!newEntry.customer_name || !newEntry.account_type || !newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const margin = newEntry.amount - newEntry.expense;
      
      const { data, error } = await supabase
        .from('banking_accounts')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          customer_name: newEntry.customer_name,
          account_type: newEntry.account_type,
          account_number: newEntry.account_number || null,
          insurance_type: newEntry.insurance_type || null,
          amount: newEntry.amount,
          expense: newEntry.expense,
          margin: margin,
        })
        .select();

      if (error) throw error;

      // Save to account_details table if account number is provided
      if (newEntry.account_number && newEntry.account_number.trim()) {
        const { error: accountError } = await supabase
          .from('account_details')
          .upsert({
            name: newEntry.customer_name,
            account_number: newEntry.account_number.trim(),
            aadhar_number: '', // Not available in this form
          }, { 
            onConflict: 'account_number',
            ignoreDuplicates: false 
          });

        if (accountError) {
          console.error('Error saving to account_details:', accountError);
          toast.error('Failed to save account details');
        } else {
          toast.success('Account details saved successfully');
        }
      }

      // Save expense to expenses table
      if (newEntry.expense > 0) {
        const expenseName = `${newEntry.account_type}${newEntry.insurance_type ? ' - ' + newEntry.insurance_type : ''}`;
        const { error: expenseError } = await supabase
          .from('expenses')
          .insert({
            date: new Date(newEntry.date).toISOString(),
            name: expenseName,
            amount: newEntry.expense,
          });

        if (expenseError) console.error('Error saving expense:', expenseError);
      }

      if (data && data.length > 0) {
        const newAccount: BankingAccount = {
          id: data[0].id,
          date: new Date(data[0].date),
          customer_name: data[0].customer_name,
          account_type: data[0].account_type,
          account_number: data[0].account_number || '',
          insurance_type: data[0].insurance_type || '',
          amount: Number(data[0].amount),
          expense: Number(data[0].expense || 0),
          margin: Number(data[0].margin || 0),
          created_at: data[0].created_at
        };

        setBankingAccounts(prev => [newAccount, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          customer_name: '',
          account_type: '',
          account_number: '',
          insurance_type: '',
          amount: 0,
          expense: 0,
        });
        toast.success('Banking account added successfully');
      }
    } catch (error) {
      console.error('Error adding banking account:', error);
      toast.error('Failed to add banking account');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    try {
      const margin = editForm.amount - editForm.expense;
      
      const { error } = await supabase
        .from('banking_accounts')
        .update({
          date: new Date(editForm.date).toISOString(),
          customer_name: editForm.customer_name,
          account_type: editForm.account_type,
          account_number: editForm.account_number || null,
          insurance_type: editForm.insurance_type || null,
          amount: editForm.amount,
          expense: editForm.expense,
          margin: margin,
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      // Update account_details if account number is provided
      if (editForm.account_number && editForm.account_number.trim()) {
        const { error: accountError } = await supabase
          .from('account_details')
          .upsert({
            name: editForm.customer_name,
            account_number: editForm.account_number.trim(),
            aadhar_number: '', // Not available in this form
          }, { 
            onConflict: 'account_number',
            ignoreDuplicates: false 
          });

        if (accountError) {
          console.error('Error updating account_details:', accountError);
          toast.error('Failed to update account details');
        }
      }

      const updatedEntry: BankingAccount = {
        ...editingEntry,
        date: new Date(editForm.date),
        customer_name: editForm.customer_name,
        account_type: editForm.account_type,
        account_number: editForm.account_number,
        insurance_type: editForm.insurance_type,
        amount: editForm.amount,
        expense: editForm.expense,
        margin: margin,
      };

      setBankingAccounts(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      toast.success('Banking account updated successfully');
    } catch (error) {
      console.error('Error updating banking account:', error);
      toast.error('Failed to update banking account');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banking_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBankingAccounts(prev => prev.filter(entry => entry.id !== id));
      toast.success('Banking account deleted successfully');
    } catch (error) {
      console.error('Error deleting banking account:', error);
      toast.error('Failed to delete banking account');
    }
  };

  const openEditEntry = (entry: BankingAccount) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      customer_name: entry.customer_name,
      account_type: entry.account_type,
      account_number: entry.account_number || '',
      insurance_type: entry.insurance_type || '',
      amount: entry.amount,
      expense: entry.expense || 0,
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Banking Accounts Report</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Banking Accounts Report</h1>
          <div class="total">Total Accounts: ${totalAccounts} | Total Amount: ₹${totalAmount.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Account Type</th>
                <th>Account Number</th>
                <th>Insurance Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAccounts.map((account) => `
                <tr>
                  <td>${format(account.date, 'dd/MM/yyyy')}</td>
                  <td>${account.customer_name}</td>
                  <td>${account.account_type}</td>
                  <td>${account.account_number || '-'}</td>
                  <td>${account.insurance_type || '-'}</td>
                  <td>₹${account.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const totalAccounts = filteredAccounts.length;
  const totalAmount = filteredAccounts.reduce((sum, account) => sum + account.amount, 0);
  const totalMargin = filteredAccounts.reduce((sum, account) => sum + account.margin, 0);

  return (
    <PageWrapper
      title="Other Banking Services"
      subtitle="Manage banking accounts and insurance services"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton
              data={bankingAccounts}
              filename="banking-accounts-data"
              currentData={filteredAccounts}
            />
          </div>
        </div>
      }
    >
      {/* Add Banking Account Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Banking Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="customer_name">Customer Name</Label>
            <Input
              id="customer_name"
              value={newEntry.customer_name}
              onChange={(e) => setNewEntry(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label htmlFor="account_type">Account Type</Label>
            <Select value={newEntry.account_type} onValueChange={(value) => setNewEntry(prev => ({ ...prev, account_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="account_number">Account Number</Label>
            <Input
              id="account_number"
              value={newEntry.account_number}
              onChange={(e) => setNewEntry(prev => ({ ...prev, account_number: e.target.value }))}
              placeholder="Account number (optional)"
            />
          </div>
          <div>
            <Label htmlFor="insurance_type">Insurance Type</Label>
            <Select value={newEntry.insurance_type} onValueChange={(value) => setNewEntry(prev => ({ ...prev, insurance_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select insurance type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {insuranceTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={newEntry.amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="Amount"
            />
          </div>
          <div>
            <Label htmlFor="expense">Expense</Label>
            <Input
              id="expense"
              type="number"
              value={newEntry.expense}
              onChange={(e) => setNewEntry(prev => ({ ...prev, expense: Number(e.target.value) }))}
              placeholder="Expense"
            />
          </div>
          <div>
            <Label>Margin</Label>
            <Input
              value={(newEntry.amount - newEntry.expense).toFixed(2)}
              disabled
              className="bg-muted"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Accounts"
          value={totalAccounts.toString()}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          icon={<CreditCard size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAccounts.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No banking accounts found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredAccounts.map(entry => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.customer_name}
              date={entry.date}
              data={{
                account_type: entry.account_type,
                account_number: entry.account_number || 'N/A',
                insurance_type: entry.insurance_type || 'N/A',
                amount: formatCurrency(entry.amount),
                expense: formatCurrency(entry.expense),
                margin: formatCurrency(entry.margin)
              }}
              labels={{
                account_type: 'Account Type',
                account_number: 'Account Number',
                insurance_type: 'Insurance Type',
                amount: 'Amount',
                expense: 'Expense',
                margin: 'Margin'
              }}
              onEdit={() => openEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))
        )}
      </div>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Banking Account</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_date">Date</Label>
                <Input
                  id="edit_date"
                  type="date"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_customer_name">Customer Name</Label>
                <Input
                  id="edit_customer_name"
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_account_type">Account Type</Label>
                <Select value={editForm.account_type} onValueChange={(value) => setEditForm(prev => ({ ...prev, account_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accountTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_account_number">Account Number</Label>
                <Input
                  id="edit_account_number"
                  value={editForm.account_number}
                  onChange={(e) => setEditForm(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="Account number (optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_insurance_type">Insurance Type</Label>
                <Select value={editForm.insurance_type} onValueChange={(value) => setEditForm(prev => ({ ...prev, insurance_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {insuranceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_amount">Amount</Label>
                <Input
                  id="edit_amount"
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  placeholder="Amount"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_expense">Expense</Label>
                <Input
                  id="edit_expense"
                  type="number"
                  value={editForm.expense}
                  onChange={(e) => setEditForm(prev => ({ ...prev, expense: Number(e.target.value) }))}
                  placeholder="Expense"
                />
              </div>
              <div className="grid gap-2">
                <Label>Margin</Label>
                <Input
                  value={(editForm.amount - editForm.expense).toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <Button onClick={handleEditEntry}>Update Banking Account</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default OtherBankingServices;
