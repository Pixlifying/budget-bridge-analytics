
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
  // For Customers page
  customer?: Customer;
  onConfirm?: () => void;
  onCancel?: () => void;
  
  // For Ledger page
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: () => Promise<void>;
}

const DeleteCustomerDialog = ({
  customer,
  onConfirm,
  onCancel,
  isOpen,
  onClose,
}: DeleteCustomerDialogProps) => {
  // Handle Ledger page props
  if (isOpen !== undefined && onClose) {
    return (
      <DeleteConfirmation
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onConfirm || (() => {})}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone and will remove all associated data."
      />
    );
  }

  // Handle Customers page props - ensure customer exists
  if (!customer) {
    return null;
  }

  return (
    <DeleteConfirmation
      isOpen={true}
      onClose={onCancel || (() => {})}
      onConfirm={onConfirm || (() => {})}
      title="Delete Customer"
      description={`Are you sure you want to delete ${customer.name}? This action cannot be undone and will remove all associated data.`}
    />
  );
};

export default DeleteCustomerDialog;
