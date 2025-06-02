
import { useState, useEffect } from 'react';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { v4 } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, filterByDate, filterByMonth } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';

interface PhotostatEntry {
  id: string;
  date: Date;
  pages_count: number;
  amount_per_page: number;
  total_amount: number;
  margin: number;
}

const Photostat = () => {
  const [photostats, setPhotostats] = useState<PhotostatEntry[]>([]);
  const [filteredPhotostats, setFilteredPhotostats] = useState<PhotostatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<PhotostatEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  const fetchPhotostats = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('photostats')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        pages_count: entry.pages_count,
        amount_per_page: Number(entry.amount_per_page),
        total_amount: Number(entry.total_amount),
        margin: Number(entry.margin)
      }));

      setPhotostats(formattedData);
    } catch (error) {
      console.error('Error fetching photostats:', error);
      toast.error('Failed to load photostat entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotostats();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredPhotostats(filterByDate(photostats, date));
    } else {
      setFilteredPhotostats(filterByMonth(photostats, date));
    }
  }, [date, viewMode, photostats]);

  const handleAddPhotostat = async (values: Record<string, any>) => {
    try {
      const totalAmount = values.pages_count * values.amount_per_page;
      
      const { data, error } = await supabase
        .from('photostats')
        .insert({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          pages_count: values.pages_count,
          amount_per_page: values.amount_per_page,
          total_amount: totalAmount,
          margin: totalAmount // 100% margin as specified
        })
        .select();

      if (error) throw error;

      const newEntry: PhotostatEntry = {
        id: data[0].id,
        date: new Date(data[0].date),
        pages_count: data[0].pages_count,
        amount_per_page: Number(data[0].amount_per_page),
        total_amount: Number(data[0].total_amount),
        margin: Number(data[0].margin)
      };

      setPhotostats(prev => [newEntry, ...prev]);
      toast.success('Photostat entry added successfully');
      setFormOpen(false);
    } catch (error) {
      console.error('Error adding photostat:', error);
      toast.error('Failed to add photostat entry');
    }
  };

  const handleEditPhotostat = async (values: Record<string, any>) => {
    if (!editingEntry) return;

    try {
      const totalAmount = values.pages_count * values.amount_per_page;
      
      const { error } = await supabase
        .from('photostats')
        .update({
          date: values.date ? new Date(values.date).toISOString() : editingEntry.date.toISOString(),
          pages_count: values.pages_count,
          amount_per_page: values.amount_per_page,
          total_amount: totalAmount,
          margin: totalAmount // 100% margin as specified
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      setPhotostats(prev => 
        prev.map(item => 
          item.id === editingEntry.id
            ? {
                ...item,
                date: values.date ? new Date(values.date) : item.date,
                pages_count: values.pages_count,
                amount_per_page: values.amount_per_page,
                total_amount: totalAmount,
                margin: totalAmount
              }
            : item
        )
      );

      toast.success('Photostat entry updated successfully');
      setEditingEntry(null);
    } catch (error) {
      console.error('Error updating photostat:', error);
      toast.error('Failed to update photostat entry');
    }
  };

  const handleDeletePhotostat = async (id: string) => {
    try {
      const { error } = await supabase
        .from('photostats')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPhotostats(prev => prev.filter(item => item.id !== id));
      toast.success('Photostat entry deleted successfully');
    } catch (error) {
      console.error('Error deleting photostat:', error);
      toast.error('Failed to delete photostat entry');
    }
  };

  const openEditForm = (entry: PhotostatEntry) => {
    setEditingEntry(entry);
  };

  const photostatFormFields = [
    {
      name: 'date',
      label: 'Date',
      type: 'date' as const,
      required: true
    },
    {
      name: 'pages_count',
      label: 'Number of Pages',
      type: 'number' as const,
      required: true,
      min: 1
    },
    {
      name: 'amount_per_page',
      label: 'Amount per Page',
      type: 'number' as const,
      required: true,
      min: 0
    }
  ];

  const totalPages = filteredPhotostats.reduce((sum, entry) => sum + entry.pages_count, 0);
  const totalAmount = filteredPhotostats.reduce((sum, entry) => sum + entry.total_amount, 0);

  return (
    <PageWrapper
      title="Photostat Services"
      subtitle="Manage photostat services and view analytics"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <div className="flex gap-2">
            <ServiceForm
              title="Add Photostat Entry"
              fields={photostatFormFields}
              initialValues={{
                date: new Date(),
                pages_count: 1,
                amount_per_page: 0
              }}
              onSubmit={handleAddPhotostat}
              trigger={
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  <span>Add Entry</span>
                </Button>
              }
              open={formOpen}
              onOpenChange={setFormOpen}
            />
            <DownloadButton
              data={photostats}
              filename="photostat-data"
              currentData={filteredPhotostats}
            />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatCard 
          title="Total Pages"
          value={totalPages.toString()}
          icon={<FileText size={20} />}
        />
        <StatCard 
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={<FileText size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPhotostats.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No photostat entries found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredPhotostats.map(entry => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Photostat Entry"
              date={entry.date}
              data={{
                'Pages': entry.pages_count,
                'Amount per Page': formatCurrency(entry.amount_per_page),
                'Total Amount': formatCurrency(entry.total_amount)
              }}
              labels={{
                'Pages': 'Pages',
                'Amount per Page': 'Amount per Page',
                'Total Amount': 'Total Amount'
              }}
              onEdit={() => openEditForm(entry)}
              onDelete={() => handleDeletePhotostat(entry.id)}
            />
          ))
        )}
      </div>

      {editingEntry && (
        <ServiceForm
          title="Edit Photostat Entry"
          fields={photostatFormFields}
          initialValues={{
            date: editingEntry.date,
            pages_count: editingEntry.pages_count,
            amount_per_page: editingEntry.amount_per_page
          }}
          onSubmit={handleEditPhotostat}
          trigger={<></>}
          isEdit
          open={!!editingEntry}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
        />
      )}
    </PageWrapper>
  );
};

export default Photostat;
