
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

interface FeeExpense {
  id: string;
  customer_name: string;
  fee: number;
  date: Date;
  created_at?: string;
}

const FeeExpenses = () => {
  const [expenses, setExpenses] = useState<FeeExpense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<FeeExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<FeeExpense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fee_expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedExpenses = data.map(expense => ({
        ...expense,
        date: new Date(expense.date)
      }));

      setExpenses(formattedExpenses);
      console.info('Fee expenses data fetched:', formattedExpenses, 'for date:', date, 'mode:', viewMode);
    } catch (error) {
      console.error('Error fetching fee expenses:', error);
      toast.error('Failed to load fee expenses');
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
        .from('fee_expenses')
        .insert({
          customer_name: values.customer_name,
          fee: values.fee,
          date: new Date(values.date).toISOString(),
        })
        .select();

      if (error) throw error;

      const newExpense: FeeExpense = {
        ...data[0],
        date: new Date(data[0].date),
      };

      setExpenses(prev => [newExpense, ...prev]);
      toast.success('Fee expense added successfully');
      setFormOpen(false);
      filterExpenses();
    } catch (error) {
      console.error('Error adding fee expense:', error);
      toast.error('Failed to add fee expense');
    }
  };

  const handleEditExpense = async (values: Record<string, any>) => {
    if (!editingExpense) return;

    try {
      const { error } = await supabase
        .from('fee_expenses')
        .update({
          customer_name: values.customer_name,
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
                customer_name: values.customer_name,
                fee: values.fee,
                date: new Date(values.date),
              }
            : item
        )
      );

      toast.success('Fee expense updated successfully');
      setEditingExpense(null);
      filterExpenses();
    } catch (error) {
      console.error('Error updating fee expense:', error);
      toast.error('Failed to update fee expense');
    }
  };

  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;

    try {
      const { error } = await supabase
        .from('fee_expenses')
        .delete()
        .eq('id', expenseToDelete);

      if (error) throw error;

      setExpenses(prev => prev.filter(item => item.id !== expenseToDelete));
      toast.success('Fee expense deleted successfully');
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      filterExpenses();
    } catch (error) {
      console.error('Error deleting fee expense:', error);
      toast.error('Failed to delete fee expense');
    }
  };

  const openEditForm = (expense: FeeExpense) => {
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
      name: 'customer_name',
      label: 'Customer Name',
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
      title="Fee Expenses"
      subtitle="Track and manage your fee expenses"
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
              title="Add Fee Expense"
              fields={expenseFormFields}
              initialValues={{
                date: new Date().toISOString().split('T')[0],
                customer_name: '',
                fee: 0,
              }}
              onSubmit={handleAddExpense}
              trigger={
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Add Fee Expense</span>
                </Button>
              }
              open={formOpen}
              onOpenChange={setFormOpen}
            />
            <DownloadButton
              data={expenses}
              filename="fee-expenses"
              currentData={filteredExpenses}
            />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Fee Expenses"
          value={formatCurrency(totalAmount)}
          icon={<Plus size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExpenses.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No fee expenses found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredExpenses.map(expense => (
            <ServiceCard
              key={expense.id}
              id={expense.id}
              title={expense.customer_name}
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
          title="Edit Fee Expense"
          fields={expenseFormFields}
          initialValues={{
            date: format(editingExpense.date, 'yyyy-MM-dd'),
            customer_name: editingExpense.customer_name,
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
        title="Delete Fee Expense"
        description="Are you sure you want to delete this fee expense? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default FeeExpenses;
