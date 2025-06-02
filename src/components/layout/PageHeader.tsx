
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import NotificationDropdown from '@/components/ui/NotificationDropdown';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
  showThemeToggle?: boolean;
}

const PageHeader = ({ 
  title, 
  searchValue = '', 
  onSearchChange, 
  searchPlaceholder = "Search...", 
  children,
  showThemeToggle = false
}: PageHeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={cn(
      "sticky top-0 z-40 transition-all duration-300",
      isScrolled 
        ? "bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm" 
        : "bg-background border-b border-border"
    )}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent animate-fade-in">
            {title}
          </h1>
          <div className="flex items-center gap-2">
            {showThemeToggle && <ThemeToggle />}
            <NotificationDropdown />
          </div>
        </div>
        
        <div className="flex items-center justify-between gap-4">
          {onSearchChange && (
            <div className="relative flex-1 max-w-md group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" size={16} />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9 bg-white/50 dark:bg-white/5 backdrop-blur-md border-white/20 dark:border-white/10 focus:bg-white/70 dark:focus:bg-white/10 transition-all duration-300 focus:scale-[1.02] hover:shadow-md"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {children && (
            <div className="flex items-center gap-2 animate-slide-in-right">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
