
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { supabase } from '@/integrations/supabase/client';

interface QueryEntry {
  id: string;
  customer_name: string;
  date: string;
  mobile_no: string;
  description: string;
  address: string;
  adhar_no?: string;
}

const Query = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<QueryEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  // Fetch queries data
  const { data: queries, refetch, isError } = useQuery({
    queryKey: ['queries', viewMode, selectedDate],
    queryFn: async () => {
      let query = supabase.from('queries').select('*');
      
      if (viewMode === 'day') {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching queries:', error);
        toast.error('Failed to load queries');
        throw error;
      }
      
      return (data || []) as QueryEntry[];
    },
  });

  // Form fields for queries
  const formFields = [
    {
      name: 'date',
      label: 'Date',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'customer_name',
      label: 'Customer Name',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'mobile_no',
      label: 'Mobile Number',
      type: 'text' as const,
      required: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea' as const,
      required: true,
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea' as const,
      required: true,
    },
    {
      name: 'adhar_no',
      label: 'Aadhar Number (Optional)',
      type: 'text' as const,
      required: false,
    },
  ];

  // Handle add new query
  const handleAddQuery = async (formData: any) => {
    try {
      const { error } = await supabase.from('queries').insert([formData]);

      if (error) throw error;
      
      toast.success('Query added successfully');
      setIsAddModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error adding query:', error);
      toast.error('Failed to add query');
    }
  };

  // Handle delete query
  const handleDeleteQuery = async () => {
    try {
      if (!currentQuery) return;
      
      const { error } = await supabase
        .from('queries')
        .delete()
        .eq('id', currentQuery.id);

      if (error) throw error;
      
      toast.success('Query deleted successfully');
      setIsDeleteModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error deleting query:', error);
      toast.error('Failed to delete query');
    }
  };

  return (
    <PageWrapper
      title="Queries"
      subtitle="Manage customer queries"
      action={
        <div className="flex items-center space-x-4">
          <DateRangePicker
            date={selectedDate}
            onDateChange={setSelectedDate}
            mode={viewMode}
            onModeChange={setViewMode}
          />
          <DownloadButton
            data={queries || []}
            filename="queries"
            currentData={queries || []}
            label="Download CSV"
          />
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2" /> Add Query
          </Button>
        </div>
      }
    >
      {/* Queries List */}
      <div className="space-y-4">
        {queries?.map((query) => (
          <div
            key={query.id}
            className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-medium">{query.customer_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(query.date).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setCurrentQuery(query);
                  setIsDeleteModalOpen(true);
                }}
              >
                Delete
              </Button>
            </div>
            <div className="mt-4 grid gap-4 text-sm">
              <div>
                <span className="font-medium">Mobile:</span> {query.mobile_no}
              </div>
              <div>
                <span className="font-medium">Description:</span>
                <p className="mt-1 text-muted-foreground">{query.description}</p>
              </div>
              <div>
                <span className="font-medium">Address:</span>
                <p className="mt-1 text-muted-foreground">{query.address}</p>
              </div>
              {query.adhar_no && (
                <div>
                  <span className="font-medium">Aadhar:</span> {query.adhar_no}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Query Modal */}
      <ServiceForm
        title="Add Query"
        fields={formFields}
        initialValues={{
          date: new Date().toISOString().split('T')[0],
          customer_name: '',
          mobile_no: '',
          description: '',
          address: '',
          adhar_no: '',
        }}
        onSubmit={handleAddQuery}
        trigger={<></>}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteQuery}
        title="Delete Query"
        description="Are you sure you want to delete this query? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default Query;
