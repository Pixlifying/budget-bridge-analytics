
import DeleteConfirmation from "@/components/ui/DeleteConfirmation";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  description?: string;
  created_at: string;
}

interface DeleteCustomerDialogProps {
  customer: Customer;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteCustomerDialog = ({
  customer,
  onConfirm,
  onCancel,
}: DeleteCustomerDialogProps) => (
  <DeleteConfirmation
    isOpen={true}
    onClose={onCancel}
    onConfirm={onConfirm}
    title="Delete Customer"
    description={`Are you sure you want to delete ${customer.name}? This action cannot be undone and will remove all associated data.`}
  />
);

export default DeleteCustomerDialog;
