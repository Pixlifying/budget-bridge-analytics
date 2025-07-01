
import DeleteConfirmation from "@/components/ui/DeleteConfirmation";

interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  description?: string;
}

interface DeleteCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  customer?: Customer;
}

const DeleteCustomerDialog = ({
  isOpen,
  onClose,
  onConfirm,
  customer,
}: DeleteCustomerDialogProps) => (
  <DeleteConfirmation
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Delete Customer"
    description={`Are you sure you want to delete ${customer?.name || 'this customer'}? This action cannot be undone and will remove all associated transactions.`}
  />
);

export default DeleteCustomerDialog;
