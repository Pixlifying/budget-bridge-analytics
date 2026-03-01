import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

const DigitalClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeString = format(currentTime, 'HH:mm:ss');
  const dateString = format(currentTime, 'EEE, MMM d');

  return (
    <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
      <Clock className="h-4 w-4 text-primary" />
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold font-mono text-primary tracking-wider">
          {timeString}
        </span>
        <span className="text-xs text-muted-foreground hidden xl:inline">
          {dateString}
        </span>
      </div>
    </div>
  );
};

export default DigitalClock;
