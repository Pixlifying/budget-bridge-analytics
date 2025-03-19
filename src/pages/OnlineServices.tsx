
import { useState, useEffect } from 'react';
import { Globe, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceForm from '@/components/ui/ServiceForm';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency,
  exportToExcel
} from '@/utils/calculateUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OnlineServiceEntry {
  id: string;
  date: Date;
  service: string;
  customService?: string;
  amount: number;
  count: number;
  total: number;
}

const OnlineServices = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [onlineServices, setOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredServices, setFilteredServices] = useState<OnlineServiceEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<OnlineServiceEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [showCustomService, setShowCustomService] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const fetchOnlineServices = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('online_services')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        service: entry.service,
        customService: entry.custom_service,
        amount: Number(entry.amount),
        count: entry.count,
        total: Number(entry.total)
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
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredServices(filterByDate(onlineServices, date));
    } else {
      setFilteredServices(filterByMonth(onlineServices, date));
    }
  }, [date, viewMode, onlineServices]);

  const handleAddEntry = async (values: Partial<OnlineServiceEntry>) => {
    try {
      const count = Number(values.count);
      const amount = Number(values.amount);
      const total = count * amount;
      const service = values.service || '';
      const customService = values.customService || '';
      
      const { data, error } = await supabase
        .from('online_services')
        .insert({
          date: values.date ? new Date(values.date).toISOString() : new Date().toISOString(),
          service: service === 'Others' ? 'Others' : service,
          custom_service: service === 'Others' ? customService : null,
          amount,
          count,
          total
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const newEntry: OnlineServiceEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          service: data[0].service,
          customService: data[0].custom_service,
          amount: Number(data[0].amount),
          count: data[0].count,
          total: Number(data[0].total)
        };
        
        setOnlineServices(prev => [newEntry, ...prev]);
        toast.success('Online service added successfully');
      }
      
      setShowCustomService(false);
    } catch (error) {
      console.error('Error adding online service:', error);
      toast.error('Failed to add online service');
    }
  };

  const handleEditEntry = async (values: Partial<OnlineServiceEntry>) => {
    if (!editingEntry) return;
    
    try {
      const count = Number(values.count);
      const amount = Number(values.amount);
      const total = count * amount;
      const service = values.service || '';
      const customService = values.customService || '';
      
      const { error } = await supabase
        .from('online_services')
        .update({
          date: values.date ? new Date(values.date).toISOString() : editingEntry.date.toISOString(),
          service: service === 'Others' ? 'Others' : service,
          custom_service: service === 'Others' ? customService : null,
          amount,
          count,
          total
        })
        .eq('id', editingEntry.id);
      
      if (error) {
        throw error;
      }
      
      const updatedEntry: OnlineServiceEntry = {
        ...editingEntry,
        date: values.date || editingEntry.date,
        service: service === 'Others' ? 'Others' : service,
        customService: service === 'Others' ? customService : undefined,
        amount,
        count,
        total
      };
      
      setOnlineServices(prev => 
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );
      
      setEditingEntry(null);
      setFormOpen(false);
      toast.success('Online service updated successfully');
      setShowCustomService(false);
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
      
      if (error) {
        throw error;
      }
      
      setOnlineServices(prev => prev.filter(entry => entry.id !== id));
      toast.success('Online service deleted successfully');
    } catch (error) {
      console.error('Error deleting online service:', error);
      toast.error('Failed to delete online service');
    }
  };

  const serviceOptions = [
    { value: 'UAN Activation', label: 'UAN Activation' },
    { value: 'PF/ESI Registration', label: 'PF/ESI Registration' },
    { value: 'ITR Filing', label: 'ITR Filing' },
    { value: 'GST Registration', label: 'GST Registration' },
    { value: 'GST Return', label: 'GST Return' },
    { value: 'Udyam/Udyog Registration', label: 'Udyam/Udyog Registration' },
    { value: 'Ayushman Card', label: 'Ayushman Card' },
    { value: 'Others', label: 'Others' },
  ];

  const getFormFields = () => {
    const fields = [
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
        options: serviceOptions,
        required: true,
        onChange: (value: string) => setShowCustomService(value === 'Others')
      },
    ];

    if (showCustomService) {
      fields.push({ 
        name: 'customService', 
        label: 'Specify Service', 
        type: 'text' as const,
        required: true
      });
    }

    fields.push({ 
      name: 'count', 
      label: 'Number of Services', 
      type: 'number' as const,
      min: 1,
      required: true
    });

    fields.push({ 
      name: 'amount', 
      label: 'Amount per Service (₹)', 
      type: 'number' as const,
      min: 0,
      required: true
    });

    fields.push({ 
      name: 'total', 
      label: 'Total Amount (₹)', 
      type: 'number' as const,
      readOnly: true
    });

    return fields;
  };

  const calculateTotal = (values: Record<string, any>) => {
    const count = Number(values.count) || 0;
    const amount = Number(values.amount) || 0;
    return {
      ...values,
      total: count * amount
    };
  };

  const totalCount = filteredServices.reduce((sum, entry) => sum + entry.count, 0);
  const totalAmount = filteredServices.reduce((sum, entry) => sum + entry.total, 0);
  const serviceGroups = filteredServices.reduce((groups, entry) => {
    const service = entry.service === 'Others' ? (entry.customService || 'Other') : entry.service;
    groups[service] = (groups[service] || 0) + entry.count;
    return groups;
  }, {} as Record<string, number>);

  const mostUsedService = Object.entries(serviceGroups).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

  const handleDownloadAll = () => {
    exportToExcel(onlineServices, 'online-services-all');
    setIsDropdownOpen(false);
  };

  const handleDownloadCurrent = () => {
    exportToExcel(filteredServices, 'online-services-current-view');
    setIsDropdownOpen(false);
  };

  return (
    <PageWrapper
      title="Online Services"
      subtitle={`Manage your online services for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <div className="flex gap-2">
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download size={16} />
                  <span>Download</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50 bg-background border shadow-md">
                <DropdownMenuItem onClick={handleDownloadAll} className="cursor-pointer">
                  Download All Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadCurrent} className="cursor-pointer">
                  Download Current View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ServiceForm
              title="Add Online Service"
              fields={getFormFields()}
              initialValues={{
                date: new Date(),
                service: '',
                customService: '',
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <ServiceCard 
          id="summary-services"
          title="Total Services"
          date={date}
          data={{ 
            value: totalCount,
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
          date={date}
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
        <ServiceCard 
          id="summary-popular"
          title="Most Used Service"
          date={date}
          data={{ 
            value: mostUsedService,
          }}
          labels={{ 
            value: "Service",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-purple-50"
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
            Add a new online service to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.service === 'Others' ? (entry.customService || 'Other Service') : entry.service}
              date={entry.date}
              data={{
                count: entry.count,
                amount: formatCurrency(entry.amount),
                total: formatCurrency(entry.total),
              }}
              labels={{
                count: 'Number of Services',
                amount: 'Amount per Service',
                total: 'Total Amount',
              }}
              onEdit={() => {
                setShowCustomService(entry.service === 'Others');
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
          fields={getFormFields()}
          initialValues={{
            ...calculateTotal(editingEntry),
            customService: editingEntry.customService || '',
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
