
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Customer } from '@/types/customer';
import { Phone, MapPin, FileText } from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
  balance: number;
  onDragStart: () => void;
}

const CustomerCard = ({ customer, balance, onDragStart }: CustomerCardProps) => {
  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={onDragStart}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{customer.name}</h3>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Phone size={12} className="mr-1" />
              <span>{customer.phone}</span>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <MapPin size={12} className="mr-1" />
              <span className="truncate max-w-[180px]">{customer.address}</span>
            </div>
            {customer.description && (
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <FileText size={12} className="mr-1" />
                <span className="truncate max-w-[180px]">{customer.description}</span>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className={`font-bold ${balance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{Math.abs(balance)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {customer.transactions.length} transaction{customer.transactions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs">
          <p className="text-muted-foreground">Drag to opposite section to create a new transaction</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
