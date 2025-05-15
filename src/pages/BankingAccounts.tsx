
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PageWrapper from '@/components/layout/PageWrapper';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { exportToExcel } from '@/utils/calculateUtils';
import StatCard from '@/components/ui/StatCard';

// Define form schema
const formSchema = z.object({
  customer_name: z.string().min(1, { message: "Customer name is required" }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number" }),
  account_type: z.string().min(1, { message: "Account type is required" }),
  account_number: z.string().optional(),
  insurance_type: z.string().optional(),
  date: z.date()
});

type FormValues = z.infer<typeof formSchema>;

const BankingAccounts = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<'day' | 'month'>('day');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  
  // Form for adding new account
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: '',
      amount: 0,
      account_type: '',
      account_number: '',
      insurance_type: '',
      date: new Date()
    }
  });

  // Watch for account type changes to show/hide insurance options
  const accountType = form.watch('account_type');

  // Get accounts
  const fetchAccounts = async () => {
    let query = supabase
      .from('banking_accounts')
      .select('*');
    
    if (mode === 'day') {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query = query
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
    } else if (mode === 'month') {
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      
      query = query
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  };

  const { data: accounts = [], refetch } = useQuery({
    queryKey: ['banking-accounts', date.toISOString(), mode],
    queryFn: fetchAccounts
  });

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      const accountData: any = {
        customer_name: values.customer_name,
        date: values.date.toISOString(),
        amount: values.amount,
        account_type: values.account_type
      };

      // Add account number if provided
      if (values.account_number) {
        accountData.account_number = values.account_number;
      }

      // Add insurance type if it's a savings account or social security with insurance
      if ((values.account_type === 'Savings Account' || values.account_type === 'Social Security') && values.insurance_type && values.insurance_type !== 'none') {
        accountData.insurance_type = values.insurance_type;
      }

      const { error } = await supabase.from('banking_accounts').insert(accountData);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Banking account added successfully",
      });

      form.reset();
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error adding banking account:", error);
      toast({
        title: "Error",
        description: "Failed to add banking account",
        variant: "destructive",
      });
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    try {
      const { error } = await supabase
        .from('banking_accounts')
        .delete()
        .eq('id', accountToDelete);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Account deleted successfully",
      });

      setDeleteDialogOpen(false);
      setAccountToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (id: string) => {
    setAccountToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Account type options
  const accountTypes = [
    { value: "Savings Account", label: "Savings Account" },
    { value: "FD/RD", label: "FD/RD" },
    { value: "Loan Documents", label: "Loan Documents" },
    { value: "Social Security", label: "Social Security" }
  ];

  // Insurance type options
  const insuranceTypes = [
    { value: "PMSBY", label: "PMSBY" },
    { value: "PMJJY", label: "PMJJY" },
  ];

  // Handle export to CSV
  const handleExport = () => {
    exportToExcel(accounts, 'other-banking-services');
    toast({
      title: "Success",
      description: "Data exported successfully",
    });
  };

  // Calculate summary statistics
  const totalAmount = accounts.reduce((sum, acc) => sum + acc.amount, 0);
  const totalAccounts = accounts.length;
  const totalPMSBY = accounts.filter(acc => acc.insurance_type === 'PMSBY').length;
  const totalPMJJY = accounts.filter(acc => acc.insurance_type === 'PMJJY').length;

  // Group accounts by account type
  const groupedAccounts = accounts.reduce((groups, account) => {
    const type = account.account_type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(account);
    return groups;
  }, {} as Record<string, typeof accounts>);

  return (
    <PageWrapper title="Other Banking Services" subtitle="Manage banking services">
      <div className="flex justify-between items-center mb-6">
        <DateRangePicker 
          date={date} 
          onDateChange={setDate} 
          mode={mode} 
          onModeChange={setMode} 
        />
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Banking Service</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter customer name" className="max-w-md" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <DateRangePicker 
                              date={field.value} 
                              onDateChange={field.onChange}
                              mode="day"
                              onModeChange={() => {}}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" className="max-w-xs" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="account_type"
                    render={({ field }) => (
                      <FormItem className="max-w-md">
                        <FormLabel>Account Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {accountTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_number"
                    render={({ field }) => (
                      <FormItem className="max-w-md">
                        <FormLabel>Account Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(accountType === 'Savings Account' || accountType === 'Social Security') && (
                    <FormField
                      control={form.control}
                      name="insurance_type"
                      render={({ field }) => (
                        <FormItem className="max-w-md">
                          <FormLabel>Insurance Type (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select insurance type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {insuranceTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="flex justify-end">
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Amount" 
          value={`₹${totalAmount.toLocaleString()}`}
        />
        <StatCard 
          title="Total Accounts Opened" 
          value={totalAccounts.toString()}
        />
        <StatCard 
          title="Total PMSBY" 
          value={totalPMSBY.toString()}
        />
        <StatCard 
          title="Total PMJJY" 
          value={totalPMJJY.toString()}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedAccounts).map(([type, accounts]) => (
          <Card key={type} className="overflow-hidden">
            <CardHeader className="bg-muted">
              <CardTitle>{type}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {accounts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No accounts found</div>
              ) : (
                <div className="divide-y">
                  {accounts.map(account => (
                    <div key={account.id} className="p-4">
                      <div className="flex justify-between mb-1">
                        <div>
                          <span className="font-medium">{account.customer_name}</span>
                          {account.insurance_type && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full">
                              {account.insurance_type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span>₹{account.amount.toLocaleString()}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openDeleteDialog(account.id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(account.date), 'PPP')}
                      </div>
                      {account.account_number && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Account: {account.account_number}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
