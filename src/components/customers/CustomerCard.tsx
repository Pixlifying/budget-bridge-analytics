
import { User, Phone, MapPin, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  description?: string;
  created_at: string;
}

interface CustomerCardProps {
  customer: Customer;
  onClick?: (id: string, e: React.MouseEvent) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

const CustomerCard = ({ customer, onClick, onEdit, onDelete }: CustomerCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick(customer.id, e);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(customer);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(customer);
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200" onClick={handleCardClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <User size={16} className="text-primary" />
              <h3 className="font-semibold text-lg">{customer.name}</h3>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} />
              <span className="text-sm">{customer.phone}</span>
            </div>

            {customer.address && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin size={14} />
                <span className="text-sm">{customer.address}</span>
              </div>
            )}

            {customer.description && (
              <p className="text-sm text-muted-foreground mt-2">{customer.description}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                Edit Customer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                Delete Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
