
import { useState, useEffect } from 'react';
import { Globe, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Button } from '@/components/ui/button';
import { formatCurrency, filterByDate, filterByMonth } from '@/utils/calculateUtils';

interface OnlineServiceEntry {
  id: string;
  date: Date;
  service: string;
  custom_service?: string;
  customer_name?: string; // Make this optional since it doesn't exist in the database yet
  amount: number;
  count: number;
  total: number;
  created_at?: string;
}

const OnlineServices = () => {
  const [onlineServices, setOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredServices, setFilteredServices] = useState<OnlineServiceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<OnlineServiceEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterMode, setFilterMode] = useState<'day' | 'month'>('day');

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
        custom_service: entry.custom_service,
        // The database doesn't have customer_name yet, so we'll default to an empty string
        amount: Number(entry.amount),
        count: Number(entry.count),
        total: Number(entry.total),
        created_at: entry.created_at
      }));

      setOnlineServices(formattedData);
      applyDateFilter(formattedData, selectedDate, filterMode);
    } catch (error) {
      console.error('Error fetching online services:', error);
      toast.error('Failed to load online services data');
    } finally {
      setIsLoading(false);
    }
  };

  const applyDateFilter = (data: OnlineServiceEntry[], date: Date, mode: 'day' | 'month') => {
    if (mode === 'day') {
      setFilteredServices(filterByDate(data, date));
    } else {
      setFilteredServices(filterByMonth(data, date));
    }
  };

  useEffect(() => {
    fetchOnlineServices();
  }, []);

  useEffect(() => {
    applyDateFilter(onlineServices, selectedDate, filterMode);
  }, [selectedDate, filterMode, onlineServices]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleModeChange = (mode: 'day' | 'month') => {
    setFilterMode(mode);
  };

  const handleAddEntry = async (values: Partial<OnlineServiceEntry>) => {
    try {
      const finalServiceName = values.service === 'Other' && values.custom_service 
        ? values.custom_service 
        : values.service;
        
      // Add console.log to debug
      console.log('Adding online service:', values);
      
      const { data, error } = await supabase
        .from('online_services')
        .insert({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          service: values.service,
          custom_service: values.service === 'Other' ? values.custom_service : null,
          // Temporarily remove customer_name from the insert since it doesn't exist in the table yet
          amount: values.amount,
          count: values.count,
          total: values.amount * values.count,
        })
        .select();

      if (error) {
        console.error('Error adding online service:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const newEntry: OnlineServiceEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          service: data[0].service,
          custom_service: data[0].custom_service,
          // Store customer_name in the local state even though it's not in the database yet
          customer_name: values.customer_name || '',
          amount: Number(data[0].amount),
          count: Number(data[0].count),
          total: Number(data[0].total),
          created_at: data[0].created_at
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
      const finalServiceName = values.service === 'Other' && values.custom_service 
        ? values.custom_service 
        : values.service;
        
      const { error } = await supabase
        .from('online_services')
        .update({
          date: values.date ? new Date(values.date).toISOString() : editingEntry.date.toISOString(),
          service: values.service,
          custom_service: values.service === 'Other' ? values.custom_service : null,
          // Temporarily remove customer_name from the update since it doesn't exist in the table yet
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
        custom_service: values.service === 'Other' ? values.custom_service : null,
        customer_name: values.customer_name || '',
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
      name: 'customer_name',
      label: 'Customer Name',
      type: 'text' as const,
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
        { label: 'Domicile', value: 'Domicile' },
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
      required: true
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
  ];

  // Calculate totals for the filtered services
  const totalServices = filteredServices.length;
  const totalAmount = filteredServices.reduce((sum, service) => sum + service.total, 0);

  return (
    <PageWrapper
      title="Online Services"
      subtitle="Manage your online services"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker
            date={selectedDate}
            onDateChange={handleDateChange}
            mode={filterMode}
            onModeChange={handleModeChange}
          />
          <div className="flex gap-2">
            <DownloadButton 
              data={onlineServices}
              filename="online-services"
              currentData={filteredServices}
            />
            <ServiceForm
              title="Add Online Service"
              fields={formFields}
              initialValues={{
                date: new Date(),
                customer_name: '',
                service: '',
                custom_service: '',
                amount: 0,
                count: 1,
              }}
              onSubmit={handleAddEntry}
              trigger={
                <Button className="flex items-center gap-1">
                  <Plus size={16} />
                  <span>Add Service</span>
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
          id="summary-services"
          title="Total Services"
          date={selectedDate}
          data={{ 
            value: totalServices,
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
          date={selectedDate}
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
          <p>Loading online services data...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Online Services</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {onlineServices.length > 0 
              ? `No services found for the selected ${filterMode === 'day' ? 'day' : 'month'}.` 
              : 'Add a new online service to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.service === 'Other' && entry.custom_service ? entry.custom_service : entry.service}
              date={entry.date}
              data={{
                customer: entry.customer_name || 'Not specified',
                amount: formatCurrency(entry.amount),
                total: formatCurrency(entry.total),
              }}
              labels={{
                customer: 'Customer',
                amount: 'Amount per Service',
                total: 'Total Amount',
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
            customer_name: editingEntry.customer_name || '',
            service: editingEntry.service,
            custom_service: editingEntry.custom_service || '',
            amount: editingEntry.amount,
            count: editingEntry.count,
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
