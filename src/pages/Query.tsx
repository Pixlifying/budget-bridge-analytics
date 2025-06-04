
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { Plus, Edit, Check, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { supabase } from '@/integrations/supabase/client';
import { exportToPDF } from '@/utils/calculateUtils';

interface QueryEntry {
  id: string;
  customer_name: string;
  date: string;
  mobile_no: string;
  description: string;
  address: string;
  adhar_no?: string;
  completed: boolean;
}

const Query = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<QueryEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [filterCompleted, setFilterCompleted] = useState<boolean | null>(null);

  // Fetch queries data
  const { data: queries, refetch, isError } = useQuery({
    queryKey: ['queries', viewMode, selectedDate, filterCompleted],
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
      
      if (filterCompleted !== null) {
        query = query.eq('completed', filterCompleted);
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
    {
      name: 'completed',
      label: 'Completed',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ],
      required: true,
    }
  ];

  // Handle add new query
  const handleAddQuery = async (formData: any) => {
    try {
      const { error } = await supabase.from('queries').insert([{
        ...formData,
        completed: formData.completed === 'true'
      }]);

      if (error) throw error;
      
      toast.success('Query added successfully');
      setIsAddModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error adding query:', error);
      toast.error('Failed to add query');
    }
  };

  // Handle edit query
  const handleEditQuery = async (formData: any) => {
    try {
      if (!currentQuery) return;
      
      const { error } = await supabase
        .from('queries')
        .update({
          ...formData,
          completed: formData.completed === 'true'
        })
        .eq('id', currentQuery.id);

      if (error) throw error;
      
      toast.success('Query updated successfully');
      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error updating query:', error);
      toast.error('Failed to update query');
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

  // Handle mark as complete
  const handleMarkAsComplete = async (query: QueryEntry) => {
    try {
      const { error } = await supabase
        .from('queries')
        .update({ completed: true })
        .eq('id', query.id);

      if (error) throw error;
      
      toast.success('Query marked as completed');
      refetch();
    } catch (error) {
      console.error('Error marking query as complete:', error);
      toast.error('Failed to mark query as complete');
    }
  };

  // Download as PDF
  const handleDownloadPDF = () => {
    if (queries) {
      exportToPDF(queries, 'queries');
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
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setFilterCompleted(null)}
              className={filterCompleted === null ? 'bg-primary text-primary-foreground' : ''}
            >
              All
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFilterCompleted(true)}
              className={filterCompleted === true ? 'bg-primary text-primary-foreground' : ''}
            >
              Completed
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFilterCompleted(false)}
              className={filterCompleted === false ? 'bg-primary text-primary-foreground' : ''}
            >
              Pending
            </Button>
          </div>
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <FileText size={16} /> Download PDF
          </Button>
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
                  {query.completed && <span className="ml-2 text-green-600">(Completed)</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentQuery(query);
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit size={14} className="mr-1" />
                  Edit
                </Button>
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
                {!query.completed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsComplete(query)}
                  >
                    <Check size={14} className="mr-1" />
                    Mark Complete
                  </Button>
                )}
              </div>
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
          completed: 'false'
        }}
        onSubmit={handleAddQuery}
        trigger={<></>}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* Edit Query Modal */}
      <ServiceForm
        title="Edit Query"
        fields={formFields}
        initialValues={currentQuery ? {
          ...currentQuery,
          date: new Date(currentQuery.date).toISOString().split('T')[0],
          completed: currentQuery.completed.toString()
        } : {}}
        onSubmit={handleEditQuery}
        trigger={<></>}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        isEdit={true}
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
