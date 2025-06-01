
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
        "bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer group", 
        className
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2 rounded-lg bg-gray-50 text-gray-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300">
              {icon}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
            )}
          </div>
        </div>
        <div className="p-1 rounded bg-gray-50">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
            <path d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 6V8L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend.isPositive ? "text-emerald-500" : "text-red-500"
          )}>
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}%</span>
            <span className="text-gray-400 font-normal">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
