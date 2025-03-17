
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
  calculatePassportTotal, 
  calculatePassportMargin,
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';

interface PassportEntry {
  id: string;
  date: Date;
  count: number;
  amount: number;
  total: number;
  margin: number;
}

const Passport = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [passports, setPassports] = useLocalStorage<PassportEntry[]>('passports', []);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PassportEntry | null>(null);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredPassports(filterByDate(passports, date));
    } else {
      setFilteredPassports(filterByMonth(passports, date));
    }
  }, [date, viewMode, passports]);

  const handleAddEntry = (values: Partial<PassportEntry>) => {
    const count = Number(values.count);
    const amount = Number(values.amount);
    const total = calculatePassportTotal(count, amount);
    const margin = calculatePassportMargin(count);

    const newEntry: PassportEntry = {
      id: uuidv4(),
      date: values.date || new Date(),
      count,
      amount,
      total,
      margin,
    };

    setPassports([...passports, newEntry]);
    toast.success('Passport entry added successfully');
  };

  const handleEditEntry = (values: Partial<PassportEntry>) => {
    if (!editingEntry) return;
    
    const count = Number(values.count);
    const amount = Number(values.amount);
    const total = calculatePassportTotal(count, amount);
    const margin = calculatePassportMargin(count);

    const updatedPassports = passports.map(entry => 
      entry.id === editingEntry.id 
        ? { 
            ...entry, 
            date: values.date || entry.date,
            count,
            amount,
            total,
            margin,
          } 
        : entry
    );

    setPassports(updatedPassports);
    setEditingEntry(null);
    toast.success('Passport entry updated successfully');
  };

  const handleDeleteEntry = (id: string) => {
    setPassports(passports.filter(entry => entry.id !== id));
    toast.success('Passport entry deleted successfully');
  };

  const formFields = [
    { 
      name: 'date', 
      label: 'Date', 
      type: 'date' as const,
      required: true
    },
    { 
      name: 'count', 
      label: 'Number of Passports', 
      type: 'number' as const,
      min: 1,
      required: true
    },
    { 
      name: 'amount', 
      label: 'Amount per Passport (₹)', 
      type: 'number' as const,
      min: 0,
      required: true
    },
    { 
      name: 'total', 
      label: 'Total Amount (₹)', 
      type: 'number' as const,
      readOnly: true
    },
    { 
      name: 'margin', 
      label: 'Margin (₹)', 
      type: 'number' as const,
      readOnly: true
    },
  ];

  const calculateTotals = (values: Record<string, any>) => {
    const count = Number(values.count) || 0;
    const amount = Number(values.amount) || 0;
    return {
      ...values,
      total: calculatePassportTotal(count, amount),
      margin: calculatePassportMargin(count)
    };
  };

  const totalPassports = filteredPassports.reduce((sum, entry) => sum + entry.count, 0);
  const totalAmount = filteredPassports.reduce((sum, entry) => sum + entry.total, 0);
  const totalMargin = filteredPassports.reduce((sum, entry) => sum + entry.margin, 0);

  return (
    <PageWrapper
      title="Passport Services"
      subtitle={`Manage your Passport services for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <ServiceForm
            title="Add Passport Entry"
            fields={formFields}
            initialValues={{
              date: new Date(),
              count: 1,
              amount: 0,
              total: 0,
              margin: 200,
            }}
            onSubmit={handleAddEntry}
            trigger={
              <Button className="flex items-center gap-1">
                <Plus size={16} />
                <span>Add Entry</span>
              </Button>
            }
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ServiceCard 
          id="summary-passports"
          title="Total Passports"
          date={date}
          data={{ 
            value: totalPassports,
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
            value: formatCurrency(totalAmount),
          }}
          labels={{ 
            value: "Amount",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-emerald-50"
        />
        <ServiceCard 
          id="summary-margin"
          title="Total Margin"
          date={date}
          data={{ 
            value: formatCurrency(totalMargin),
          }}
          labels={{ 
            value: "Margin",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-purple-50"
        />
      </div>

      {filteredPassports.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Passport entries</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new entry to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPassports.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Passport Entry"
              date={entry.date}
              data={{
                count: entry.count,
                amount: formatCurrency(entry.amount),
                total: formatCurrency(entry.total),
                margin: formatCurrency(entry.margin),
              }}
              labels={{
                count: 'Number of Passports',
                amount: 'Amount per Passport',
                total: 'Total Amount',
                margin: 'Margin',
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
          title="Edit Passport Entry"
          fields={formFields}
          initialValues={calculateTotals(editingEntry)}
          onSubmit={handleEditEntry}
          trigger={<div />}
          isEdit
        />
      )}
    </PageWrapper>
  );
};

export default Passport;
