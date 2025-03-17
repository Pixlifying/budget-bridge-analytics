
import { useState, useEffect } from 'react';
import { Receipt, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import useLocalStorage from '@/hooks/useLocalStorage';
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
}

const Expenses = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [expenses, setExpenses] = useLocalStorage<ExpenseEntry[]>('expenses', []);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<ExpenseEntry | null>(null);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredExpenses(filterByDate(expenses, date));
    } else {
      setFilteredExpenses(filterByMonth(expenses, date));
    }
  }, [date, viewMode, expenses]);

  const handleAddEntry = (values: Partial<ExpenseEntry>) => {
    const amount = Number(values.amount);

    const newEntry: ExpenseEntry = {
      id: uuidv4(),
      date: values.date || new Date(),
      name: values.name || '',
      amount,
    };

    setExpenses([...expenses, newEntry]);
    toast.success('Expense added successfully');
  };

  const handleEditEntry = (values: Partial<ExpenseEntry>) => {
    if (!editingEntry) return;
    
    const amount = Number(values.amount);

    const updatedExpenses = expenses.map(entry => 
      entry.id === editingEntry.id 
        ? { 
            ...entry, 
            date: values.date || entry.date,
            name: values.name || entry.name,
            amount,
          } 
        : entry
    );

    setExpenses(updatedExpenses);
    setEditingEntry(null);
    toast.success('Expense updated successfully');
  };

  const handleDeleteEntry = (id: string) => {
    setExpenses(expenses.filter(entry => entry.id !== id));
    toast.success('Expense deleted successfully');
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
        />
      </div>

      {filteredExpenses.length === 0 ? (
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
                setEditingEntry(entry);
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
        />
      )}
    </PageWrapper>
  );
};

export default Expenses;
