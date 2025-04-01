
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceCard from '@/components/ui/ServiceCard';
import ServiceForm from '@/components/ui/ServiceForm';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { formatCurrency } from '@/utils/calculateUtils';
import { supabase } from '@/integrations/supabase/client';

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
  const { data: bankingServices, refetch } = useQuery({
    queryKey: ['bankingServices'],
    queryFn: async () => {
      let query = supabase.from('banking_services').select('*');
      
      if (viewMode === 'day') {
        const dateStr = selectedDate.toISOString().split('T')[0];
        query = query.eq('date', dateStr);
      } else if (viewMode === 'month') {
        const yearMonth = selectedDate.toISOString().split('T')[0].substring(0, 7);
        query = query.ilike('date', `${yearMonth}%`);
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) {
        toast.error('Failed to load banking services');
        throw error;
      }
      
      return data || [];
    },
  });

  // Calculate summary data
  const totalAmount = bankingServices?.reduce((sum, service) => sum + service.amount, 0) || 0;
  const totalTransactions = bankingServices?.reduce((sum, service) => sum + (service.transaction_count || 0), 0) || 0;
  const totalMargin = bankingServices?.reduce((sum, service) => sum + service.margin, 0) || 0;

  // Handle add new service
  const handleAddService = async (formData: any) => {
    try {
      const { error } = await supabase.from('banking_services').insert([
        {
          date: formData.date,
          amount: formData.amount,
          margin: formData.margin,
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
      
      const { error } = await supabase
        .from('banking_services')
        .update({
          date: formData.date,
          amount: formData.amount,
          margin: formData.margin,
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

  // Filter services by date or month
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'day' ? 'month' : 'day');
  };

  // Form fields for banking services
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
      name: 'margin',
      label: 'Margin',
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
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-1" /> Add Service
        </Button>
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

      {/* Date Filter */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleViewMode}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {viewMode === 'day' ? 'View by Day' : 'View by Month'}
          </Button>
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
          margin: '',
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
          margin: currentService.margin,
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
