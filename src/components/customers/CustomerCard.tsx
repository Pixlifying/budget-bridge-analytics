
import { Phone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/utils/calculateUtils';

interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  date: string;
  description?: string;
  customer_id: string;
  created_at?: string;
}

interface CustomerCardProps {
  customer: {
    id: string;
    name: string;
    phone: string;
    transactions: Transaction[];
  };
  onView: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const CustomerCard = ({ customer, onView, onDelete }: CustomerCardProps) => {
  const balance = customer.transactions
    ? customer.transactions.reduce(
        (sum, t) => sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount)), 0
      )
    : 0;
    
  return (
    <Card
      key={customer.id}
      className="border shadow-sm hover:shadow transition-shadow"
      onClick={() => onView(customer.id)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-grow">
            <h3 className="font-semibold text-lg">{customer.name}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <Phone size={14} />
              <span>{customer.phone}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => onDelete(customer.id, e)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
        <div className={`mt-2 text-right ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          <p className="text-sm font-medium">{formatCurrency(balance)}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;

