
import { Button } from "@/components/ui/button";
import { CalendarRange } from "lucide-react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerDateFilterProps {
  viewMode: 'day' | 'month' | 'year';
  selectedDate: Date;
  onViewModeChange: (mode: 'day' | 'month' | 'year') => void;
  onDateChange: (date: Date) => void;
}

const CustomerDateFilter = ({ viewMode, selectedDate, onViewModeChange, onDateChange }: CustomerDateFilterProps) => {
  const dateFormat = viewMode === 'day' ? 'd MMM yyyy' : viewMode === 'month' ? 'MMMM yyyy' : 'yyyy';

  return (
    <div className="flex items-center space-x-2">
      <Select value={viewMode} onValueChange={onViewModeChange}>
        <SelectTrigger className="w-[120px] h-9">
          <SelectValue placeholder="Select view" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Daily</SelectItem>
          <SelectItem value="month">Monthly</SelectItem>
          <SelectItem value="year">Yearly</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal h-9 border-border",
              !selectedDate && "text-muted-foreground"
            )}
          >
            <CalendarRange className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, dateFormat) : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-border" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CustomerDateFilter;
