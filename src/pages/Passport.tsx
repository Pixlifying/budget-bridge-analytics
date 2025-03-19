import { useState, useEffect } from 'react';
import { Receipt, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
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
  const [passports, setPassports] = useState<PassportEntry[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PassportEntry | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchPassports = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('passports')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        count: entry.count,
        amount: Number(entry.amount),
        total: Number(entry.total),
        margin: Number(entry.margin)
      }));
      
      setPassports(formattedData);
    } catch (error) {
      console.error('Error fetching passports:', error);
      toast.error('Failed to load passport data');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPassports();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredPassports(filterByDate(passports, date));
    } else {
      setFilteredPassports(filterByMonth(passports, date));
    }
  }, [date, viewMode, passports]);

  const handleAddEntry = async (values: Partial<PassportEntry>) => {
    try {
      const count = Number(values.count);
      const amount = Number(values.amount);
      const total = calculatePassportTotal(count, amount);
      const margin = calculatePassportMargin(count);
      
      const { data, error } = await supabase
        .from('passports')
        .insert({
          date: values.date ? new Date(values.date) : new Date().toISOString(),
          count,
          amount,
          total,
          margin
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newEntry: PassportEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          count: data[0].count,
          amount: Number(data[0].amount),
          total: Number(data[0].total),
          margin: Number(data[0].margin)
        };
        
        setPassports(prev => [newEntry, ...prev]);
        toast.success('Passport entry added successfully');
      }
    } catch (error) {
      console.error('Error adding passport entry:', error);
      toast.error('Failed to add passport entry');
    }
  };

  const handleEditEntry = async (values: Partial<PassportEntry>) => {
    if (!editingEntry) return;
    
    try {
      const count = Number(values.count);
      const amount = Number(values.amount);
      const total = calculatePassportTotal(count, amount);
      const margin = calculatePassportMargin(count);
      
      const { error } = await supabase
        .from('passports')
        .update({
          date: values.date ? new Date(values.date) : editingEntry.date.toISOString(),
          count,
          amount,
          total,
          margin
        })
        .eq('id', editingEntry.id);
      
      if (error) {
        throw error;
      }
      
      const updatedEntry: PassportEntry = {
        ...editingEntry,
        date: values.date ? new Date(values.date) : editingEntry.date.toISOString(),
        count,
        amount,
        total,
        margin
      };
      
      setPassports(prev => 
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );
      
      setEditingEntry(null);
      setIsEditFormOpen(false);
      toast.success('Passport entry updated successfully');
    } catch (error) {
      console.error('Error updating passport entry:', error);
      toast.error('Failed to update passport entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('passports')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setPassports(prev => prev.filter(entry => entry.id !== id));
      toast.success('Passport entry deleted successfully');
    } catch (error) {
      console.error('Error deleting passport entry:', error);
      toast.error('Failed to delete passport entry');
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
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading passport data...</p>
        </div>
      ) : filteredPassports.length === 0 ? (
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
                setIsEditFormOpen(true);
              }}
              onDelete={() => handleDeleteEntry(entry.id)}
              showActions={true}
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
          isEdit={true}
          open={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
        />
      )}
    </PageWrapper>
  );
};

export default Passport;
