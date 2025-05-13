
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Trash2, FileBox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import PageWrapper from '@/components/layout/PageWrapper';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { filterByDate, filterByMonth, formatCurrency } from '@/utils/calculateUtils';

const formSchema = z.object({
  name: z.string().min(2, { message: "Expense name is required" }),
  fee: z.coerce.number().min(1, { message: "Fee must be at least 1" }),
  date: z.date()
});

type FormValues = z.infer<typeof formSchema>;

interface MiscExpense {
  id: string;
  date: Date;
  name: string;
  fee: number;
  created_at?: string;
}

const MiscExpenses = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<MiscExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<MiscExpense[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      fee: 0,
      date: new Date()
    }
  });

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('misc_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      const formattedExpenses = (data || []).map(expense => ({
        ...expense,
        date: new Date(expense.date)
      }));
      
      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error fetching miscellaneous expenses:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load miscellaneous expenses",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredExpenses(filterByDate(expenses, date));
    } else {
      setFilteredExpenses(filterByMonth(expenses, date));
    }
  }, [date, viewMode, expenses]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);

    try {
      const { error } = await supabase.from('misc_expenses').insert({
        name: data.name,
        fee: data.fee,
        date: data.date.toISOString()
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Miscellaneous expense has been added successfully",
      });
      
      form.reset({
        name: '',
        fee: 0,
        date: new Date()
      });
      
      fetchExpenses();
    } catch (error) {
      console.error('Error adding misc expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add miscellaneous expense. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    try {
      const { error } = await supabase
        .from('misc_expenses')
        .delete()
        .eq('id', expenseToDelete);
        
      if (error) throw error;
      
      setExpenses(prevExpenses => 
        prevExpenses.filter(expense => expense.id !== expenseToDelete)
      );
      
      toast({
        title: "Success",
        description: "Miscellaneous expense deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting misc expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete miscellaneous expense",
      });
    } finally {
      setExpenseToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const totalFee = filteredExpenses.reduce((total, expense) => total + Number(expense.fee), 0);

  return (
    <PageWrapper
      title="Miscellaneous Expenses"
      subtitle="Manage general expenses"
      action={
        <DateRangePicker 
          date={date} 
          onDateChange={setDate} 
          mode={viewMode} 
          onModeChange={setViewMode} 
        />
      }
    >
      <div className="container mx-auto py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="col-span-1 md:col-span-3 lg:col-span-1 bg-green-50">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Miscellaneous Expenses</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(totalFee)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Expenses</p>
                  <p className="text-2xl font-bold text-green-700">{filteredExpenses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-3 lg:col-span-2">
            <CardHeader>
              <CardTitle>Add Miscellaneous Expense</CardTitle>
              <CardDescription>Record a new general expense</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expense Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter expense name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Expense"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p>Loading miscellaneous expense data...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
            <FileBox className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No Miscellaneous Expenses</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {viewMode === 'day' 
                ? `No expenses found for ${format(date, 'MMMM d, yyyy')}.` 
                : `No expenses found for ${format(date, 'MMMM yyyy')}.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExpenses.map((expense) => (
              <Card key={expense.id} className="overflow-hidden">
                <CardHeader className="bg-green-50 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{expense.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteExpense(expense.id)}
                    >
                      <Trash2 size={16} />
                      <span className="sr-only">Delete expense</span>
                    </Button>
                  </div>
                  <CardDescription>
                    {format(new Date(expense.date), 'MMMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fee Amount</p>
                    <p className="text-xl font-bold text-green-700">{formatCurrency(Number(expense.fee))}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DeleteConfirmation
          isOpen={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setExpenseToDelete(null);
          }}
          onConfirm={confirmDeleteExpense}
          title="Delete Miscellaneous Expense"
          description="Are you sure you want to delete this miscellaneous expense? This action cannot be undone."
        />
      </div>
    </PageWrapper>
  );
};

export default MiscExpenses;
