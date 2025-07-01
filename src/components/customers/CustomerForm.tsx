
import { useState } from 'react';
import { Plus } from 'lucide-react';
import ServiceForm from '@/components/ui/ServiceForm';
import { Button } from '@/components/ui/button';

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  description?: string;
  created_at?: string;
}

interface CustomerFormProps {
  onSubmit: (values: Record<string, any>) => Promise<boolean>;
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

const CustomerForm = ({ onSubmit, customer, onSuccess, onClose }: CustomerFormProps) => (
  <ServiceForm
    title={customer ? "Edit Customer" : "Add New Customer"}
    fields={customerFormFields}
    initialValues={customer || {}}
    onSubmit={onSubmit}
    trigger={
      customer ? undefined : (
        <Button size="sm">
          <Plus size={16} className="mr-1" /> Add
        </Button>
      )
    }
  />
);

export default CustomerForm;
