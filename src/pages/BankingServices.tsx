
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceCard from '@/components/ui/ServiceCard';
import ServiceForm from '@/components/ui/ServiceForm';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { formatCurrency } from '@/utils/calculateUtils';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface BankingService {
  id: string;
  date: string;
  amount: number;
  margin: number;
  transaction_count: number;
}

const BankingServices = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<BankingService | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  // Fetch banking services data
  const { data: bankingServices, refetch, isError } = useQuery({
    queryKey: ['bankingServices', viewMode, selectedDate],
    queryFn: async () => {
      let query = supabase.from('banking_services').select('*');
      
      if (viewMode === 'day') {
        // Filter by exact date
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      } else if (viewMode === 'month') {
        // Filter by month range
        const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching banking services:', error);
        toast.error('Failed to load banking services');
        throw error;
      }
      
      return data || [];
    },
  });

  // Show toast when there's an error
  useEffect(() => {
    if (isError) {
      toast.error('Failed to load banking services');
    }
  }, [isError]);

  // Calculate summary data
  const totalAmount = bankingServices?.reduce((sum, service) => sum + service.amount, 0) || 0;
  const totalTransactions = bankingServices?.reduce((sum, service) => sum + (service.transaction_count || 0), 0) || 0;
  const totalMargin = bankingServices?.reduce((sum, service) => sum + service.margin, 0) || 0;

  // Handle add new service
  const handleAddService = async (formData: any) => {
    try {
      // Calculate margin using the formula: amount * 0.5 / 100
      const calculatedMargin = (formData.amount * 0.5) / 100;
      
      const { error } = await supabase.from('banking_services').insert([
        {
          date: formData.date,
          amount: formData.amount,
          margin: calculatedMargin,
          transaction_count: formData.transaction_count || 0,
        }
      ]);

      if (error) throw error;
      
      toast.success('Banking service added successfully');
      setIsAddModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error adding banking service:', error);
      toast.error('Failed to add banking service');
    }
  };

  // Handle edit service
  const handleEditService = async (formData: any) => {
    try {
      if (!currentService) return;
      
      // Calculate margin using the formula: amount * 0.5 / 100
      const calculatedMargin = (formData.amount * 0.5) / 100;
      
      const { error } = await supabase
        .from('banking_services')
        .update({
          date: formData.date,
          amount: formData.amount,
          margin: calculatedMargin,
          transaction_count: formData.transaction_count || 0,
        })
        .eq('id', currentService.id);

      if (error) throw error;
      
      toast.success('Banking service updated successfully');
      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error updating banking service:', error);
      toast.error('Failed to update banking service');
    }
  };

  // Handle delete service
  const handleDeleteService = async () => {
    try {
      if (!currentService) return;
      
      const { error } = await supabase
        .from('banking_services')
        .delete()
        .eq('id', currentService.id);

      if (error) throw error;
      
      toast.success('Banking service deleted successfully');
      setIsDeleteModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Error deleting banking service:', error);
      toast.error('Failed to delete banking service');
    }
  };

  // Handle date change
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: 'day' | 'month') => {
    setViewMode(mode);
  };

  // Form fields for banking services - removed margin field since it's calculated
  const formFields = [
    {
      name: 'date',
      label: 'Date',
      type: 'date' as const,
      required: true,
    },
    {
      name: 'amount',
      label: 'Amount',
      type: 'number' as const,
      required: true,
    },
    {
      name: 'transaction_count',
      label: 'Number of Transactions',
      type: 'number' as const,
      required: true,
    },
  ];

  return (
    <PageWrapper
      title="Banking Services"
      subtitle="Manage banking transactions"
      action={
        <div className="flex items-center space-x-4">
          <DateRangePicker 
            date={selectedDate}
            onDateChange={handleDateChange}
            mode={viewMode}
            onModeChange={handleViewModeChange}
          />
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-1" /> Add Service
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glassmorphism p-4 rounded-lg">
          <h3 className="text-sm text-muted-foreground">Total Amount</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="glassmorphism p-4 rounded-lg">
          <h3 className="text-sm text-muted-foreground">Total Transactions</h3>
          <p className="text-2xl font-bold">{totalTransactions}</p>
        </div>
        <div className="glassmorphism p-4 rounded-lg">
          <h3 className="text-sm text-muted-foreground">Total Margin</h3>
          <p className="text-2xl font-bold">{formatCurrency(totalMargin)}</p>
        </div>
      </div>

      {/* Services List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bankingServices?.map((service) => (
          <ServiceCard
            key={service.id}
            id={service.id}
            title={`Banking Service`}
            date={new Date(service.date)}
            data={{
              amount: formatCurrency(service.amount),
              margin: formatCurrency(service.margin),
              transactions: service.transaction_count || 0,
            }}
            labels={{
              amount: 'Amount',
              margin: 'Margin',
              transactions: 'Transactions',
            }}
            onEdit={() => {
              setCurrentService(service);
              setIsEditModalOpen(true);
            }}
            onDelete={() => {
              setCurrentService(service);
              setIsDeleteModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* Add Service Modal */}
      <ServiceForm
        title="Add Banking Service"
        fields={formFields}
        initialValues={{
          date: new Date().toISOString().split('T')[0],
          amount: '',
          transaction_count: 1,
        }}
        onSubmit={handleAddService}
        trigger={<></>}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />

      {/* Edit Service Modal */}
      <ServiceForm
        title="Edit Banking Service"
        fields={formFields}
        initialValues={currentService ? {
          date: currentService.date,
          amount: currentService.amount,
          transaction_count: currentService.transaction_count || 0,
        } : {}}
        onSubmit={handleEditService}
        trigger={<></>}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteService}
        title="Delete Banking Service"
        description="Are you sure you want to delete this banking service? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default BankingServices;
