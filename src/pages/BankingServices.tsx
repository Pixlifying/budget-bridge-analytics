
import { useState, useEffect } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import useLocalStorage from '@/hooks/useLocalStorage';
import { 
  calculateBankingServicesMargin,
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';

interface BankingServiceEntry {
  id: string;
  date: Date;
  amount: number;
  margin: number;
}

const BankingServices = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [bankingServices, setBankingServices] = useLocalStorage<BankingServiceEntry[]>('bankingServices', []);
  const [filteredServices, setFilteredServices] = useState<BankingServiceEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<BankingServiceEntry | null>(null);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredServices(filterByDate(bankingServices, date));
    } else {
      setFilteredServices(filterByMonth(bankingServices, date));
    }
  }, [date, viewMode, bankingServices]);

  const handleAddEntry = (values: Partial<BankingServiceEntry>) => {
    const amount = Number(values.amount);
    const margin = calculateBankingServicesMargin(amount);

    const newEntry: BankingServiceEntry = {
      id: uuidv4(),
      date: values.date || new Date(),
      amount,
      margin,
    };

    setBankingServices([...bankingServices, newEntry]);
    toast.success('Banking service added successfully');
  };

  const handleEditEntry = (values: Partial<BankingServiceEntry>) => {
    if (!editingEntry) return;
    
    const amount = Number(values.amount);
    const margin = calculateBankingServicesMargin(amount);

    const updatedServices = bankingServices.map(entry => 
      entry.id === editingEntry.id 
        ? { 
            ...entry, 
            date: values.date || entry.date,
            amount,
            margin,
          } 
        : entry
    );

    setBankingServices(updatedServices);
    setEditingEntry(null);
    toast.success('Banking service updated successfully');
  };

  const handleDeleteEntry = (id: string) => {
    setBankingServices(bankingServices.filter(entry => entry.id !== id));
    toast.success('Banking service deleted successfully');
  };

  const formFields = [
    { 
      name: 'date', 
      label: 'Date', 
      type: 'date' as const,
      required: true
    },
    { 
      name: 'amount', 
      label: 'Amount (₹)', 
      type: 'number' as const,
      min: 0,
      required: true
    },
    { 
      name: 'margin', 
      label: 'Margin (₹)', 
      type: 'number' as const,
      readOnly: true
    },
  ];

  const calculateTotals = (values: Record<string, any>) => {
    const amount = Number(values.amount) || 0;
    return {
      ...values,
      margin: calculateBankingServicesMargin(amount)
    };
  };

  const totalAmount = filteredServices.reduce((sum, entry) => sum + entry.amount, 0);
  const totalMargin = filteredServices.reduce((sum, entry) => sum + entry.margin, 0);
  const totalServices = filteredServices.length;

  return (
    <PageWrapper
      title="Banking Services"
      subtitle={`Manage your banking services for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <ServiceForm
            title="Add Banking Service"
            fields={formFields}
            initialValues={{
              date: new Date(),
              amount: 0,
              margin: 0,
            }}
            onSubmit={handleAddEntry}
            trigger={
              <Button className="flex items-center gap-1">
                <Plus size={16} />
                <span>Add Service</span>
              </Button>
            }
          />
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ServiceCard 
          id="summary-services"
          title="Total Services"
          date={date}
          data={{ 
            value: totalServices,
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

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Banking Services</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new banking service to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Banking Service"
              date={entry.date}
              data={{
                amount: formatCurrency(entry.amount),
                margin: formatCurrency(entry.margin),
              }}
              labels={{
                amount: 'Amount',
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
          title="Edit Banking Service"
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

export default BankingServices;
