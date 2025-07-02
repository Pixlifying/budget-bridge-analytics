
import { useState } from 'react';
import { Calendar, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ViewModeType = 'day' | 'month' | 'year';

interface DateRangePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  mode: ViewModeType;
  onModeChange: (mode: ViewModeType) => void;
}

const DateRangePicker = ({ date, onDateChange, mode, onModeChange }: DateRangePickerProps) => {
  const handleDateChange = (value: string) => {
    const newDate = new Date(value);
    onDateChange(newDate);
  };

  const handleModeChange = (newMode: ViewModeType) => {
    onModeChange(newMode);
  };

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
          <Select value={mode} onValueChange={handleModeChange}>
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
            type={mode === 'year' ? 'number' : mode === 'month' ? 'month' : 'date'}
            value={
              mode === 'year' 
                ? date.getFullYear().toString()
                : mode === 'month'
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                : date.toISOString().split('T')[0]
            }
            onChange={(e) => {
              if (mode === 'year') {
                const year = parseInt(e.target.value);
                handleDateChange(new Date(year, 0, 1).toISOString());
              } else if (mode === 'month') {
                handleDateChange(new Date(e.target.value + '-01').toISOString());
              } else {
                handleDateChange(e.target.value);
              }
            }}
            min={mode === 'year' ? '2020' : undefined}
            max={mode === 'year' ? '2030' : undefined}
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

export default DateRangePicker;
