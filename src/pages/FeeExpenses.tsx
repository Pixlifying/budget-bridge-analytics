
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Receipt, Trash2, Printer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import PageWrapper from '@/components/layout/PageWrapper';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { filterByDate, filterByMonth, formatCurrency } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';

interface FeeExpense {
  id: string;
  date: Date;
  customer_name: string;
  fee: number;
  created_at?: string;
}

const FeeExpenses = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [expenses, setExpenses] = useState<FeeExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<FeeExpense[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    customer_name: '',
    fee: 0,
  });

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('fee_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      const formattedExpenses = (data || []).map(expense => ({
        ...expense,
        date: new Date(expense.date)
      }));
      
      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error fetching fee expenses:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load fee expenses",
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

  const handleAddEntry = async () => {
    if (!newEntry.customer_name || !newEntry.fee) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.from('fee_expenses').insert({
        customer_name: newEntry.customer_name,
        fee: newEntry.fee,
        date: new Date(newEntry.date).toISOString()
      }).select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        const newFeeExpense: FeeExpense = {
          ...data[0],
          date: new Date(data[0].date)
        };
        
        setExpenses(prev => [newFeeExpense, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          customer_name: '',
          fee: 0,
        });
        
        toast({
          title: "Success",
          description: "Fee expense has been added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding fee expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add fee expense. Please try again.",
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
        .from('fee_expenses')
        .delete()
        .eq('id', expenseToDelete);
        
      if (error) throw error;
      
      setExpenses(prevExpenses => 
        prevExpenses.filter(expense => expense.id !== expenseToDelete)
      );
      
      toast({
        title: "Success",
        description: "Fee expense deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting fee expense:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete fee expense",
      });
    } finally {
      setExpenseToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Expenses Report</title>
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
          <h1>Fee Expenses Report</h1>
          <div class="total">Total Fee Expenses: ₹${totalFee.toFixed(2)} | Number of Expenses: ${filteredExpenses.length}</div>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Fee Amount</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map((expense, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(format(expense.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(expense.customer_name)}</td>
                  <td>₹${escapeHtml(expense.fee.toFixed(2))}</td>
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

  const totalFee = filteredExpenses.reduce((total, expense) => total + Number(expense.fee), 0);

  return (
    <PageWrapper
      title="Fee Expenses"
      subtitle="Manage customer related expenses"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
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
      {/* Add Fee Expense Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Fee Expense</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
            <Label htmlFor="fee">Fee Amount</Label>
            <Input
              id="fee"
              type="number"
              value={newEntry.fee}
              onChange={(e) => setNewEntry(prev => ({ ...prev, fee: Number(e.target.value) }))}
              placeholder="Fee amount"
            />
          </div>
          <Button onClick={handleAddEntry} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Total Fee Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalFee)}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle>Number of Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{filteredExpenses.length}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading fee expense data...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Fee Expenses</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {viewMode === 'day' 
              ? `No fee expenses found for ${format(date, 'MMMM d, yyyy')}.` 
              : `No fee expenses found for ${format(date, 'MMMM yyyy')}.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses.map((expense, index) => (
            <Card key={expense.id} className="overflow-hidden">
              <CardHeader className="bg-blue-50 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{expense.customer_name}</CardTitle>
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
                  {format(expense.date, 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fee Amount</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(Number(expense.fee))}</p>
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
        title="Delete Fee Expense"
        description="Are you sure you want to delete this fee expense? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default FeeExpenses;
