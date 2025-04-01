
import { useState, useEffect } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/ui/StatCard';
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
  transaction_count: number;
  margin: number;
}

const BankingServices = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [bankingServices, setBankingServices] = useState<BankingServiceEntry[]>([]);
  const [filteredServices, setFilteredServices] = useState<BankingServiceEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<BankingServiceEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchBankingServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount: Number(entry.amount),
        transaction_count: Number(entry.transaction_count || 1),
        margin: Number(entry.margin)
      }));
      
      setBankingServices(formattedData);
    } catch (error) {
      console.error('Error fetching banking services:', error);
      toast.error('Failed to load banking services data');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBankingServices();
  }, []);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredServices(filterByDate(bankingServices, date));
    } else {
      setFilteredServices(filterByMonth(bankingServices, date));
    }
  }, [date, viewMode, bankingServices]);

  const handleAddEntry = async (values: Partial<BankingServiceEntry>) => {
    try {
      const amount = Number(values.amount);
      const transaction_count = Number(values.transaction_count || 1);
      const margin = calculateBankingServicesMargin(amount);
      
      const { data, error } = await supabase
        .from('banking_services')
        .insert({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          amount,
          transaction_count,
          margin
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newEntry: BankingServiceEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          amount: Number(data[0].amount),
          transaction_count: Number(data[0].transaction_count || 1),
          margin: Number(data[0].margin)
        };
        
        setBankingServices(prev => [newEntry, ...prev]);
        toast.success('Banking service added successfully');
      }
    } catch (error) {
      console.error('Error adding banking service:', error);
      toast.error('Failed to add banking service');
    }
  };

  const handleEditEntry = async (values: Partial<BankingServiceEntry>) => {
    if (!editingEntry) return;
    
    try {
      const amount = Number(values.amount);
      const transaction_count = Number(values.transaction_count || 1);
      const margin = calculateBankingServicesMargin(amount);
      
      const { error } = await supabase
        .from('banking_services')
        .update({
          date: values.date ? new Date(values.date).toISOString() : editingEntry.date.toISOString(),
          amount,
          transaction_count,
          margin
        })
        .eq('id', editingEntry.id);
      
      if (error) {
        throw error;
      }
      
      const updatedEntry: BankingServiceEntry = {
        ...editingEntry,
        date: values.date || editingEntry.date,
        amount,
        transaction_count,
        margin
      };
      
      setBankingServices(prev => 
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );
      
      setEditingEntry(null);
      setFormOpen(false);
      toast.success('Banking service updated successfully');
    } catch (error) {
      console.error('Error updating banking service:', error);
      toast.error('Failed to update banking service');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banking_services')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setBankingServices(prev => prev.filter(entry => entry.id !== id));
      toast.success('Banking service deleted successfully');
    } catch (error) {
      console.error('Error deleting banking service:', error);
      toast.error('Failed to delete banking service');
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
      name: 'amount', 
      label: 'Amount (₹)', 
      type: 'number' as const,
      min: 0,
      required: true
    },
    {
      name: 'transaction_count',
      label: 'Number of Transactions',
      type: 'number' as const,
      min: 1,
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

  // Calculate summary stats
  const totalAmount = filteredServices.reduce((sum, entry) => sum + entry.amount, 0);
  const totalMargin = filteredServices.reduce((sum, entry) => sum + entry.margin, 0);
  const totalServices = filteredServices.length;
  const totalTransactions = filteredServices.reduce((sum, entry) => sum + (entry.transaction_count || 1), 0);

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
          <div className="flex gap-2">
            <DownloadButton 
              data={bankingServices}
              filename="banking-services"
              currentData={filteredServices}
            />
            <ServiceForm
              title="Add Banking Service"
              fields={formFields}
              initialValues={{
                date: new Date(),
                amount: 0,
                transaction_count: 1,
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
        </div>
      }
    >
      {/* Summary cards showing totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Services"
          value={totalServices}
          icon={<CreditCard className="h-5 w-5" />}
          className="bg-blue-50"
        />
        <StatCard 
          title="Total Transactions"
          value={totalTransactions}
          icon={<CreditCard className="h-5 w-5" />}
          className="bg-green-50"
        />
        <StatCard 
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={<CreditCard className="h-5 w-5" />}
          className="bg-emerald-50"
        />
        <StatCard 
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          icon={<CreditCard className="h-5 w-5" />}
          className="bg-purple-50"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading banking services data...</p>
        </div>
      ) : filteredServices.length === 0 ? (
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
                transactions: entry.transaction_count || 1,
                margin: formatCurrency(entry.margin),
              }}
              labels={{
                amount: 'Amount',
                transactions: 'Transactions',
                margin: 'Margin',
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
          title="Edit Banking Service"
          fields={formFields}
          initialValues={calculateTotals({
            ...editingEntry,
            transaction_count: editingEntry.transaction_count || 1
          })}
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

export default BankingServices;
