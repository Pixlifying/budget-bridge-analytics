
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
  description?: string;
}

const StatCard = ({ title, value, icon, trend, className, onClick, description }: StatCardProps) => {
  return (
    <div 
      className={cn(
        "stat-card group cursor-pointer", 
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              {icon}
            </div>
          )}
          <div>
            <p className="metric-label">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground/70">{description}</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="metric-value">{value}</p>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend.isPositive ? "trend-positive" : "trend-negative"
          )}>
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground font-normal">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
