
import { useState, ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  min?: number;
  readOnly?: boolean;
}

interface ServiceFormProps {
  title: string;
  fields: FormField[];
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  trigger: ReactNode;
  isEdit?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ServiceForm = ({ 
  title, 
  fields, 
  initialValues, 
  onSubmit, 
  trigger, 
  isEdit = false,
  open,
  onOpenChange
}: ServiceFormProps) => {
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Set internal state based on controlled props
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  // Reset values when initialValues change (e.g., when switching between different edit entries)
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose className="absolute top-4 right-4 hover:bg-muted rounded-full p-1">
            <X size={18} />
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field.name} className="grid gap-2">
              <Label htmlFor={field.name} className="text-sm">
                {field.label}
              </Label>

              {field.type === 'date' ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id={field.name}
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !values[field.name] && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {values[field.name] ? (
                        format(values[field.name], 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={values[field.name]}
                      onSelect={(date) => handleChange(field.name, date)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              ) : field.type === 'select' ? (
                <select
                  id={field.name}
                  value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required={field.required}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={field.name}
                  type={field.type}
                  value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  min={field.min}
                  required={field.required}
                  readOnly={field.readOnly}
                  className={field.readOnly ? "bg-muted" : ""}
                />
              )}
            </div>
          ))}

          <div className="mt-2 flex justify-end">
            <Button type="submit" className="btn-hover">
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceForm;
