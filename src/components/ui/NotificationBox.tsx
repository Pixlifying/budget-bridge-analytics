import React, { useState, useEffect } from 'react';
import { AlertCircle, Wallet, CreditCard, Activity, Globe, FileText, Receipt, Printer } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/calculateUtils';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'overdraft' | 'pending_balance';
  title: string;
  message: string;
  amount?: number;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

const NotificationBox = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch all data in parallel for faster loading
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

  // Real-time subscription for OD records
  useEffect(() => {
    const channel = supabase
      .channel('od-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'od_detail_records'
        },
        () => {
          refetchOd();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchOd]);

  // Fetch all pending balances
  const { data: pendingData } = useQuery({
    queryKey: ['pending_notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_balances')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Fetch recent activities (latest entries across modules)
  const { data: recentActivities } = useQuery({
    queryKey: ['recent_activities_notifications'],
    queryFn: async () => {
      const items: Array<{ id: string; type: string; description: string; amount: number; date: string; icon: 'banking' | 'online' | 'application' | 'photostat' | 'expense' }> = [];

      // Compute the last 2 working days (Mon-Fri), inclusive of today if working day
      const workingDays: string[] = [];
      const cursor = new Date();
      while (workingDays.length < 2) {
        const dow = cursor.getDay();
        if (dow !== 0 && dow !== 6) {
          workingDays.push(format(cursor, 'yyyy-MM-dd'));
        }
        cursor.setDate(cursor.getDate() - 1);
      }
      const earliest = workingDays[workingDays.length - 1];
      const latest = workingDays[0] + 'T23:59:59.999';

      const [banking, online, apps, photos, expenses] = await Promise.all([
        supabase.from('banking_services').select('*').gte('date', earliest).lte('date', latest).order('created_at', { ascending: false }),
        supabase.from('online_services').select('*').gte('date', earliest).lte('date', latest).order('created_at', { ascending: false }),
        supabase.from('applications').select('*').gte('date', earliest).lte('date', latest).order('created_at', { ascending: false }),
        supabase.from('photostats').select('*').gte('date', earliest).lte('date', latest).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').gte('date', earliest).lte('date', latest).order('created_at', { ascending: false }),
      ]);

      banking.data?.forEach((i: any) => items.push({ id: `b-${i.id}`, type: 'Banking', description: `Banking · ${i.transaction_count} txn`, amount: Number(i.margin) || 0, date: i.date, icon: 'banking' }));
      online.data?.forEach((i: any) => items.push({ id: `o-${i.id}`, type: 'Online', description: `${i.service}${i.customer_name ? ` · ${i.customer_name}` : ''}`, amount: Number(i.total) || 0, date: i.date, icon: 'online' }));
      apps.data?.forEach((i: any) => items.push({ id: `a-${i.id}`, type: 'Offline Service', description: i.customer_name, amount: Number(i.amount) || 0, date: i.date, icon: 'application' }));
      photos.data?.forEach((i: any) => items.push({ id: `p-${i.id}`, type: 'Print', description: `Print · ${i.is_double_sided ? 'Double' : 'Single'}`, amount: Number(i.margin) || 0, date: i.date, icon: 'photostat' }));
      expenses.data?.forEach((i: any) => items.push({ id: `e-${i.id}`, type: 'Expense', description: i.name, amount: -Math.abs(Number(i.amount) || 0), date: i.date, icon: 'expense' }));

      return items
        .filter(it => workingDays.includes(format(new Date(it.date), 'yyyy-MM-dd')))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    refetchInterval: 60000,
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

    // Show individual pending balance customers
    if (pendingData && pendingData.length > 0) {
      pendingData.forEach((pending) => {
        newNotifications.push({
          id: `pending-${pending.id}`,
          type: 'pending_balance',
          title: 'Pending Payment',
          message: `${pending.name} - ${pending.service}${pending.custom_service ? ` (${pending.custom_service})` : ''}`,
          amount: pending.amount,
          icon: <AlertCircle className="h-4 w-4" />,
          priority: pending.amount > 1000 ? 'high' : pending.amount > 500 ? 'medium' : 'low',
        });
      });
    }

    setNotifications(newNotifications);
  }, [odData, pendingData]);

  const hasRecent = (recentActivities?.length || 0) > 0;

  if (notifications.length === 0 && !hasRecent) {
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

  const renderActivityIcon = (icon: string) => {
    if (icon === 'banking') return <CreditCard className="h-4 w-4" />;
    if (icon === 'online') return <Globe className="h-4 w-4" />;
    if (icon === 'application') return <FileText className="h-4 w-4" />;
    if (icon === 'photostat') return <Printer className="h-4 w-4" />;
    return <Receipt className="h-4 w-4" />;
  };

  return (
    <div className="w-80 max-w-[90vw] h-96 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden relative md:w-80">
      {/* Header */}
      <div className="p-4 border-b border-white/20 dark:border-white/10">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Live Notifications</h3>
        </div>
      </div>

      {/* Scrolling Container — bottom-to-top ticker */}
      <div className="relative h-80 overflow-hidden group">
        {/* Top fade effect */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/60 to-transparent dark:from-slate-800/60 z-10 pointer-events-none" />
        
        {/* Bottom fade effect */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-800/60 z-10 pointer-events-none" />

        <div className="animate-ticker-up group-hover:[animation-play-state:paused]">
          {[0, 1].map((loopIdx) => (
          <div key={loopIdx}>
          {notifications.map((notification, index) => (
              <div
                key={`${notification.id}-${index}`}
                className={`p-3 m-2 rounded-xl border transition-all duration-300 hover:scale-105 ${
                  notification.type === 'overdraft'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    notification.type === 'overdraft'
                      ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400'
                      : 'bg-orange-100 dark:bg-orange-800/40 text-orange-600 dark:text-orange-400'
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
                        notification.type === 'overdraft'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {formatCurrency(notification.amount)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
          ))}

          {/* Recent Activity section — appears after pending notifications */}
          {hasRecent && (
            <>
              <div className="px-4 pt-3 pb-1 mt-1 border-t border-white/20 dark:border-white/10 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm text-foreground">Recent Activity</h4>
              </div>
              {recentActivities!.map((a) => (
                <div key={a.id} className="p-3 mx-2 my-1 rounded-xl border border-border/40 bg-card/40 hover:bg-card/70 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${a.amount < 0 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      {renderActivityIcon(a.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{a.description}</p>
                      <p className="text-[11px] text-muted-foreground">{a.type} · {format(new Date(a.date), 'dd MMM')}</p>
                    </div>
                    <span className={`text-xs font-semibold ${a.amount < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {a.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(a.amount))}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
          </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationBox;