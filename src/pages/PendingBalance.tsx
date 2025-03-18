
import { useState, useEffect } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import DownloadButton from '@/components/ui/DownloadButton';
import useLocalStorage from '@/hooks/useLocalStorage';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';

interface PendingBalanceEntry {
  id: string;
  date: Date;
  name: string;
  address: string;
  phone: string;
  service: string;
  customService?: string;
  amount: number;
}

const PendingBalance = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [pendingBalances, setPendingBalances] = useLocalStorage<PendingBalanceEntry[]>('pendingBalances', []);
  const [filteredBalances, setFilteredBalances] = useState<PendingBalanceEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PendingBalanceEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showCustomService, setShowCustomService] = useState(false);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredBalances(filterByDate(pendingBalances, date));
    } else {
      setFilteredBalances(filterByMonth(pendingBalances, date));
    }
  }, [date, viewMode, pendingBalances]);

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

  const handleAddEntry = (values: Partial<PendingBalanceEntry>) => {
    const amount = Number(values.amount);
    const service = values.service || '';
    const customService = values.customService || '';

    const newEntry: PendingBalanceEntry = {
      id: uuidv4(),
      date: values.date || new Date(),
      name: values.name || '',
      address: values.address || '',
      phone: values.phone || '',
      service: service === 'Others' ? 'Others' : service,
      customService: service === 'Others' ? customService : undefined,
      amount,
    };

    setPendingBalances([...pendingBalances, newEntry]);
    toast.success('Pending balance added successfully');
    setShowCustomService(false);
  };

  const handleEditEntry = (values: Partial<PendingBalanceEntry>) => {
    if (!editingEntry) return;
    
    const amount = Number(values.amount);
    const service = values.service || '';
    const customService = values.customService || '';

    const updatedBalances = pendingBalances.map(entry => 
      entry.id === editingEntry.id 
        ? { 
            ...entry, 
            date: values.date || entry.date,
            name: values.name || entry.name,
            address: values.address || entry.address,
            phone: values.phone || entry.phone,
            service: service === 'Others' ? 'Others' : service,
            customService: service === 'Others' ? customService : undefined,
            amount,
          } 
        : entry
    );

    setPendingBalances(updatedBalances);
    setEditingEntry(null);
    toast.success('Pending balance updated successfully');
    setShowCustomService(false);
  };

  const handleDeleteEntry = (id: string) => {
    setPendingBalances(pendingBalances.filter(entry => entry.id !== id));
    toast.success('Pending balance deleted successfully');
  };

  const getFormFields = () => {
    const fields = [
      { 
        name: 'date', 
        label: 'Date', 
        type: 'date' as const,
        required: true
      },
      { 
        name: 'name', 
        label: 'Name', 
        type: 'text' as const,
        required: true
      },
      { 
        name: 'address', 
        label: 'Address', 
        type: 'text' as const,
        required: true
      },
      { 
        name: 'phone', 
        label: 'Phone Number', 
        type: 'text' as const,
        required: true
      },
      { 
        name: 'service', 
        label: 'Service Type', 
        type: 'select' as const,
        options: serviceOptions,
        required: true,
        onChange: (value: string) => setShowCustomService(value === 'Others')
      },
    ];

    if (showCustomService) {
      fields.push({ 
        name: 'customService', 
        label: 'Specify Service', 
        type: 'text' as const,
        required: true
      });
    }

    fields.push({ 
      name: 'amount', 
      label: 'Pending Amount (₹)', 
      type: 'number' as const,
      min: 0,
      required: true
    });

    return fields;
  };

  const totalPendingAmount = filteredBalances.reduce((sum, entry) => sum + entry.amount, 0);
  const totalEntries = filteredBalances.length;
  const avgAmount = totalEntries > 0 ? totalPendingAmount / totalEntries : 0;

  return (
    <PageWrapper
      title="Pending Balance"
      subtitle={`Manage pending balances for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <div className="flex gap-2">
            <DownloadButton 
              data={pendingBalances}
              filename="pending-balances"
              currentData={filteredBalances}
            />
            <ServiceForm
              title="Add Pending Balance"
              fields={getFormFields()}
              initialValues={{
                date: new Date(),
                name: '',
                address: '',
                phone: '',
                service: '',
                customService: '',
                amount: 0,
              }}
              onSubmit={handleAddEntry}
              trigger={
                <Button className="flex items-center gap-1">
                  <Plus size={16} />
                  <span>Add Balance</span>
                </Button>
              }
            />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ServiceCard 
          id="summary-count"
          title="Total Entries"
          date={date}
          data={{ 
            value: totalEntries,
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
          title="Total Pending Amount"
          date={date}
          data={{ 
            value: formatCurrency(totalPendingAmount),
          }}
          labels={{ 
            value: "Amount",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-amber-50"
          showActions={false}
        />
        <ServiceCard 
          id="summary-average"
          title="Average Pending Amount"
          date={date}
          data={{ 
            value: formatCurrency(avgAmount),
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

      {filteredBalances.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Pending Balances</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new pending balance to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBalances.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.name}
              date={entry.date}
              data={{
                service: entry.service === 'Others' ? (entry.customService || 'Other Service') : entry.service,
                phone: entry.phone,
                address: entry.address,
                amount: formatCurrency(entry.amount),
              }}
              labels={{
                service: 'Service',
                phone: 'Phone',
                address: 'Address',
                amount: 'Pending Amount',
              }}
              onEdit={() => {
                setShowCustomService(entry.service === 'Others');
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
          title="Edit Pending Balance"
          fields={getFormFields()}
          initialValues={{
            ...editingEntry,
            service: editingEntry.service || '',
            customService: editingEntry.customService || '',
          }}
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

export default PendingBalance;
