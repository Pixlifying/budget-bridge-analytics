
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
import { Textarea } from '@/components/ui/textarea';
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
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: Array<{ value: string; label: string }>;
  required?: boolean;
  min?: number;
  readOnly?: boolean;
  onChange?: (value: any) => void;
  conditional?: (values: Record<string, any>) => boolean;
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
    
    // Call the field's onChange handler if provided
    const field = fields.find(f => f.name === name);
    if (field && field.onChange) {
      field.onChange(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-full max-w-[95vw] md:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogClose className="absolute top-4 right-4 hover:bg-muted rounded-full p-1">
            <X size={18} />
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-3 py-3">
          <div className="grid gap-3 max-h-[calc(80vh-100px)] overflow-y-auto px-1">
            {fields.map((field) => {
              if (field.conditional && !field.conditional(values)) {
                return null;
              }
              
              return (
                <div key={field.name} className="grid gap-1.5">
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
                        />
                      </PopoverContent>
                    </Popover>
                  ) : field.type === 'select' ? (
                    <select
                      id={field.name}
                      value={values[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      value={values[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      required={field.required}
                      readOnly={field.readOnly}
                      className={cn(
                        "min-h-[60px] max-h-[120px]",
                        field.readOnly && "bg-muted"
                      )}
                    />
                  ) : field.type === 'number' ? (
                    <Input
                      id={field.name}
                      type="number"
                      value={values[field.name] || ''}
                      onChange={(e) => handleChange(field.name, Number(e.target.value))}
                      min={field.min}
                      required={field.required}
                      readOnly={field.readOnly}
                      className={field.readOnly ? "bg-muted" : ""}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type="text"
                      value={values[field.name] || ''}
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      required={field.required}
                      readOnly={field.readOnly}
                      className={field.readOnly ? "bg-muted" : ""}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-0 pt-3 bg-background border-t mt-2">
            <Button type="submit" className="w-full sm:w-auto">
              {isEdit ? 'Update' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceForm;
