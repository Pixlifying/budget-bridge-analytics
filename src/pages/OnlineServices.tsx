import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/calculateUtils';

interface OnlineServiceEntry {
  id: string;
  date: Date;
  service: string;
  amount: number;
  count: number;
  total: number;
}

const OnlineServices = () => {
  const [onlineServices, setOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OnlineServiceEntry | null>(null);

  const fetchOnlineServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('online_services')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        service: entry.service,
        amount: Number(entry.amount),
        count: Number(entry.count),
        total: Number(entry.total),
      }));

      setOnlineServices(formattedData);
    } catch (error) {
      console.error('Error fetching online services:', error);
      toast.error('Failed to load online services data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineServices();
  }, []);

  const handleAddEntry = async (values: Partial<OnlineServiceEntry>) => {
    try {
      const { data, error } = await supabase
        .from('online_services')
        .insert({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          service: values.service,
          amount: values.amount,
          count: values.count,
          total: values.amount * values.count,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newEntry: OnlineServiceEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          service: data[0].service,
          amount: Number(data[0].amount),
          count: Number(data[0].count),
          total: Number(data[0].total),
        };

        setOnlineServices(prev => [newEntry, ...prev]);
        toast.success('Online service added successfully');
      }
    } catch (error) {
      console.error('Error adding online service:', error);
      toast.error('Failed to add online service');
    }
  };

  const handleEditEntry = async (values: Partial<OnlineServiceEntry>) => {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('online_services')
        .update({
          date: values.date ? new Date(values.date).toISOString() : editingEntry.date.toISOString(),
          service: values.service,
          amount: values.amount,
          count: values.count,
          total: values.amount * values.count,
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      const updatedEntry: OnlineServiceEntry = {
        ...editingEntry,
        date: values.date || editingEntry.date,
        service: values.service,
        amount: values.amount,
        count: values.count,
        total: values.amount * values.count,
      };

      setOnlineServices(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      setFormOpen(false);
      toast.success('Online service updated successfully');
    } catch (error) {
      console.error('Error updating online service:', error);
      toast.error('Failed to update online service');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('online_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOnlineServices(prev => prev.filter(entry => entry.id !== id));
      toast.success('Online service deleted successfully');
    } catch (error) {
      console.error('Error deleting online service:', error);
      toast.error('Failed to delete online service');
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
      name: 'service', 
      label: 'Service Type', 
      type: 'select' as const,
      options: [
        { label: 'Income Certificate', value: 'Income Certificate' },
        { label: 'Birth Certificate', value: 'Birth Certificate' },
        { label: 'Ladli Beti', value: 'Ladli Beti' },
        { label: 'Insurance Car/Bike', value: 'Insurance Car/Bike' },
        { label: 'Marriage Certificate', value: 'Marriage Certificate' },
        { label: 'Railway Tickets', value: 'Railway Tickets' },
        { label: 'Pension Form', value: 'Pension Form' },
        { label: 'Social Security Schemes', value: 'Social Security Schemes' },
        { label: 'Marriage Assistance Form', value: 'Marriage Assistance Form' },
        { label: 'Other', value: 'Other' }
      ],
      required: true
    },
    { 
      name: 'custom_service', 
      label: 'Custom Service Name', 
      type: 'text' as const,
      conditional: (values: Record<string, any>) => values.service === 'Other',
    },
    { 
      name: 'amount', 
      label: 'Amount per Service (₹)', 
      type: 'number' as const,
      min: 0,
      required: true
    },
    { 
      name: 'count', 
      label: 'Number of Services', 
      type: 'number' as const,
      min: 1,
      required: true
    },
    { 
      name: 'total', 
      label: 'Total Amount (₹)', 
      type: 'number' as const,
      readOnly: true
    },
  ];

  return (
    <PageWrapper
      title="Online Services"
      subtitle="Manage your online services"
      action={
        <div className="flex gap-2">
          <ServiceForm
            title="Add Online Service"
            fields={formFields}
            initialValues={{
              date: new Date(),
              service: '',
              amount: 0,
              count: 1,
              total: 0,
            }}
            onSubmit={handleAddEntry}
            trigger={
              <Button className="flex items-center gap-1">
                <span>Add Service</span>
              </Button>
            }
          />
        </div>
      }
    >
      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading online services data...</p>
        </div>
      ) : onlineServices.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mt-4 text-lg font-medium">No Online Services</h3>
          <p className="mt-2 text-sm">
            Add a new online service to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {onlineServices.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.service}
              date={entry.date}
              data={{
                amount: formatCurrency(entry.amount),
                total: formatCurrency(entry.total),
              }}
              labels={{
                amount: 'Amount',
                total: 'Total',
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
          title="Edit Online Service"
          fields={formFields}
          initialValues={{
            date: editingEntry.date,
            service: editingEntry.service,
            amount: editingEntry.amount,
            count: editingEntry.count,
            total: editingEntry.total,
          }}
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

export default OnlineServices;
