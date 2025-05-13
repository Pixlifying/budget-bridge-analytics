
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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

interface MiscExpense {
  id: string;
  name: string;
  fee: number;
  date: Date;
  created_at?: string;
}

const MiscExpenses = () => {
  const [expenses, setExpenses] = useState<MiscExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<MiscExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<MiscExpense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('misc_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedExpenses = data.map(expense => ({
        ...expense,
        date: new Date(expense.date)
      }));

      setExpenses(formattedExpenses);
      console.info('Misc expenses data fetched:', formattedExpenses, 'for date:', date, 'mode:', viewMode);
    } catch (error) {
      console.error('Error fetching misc expenses:', error);
      toast.error('Failed to load miscellaneous expenses');
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
        .from('misc_expenses')
        .insert({
          name: values.name,
          fee: values.fee,
          date: new Date(values.date).toISOString(),
        })
        .select();

      if (error) throw error;

      const newExpense: MiscExpense = {
        ...data[0],
        date: new Date(data[0].date),
      };

      setExpenses(prev => [newExpense, ...prev]);
      toast.success('Miscellaneous expense added successfully');
      setFormOpen(false);
      filterExpenses();
    } catch (error) {
      console.error('Error adding misc expense:', error);
      toast.error('Failed to add miscellaneous expense');
    }
  };

  const handleEditExpense = async (values: Record<string, any>) => {
    if (!editingExpense) return;

    try {
      const { error } = await supabase
        .from('misc_expenses')
        .update({
          name: values.name,
          fee: values.fee,
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
                fee: values.fee,
                date: new Date(values.date),
              }
            : item
        )
      );

      toast.success('Miscellaneous expense updated successfully');
      setEditingExpense(null);
      filterExpenses();
    } catch (error) {
      console.error('Error updating misc expense:', error);
      toast.error('Failed to update miscellaneous expense');
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const { error } = await supabase
        .from('misc_expenses')
        .delete()
        .eq('id', expenseToDelete);

      if (error) throw error;

      setExpenses(prev => prev.filter(item => item.id !== expenseToDelete));
      toast.success('Miscellaneous expense deleted successfully');
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      filterExpenses();
    } catch (error) {
      console.error('Error deleting misc expense:', error);
      toast.error('Failed to delete miscellaneous expense');
    }
  };

  const openEditForm = (expense: MiscExpense) => {
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
      name: 'fee',
      label: 'Fee Amount',
      type: 'number' as const,
      required: true,
      min: 0,
    },
  ];

  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + Number(expense.fee), 0);

  return (
    <PageWrapper
      title="Miscellaneous Expenses"
      subtitle="Track and manage your miscellaneous expenses"
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
              title="Add Miscellaneous Expense"
              fields={expenseFormFields}
              initialValues={{
                date: new Date().toISOString().split('T')[0],
                name: '',
                fee: 0,
              }}
              onSubmit={handleAddExpense}
              trigger={
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Add Misc Expense</span>
                </Button>
              }
              open={formOpen}
              onOpenChange={setFormOpen}
            />
            <DownloadButton
              data={expenses}
              filename="misc-expenses"
              currentData={filteredExpenses}
            />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Miscellaneous Expenses"
          value={formatCurrency(totalAmount)}
          icon={<Plus size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExpenses.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No miscellaneous expenses found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredExpenses.map(expense => (
            <ServiceCard
              key={expense.id}
              id={expense.id}
              title={expense.name}
              date={expense.date}
              data={{
                'Fee Amount': formatCurrency(expense.fee),
              }}
              labels={{
                'Fee Amount': 'Fee Amount',
              }}
              onEdit={() => openEditForm(expense)}
              onDelete={() => initiateDelete(expense.id)}
            />
          ))
        )}
      </div>

      {editingExpense && (
        <ServiceForm
          title="Edit Miscellaneous Expense"
          fields={expenseFormFields}
          initialValues={{
            date: format(editingExpense.date, 'yyyy-MM-dd'),
            name: editingExpense.name,
            fee: editingExpense.fee,
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
        title="Delete Miscellaneous Expense"
        description="Are you sure you want to delete this miscellaneous expense? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default MiscExpenses;
