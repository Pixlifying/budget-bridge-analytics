
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// For Ledger page usage
interface LedgerDateFilterProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

// For Customers page usage
interface CustomersDateFilterProps {
  viewMode: 'day' | 'month' | 'year';
  selectedDate: Date;
  onViewModeChange: (mode: 'day' | 'month' | 'year') => void;
  onDateChange: (date: Date) => void;
}

type CustomerDateFilterProps = LedgerDateFilterProps | CustomersDateFilterProps;

const CustomerDateFilter = (props: CustomerDateFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Check if this is the Customers page version (has viewMode)
  const isCustomersVersion = 'viewMode' in props;

  if (isCustomersVersion) {
    const { viewMode, selectedDate, onViewModeChange, onDateChange } = props as CustomersDateFilterProps;
    
    return (
      <div className="flex gap-2 items-center">
        <Select value={viewMode} onValueChange={onViewModeChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  onDateChange(date);
                  setIsOpen(false);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Ledger page version
  const { selectedDate, onChange } = props as LedgerDateFilterProps;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date) {
              onChange(date);
              setIsOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default CustomerDateFilter;
