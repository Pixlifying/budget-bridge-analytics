
import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ViewMode = 'day' | 'month' | 'year';

export interface CustomerDateFilterProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  dateFilter?: Date;
  onChange?: (date: Date) => void;
}

const CustomerDateFilter = ({ 
  selectedDate, 
  onDateChange, 
  viewMode = 'day', 
  onViewModeChange,
  dateFilter,
  onChange
}: CustomerDateFilterProps) => {
  const [localDate, setLocalDate] = useState<Date>(selectedDate || dateFilter || new Date());
  const [localViewMode, setLocalViewMode] = useState<ViewMode>(viewMode);

  const handleDateChange = (value: string) => {
    const newDate = new Date(value);
    setLocalDate(newDate);
    if (onDateChange) onDateChange(newDate);
    if (onChange) onChange(newDate);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setLocalViewMode(mode);
    if (onViewModeChange) onViewModeChange(mode);
  };

  const currentDate = selectedDate || dateFilter || localDate;
  const currentViewMode = viewMode || localViewMode;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar size={20} />
          Date Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="viewMode">View Mode</Label>
          <Select value={currentViewMode} onValueChange={handleViewModeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Daily</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Select Date</Label>
          <Input
            id="date"
            type={currentViewMode === 'year' ? 'number' : currentViewMode === 'month' ? 'month' : 'date'}
            value={
              currentViewMode === 'year' 
                ? currentDate.getFullYear().toString()
                : currentViewMode === 'month'
                ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
                : currentDate.toISOString().split('T')[0]
            }
            onChange={(e) => {
              if (currentViewMode === 'year') {
                const year = parseInt(e.target.value);
                handleDateChange(new Date(year, 0, 1).toISOString());
              } else if (currentViewMode === 'month') {
                handleDateChange(new Date(e.target.value + '-01').toISOString());
              } else {
                handleDateChange(e.target.value);
              }
            }}
            min={currentViewMode === 'year' ? '2020' : undefined}
            max={currentViewMode === 'year' ? '2030' : undefined}
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(new Date().toISOString())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              handleDateChange(yesterday.toISOString());
            }}
          >
            Yesterday
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerDateFilter;
