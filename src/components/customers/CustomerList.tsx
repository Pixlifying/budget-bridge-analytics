
import { useState } from 'react';
import { Customer } from './CustomerCard';
import CustomerCard from './CustomerCard';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onCustomerClick?: (id: string, e: React.MouseEvent) => void;
}

const CustomerList = ({ customers, onEdit, onDelete, onCustomerClick }: CustomerListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {customers.length === 0 ? (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          No customers found. Add your first customer to get started.
        </div>
      ) : (
        customers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onClick={onCustomerClick}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default CustomerList;
