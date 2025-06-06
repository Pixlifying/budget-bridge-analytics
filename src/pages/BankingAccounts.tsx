
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Printer, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DateRangePicker from '@/components/ui/DateRangePicker';
import PageWrapper from '@/components/layout/PageWrapper';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { formatCurrency, filterByDate, filterByMonth } from '@/utils/calculateUtils';

interface BankingAccount {
  id: string;
  date: string;
  amount: number;
  customer_name: string;
  account_type: string;
  account_number?: string;
  insurance_type?: string;
}

const BankingAccounts = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [allAccounts, setAllAccounts] = useState<BankingAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<BankingAccount[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    amount: 0,
    account_type: '',
    account_number: '',
    insurance_type: '',
  });

  const accountTypes = [
    { value: "Savings Account", label: "Savings Account" },
    { value: "FD/RD", label: "FD/RD" },
    { value: "Loan Documents", label: "Loan Documents" },
    { value: "Social Security", label: "Social Security" }
  ];

  const insuranceTypes = [
    { value: "PMSBY", label: "PMSBY" },
    { value: "PMJJY", label: "PMJJY" },
  ];

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('banking_accounts')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      
      const formattedData = (data || []).map(account => ({
        ...account,
        amount: Number(account.amount)
      }));
      
      setAllAccounts(formattedData);
    } catch (error) {
      console.error('Error fetching banking accounts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load banking accounts",
      });
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const accountsWithDate = allAccounts.map(account => ({
      ...account,
      date: new Date(account.date)
    }));

    if (viewMode === 'day') {
      setFilteredAccounts(filterByDate(accountsWithDate, selectedDate));
    } else {
      setFilteredAccounts(filterByMonth(accountsWithDate, selectedDate));
    }
  }, [selectedDate, viewMode, allAccounts]);

  const handleAddEntry = async () => {
    if (!newEntry.customer_name || !newEntry.amount || !newEntry.account_type) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    try {
      const accountData: any = {
        customer_name: newEntry.customer_name,
        date: new Date(newEntry.date).toISOString(),
        amount: newEntry.amount,
        account_type: newEntry.account_type
      };

      if (newEntry.account_number) {
        accountData.account_number = newEntry.account_number;
      }

      if ((newEntry.account_type === 'Savings Account' || newEntry.account_type === 'Social Security') && 
          newEntry.insurance_type && newEntry.insurance_type !== 'none') {
        accountData.insurance_type = newEntry.insurance_type;
      }

      const { data, error } = await supabase
        .from('banking_accounts')
        .insert(accountData)
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        const newAccount: BankingAccount = {
          ...data[0],
          amount: Number(data[0].amount)
        };

        setAllAccounts(prev => [newAccount, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          customer_name: '',
          amount: 0,
          account_type: '',
          account_number: '',
          insurance_type: '',
        });
        
        toast({
          title: "Success",
          description: "Banking account added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding banking account:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add banking account",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    try {
      const { error } = await supabase
        .from('banking_accounts')
        .delete()
        .eq('id', accountToDelete);

      if (error) throw error;

      setAllAccounts(prev => prev.filter(account => account.id !== accountToDelete));
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      
      toast({
        title: "Success",
        description: "Account deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account",
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Other Banking Services Report</title>
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
          <h1>Other Banking Services Report</h1>
          <div class="total">Total Amount: ₹${totalAmount.toFixed(2)} | Total Accounts: ${totalAccounts} | Total PMSBY: ${totalPMSBY} | Total PMJJY: ${totalPMJJY}</div>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Account Type</th>
                <th>Amount</th>
                <th>Insurance</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAccounts.map((account, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(new Date(account.date), 'dd/MM/yyyy')}</td>
                  <td>${account.customer_name}</td>
                  <td>${account.account_type}</td>
                  <td>₹${account.amount.toFixed(2)}</td>
                  <td>${account.insurance_type || '-'}</td>
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

  const totalAmount = filteredAccounts.reduce((sum, account) => sum + account.amount, 0);
  const totalAccounts = filteredAccounts.length;
  const totalPMSBY = filteredAccounts.filter(acc => acc.insurance_type === 'PMSBY').length;
  const totalPMJJY = filteredAccounts.filter(acc => acc.insurance_type === 'PMJJY').length;

  return (
    <PageWrapper
      title="Other Banking Services"
      subtitle="Manage banking services"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={selectedDate}
            onDateChange={setSelectedDate}
            mode={viewMode}
            onModeChange={setViewMode}
          />
          <Button onClick={handlePrint} variant="outline">
            <Printer size={16} className="mr-2" />
            Print
          </Button>
        </div>
      }
    >
      {/* Add Banking Account Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Banking Service</h3>
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
            <Label htmlFor="customer">Customer Name</Label>
            <Input
              id="customer"
              value={newEntry.customer_name}
              onChange={(e) => setNewEntry(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label htmlFor="account-type">Account Type</Label>
            <Select value={newEntry.account_type} onValueChange={(value) => setNewEntry(prev => ({ ...prev, account_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
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
          {(newEntry.account_type === 'Savings Account' || newEntry.account_type === 'Social Security') && (
            <div>
              <Label htmlFor="insurance">Insurance</Label>
              <Select value={newEntry.insurance_type} onValueChange={(value) => setNewEntry(prev => ({ ...prev, insurance_type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {insuranceTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle>Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{totalAccounts}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50">
          <CardHeader>
            <CardTitle>Total PMSBY</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-700">{totalPMSBY}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardHeader>
            <CardTitle>Total PMJJY</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-700">{totalPMJJY}</p>
          </CardContent>
        </Card>
      </div>

      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <h3 className="mt-4 text-lg font-medium">No Banking Services</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewMode === 'day' 
              ? `No banking services found for ${format(selectedDate, 'MMMM d, yyyy')}.` 
              : `No banking services found for ${format(selectedDate, 'MMMM yyyy')}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccounts.map((account, index) => (
            <Card key={account.id} className="overflow-hidden">
              <CardHeader className="bg-blue-50 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{account.customer_name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setAccountToDelete(account.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(account.date), 'MMMM d, yyyy')}
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Account Type</p>
                    <p className="font-semibold">{account.account_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(account.amount)}</p>
                  </div>
                  {account.insurance_type && (
                    <div>
                      <p className="text-sm text-muted-foreground">Insurance</p>
                      <p className="font-semibold text-green-700">{account.insurance_type}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmation 
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to delete this account? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default BankingAccounts;
