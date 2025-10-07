import { useState, useEffect } from 'react';
import { Clock, Bell } from 'lucide-react';
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
  const dateString = format(currentTime, 'EEEE, MMMM d, yyyy');

  return (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 backdrop-blur-md rounded-xl p-4 border border-primary/20 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-sm text-foreground">Current Time</h3>
      </div>
      
      <div className="space-y-2">
        <div className="text-3xl sm:text-4xl font-bold font-mono text-primary tracking-wider">
          {timeString}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground">
          {dateString}
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-primary/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bell className="h-3 w-3" />
          <span>Check reminders below</span>
        </div>
      </div>
    </div>
  );
};

export default DigitalClock;
