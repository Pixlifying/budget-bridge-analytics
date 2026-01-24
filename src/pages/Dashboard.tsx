import { useEffect, useState } from 'react';
import { CreditCard, FileText, Globe, BarChart3, AlertCircle, Wallet, Printer, Receipt, TrendingUp, Search, Bell, MessageSquare, Users, ArrowUpRight, ArrowDownRight, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import DateRangePicker from '@/components/ui/DateRangePicker';
import NotificationBox from '@/components/ui/NotificationBox';
import ReminderCalendar from '@/components/ui/ReminderCalendar';
import DigitalClock from '@/components/ui/DigitalClock';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/utils/calculateUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [marginDialogOpen, setMarginDialogOpen] = useState(false);

  // Previous month for comparison
  const previousMonth = subMonths(date, 1);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const {
    data: bankingData,
    error: bankingError
  } = useQuery({
    queryKey: ['bankingServices', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('banking_services').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate);
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Previous month banking data for comparison
  const { data: prevBankingData } = useQuery({
    queryKey: ['bankingServicesPrev', previousMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      return data;
    }
  });

  const {
    data: onlineData,
    error: onlineError
  } = useQuery({
    queryKey: ['onlineServices', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('online_services').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Previous month online services for comparison
  const { data: prevOnlineData } = useQuery({
    queryKey: ['onlineServicesPrev', previousMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('online_services')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59.999');
      if (error) throw error;
      return data;
    }
  });

  const {
    data: applicationsData,
    error: applicationsError
  } = useQuery({
    queryKey: ['applications', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('applications').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate);
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const {
    data: photostatData,
    error: photostatError
  } = useQuery({
    queryKey: ['photostat', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('photostats').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const {
    data: bankingAccountsData,
    error: bankingAccountsError
  } = useQuery({
    queryKey: ['bankingAccounts', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('banking_accounts').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const {
    data: pendingBalanceData,
    error: pendingBalanceError
  } = useQuery({
    queryKey: ['pendingBalances', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('pending_balances').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const {
    data: expensesData,
    error: expensesError
  } = useQuery({
    queryKey: ['expenses', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('expenses').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Previous month expenses for comparison
  const { data: prevExpensesData } = useQuery({
    queryKey: ['expensesPrev', previousMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59');
      if (error) throw error;
      return data;
    }
  });

  const {
    data: odRecordsData,
    refetch: refetchOdRecords
  } = useQuery({
    queryKey: ['odRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('od_detail_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data;
    }
  });

  // Recent activities - fetch today's data for day mode, or filtered data for month mode
  const { data: recentActivitiesData } = useQuery({
    queryKey: ['recentActivities', viewMode, date],
    queryFn: async () => {
      const activities: Array<{
        id: string;
        type: string;
        description: string;
        amount: number;
        date: string;
        icon: string;
        color: string;
      }> = [];

      const filterDate = viewMode === 'day' ? format(date, 'yyyy-MM-dd') : null;
      const startDate = viewMode === 'month' ? format(startOfMonth(date), 'yyyy-MM-dd') : null;
      const endDate = viewMode === 'month' ? format(endOfMonth(date), 'yyyy-MM-dd') : null;

      // Fetch banking services
      let bankingQuery = supabase.from('banking_services').select('*');
      if (filterDate) {
        bankingQuery = bankingQuery.eq('date', filterDate);
      } else if (startDate && endDate) {
        bankingQuery = bankingQuery.gte('date', startDate).lte('date', endDate);
      }
      const { data: banking } = await bankingQuery.order('created_at', { ascending: false }).limit(10);
      
      banking?.forEach(item => {
        activities.push({
          id: `banking-${item.id}`,
          type: 'Banking',
          description: `You did ${item.transaction_count} transactions`,
          amount: item.margin,
          date: item.date,
          icon: 'banking',
          color: 'primary'
        });
      });

      // Fetch online services
      let onlineQuery = supabase.from('online_services').select('*');
      if (filterDate) {
        onlineQuery = onlineQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        onlineQuery = onlineQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: online } = await onlineQuery.order('created_at', { ascending: false }).limit(10);

      online?.forEach(item => {
        activities.push({
          id: `online-${item.id}`,
          type: 'Online',
          description: `You did ${item.service} service${item.customer_name ? ` for ${item.customer_name}` : ''}`,
          amount: item.total,
          date: item.date,
          icon: 'online',
          color: 'primary'
        });
      });

      // Fetch applications
      let appsQuery = supabase.from('applications').select('*');
      if (filterDate) {
        appsQuery = appsQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        appsQuery = appsQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: apps } = await appsQuery.order('created_at', { ascending: false }).limit(10);

      apps?.forEach(item => {
        activities.push({
          id: `app-${item.id}`,
          type: 'Application',
          description: `You did application for ${item.customer_name}`,
          amount: item.amount,
          date: item.date,
          icon: 'application',
          color: 'primary'
        });
      });

      // Fetch photostat
      let photoQuery = supabase.from('photostats').select('*');
      if (filterDate) {
        photoQuery = photoQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        photoQuery = photoQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: photos } = await photoQuery.order('created_at', { ascending: false }).limit(5);

      photos?.forEach(item => {
        activities.push({
          id: `photo-${item.id}`,
          type: 'Photostat',
          description: `You did photostat work`,
          amount: item.margin,
          date: item.date,
          icon: 'photostat',
          color: 'primary'
        });
      });

      // Fetch expenses
      let expenseQuery = supabase.from('expenses').select('*');
      if (filterDate) {
        expenseQuery = expenseQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        expenseQuery = expenseQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: expenses } = await expenseQuery.order('created_at', { ascending: false }).limit(5);

      expenses?.forEach(item => {
        activities.push({
          id: `expense-${item.id}`,
          type: 'Expense',
          description: `You spent on ${item.name}`,
          amount: -item.amount,
          date: item.date,
          icon: 'expense',
          color: 'destructive'
        });
      });

      // Fetch banking accounts (Other Banking)
      let bankingAccQuery = supabase.from('banking_accounts').select('*');
      if (filterDate) {
        bankingAccQuery = bankingAccQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        bankingAccQuery = bankingAccQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: bankingAccounts } = await bankingAccQuery.order('created_at', { ascending: false }).limit(5);

      bankingAccounts?.forEach(item => {
        activities.push({
          id: `bankingAcc-${item.id}`,
          type: 'Other Banking',
          description: `You did ${item.account_type} for ${item.customer_name}`,
          amount: item.margin || 0,
          date: item.date,
          icon: 'banking',
          color: 'primary'
        });
      });

      // Sort by date and created_at
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  });

  // Fetch daily margin data for the current month for charts
  const { data: dailyMarginData } = useQuery({
    queryKey: ['dailyMargin', date],
    queryFn: async () => {
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('banking_services')
        .select('date, margin')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  useEffect(() => {
    const channel = supabase.channel('od-records-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'od_detail_records'
    }, () => {
      refetchOdRecords();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchOdRecords]);

  useEffect(() => {
    if (bankingError || bankingAccountsError || onlineError || applicationsError || photostatError || pendingBalanceError || expensesError) {
      toast.error('Failed to load data');
    }
  }, [bankingError, bankingAccountsError, onlineError, applicationsError, photostatError, pendingBalanceError, expensesError]);

  // Calculate metrics
  const bankingServicesTotal = bankingData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const bankingServicesCount = bankingData?.reduce((sum, entry) => sum + (entry.transaction_count || 1), 0) || 0;
  const bankingMargin = bankingData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const bankingAccountsMargin = bankingAccountsData?.reduce((sum, entry) => sum + Number(entry.margin || 0), 0) || 0;
  const onlineServicesTotal = onlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;
  const onlineServicesCount = onlineData?.length || 0;
  const onlineMargin = onlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;
  const applicationsTotal = applicationsData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const applicationsCount = applicationsData?.length || 0;
  const applicationsMargin = applicationsData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const photostatTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const photostatMarginTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.margin), 0) || 0;
  const pendingBalanceTotal = pendingBalanceData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const expensesTotal = expensesData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const expensesCount = expensesData?.length || 0;
  const latestCashInHand = odRecordsData?.[0]?.cash_in_hand || 0;
  const totalMargin = bankingMargin + bankingAccountsMargin + onlineMargin + applicationsMargin + photostatMarginTotal;

  // Previous month calculations for comparison
  const prevBankingMargin = prevBankingData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const prevOnlineMargin = prevOnlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;
  const prevExpensesTotal = prevExpensesData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const prevBankingCount = prevBankingData?.reduce((sum, entry) => sum + (entry.transaction_count || 1), 0) || 0;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const marginChange = calculateChange(totalMargin, prevBankingMargin + prevOnlineMargin);
  const bankingChange = calculateChange(bankingServicesCount, prevBankingCount);
  const expenseChange = calculateChange(expensesTotal, prevExpensesTotal);

  const marginDetails = [{
    name: 'Banking Services',
    value: bankingMargin,
    color: 'hsl(var(--chart-1))'
  }, {
    name: 'Other Banking',
    value: bankingAccountsMargin,
    color: 'hsl(var(--chart-2))'
  }, {
    name: 'Online Services',
    value: onlineMargin,
    color: 'hsl(var(--chart-3))'
  }, {
    name: 'Applications',
    value: applicationsMargin,
    color: 'hsl(var(--chart-4))'
  }, {
    name: 'Printout & Photostat',
    value: photostatMarginTotal,
    color: 'hsl(var(--chart-5))'
  }];

  const handleDateChange = (newDate: Date) => setDate(newDate);
  const handleViewModeChange = (mode: 'day' | 'month') => setViewMode(mode);

  // Generate real chart data from daily margin
  const generateChartData = (): number[] => {
    if (!dailyMarginData || dailyMarginData.length === 0) {
      return [0, 0, 0, 0, 0, 0, 0];
    }
    // Group by date and sum margins
    const marginByDate: { [key: string]: number } = {};
    dailyMarginData.forEach(item => {
      const dateKey = item.date;
      marginByDate[dateKey] = (marginByDate[dateKey] || 0) + item.margin;
    });
    const values = Object.values(marginByDate);
    // Return last 7 values or pad with zeros
    if (values.length >= 7) return values.slice(-7);
    return [...Array(7 - values.length).fill(0), ...values];
  };

  // Mini line chart for cards
  const MiniLineChart = ({
    data,
    color = 'primary'
  }: {
    data: number[];
    color?: string;
  }) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const height = 40;
    const width = 80;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={width} height={height} className="overflow-hidden">
        <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  // Mini bar chart with real data
  const MiniBarChart = ({
    data
  }: {
    data: number[];
  }) => {
    const max = Math.max(...data, 1);
    return (
      <div className="flex items-end gap-1 h-10 overflow-hidden">
        {data.map((value, i) => (
          <div 
            key={i} 
            className="w-2 bg-primary rounded-t flex-shrink-0" 
            style={{ height: `${Math.max((value / max) * 100, 5)}%` }} 
          />
        ))}
      </div>
    );
  };

  // Dashboard Card component matching reference image style
  const DashCard = ({
    children,
    className = '',
    onClick
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div 
      onClick={onClick} 
      className={`
        bg-card rounded-2xl p-5 border border-border/50
        transition-all duration-200 hover:shadow-lg
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );

  const chartData = generateChartData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Hello, Harry</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Explore information</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-9 w-64 bg-background border-border" />
            </div>
            <DateRangePicker date={date} onDateChange={handleDateChange} mode={viewMode} onModeChange={handleViewModeChange} />
            <button className="p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-5">
            {/* Cash in Hand Banner - Moved to Top */}
            <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
              <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-5 w-5 opacity-80" />
                    <h3 className="text-sm opacity-80">Cash in Hand</h3>
                  </div>
                  <p className="text-4xl font-bold">{formatCurrency(latestCashInHand)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm mb-1">
                      <span className="text-2xl font-bold">{bankingServicesCount}</span>
                    </div>
                    <span className="text-xs opacity-80">Banking Txn</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm mb-1">
                      <span className="text-2xl font-bold">{onlineServicesCount}</span>
                    </div>
                    <span className="text-xs opacity-80">Online</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm mb-1">
                      <span className="text-2xl font-bold">{applicationsCount}</span>
                    </div>
                    <span className="text-xs opacity-80">Applications</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              {/* Total Margin */}
              <DashCard onClick={() => setMarginDialogOpen(true)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Margin</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalMargin)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {marginChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`text-xs ${marginChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {Math.abs(marginChange).toFixed(1)}% vs last month
                      </span>
                    </div>
                  </div>
                  <MiniBarChart data={chartData} />
                </div>
              </DashCard>

              {/* Banking Transactions */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Banking Txn</p>
                      <p className="text-xl font-bold text-foreground">{bankingServicesCount}</p>
                      <div className="flex items-center gap-1">
                        {bankingChange >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-destructive" />
                        )}
                        <span className={`text-xs ${bankingChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                          {Math.abs(bankingChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <MiniLineChart data={chartData} />
                </div>
              </DashCard>

              {/* Online Services */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Online Services</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(onlineServicesTotal)}</p>
                      <p className="text-xs text-muted-foreground">{onlineServicesCount} services</p>
                    </div>
                  </div>
                </div>
              </DashCard>

              {/* Banking Amount */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Banking Amount</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(bankingServicesTotal)}</p>
                  </div>
                  <MiniLineChart data={chartData} />
                </div>
              </DashCard>
            </div>

            {/* Second Row - More Stats */}
            <div className="grid grid-cols-4 gap-4">
              {/* Expenses */}
              <DashCard>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Receipt className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="font-medium text-foreground">Expenses</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(expensesTotal)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {expenseChange >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-destructive" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-green-500" />
                  )}
                  <span className={`text-xs ${expenseChange >= 0 ? 'text-destructive' : 'text-green-500'}`}>
                    {Math.abs(expenseChange).toFixed(1)}% vs last month
                  </span>
                </div>
              </DashCard>

              {/* Applications */}
              <DashCard>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Applications</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(applicationsTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{applicationsCount} applications</p>
              </DashCard>

              {/* Photostat */}
              <DashCard>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Printer className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Photostat</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(photostatTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">Margin: {formatCurrency(photostatMarginTotal)}</p>
              </DashCard>

              {/* Pending Balance */}
              <DashCard>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="font-medium text-foreground">Pending Balance</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingBalanceTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingBalanceData?.length || 0} pending entries</p>
              </DashCard>
            </div>

            {/* Third Row - Recent Activities (Full Width Ticker) */}
            <DashCard>
              <h3 className="font-medium text-foreground mb-3">Recent Activities {viewMode === 'day' ? '(Today)' : '(This Month)'}</h3>
              <div className="relative overflow-hidden h-12">
                {recentActivitiesData && recentActivitiesData.length > 0 ? (
                  <div className="flex animate-marquee whitespace-nowrap">
                    {[...recentActivitiesData, ...recentActivitiesData].map((activity, idx) => (
                      <div key={`${activity.id}-${idx}`} className="inline-flex items-center gap-3 px-4 border-r border-border/50">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.color === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'
                        }`}>
                          {activity.icon === 'banking' && <CreditCard className={`h-3 w-3 ${activity.color === 'destructive' ? 'text-destructive' : 'text-primary'}`} />}
                          {activity.icon === 'online' && <Globe className={`h-3 w-3 ${activity.color === 'destructive' ? 'text-destructive' : 'text-primary'}`} />}
                          {activity.icon === 'expense' && <Receipt className="h-3 w-3 text-destructive" />}
                          {activity.icon === 'application' && <FileText className={`h-3 w-3 text-primary`} />}
                          {activity.icon === 'photostat' && <Printer className={`h-3 w-3 text-primary`} />}
                        </div>
                        <span className="text-sm text-foreground">{activity.description}</span>
                        <span className={`text-sm font-medium ${activity.amount < 0 ? 'text-destructive' : 'text-primary'}`}>
                          {activity.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(activity.amount))}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No activities {viewMode === 'day' ? 'today' : 'this month'}</p>
                )}
              </div>
            </DashCard>

            {/* Fourth Row - Other Banking & Summary */}
            <div className="grid grid-cols-3 gap-4">
              {/* Other Banking Services */}
              <DashCard>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Other Banking</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(bankingAccountsMargin)}</p>
                <p className="text-xs text-muted-foreground mt-1">{bankingAccountsData?.length || 0} entries</p>
              </DashCard>

              {/* Total Revenue */}
              <DashCard>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Total Revenue</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(bankingServicesTotal + onlineServicesTotal + applicationsTotal + photostatTotal)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">All services combined</p>
              </DashCard>

              {/* Service Summary */}
              <DashCard>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Service Summary</h3>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Banking:</span>
                  <span className="font-medium text-foreground">{bankingServicesCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Online:</span>
                  <span className="font-medium text-foreground">{onlineServicesCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Apps:</span>
                  <span className="font-medium text-foreground">{applicationsCount}</span>
                </div>
              </DashCard>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 space-y-5">
            {/* User Profile Card */}
            <DashCard className="text-center">
              <Avatar className="w-16 h-16 mx-auto mb-3">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">U</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-foreground">User Name</h3>
              <p className="text-xs text-muted-foreground">user@example.com</p>
              <div className="flex justify-center gap-6 mt-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{applicationsCount}</p>
                  <p className="text-xs text-muted-foreground">Applications</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{bankingServicesCount}</p>
                  <p className="text-xs text-muted-foreground">Banking</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{onlineServicesCount}</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </DashCard>

            <DigitalClock />
            <NotificationBox />
            <ReminderCalendar />
          </div>
        </div>
      </div>

      {/* Margin Dialog */}
      <Dialog open={marginDialogOpen} onOpenChange={setMarginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Margin Breakdown</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {marginDetails.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-foreground">Total Margin</span>
                <span className="text-foreground">{formatCurrency(totalMargin)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
