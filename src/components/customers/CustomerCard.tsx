
import { Phone, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  description?: string;
  created_at: string;
}

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

const CustomerCard = ({ customer, onEdit, onDelete }: CustomerCardProps) => {
  return (
    <Card className="border shadow-sm hover:shadow transition-shadow">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <h3 className="font-semibold text-lg">{customer.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Phone size={14} />
              <span>{customer.phone}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{customer.address}</p>
            {customer.description && (
              <p className="text-sm text-muted-foreground mt-1">{customer.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Added: {format(new Date(customer.created_at), 'dd MMM yyyy')}
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-600 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => onEdit(customer)}
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(customer)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
