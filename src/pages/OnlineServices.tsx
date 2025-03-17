
import { useState, useEffect } from 'react';
import { Globe, Plus } from 'lucide-react';
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

interface OnlineServiceEntry {
  id: string;
  date: Date;
  service: string;
  amount: number;
  count: number;
  total: number;
}

const OnlineServices = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [onlineServices, setOnlineServices] = useLocalStorage<OnlineServiceEntry[]>('onlineServices', []);
  const [filteredServices, setFilteredServices] = useState<OnlineServiceEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<OnlineServiceEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredServices(filterByDate(onlineServices, date));
    } else {
      setFilteredServices(filterByMonth(onlineServices, date));
    }
  }, [date, viewMode, onlineServices]);

  const serviceOptions = [
    { value: 'Domicile', label: 'Domicile' },
    { value: 'Birth Certificate', label: 'Birth Certificate' },
    { value: 'Death Certificate', label: 'Death Certificate' },
    { value: 'Pension Form', label: 'Pension Form' },
    { value: 'Ladli Beti Form', label: 'Ladli Beti Form' },
    { value: 'Railway Tickets', label: 'Railway Tickets' },
    { value: 'Marriage Assistance Form', label: 'Marriage Assistance Form' },
    { value: 'Ayushman Form', label: 'Ayushman Form' },
    { value: 'Loan/Files', label: 'Loan/Files' },
    { value: 'Others', label: 'Others' },
  ];

  const handleAddEntry = (values: Partial<OnlineServiceEntry>) => {
    const count = Number(values.count);
    const amount = Number(values.amount);
    const total = count * amount;

    const newEntry: OnlineServiceEntry = {
      id: uuidv4(),
      date: values.date || new Date(),
      service: values.service || '',
      amount,
      count,
      total,
    };

    setOnlineServices([...onlineServices, newEntry]);
    toast.success('Online service added successfully');
  };

  const handleEditEntry = (values: Partial<OnlineServiceEntry>) => {
    if (!editingEntry) return;
    
    const count = Number(values.count);
    const amount = Number(values.amount);
    const total = count * amount;

    const updatedServices = onlineServices.map(entry => 
      entry.id === editingEntry.id 
        ? { 
            ...entry, 
            date: values.date || entry.date,
            service: values.service || entry.service,
            amount,
            count,
            total,
          } 
        : entry
    );

    setOnlineServices(updatedServices);
    setEditingEntry(null);
    toast.success('Online service updated successfully');
  };

  const handleDeleteEntry = (id: string) => {
    setOnlineServices(onlineServices.filter(entry => entry.id !== id));
    toast.success('Online service deleted successfully');
  };

  const formFields = [
    { 
      name: 'date', 
      label: 'Date', 
      type: 'date' as const,
      required: true
    },
    { 
      name: 'service', 
      label: 'Service Type', 
      type: 'select' as const,
      options: serviceOptions,
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
      name: 'count', 
      label: 'Number of Services', 
      type: 'number' as const,
      min: 1,
      required: true
    },
  ];

  const calculateTotals = (values: Record<string, any>) => {
    const count = Number(values.count) || 0;
    const amount = Number(values.amount) || 0;
    return {
      ...values,
      total: count * amount
    };
  };

  const totalCount = filteredServices.reduce((sum, entry) => sum + entry.count, 0);
  const totalAmount = filteredServices.reduce((sum, entry) => sum + entry.total, 0);
  const serviceGroups = filteredServices.reduce((groups, entry) => {
    const service = entry.service;
    groups[service] = (groups[service] || 0) + entry.count;
    return groups;
  }, {} as Record<string, number>);

  const mostUsedService = Object.entries(serviceGroups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  return (
    <PageWrapper
      title="Online Services"
      subtitle={`Manage your online services for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <ServiceForm
            title="Add Online Service"
            fields={formFields}
            initialValues={{
              date: new Date(),
              service: '',
              amount: 0,
              count: 1,
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
            value: totalCount,
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
            value: formatCurrency(totalAmount),
          }}
          labels={{ 
            value: "Amount",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-emerald-50"
          showActions={false}
        />
        <ServiceCard 
          id="summary-popular"
          title="Most Used Service"
          date={date}
          data={{ 
            value: mostUsedService,
          }}
          labels={{ 
            value: "Service",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-purple-50"
          showActions={false}
        />
      </div>

      {filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Online Services</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new online service to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.service}
              date={entry.date}
              data={{
                count: entry.count,
                amount: formatCurrency(entry.amount),
                total: formatCurrency(entry.total),
              }}
              labels={{
                count: 'Number of Services',
                amount: 'Amount per Service',
                total: 'Total Amount',
              }}
              onEdit={() => {
                setEditingEntry(entry);
                setFormOpen(true);
              }}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))}
        </div>
      )}

      {editingEntry && (
        <ServiceForm
          title="Edit Online Service"
          fields={formFields}
          initialValues={calculateTotals(editingEntry)}
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

export default OnlineServices;
