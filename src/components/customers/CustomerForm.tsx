
import { useState } from 'react';
import { Plus } from 'lucide-react';
import ServiceForm from '@/components/ui/ServiceForm';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  description?: string;
  created_at?: string;
}

interface CustomerFormProps {
  onSubmit?: (values: Record<string, any>) => Promise<boolean>;
  customer?: Customer;
  onSuccess?: () => void;
  onClose?: () => void;
}

const customerFormFields = [
  {
    name: 'name',
    label: 'Customer Name',
    type: 'text' as const,
    required: true,
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'text' as const,
    required: true,
  },
  {
    name: 'address',
    label: 'Address',
    type: 'text' as const,
    required: true,
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea' as const,
  },
];

const CustomerForm = ({ onSubmit, customer, onSuccess, onClose }: CustomerFormProps) => {
  const handleSubmit = async (values: Record<string, any>) => {
    if (onSubmit) {
      const success = await onSubmit(values);
      if (success && onSuccess) {
        onSuccess();
      }
      return success;
    }

    // Default submit logic
    try {
      if (customer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({
            name: values.name,
            phone: values.phone,
            address: values.address,
            description: values.description || null,
          })
          .eq('id', customer.id);

        if (error) throw error;
        toast.success("Customer updated successfully");
      } else {
        // Create new customer
        const { error } = await supabase
          .from('customers')
          .insert({
            name: values.name,
            phone: values.phone,
            address: values.address,
            description: values.description || null,
          });

        if (error) throw error;
        toast.success("Customer added successfully");
      }

      if (onSuccess) {
        onSuccess();
      }
      return true;
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error("Failed to save customer");
      return false;
    }
  };

  return (
    <ServiceForm
      title={customer ? "Edit Customer" : "Add New Customer"}
      fields={customerFormFields}
      initialValues={customer || {}}
      onSubmit={handleSubmit}
      trigger={
        customer ? undefined : (
          <Button size="sm">
            <Plus size={16} className="mr-1" /> Add
          </Button>
        )
      }
    />
  );
};

export default CustomerForm;
