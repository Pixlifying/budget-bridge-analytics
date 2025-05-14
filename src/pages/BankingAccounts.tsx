
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
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

// Define form schema
const formSchema = z.object({
  customer_name: z.string().min(1, { message: "Customer name is required" }),
  amount: z.coerce.number().positive({ message: "Amount must be a positive number" }),
  account_type: z.string().min(1, { message: "Account type is required" }),
  date: z.date()
});

type FormValues = z.infer<typeof formSchema>;

const BankingAccounts = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [mode, setMode] = useState<'day' | 'month'>('day');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form for adding new account
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_name: '',
      amount: 0,
      account_type: '',
      date: new Date()
    }
  });

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
      const { error } = await supabase.from('banking_accounts').insert({
        customer_name: values.customer_name,
        date: values.date.toISOString(),
        amount: values.amount,
        account_type: values.account_type
      });

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

  // Account type options
  const accountTypes = [
    { value: "Savings Account", label: "Savings Account" },
    { value: "FD/RD", label: "FD/RD" },
    { value: "Loan Documents", label: "Loan Documents" },
    { value: "Social Security", label: "Social Security" }
  ];

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
    <PageWrapper title="Banking Accounts" description="Manage banking accounts">
      <div className="flex justify-between items-center mb-6">
        <DateRangePicker 
          date={date} 
          onDateChange={setDate} 
          mode={mode} 
          onModeChange={setMode} 
        />
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Banking Account</DialogTitle>
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
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="account_type"
                  render={({ field }) => (
                    <FormItem>
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
                
                <div className="flex justify-end">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
                        <span className="font-medium">{account.customer_name}</span>
                        <span>₹{account.amount.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(account.date), 'PPP')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageWrapper>
  );
};

export default BankingAccounts;
