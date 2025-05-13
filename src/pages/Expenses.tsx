
import { useState, useEffect } from 'react';
import { Receipt, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';

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
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      
      // Fetch general expenses
      const { data: generalExpenses, error: generalError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (generalError) {
        throw generalError;
      }
      
      // Fetch fee expenses
      const { data: feeExpenses, error: feeError } = await supabase
        .from('fee_expenses')
        .select('*')
        .order('date', { ascending: false });
        
      if (feeError) {
        throw feeError;
      }
      
      // Fetch misc expenses
      const { data: miscExpenses, error: miscError } = await supabase
        .from('misc_expenses')
        .select('*')
        .order('date', { ascending: false });
        
      if (miscError) {
        throw miscError;
      }
      
      // Format general expenses
      const formattedGeneralExpenses = (generalExpenses || []).map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        amount: Number(entry.amount),
        type: 'general'
      }));
      
      // Format fee expenses
      const formattedFeeExpenses = (feeExpenses || []).map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: `Fee: ${entry.customer_name}`,
        amount: Number(entry.fee),
        type: 'fee'
      }));
      
      // Format misc expenses
      const formattedMiscExpenses = (miscExpenses || []).map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: `Misc: ${entry.name}`,
        amount: Number(entry.fee),
        type: 'misc'
      }));
      
      // Combine all expenses
      const allExpenses = [
        ...formattedGeneralExpenses,
        ...formattedFeeExpenses,
        ...formattedMiscExpenses
      ];
      
      // Sort by date (newest first)
      allExpenses.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      setExpenses(allExpenses);
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

  const handleAddEntry = async (values: Partial<ExpenseEntry>) => {
    try {
      const amount = Number(values.amount);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          date: values.date ? values.date.toISOString() : new Date().toISOString(),
          name: values.name || '',
          amount
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newEntry: ExpenseEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          name: data[0].name,
          amount: Number(data[0].amount),
          type: 'general'
        };
        
        setExpenses(prev => [newEntry, ...prev]);
        toast.success('Expense added successfully');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleEditEntry = async (values: Partial<ExpenseEntry>) => {
    if (!editingEntry) return;
    
    try {
      const amount = Number(values.amount);
      
      const { error } = await supabase
        .from('expenses')
        .update({
          date: values.date ? values.date.toISOString() : editingEntry.date.toISOString(),
          name: values.name || editingEntry.name,
          amount
        })
        .eq('id', editingEntry.id);
      
      if (error) {
        throw error;
      }
      
      const updatedEntry: ExpenseEntry = {
        ...editingEntry,
        date: values.date ? new Date(values.date) : new Date(editingEntry.date),
        name: values.name || editingEntry.name,
        amount
      };
      
      setExpenses(prev => 
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );
      
      setEditingEntry(null);
      setFormOpen(false);
      toast.success('Expense updated successfully');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const expenseToDelete = expenses.find(e => e.id === id);
      if (!expenseToDelete) return;
      
      let error;
      
      // Delete from the appropriate table based on type
      if (expenseToDelete.type === 'fee') {
        const result = await supabase
          .from('fee_expenses')
          .delete()
          .eq('id', id);
        error = result.error;
      } else if (expenseToDelete.type === 'misc') {
        const result = await supabase
          .from('misc_expenses')
          .delete()
          .eq('id', id);
        error = result.error;
      } else {
        const result = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);
        error = result.error;
      }
      
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

  const formFields = [
    { 
      name: 'date', 
      label: 'Date', 
      type: 'date' as const,
      required: true
    },
    { 
      name: 'name', 
      label: 'Expense Name', 
      type: 'text' as const,
      required: true
    },
    { 
      name: 'amount', 
      label: 'Amount (₹)', 
      type: 'number' as const,
      min: 0,
      required: true
    },
  ];

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
          <ServiceForm
            title="Add Expense"
            fields={formFields}
            initialValues={{
              date: new Date(),
              name: '',
              amount: 0,
            }}
            onSubmit={handleAddEntry}
            trigger={
              <Button className="flex items-center gap-1">
                <Plus size={16} />
                <span>Add Expense</span>
              </Button>
            }
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ServiceCard 
          id="summary-count"
          title="Total Expenses"
          date={date}
          data={{ 
            value: expenseCount,
          }}
          labels={{ 
            value: "Count",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-blue-50"
          showActions={false}
        />
        <ServiceCard 
          id="summary-amount"
          title="Total Amount"
          date={date}
          data={{ 
            value: formatCurrency(totalExpenses),
          }}
          labels={{ 
            value: "Amount",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-rose-50"
          showActions={false}
        />
        <ServiceCard 
          id="summary-average"
          title="Average Expense"
          date={date}
          data={{ 
            value: formatCurrency(avgExpense),
          }}
          labels={{ 
            value: "Amount",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-orange-50"
          showActions={false}
        />
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
              }}
              labels={{
                amount: 'Amount',
              }}
              onEdit={() => {
                if (entry.type === 'general') {
                  setEditingEntry(entry);
                  setFormOpen(true);
                } else {
                  toast.info("You can only edit general expenses here. Edit fee or misc expenses in their respective pages.");
                }
              }}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))}
        </div>
      )}

      {editingEntry && (
        <ServiceForm
          title="Edit Expense"
          fields={formFields}
          initialValues={editingEntry}
          onSubmit={handleEditEntry}
          trigger={<div />}
          isEdit
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}
    </PageWrapper>
  );
};

export default Expenses;
