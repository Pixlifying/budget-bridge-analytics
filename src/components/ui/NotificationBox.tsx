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

  const { data: odData, refetch: refetchOd } = useQuery({
    queryKey: ['od_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('od_detail_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('od-notifications-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'od_detail_records' }, () => { refetchOd(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetchOd]);

  const { data: pendingData } = useQuery({
    queryKey: ['pending_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pending_balances').select('*').order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const { data: khataData } = useQuery({
    queryKey: ['khata_notifications'],
    queryFn: async () => {
      const [customersResult, transactionsResult] = await Promise.all([
        supabase.from('khata_customers').select('*'),
        supabase.from('khata_transactions').select('*')
      ]);
      if (customersResult.error) throw customersResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      const customers = customersResult.data || [];
      const transactions = transactionsResult.data || [];
      return customers.map(customer => {
        const customerTransactions = transactions.filter(t => t.customer_id === customer.id);
        const transactionTotal = customerTransactions.reduce((sum, t) => {
          return sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount));
        }, 0);
        return { ...customer, current_balance: Number(customer.opening_balance) + transactionTotal };
      });
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    const newNotifications: Notification[] = [];

    if (odData && odData.length > 0) {
      const latestOD = odData[0];
      newNotifications.push({
        id: `od-${latestOD.id}`, type: 'overdraft', title: 'Cash in Hand',
        message: `Current: ${formatCurrency(latestOD.cash_in_hand)}`,
        amount: latestOD.cash_in_hand,
        icon: <Wallet className="h-3.5 w-3.5" />,
        priority: latestOD.cash_in_hand < 5000 ? 'high' : latestOD.cash_in_hand < 10000 ? 'medium' : 'low',
      });
    }

    if (pendingData && pendingData.length > 0) {
      pendingData.forEach((pending) => {
        newNotifications.push({
          id: `pending-${pending.id}`, type: 'pending_balance', title: 'Pending',
          message: `${pending.name} - ${pending.service}`,
          amount: pending.amount,
          icon: <AlertCircle className="h-3.5 w-3.5" />,
          priority: pending.amount > 1000 ? 'high' : pending.amount > 500 ? 'medium' : 'low',
        });
      });
    }

    if (khataData && khataData.length > 0) {
      khataData.forEach((customer) => {
        const isNegative = customer.current_balance < 0;
        newNotifications.push({
          id: `khata-${customer.id}`, type: 'khata', title: 'Khata',
          message: `${customer.name}: ${isNegative ? 'Owes' : 'Bal'} ${formatCurrency(Math.abs(customer.current_balance))}`,
          amount: customer.current_balance,
          icon: <Users className="h-3.5 w-3.5" />,
          priority: Math.abs(customer.current_balance) > 50000 ? 'high' : Math.abs(customer.current_balance) > 10000 ? 'medium' : 'low',
        });
      });
    }

    setNotifications(newNotifications);
  }, [odData, pendingData, khataData]);

  if (notifications.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
        <CreditCard className="h-4 w-4" />
        <span>No urgent notifications</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <CreditCard className="h-4 w-4 text-primary flex-shrink-0" />
      <span className="text-xs font-semibold text-primary flex-shrink-0">LIVE</span>
      <div className="overflow-hidden flex-1">
        <div className="animate-marquee flex gap-6 whitespace-nowrap">
          {[...notifications, ...notifications].map((notification, idx) => (
            <span
              key={`${notification.id}-${idx}`}
              className="inline-flex items-center gap-1.5 text-sm"
            >
              <span className={`${
                notification.type === 'overdraft' ? 'text-emerald-600 dark:text-emerald-400'
                : notification.type === 'pending_balance' ? 'text-orange-600 dark:text-orange-400'
                : 'text-purple-600 dark:text-purple-400'
              }`}>
                {notification.icon}
              </span>
              <span className="text-foreground font-medium">{notification.title}:</span>
              <span className="text-muted-foreground">{notification.message}</span>
              {notification.amount !== undefined && (
                <span className={`font-semibold ${
                  notification.type === 'overdraft' ? 'text-emerald-600 dark:text-emerald-400'
                  : notification.type === 'pending_balance' ? 'text-orange-600 dark:text-orange-400'
                  : 'text-purple-600 dark:text-purple-400'
                }`}>
                  {formatCurrency(Math.abs(notification.amount))}
                </span>
              )}
              <span className="text-border mx-2">•</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationBox;
