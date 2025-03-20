
import { useState, useEffect } from 'react';
import { FilePen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import StatCard from '@/components/ui/StatCard';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import DownloadButton from '@/components/ui/DownloadButton';
import { filterByDate, filterByMonth, formatCurrency } from '@/utils/calculateUtils';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';

interface ApplicationEntry {
  id: string;
  date: Date;
  customer_name: string;
  pages_count: number;
  amount: number;
  created_at?: string;
}

const Applications = () => {
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationEntry[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ApplicationEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        customer_name: entry.customer_name,
        pages_count: entry.pages_count,
        amount: Number(entry.amount),
        created_at: entry.created_at
      }));

      setApplications(formattedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch applications",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredApplications(filterByDate(applications, date));
    } else {
      setFilteredApplications(filterByMonth(applications, date));
    }
  }, [applications, date, viewMode]);

  const handleAddApplication = async (values: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          customer_name: values.customer_name,
          pages_count: values.pages_count,
          amount: values.amount,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newEntry: ApplicationEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          customer_name: data[0].customer_name,
          pages_count: data[0].pages_count,
          amount: Number(data[0].amount),
          created_at: data[0].created_at
        };

        setApplications(prev => [newEntry, ...prev]);
        toast({
          title: "Success",
          description: "Application added successfully",
        });
      }
    } catch (error) {
      console.error('Error adding application:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add application",
      });
    }
  };

  const handleEditApplication = async (values: Record<string, any>) => {
    if (!editingEntry) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          date: values.date ? new Date(values.date).toISOString() : editingEntry.date.toISOString(),
          customer_name: values.customer_name,
          pages_count: values.pages_count,
          amount: values.amount,
        })
        .eq('id', editingEntry.id)
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const updatedEntry: ApplicationEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          customer_name: data[0].customer_name,
          pages_count: data[0].pages_count,
          amount: Number(data[0].amount),
          created_at: data[0].created_at
        };

        setApplications(prev => prev.map(item => 
          item.id === updatedEntry.id ? updatedEntry : item
        ));

        toast({
          title: "Success",
          description: "Application updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update application",
      });
    } finally {
      setEditingEntry(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', entryToDelete);

      if (error) throw error;

      setApplications(prev => prev.filter(item => item.id !== entryToDelete));
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete application",
      });
    } finally {
      setEntryToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  const handleDelete = (id: string) => {
    setEntryToDelete(id);
    setShowDeleteConfirm(true);
  };

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
      name: 'pages_count',
      label: 'Number of Pages',
      type: 'number' as const,
      required: true,
      min: 1,
    },
    {
      name: 'amount',
      label: 'Amount (₹)',
      type: 'number' as const,
      required: true,
      min: 0,
    },
  ];

  const totalPages = filteredApplications.reduce((sum, item) => sum + item.pages_count, 0);
  const totalAmount = filteredApplications.reduce((sum, item) => sum + item.amount, 0);

  const cardLabels = {
    customer_name: 'Customer Name',
    pages_count: 'Pages',
    amount: 'Amount',
  };

  return (
    <PageWrapper
      title="Applications"
      subtitle={`Manage application records for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <div className="flex gap-2">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <DownloadButton 
            data={applications} 
            currentData={filteredApplications} 
            filename="applications" 
          />
        </div>
      }
    >
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard 
          title="Total Applications"
          value={filteredApplications.length.toString()}
          icon={<FilePen size={20} />}
        />
        <StatCard 
          title="Total Pages"
          value={totalPages.toString()}
          icon={<FilePen size={20} />}
        />
        <StatCard 
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          className="bg-primary/10"
        />
      </div>

      {/* Add Application Button */}
      <div className="mb-6">
        <ServiceForm
          title="Add Application"
          fields={formFields}
          initialValues={{
            date: new Date(),
            customer_name: '',
            pages_count: 1,
            amount: 0,
          }}
          onSubmit={handleAddApplication}
          trigger={
            <Button className="w-full">
              + Add New Application
            </Button>
          }
          open={showAddForm}
          onOpenChange={setShowAddForm}
        />
      </div>

      {/* Application cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApplications.map((application) => (
          <ServiceCard
            key={application.id}
            id={application.id}
            title={application.customer_name}
            date={application.date}
            data={{
              customer_name: application.customer_name,
              pages_count: application.pages_count,
              amount: formatCurrency(application.amount),
            }}
            labels={cardLabels}
            onEdit={() => setEditingEntry(application)}
            onDelete={() => handleDelete(application.id)}
          />
        ))}
      </div>

      {/* No applications message */}
      {filteredApplications.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No applications found for this period</p>
        </div>
      )}

      {/* Edit Form */}
      {editingEntry && (
        <ServiceForm
          title="Edit Application"
          fields={formFields}
          initialValues={{
            date: editingEntry.date,
            customer_name: editingEntry.customer_name,
            pages_count: editingEntry.pages_count,
            amount: editingEntry.amount,
          }}
          onSubmit={handleEditApplication}
          trigger={<div />}
          isEdit
          open={!!editingEntry}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        description="Are you sure you want to delete this application? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default Applications;
