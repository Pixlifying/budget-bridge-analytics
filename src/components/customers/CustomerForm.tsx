
import { Plus } from 'lucide-react';
import ServiceForm from '@/components/ui/ServiceForm';
import { Button } from '@/components/ui/button';

interface CustomerFormProps {
  onSubmit: (values: Record<string, any>) => Promise<boolean>;
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

const CustomerForm = ({ onSubmit }: CustomerFormProps) => (
  <ServiceForm
    title="Add New Customer"
    fields={customerFormFields}
    initialValues={{}}
    onSubmit={onSubmit}
    trigger={
      <Button size="sm">
        <Plus size={16} className="mr-1" /> Add
      </Button>
    }
  />
);

export default CustomerForm;

