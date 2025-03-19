
import { useState, useEffect } from 'react';
import { AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import DownloadButton from '@/components/ui/DownloadButton';
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
  const [pendingBalances, setPendingBalances] = useState<PendingBalanceEntry[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<PendingBalanceEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PendingBalanceEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showCustomService, setShowCustomService] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchPendingBalances = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pending_balances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        address: entry.address,
        phone: entry.phone,
        service: entry.service,
        customService: entry.custom_service,
        amount: Number(entry.amount)
      }));
      
      setPendingBalances(formattedData);
    } catch (error) {
      console.error('Error fetching pending balances:', error);
      toast.error('Failed to load pending balances data');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPendingBalances();
  }, []);
  
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

  const handleAddEntry = async (values: Partial<PendingBalanceEntry>) => {
    try {
      const amount = Number(values.amount);
      const service = values.service || '';
      const customService = values.customService || '';
      
      const { data, error } = await supabase
        .from('pending_balances')
        .insert({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          name: values.name || '',
          address: values.address || '',
          phone: values.phone || '',
          service: service === 'Others' ? 'Others' : service,
          custom_service: service === 'Others' ? customService : null,
          amount
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newEntry: PendingBalanceEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          name: data[0].name,
          address: data[0].address,
          phone: data[0].phone,
          service: data[0].service,
          customService: data[0].custom_service,
          amount: Number(data[0].amount)
        };
        
        setPendingBalances(prev => [newEntry, ...prev]);
        toast.success('Pending balance added successfully');
      }
      
      setShowCustomService(false);
    } catch (error) {
      console.error('Error adding pending balance:', error);
      toast.error('Failed to add pending balance');
    }
  };

  const handleEditEntry = async (values: Partial<PendingBalanceEntry>) => {
    if (!editingEntry) return;
    
    try {
      const amount = Number(values.amount);
      const service = values.service || '';
      const customService = values.customService || '';
      
      const { error } = await supabase
        .from('pending_balances')
        .update({
          date: values.date ? new Date(values.date).toISOString() : editingEntry.date.toISOString(),
          name: values.name || editingEntry.name,
          address: values.address || editingEntry.address,
          phone: values.phone || editingEntry.phone,
          service: service === 'Others' ? 'Others' : service,
          custom_service: service === 'Others' ? customService : null,
          amount
        })
        .eq('id', editingEntry.id);
      
      if (error) {
        throw error;
      }
      
      const updatedEntry: PendingBalanceEntry = {
        ...editingEntry,
        date: values.date || editingEntry.date,
        name: values.name || editingEntry.name,
        address: values.address || editingEntry.address,
        phone: values.phone || editingEntry.phone,
        service: service === 'Others' ? 'Others' : service,
        customService: service === 'Others' ? customService : undefined,
        amount
      };
      
      setPendingBalances(prev => 
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );
      
      setEditingEntry(null);
      setFormOpen(false);
      toast.success('Pending balance updated successfully');
      setShowCustomService(false);
    } catch (error) {
      console.error('Error updating pending balance:', error);
      toast.error('Failed to update pending balance');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pending_balances')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setPendingBalances(prev => prev.filter(entry => entry.id !== id));
      toast.success('Pending balance deleted successfully');
    } catch (error) {
      console.error('Error deleting pending balance:', error);
      toast.error('Failed to delete pending balance');
    }
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
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading pending balances data...</p>
        </div>
      ) : filteredBalances.length === 0 ? (
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
