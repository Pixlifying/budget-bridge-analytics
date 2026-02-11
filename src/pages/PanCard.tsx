
import { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from '@/lib/utils';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculatePanCardTotal, 
  calculatePanCardMargin,
  filterByDate, 
  filterByMonth,
  filterByQuarter,
  formatCurrency
} from '@/utils/calculateUtils';

interface PanCardEntry {
  id: string;
  date: Date;
  count: number;
  amount: number;
  total: number;
  margin: number;
}

const PanCard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'quarter'>('day');
  const [panCards, setPanCards] = useState<PanCardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredPanCards, setFilteredPanCards] = useState<PanCardEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<PanCardEntry | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  
  // Fetch data from Supabase
  const fetchPanCards = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pan_cards')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Transform the data to match our interface
      const transformedData = data.map(item => ({
        id: item.id,
        date: new Date(item.date),
        count: item.count,
        amount: Number(item.amount),
        total: Number(item.total),
        margin: Number(item.margin)
      }));
      
      setPanCards(transformedData);
    } catch (error) {
      console.error('Error fetching pan cards:', error);
      toast.error('Failed to load pan card data');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPanCards();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredPanCards(filterByDate(panCards, date));
    } else if (viewMode === 'month') {
      setFilteredPanCards(filterByMonth(panCards, date));
    } else {
      setFilteredPanCards(filterByQuarter(panCards, date));
    }
  }, [date, viewMode, panCards]);

  const handleAddEntry = async (values: Partial<PanCardEntry>) => {
    const count = Number(values.count);
    const amount = Number(values.amount);
    const total = calculatePanCardTotal(count, amount);
    const margin = calculatePanCardMargin(count);
    const entryDate = values.date || new Date();

    try {
      const { data, error } = await supabase
        .from('pan_cards')
        .insert([{
          date: entryDate.toISOString(),
          count,
          amount,
          total,
          margin
        }])
        .select();
      
      if (error) throw error;
      
      // Add the new entry to the local state with the returned ID
      if (data && data.length > 0) {
        const newEntry: PanCardEntry = {
          id: data[0].id,
          date: entryDate,
          count,
          amount,
          total,
          margin,
        };
        
        setPanCards(prev => [newEntry, ...prev]);
        toast.success('Pan Card entry added successfully');
      }
    } catch (error) {
      console.error('Error adding pan card entry:', error);
      toast.error('Failed to add pan card entry');
    }
  };

  const handleEditEntry = async (values: Partial<PanCardEntry>) => {
    if (!editingEntry) return;
    
    const count = Number(values.count);
    const amount = Number(values.amount);
    const total = calculatePanCardTotal(count, amount);
    const margin = calculatePanCardMargin(count);
    const entryDate = values.date || editingEntry.date;

    try {
      const { error } = await supabase
        .from('pan_cards')
        .update({
          date: entryDate.toISOString(),
          count,
          amount,
          total,
          margin
        })
        .eq('id', editingEntry.id);
      
      if (error) throw error;
      
      // Update the local state
      const updatedPanCards = panCards.map(entry => 
        entry.id === editingEntry.id 
          ? { 
              ...entry, 
              date: entryDate,
              count,
              amount,
              total,
              margin,
            } 
          : entry
      );

      setPanCards(updatedPanCards);
      setEditingEntry(null);
      setIsEditFormOpen(false);
      toast.success('Pan Card entry updated successfully');
    } catch (error) {
      console.error('Error updating pan card entry:', error);
      toast.error('Failed to update pan card entry');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('pan_cards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setPanCards(panCards.filter(entry => entry.id !== id));
      toast.success('Pan Card entry deleted successfully');
    } catch (error) {
      console.error('Error deleting pan card entry:', error);
      toast.error('Failed to delete pan card entry');
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
      label: 'Number of Pan Cards', 
      type: 'number' as const,
      min: 1,
      required: true
    },
    { 
      name: 'amount', 
      label: 'Amount per Pan Card (₹)', 
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
      total: calculatePanCardTotal(count, amount),
      margin: calculatePanCardMargin(count)
    };
  };

  const totalCards = filteredPanCards.reduce((sum, entry) => sum + entry.count, 0);
  const totalAmount = filteredPanCards.reduce((sum, entry) => sum + entry.total, 0);
  const totalMargin = filteredPanCards.reduce((sum, entry) => sum + entry.margin, 0);

  return (
    <PageWrapper
      title="Pan Card Services"
      subtitle={`Manage your Pan Card services for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <ServiceForm
            title="Add Pan Card Entry"
            fields={formFields}
            initialValues={{
              date: new Date(),
              count: 1,
              amount: 0,
              total: 0,
              margin: 150,
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
          id="summary-cards"
          title="Total Pan Cards"
          date={date}
          data={{ 
            value: totalCards,
          }}
          labels={{ 
            value: "Count",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          showActions={false}
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
          showActions={false}
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
          showActions={false}
          className="bg-purple-50"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <p className="text-muted-foreground">Loading pan card entries...</p>
        </div>
      ) : filteredPanCards.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Pan Card entries</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a new entry to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPanCards.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Pan Card Entry"
              date={entry.date}
              data={{
                count: entry.count,
                amount: formatCurrency(entry.amount),
                total: formatCurrency(entry.total),
                margin: formatCurrency(entry.margin),
              }}
              labels={{
                count: 'Number of Pan Cards',
                amount: 'Amount per Card',
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
          title="Edit Pan Card Entry"
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

export default PanCard;
