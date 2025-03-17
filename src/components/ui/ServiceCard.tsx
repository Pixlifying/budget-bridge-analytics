
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/calculateUtils';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ServiceCardProps {
  id: string;
  title: string;
  date: Date;
  data: Record<string, any>;
  labels: Record<string, string>;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

const ServiceCard = ({
  id,
  title,
  date,
  data,
  labels,
  onEdit,
  onDelete,
  className,
}: ServiceCardProps) => {
  return (
    <Card className={cn("bg-card shadow-sm rounded-xl overflow-hidden card-hover", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex justify-between items-center">
          <span>{title}</span>
          <span className="text-sm font-normal text-muted-foreground">
            {formatDate(new Date(date))}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid gap-1">
          {Object.entries(data).map(([key, value]) => (
            labels[key] && (
              <div key={key} className="flex justify-between items-center py-1">
                <span className="text-sm text-muted-foreground">{labels[key]}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            )
          ))}
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 text-muted-foreground" 
          onClick={onEdit}
        >
          <Pencil size={14} className="mr-1" />
          <span className="text-xs">Edit</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 px-3 text-rose-500 hover:text-rose-600 hover:bg-rose-50 border-rose-200" 
          onClick={onDelete}
        >
          <Trash2 size={14} className="mr-1" />
          <span className="text-xs">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ServiceCard;
