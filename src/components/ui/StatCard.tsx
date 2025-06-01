
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

const StatCard = ({ title, value, icon, trend, className, onClick }: StatCardProps) => {
  return (
    <div 
      className={cn(
        "glassmorphism rounded-xl p-5 flex flex-col animate-scale-in card-hover", 
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {icon && <div className="text-primary opacity-80">{icon}</div>}
      </div>
      <div className="flex items-end justify-between mt-1">
        <div>
          <p className="text-2xl font-bold">{value}</p>
          {trend && (
            <p className={cn(
              "text-xs mt-1",
              trend.isPositive ? "text-emerald-500" : "text-rose-500"
            )}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
