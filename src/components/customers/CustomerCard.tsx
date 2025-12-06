import { User, Phone, MapPin, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
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

  // Generate a gradient based on customer name for variety
  const gradients = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ];
  const gradientIndex = customer.name.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <div 
      className="group cursor-pointer transition-all duration-300 hover:-translate-y-2"
      onClick={handleCardClick}
      style={{
        perspective: '1000px',
      }}
    >
      {/* 3D Card Container */}
      <div 
        className="relative bg-white rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 border border-slate-100 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-slate-300/50"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Top Gradient Banner with 3D effect */}
        <div 
          className={`h-20 bg-gradient-to-r ${gradient} relative overflow-hidden`}
          style={{
            transform: 'translateZ(10px)',
          }}
        >
          {/* Decorative circles for 3D depth */}
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute -right-2 top-8 w-16 h-16 bg-white/5 rounded-full" />
          <div className="absolute left-4 -bottom-4 w-12 h-12 bg-white/10 rounded-full" />
        </div>

        {/* Avatar with 3D pop effect */}
        <div 
          className="absolute left-4 top-12 w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center border-4 border-white"
          style={{
            transform: 'translateZ(20px)',
          }}
        >
          <div className={`w-full h-full rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
            <span className="text-white font-bold text-xl">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Dropdown Menu */}
        <div className="absolute right-3 top-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/20 hover:bg-white/40 text-white">
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

        {/* Content */}
        <div className="pt-10 pb-5 px-5">
          {/* Name */}
          <h3 className="font-bold text-lg text-slate-800 mb-3">{customer.name}</h3>
          
          {/* Details with icons */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Phone size={14} className="text-blue-500" />
              </div>
              <span className="text-sm text-slate-600">{customer.phone}</span>
            </div>

            {customer.address && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <MapPin size={14} className="text-green-500" />
                </div>
                <span className="text-sm text-slate-600 line-clamp-1">{customer.address}</span>
              </div>
            )}

            {customer.description && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <User size={14} className="text-purple-500" />
                </div>
                <span className="text-sm text-slate-500 line-clamp-2">{customer.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom 3D shadow effect */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-50"
          style={{
            transform: 'translateZ(-5px)',
          }}
        />
      </div>
    </div>
  );
};

export default CustomerCard;