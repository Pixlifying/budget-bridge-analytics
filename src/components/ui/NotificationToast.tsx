
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onRemove: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ id, message, type, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      handleRemove();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(id);
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 dark:border-green-800 bg-green-50/80 dark:bg-green-900/20';
      case 'error':
        return 'border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-900/20';
      default:
        return 'border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/20';
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-lg border backdrop-blur-md shadow-lg transition-all duration-300 transform',
        getTypeStyles(),
        isVisible && !isRemoving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
      )}
    >
      {getIcon()}
      <p className="flex-1 text-sm font-medium text-foreground">{message}</p>
      <button
        onClick={handleRemove}
        className="ml-2 p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors duration-200"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default NotificationToast;
