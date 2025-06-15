
import CustomerCard from './CustomerCard';

interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  date: string;
  description?: string;
  customer_id: string;
  created_at?: string;
}
interface Customer {
  id: string;
  name: string;
  phone: string;
  transactions: Transaction[];
}

interface CustomerListProps {
  customers: Customer[];
  loading: boolean;
  searchTerm: string;
  onView: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const CustomerList = ({
  customers,
  loading,
  searchTerm,
  onView,
  onDelete,
}: CustomerListProps) => {
  if (loading) {
    return (
      <>
        {Array(3)
          .fill(0)
          .map((_, index) => (
            <div key={index} className="animate-pulse bg-white rounded shadow p-4 mb-2">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
      </>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {searchTerm
          ? "No customers found matching your search."
          : "No customers found. Add your first customer!"}
      </div>
    );
  }

  return (
    <>
      {customers.map((customer) => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          onView={onView}
          onDelete={onDelete}
        />
      ))}
    </>
  );
};

export default CustomerList;

