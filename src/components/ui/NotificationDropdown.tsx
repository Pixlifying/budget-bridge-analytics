
import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
  read: boolean;
}

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { showNotification } = useNotification();

  // Fetch real-time data for notifications
  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        
        // Get today's banking services
        const { data: bankingServices } = await supabase
          .from('banking_services')
          .select('*')
          .gte('date', todayStr)
          .order('created_at', { ascending: false })
          .limit(3);

        // Get today's online services
        const { data: onlineServices } = await supabase
          .from('online_services')
          .select('*')
          .gte('date', todayStr)
          .order('created_at', { ascending: false })
          .limit(3);

        // Get pending balances
        const { data: pendingBalances } = await supabase
          .from('pending_balances')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(2);

        const realTimeNotifications: Notification[] = [];

        // Add banking service notifications
        bankingServices?.forEach((service) => {
          realTimeNotifications.push({
            id: `banking-${service.id}`,
            title: 'Banking Service',
            message: `New banking transaction: ₹${service.amount} (${service.transaction_count} transactions)`,
            type: 'success',
            timestamp: new Date(service.created_at || service.date),
            read: false,
          });
        });

        // Add online service notifications
        onlineServices?.forEach((service) => {
          realTimeNotifications.push({
            id: `online-${service.id}`,
            title: 'Online Service',
            message: `${service.service} completed for ${service.customer_name || 'customer'}: ₹${service.total}`,
            type: 'info',
            timestamp: new Date(service.created_at || service.date),
            read: false,
          });
        });

        // Add pending balance notifications
        pendingBalances?.forEach((balance) => {
          realTimeNotifications.push({
            id: `pending-${balance.id}`,
            title: 'Pending Payment',
            message: `${balance.name} - ${balance.service}: ₹${balance.amount}`,
            type: 'error',
            timestamp: new Date(balance.created_at || balance.date),
            read: false,
          });
        });

        // Sort by timestamp (newest first)
        realTimeNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setNotifications(realTimeNotifications.slice(0, 10)); // Limit to 10 notifications
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchRecentActivity();

    // Set up real-time subscriptions
    const bankingChannel = supabase
      .channel('banking-notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'banking_services' },
        (payload) => {
          const newNotification: Notification = {
            id: `banking-${payload.new.id}`,
            title: 'Banking Service',
            message: `New banking transaction: ₹${payload.new.amount}`,
            type: 'success',
            timestamp: new Date(),
            read: false,
          };
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    const onlineChannel = supabase
      .channel('online-notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'online_services' },
        (payload) => {
          const newNotification: Notification = {
            id: `online-${payload.new.id}`,
            title: 'Online Service',
            message: `${payload.new.service} completed: ₹${payload.new.total}`,
            type: 'info',
            timestamp: new Date(),
            read: false,
          };
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bankingChannel);
      supabase.removeChannel(onlineChannel);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 rounded-full bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 hover:bg-white/20 dark:hover:bg-white/10 transition-all duration-300 hover:scale-105"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs animate-pulse"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl"
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No recent activity
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-4 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer",
                  !notification.read && "bg-primary/5"
                )}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-destructive/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full mt-1" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                showNotification('Viewing recent activity...', 'info');
                setIsOpen(false);
              }}
            >
              View all activity
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationDropdown;
