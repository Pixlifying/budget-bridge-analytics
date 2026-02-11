
import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateRangePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  mode: string;
  onModeChange: (mode: any) => void;
  showYearMode?: boolean;
}

const DateRangePicker = ({ date, onDateChange, mode, onModeChange, showYearMode = false }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      onDateChange(newDate);
      setIsOpen(false);
    }
  };

  const handleModeChange = (value: string) => {
    // Only allow year mode if showYearMode is true
    if (value === 'year' && !showYearMode) return;
    onModeChange(value as 'day' | 'month' | 'year');
  };

  const dateFormat = mode === 'day' ? 'd MMM yyyy' : mode === 'month' ? 'MMMM yyyy' : mode === 'quarter' ? 'QQQ yyyy' : 'yyyy';

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={mode}
        onValueChange={handleModeChange}
      >
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Daily</SelectItem>
          <SelectItem value="month">Monthly</SelectItem>
          <SelectItem value="quarter">Quarterly</SelectItem>
          {showYearMode && <SelectItem value="year">Yearly</SelectItem>}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-9 border-border",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, dateFormat) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
