
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
  gradient?: 'default' | 'income' | 'expense' | 'profit';
}

const StatCard = ({ title, value, icon, trend, className, onClick, gradient = 'default' }: StatCardProps) => {
  const gradientClasses = {
    default: 'gradient-card',
    income: 'gradient-income glow-green',
    expense: 'gradient-expense glow-red',
    profit: 'gradient-profit glow-purple'
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border border-border/50 backdrop-blur-xl", 
        "transform transition-all duration-500 ease-out hover:scale-105 hover:shadow-2xl hover:-translate-y-2",
        "animate-fade-in card-hover group cursor-pointer",
        gradientClasses[gradient],
        onClick && "cursor-pointer hover:shadow-2xl",
        className
      )}
      onClick={onClick}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider">{title}</p>
            {trend && (
              <div className={cn(
                "flex items-center text-xs font-semibold px-2 py-1 rounded-full",
                trend.isPositive 
                  ? "text-emerald-400 bg-emerald-500/20" 
                  : "text-rose-400 bg-rose-500/20"
              )}>
                <span className={cn(
                  "mr-1 text-sm",
                  trend.isPositive ? "text-emerald-400" : "text-rose-400"
                )}>
                  {trend.isPositive ? '↗' : '↘'}
                </span>
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          {icon && (
            <div className="text-primary/80 group-hover:text-primary transition-colors duration-300 group-hover:scale-110 transform">
              {icon}
            </div>
          )}
        </div>
        
        <div className="mt-2">
          <p className="text-3xl font-bold tracking-tight animate-number group-hover:text-primary transition-colors duration-300">
            {value}
          </p>
        </div>
      </div>

      {/* Animated border */}
      <div className="absolute inset-0 rounded-2xl border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

export default StatCard;
