
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
        ? "bg-sidebar/95 backdrop-blur-md shadow-md" 
        : "bg-sidebar"
    )}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-sidebar-foreground animate-fade-in">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sidebar-foreground/60 transition-colors duration-200 group-focus-within:text-sidebar-foreground" size={16} />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9 bg-sidebar-accent/30 backdrop-blur-md border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50 focus:bg-sidebar-accent/50 transition-all duration-300 focus:scale-[1.02] hover:shadow-md"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {children && (
            <div className="flex items-center gap-2 animate-slide-in-right text-sidebar-foreground">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
