
import { useState } from 'react';

export type DateFilterMode = 'day' | 'month' | 'year';

export const useDateFilter = (initialMode: DateFilterMode = 'day') => {
  const [filterDate, setFilterDate] = useState(new Date());
  const [mode, setMode] = useState<DateFilterMode>(initialMode);

  const handleModeChange = (newMode: DateFilterMode) => {
    setMode(newMode);
  };

  return {
    filterDate,
    setFilterDate,
    mode,
    setMode: handleModeChange,
  };
};
