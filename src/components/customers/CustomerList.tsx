
import { Customer } from './CustomerCard';
import CustomerCard from './CustomerCard';
import EmptyState from '@/components/ui/EmptyState';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onCustomerClick?: (id: string, e: React.MouseEvent) => void;
  highlightId?: string | null;
}

const CustomerList = ({ customers, onEdit, onDelete, onCustomerClick, highlightId }: CustomerListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.length === 0 ? (
        <EmptyState
          icon="data"
          title="No Customers Found"
          description="Add your first customer to start tracking transactions and records."
        />
      ) : (
        customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onClick={onCustomerClick}
            onEdit={onEdit}
            onDelete={onDelete}
            isHighlighted={highlightId === customer.id}
          />
        ))
      )}
    </div>
  );
};

export default CustomerList;
