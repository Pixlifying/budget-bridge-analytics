
import { useState, useEffect } from 'react';
import { Receipt, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import { format } from 'date-fns';

interface ExpenseEntry {
  id: string;
  date: Date;
  name: string;
  amount: number;
  type: string;
}

const Expenses = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    name: '',
    amount: 0,
  });
  
  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      
      // Fetch only general expenses
      const { data: generalExpenses, error: generalError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (generalError) {
        throw generalError;
      }
      
      // Format general expenses
      const formattedExpenses = (generalExpenses || []).map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        amount: Number(entry.amount),
        type: 'general'
      }));
      
      setExpenses(formattedExpenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expense data');
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
    if (!newEntry.name || !newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          name: newEntry.name,
          amount: newEntry.amount
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newExpenseEntry: ExpenseEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          name: data[0].name,
          amount: Number(data[0].amount),
          type: 'general'
        };
        
        setExpenses(prev => [newExpenseEntry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          name: '',
          amount: 0,
        });
        toast.success('Expense added successfully');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setExpenses(prev => prev.filter(entry => entry.id !== id));
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expenses Report</title>
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
          <h1>Expenses Report</h1>
          <div class="total">Total Expenses: ${expenseCount} | Total Amount: ₹${totalExpenses.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Date</th>
                <th>Expense Name</th>
                <th>Amount</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${filteredExpenses.map((expense, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(format(expense.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(expense.name)}</td>
                  <td>₹${escapeHtml(expense.amount.toFixed(2))}</td>
                  <td>${escapeHtml(expense.type)}</td>
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

  const totalExpenses = filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  const expenseCount = filteredExpenses.length;
  const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;

  return (
    <PageWrapper
      title="Expenses"
      subtitle={`Manage your expenses for ${viewMode === 'day' ? 'today' : 'this month'}`}
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
      {/* Add Expense Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Expense</h3>
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
            <Label htmlFor="name">Expense Name</Label>
            <Input
              id="name"
              value={newEntry.name}
              onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Expense name"
            />
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
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-blue-50">
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-700">{expenseCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-rose-50">
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-700">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardHeader>
            <CardTitle>Average Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(avgExpense)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading expense data...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Expenses</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new expense to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.name}
              date={entry.date}
              data={{
                amount: formatCurrency(entry.amount),
                type: entry.type,
              }}
              labels={{
                amount: 'Amount',
                type: 'Type',
              }}
              onEdit={() => {
                toast.info("Edit functionality coming soon");
              }}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))}
        </div>
      )}
    </PageWrapper>
  );
};

export default Expenses;
