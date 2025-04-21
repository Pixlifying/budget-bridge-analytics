
import DeleteConfirmation from "@/components/ui/DeleteConfirmation";

interface DeleteCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteCustomerDialog = ({
  isOpen,
  onClose,
  onConfirm,
}: DeleteCustomerDialogProps) => (
  <DeleteConfirmation
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title="Delete Customer"
    description="Are you sure you want to delete this customer? This action cannot be undone and will remove all associated transactions."
  />
);

export default DeleteCustomerDialog;
