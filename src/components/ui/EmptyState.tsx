import { FileText, Plus, Database, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: 'data' | 'search' | 'file' | 'custom';
  customIcon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const iconMap = {
  data: Database,
  search: Search,
  file: FileText,
  custom: Database,
};

const EmptyState = ({
  icon = 'data',
  customIcon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) => {
  const IconComp = iconMap[icon];

  return (
    <div className={cn(
      "col-span-full flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed border-border/60 bg-muted/20",
      className
    )}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-150" />
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20">
          {customIcon || <IconComp className="w-9 h-9 text-primary/70" />}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground text-center max-w-sm mb-5">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" className="gap-2">
          <Plus size={16} />
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
