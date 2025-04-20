
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Customer } from '@/types/customer';
import { Phone, MapPin, FileText, ArrowDownRight, ArrowUpRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerCardProps {
  customer: Customer;
  balance: number;
  onDragStart: () => void;
}

const CustomerCard = ({ customer, balance, onDragStart }: CustomerCardProps) => {
  // Calculate totals
  const debitTotal = customer.transactions
    .filter(t => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const creditTotal = customer.transactions
    .filter(t => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate net balance (credit - debit)
  const netBalance = creditTotal - debitTotal;
  const isPositiveBalance = netBalance >= 0;

  // Get latest transaction date
  const latestTransaction = customer.transactions.length > 0
    ? new Date(Math.max(...customer.transactions.map(t => new Date(t.date).getTime())))
    : null;

  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={onDragStart}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
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
          <div className="text-right ml-4">
            <div className="font-bold text-red-600 flex items-center justify-end">
              <ArrowUpRight size={14} className="mr-1" />
              Debit: ₹{debitTotal}
            </div>
            <div className="font-bold text-green-600 flex items-center justify-end mt-1">
              <ArrowDownRight size={14} className="mr-1" />
              Credit: ₹{creditTotal}
            </div>
            <div className={`font-bold mt-2 ${isPositiveBalance ? 'text-green-600' : 'text-red-600'}`}>
              Balance: {isPositiveBalance ? '+' : '-'}₹{Math.abs(netBalance)}
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs">
          {latestTransaction && (
            <div className="flex items-center text-muted-foreground">
              <Calendar size={12} className="mr-1" />
              <span>Latest: {format(latestTransaction, 'PPP')}</span>
            </div>
          )}
          <p className="text-muted-foreground mt-1">Drag to opposite section to create a new transaction</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
