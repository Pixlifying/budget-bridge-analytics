import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Button } from '@/components/ui/button';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';
import { Input } from "@/components/ui/input"

interface PendingBalanceEntry {
  id: string;
  date: Date;
  name: string;
  address: string;
  phone: string;
  service: string;
  amount: number;
}

const PendingBalance = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [pendingBalances, setPendingBalances] = useState<PendingBalanceEntry[]>([]);
  const [filteredBalances, setFilteredBalances] = useState<PendingBalanceEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PendingBalanceEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
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

  const handleAddEntry = async (values: Partial<PendingBalanceEntry>) => {
    try {
      const amount = Number(values.amount);
      
      const { data, error } = await supabase
        .from('pending_balances')
        .insert({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          name: values.name,
          address: values.address,
          phone: values.phone,
          service: values.service,
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
          amount: Number(data[0].amount)
        };
        
        setPendingBalances(prev => [newEntry, ...prev]);
        toast.success('Pending balance added successfully');
      }
    } catch (error) {
      console.error('Error adding pending balance:', error);
      toast.error('Failed to add pending balance');
    }
  };

  const handleEditEntry = async (values: Partial<PendingBalanceEntry>) => {
    if (!editingEntry) return;
    
    try {
      const amount = Number(values.amount);
      
      const { error } = await supabase
        .from('pending_balances')
        .update({
          date: values.date ? new Date(values.date).toISOString() : editingEntry.date.toISOString(),
          name: values.name || editingEntry.name,
          address: values.address || editingEntry.address,
          phone: values.phone || editingEntry.phone,
          service: values.service || editingEntry.service,
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
        service: values.service || editingEntry.service,
        amount
      };
      
      setPendingBalances(prev => 
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );
      
      setEditingEntry(null);
      setFormOpen(false);
      toast.success('Pending balance updated successfully');
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

  const formFields = [
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
      label: 'Phone', 
      type: 'text' as const,
      required: true
    },
    { 
      name: 'service', 
      label: 'Service', 
      type: 'text' as const,
      required: true
    },
    { 
      name: 'amount', 
      label: 'Amount (₹)', 
      type: 'text' as const,
      inputType: 'number',
      min: 0,
      required: true
    },
  ];

  const totalAmount = filteredBalances.reduce((sum, entry) => sum + entry.amount, 0);
  const totalBalances = filteredBalances.length;

  return (
    <PageWrapper
      title="Pending Balances"
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
              fields={formFields}
              initialValues={{
                date: new Date(),
                name: '',
                address: '',
                phone: '',
                service: '',
                amount: 0,
              }}
              onSubmit={handleAddEntry}
              trigger={
                <Button className="flex items-center gap-1">
                  <span>Add Balance</span>
                </Button>
              }
            />
          </div>
        </div>
      }
    >
      {/* Summary cards showing totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ServiceCard 
          id="summary-balances"
          title="Total Balances"
          date={date}
          data={{ 
            value: totalBalances,
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
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading pending balances data...</p>
        </div>
      ) : filteredBalances.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
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
                address: entry.address,
                phone: entry.phone,
                service: entry.service,
                amount: formatCurrency(entry.amount),
              }}
              labels={{
                address: 'Address',
                phone: 'Phone',
                service: 'Service',
                amount: 'Amount',
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
          title="Edit Pending Balance"
          fields={formFields}
          initialValues={editingEntry}
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
