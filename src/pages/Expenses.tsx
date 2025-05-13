
import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import StatCard from '@/components/ui/StatCard';
import { Button } from '@/components/ui/button';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/calculateUtils';

interface ExpenseEntry {
  id: string;
  name: string;
  amount: number;
  date: Date;
  created_at?: string;
}

interface FeeExpense {
  id: string;
  customer_name: string;
  fee: number;
  date: Date;
  created_at?: string;
}

interface MiscExpense {
  id: string;
  name: string;
  fee: number;
  date: Date;
  created_at?: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [feeExpenses, setFeeExpenses] = useState<FeeExpense[]>([]);
  const [miscExpenses, setMiscExpenses] = useState<MiscExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (expenseError) throw expenseError;

      const { data: feeData, error: feeError } = await supabase
        .from('fee_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (feeError) throw feeError;

      const { data: miscData, error: miscError } = await supabase
        .from('misc_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (miscError) throw miscError;

      setExpenses(expenseData.map(expense => ({
        ...expense,
        date: new Date(expense.date)
      })));

      setFeeExpenses(feeData.map(fee => ({
        ...fee,
        date: new Date(fee.date)
      })));

      setMiscExpenses(miscData.map(misc => ({
        ...misc,
        date: new Date(misc.date)
      })));

      console.info('Expenses data fetched:', expenseData, 'for date:', date, 'mode:', viewMode);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterExpenses();
  }, [expenses, date, viewMode]);

  const filterExpenses = () => {
    let filtered = [...expenses];
    
    if (viewMode === 'day') {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getDate() === date.getDate() &&
          expenseDate.getMonth() === date.getMonth() &&
          expenseDate.getFullYear() === date.getFullYear()
        );
      });
    } else if (viewMode === 'month') {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === date.getMonth() &&
          expenseDate.getFullYear() === date.getFullYear()
        );
      });
    }
    
    setFilteredExpenses(filtered);
  };

  const handleAddExpense = async (values: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          name: values.name,
          amount: values.amount,
          date: new Date(values.date).toISOString(),
        })
        .select();

      if (error) throw error;

      const newExpense: ExpenseEntry = {
        ...data[0],
        date: new Date(data[0].date),
      };

      setExpenses(prev => [newExpense, ...prev]);
      toast.success('Expense added successfully');
      setFormOpen(false);
      filterExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    }
  };

  const handleEditExpense = async (values: Record<string, any>) => {
    if (!editingExpense) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          name: values.name,
          amount: values.amount,
          date: new Date(values.date).toISOString(),
        })
        .eq('id', editingExpense.id);

      if (error) throw error;

      setExpenses(prev =>
        prev.map(item =>
          item.id === editingExpense.id
            ? {
                ...item,
                name: values.name,
                amount: values.amount,
                date: new Date(values.date),
              }
            : item
        )
      );

      toast.success('Expense updated successfully');
      setEditingExpense(null);
      filterExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseToDelete);

      if (error) throw error;

      setExpenses(prev => prev.filter(item => item.id !== expenseToDelete));
      toast.success('Expense deleted successfully');
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      filterExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };

  const openEditForm = (expense: ExpenseEntry) => {
    setEditingExpense(expense);
  };

  const initiateDelete = (id: string) => {
    setExpenseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const expenseFormFields = [
    {
      name: 'date',
      label: 'Date',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'name',
      label: 'Expense Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'number' as const,
      required: true,
      min: 0,
    },
  ];

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <PageWrapper
      title="Expenses"
      subtitle="Track and manage your expenses"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <div className="flex gap-2">
            <ServiceForm
              title="Add Expense"
              fields={expenseFormFields}
              initialValues={{
                date: new Date().toISOString().split('T')[0],
                name: '',
                amount: 0,
              }}
              onSubmit={handleAddExpense}
              trigger={
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Add Expense</span>
                </Button>
              }
              open={formOpen}
              onOpenChange={setFormOpen}
            />
            <DownloadButton
              data={expenses}
              filename="expenses"
              currentData={filteredExpenses}
            />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Expenses"
          value={formatCurrency(totalAmount)}
          icon={<Plus size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExpenses.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No expenses found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredExpenses.map(expense => (
            <ServiceCard
              key={expense.id}
              id={expense.id}
              title={expense.name}
              date={expense.date}
              data={{
                'Amount': formatCurrency(expense.amount),
              }}
              labels={{
                'Amount': 'Amount',
              }}
              onEdit={() => openEditForm(expense)}
              onDelete={() => initiateDelete(expense.id)}
            />
          ))
        )}
      </div>

      {editingExpense && (
        <ServiceForm
          title="Edit Expense"
          fields={expenseFormFields}
          initialValues={{
            date: editingExpense.date.toISOString().split('T')[0],
            name: editingExpense.name,
            amount: editingExpense.amount,
          }}
          onSubmit={handleEditExpense}
          trigger={<></>}
          isEdit
          open={!!editingExpense}
          onOpenChange={(open) => {
            if (!open) setEditingExpense(null);
          }}
        />
      )}

      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default Expenses;
