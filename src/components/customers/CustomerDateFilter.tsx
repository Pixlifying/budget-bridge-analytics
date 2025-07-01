
import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

export interface CustomerDateFilterProps {
  viewMode: 'day' | 'month' | 'year';
  selectedDate: Date;
  onViewModeChange: (mode: 'day' | 'month' | 'year') => void;
  onDateChange: (date: Date) => void;
}

const CustomerDateFilter = ({
  viewMode,
  selectedDate,
  onViewModeChange,
  onDateChange,
}: CustomerDateFilterProps) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const formatDateDisplay = () => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, 'PPP');
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'year':
        return format(selectedDate, 'yyyy');
      default:
        return format(selectedDate, 'PPP');
    }
  };

  return (
    <div className="flex items-center gap-4 mb-6">
      <Select value={viewMode} onValueChange={(value: 'day' | 'month' | 'year') => onViewModeChange(value)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Day</SelectItem>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="year">Year</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Calendar size={16} />
            {formatDateDisplay()}
            <ChevronDown size={16} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) {
                onDateChange(date);
                setIsCalendarOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CustomerDateFilter;
