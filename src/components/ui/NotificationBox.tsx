import React, { useState, useEffect } from 'react';
import { AlertCircle, Wallet, Users, CreditCard } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/calculateUtils';

interface Notification {
  id: string;
  type: 'overdraft' | 'pending_balance' | 'khata';
  title: string;
  message: string;
  amount?: number;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

const NotificationBox = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch OD records to check cash in hand
  const { data: odData } = useQuery({
    queryKey: ['od_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('od_records')
        .select('*')
        .order('date', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch pending balances
  const { data: pendingData } = useQuery({
    queryKey: ['pending_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_balances')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch khata customers with high balances
  const { data: khataData } = useQuery({
    queryKey: ['khata_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('khata_customers')
        .select('*')
        .order('opening_balance', { ascending: false })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Show all cash in hand (overdraft notifications)
    if (odData && odData.length > 0) {
      const latestOD = odData[0];
      newNotifications.push({
        id: `od-${latestOD.id}`,
        type: 'overdraft',
        title: 'Cash in Hand',
        message: `Current cash in hand: ${formatCurrency(latestOD.cash_in_hand)}`,
        amount: latestOD.cash_in_hand,
        icon: <Wallet className="h-4 w-4" />,
        priority: latestOD.cash_in_hand < 5000 ? 'high' : latestOD.cash_in_hand < 10000 ? 'medium' : 'low',
      });
    }

    // Check pending balances - group by date
    if (pendingData && pendingData.length > 0) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const monthlyPending = pendingData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      });
      
      const otherPending = pendingData.filter(item => {
        const itemDate = new Date(item.date);
        return !(itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear);
      });

      if (monthlyPending.length > 0) {
        const monthlyTotal = monthlyPending.reduce((sum, item) => sum + Number(item.amount), 0);
        newNotifications.push({
          id: 'pending-monthly',
          type: 'pending_balance',
          title: 'Monthly Pending',
          message: `${monthlyPending.length} monthly pending payments: ${formatCurrency(monthlyTotal)}`,
          amount: monthlyTotal,
          icon: <AlertCircle className="h-4 w-4" />,
          priority: monthlyTotal > 50000 ? 'high' : 'medium',
        });
      }

      if (otherPending.length > 0) {
        const otherTotal = otherPending.reduce((sum, item) => sum + Number(item.amount), 0);
        newNotifications.push({
          id: 'pending-other',
          type: 'pending_balance',
          title: 'Other Pending',
          message: `${otherPending.length} other pending payments: ${formatCurrency(otherTotal)}`,
          amount: otherTotal,
          icon: <AlertCircle className="h-4 w-4" />,
          priority: otherTotal > 50000 ? 'high' : 'medium',
        });
      }
    }

    // Show all khata customers with current balance
    if (khataData && khataData.length > 0) {
      khataData.forEach((customer) => {
        newNotifications.push({
          id: `khata-${customer.id}`,
          type: 'khata',
          title: 'Khata Customer',
          message: `${customer.name}: ${formatCurrency(customer.opening_balance)}`,
          amount: customer.opening_balance,
          icon: <Users className="h-4 w-4" />,
          priority: customer.opening_balance > 50000 ? 'high' : customer.opening_balance > 10000 ? 'medium' : 'low',
        });
      });
    }

    setNotifications(newNotifications);
  }, [odData, pendingData, khataData]);

  if (notifications.length === 0) {
    return (
      <div className="w-80 max-w-[90vw] h-96 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 shadow-xl p-4 md:w-80">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Live Notifications</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>All clear! No urgent notifications.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 max-w-[90vw] h-96 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden relative md:w-80">
      {/* Header */}
      <div className="p-4 border-b border-white/20 dark:border-white/10">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Live Notifications</h3>
        </div>
      </div>

      {/* Scrolling Container */}
      <div className="relative h-80 overflow-hidden">
        {/* Top fade effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/60 to-transparent dark:from-slate-800/60 z-10 pointer-events-none" />
        
        {/* Bottom fade effect */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-800/60 z-10 pointer-events-none" />

        {/* Animated notifications */}
        <div className="h-full overflow-hidden">
          <div className="animate-scroll-up">
            {/* Single loop of notifications */}
            {notifications.concat(notifications).map((notification, index) => (
              <div
                key={`${notification.id}-${index}`}
                className={`p-3 m-2 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  notification.priority === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : notification.priority === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    notification.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-800/40 text-red-600 dark:text-red-400'
                      : notification.priority === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-800/40 text-yellow-600 dark:text-yellow-400'
                      : 'bg-blue-100 dark:bg-blue-800/40 text-blue-600 dark:text-blue-400'
                  }`}>
                    {notification.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {notification.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notification.message}
                    </p>
                    {notification.amount && (
                      <div className={`text-xs font-medium mt-1 ${
                        notification.priority === 'high'
                          ? 'text-red-600 dark:text-red-400'
                          : notification.priority === 'medium'
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {formatCurrency(notification.amount)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBox;