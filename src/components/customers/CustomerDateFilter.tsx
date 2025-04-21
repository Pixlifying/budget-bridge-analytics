
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

interface CustomerDateFilterProps {
  dateFilter: Date | null;
  onChange: (date: Date | undefined) => void;
}
const CustomerDateFilter = ({ dateFilter, onChange }: CustomerDateFilterProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="outline" className="flex items-center gap-1">
        <CalendarRange size={16} />
        {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="end">
      <Calendar
        mode="single"
        selected={dateFilter || undefined}
        onSelect={onChange}
        initialFocus
        className={cn("p-3 pointer-events-auto")}
      />
    </PopoverContent>
  </Popover>
);

export default CustomerDateFilter;
