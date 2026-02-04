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
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [applicationsDialogOpen, setApplicationsDialogOpen] = useState(false);
  const [onlineServicesDialogOpen, setOnlineServicesDialogOpen] = useState(false);

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
        bankingQuery = bankingQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59.999');
      } else if (startDate && endDate) {
        bankingQuery = bankingQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data: banking } = await bankingQuery.order('created_at', { ascending: false }).limit(10);
      
      banking?.forEach(item => {
        activities.push({
          id: `banking-${item.id}`,
          type: 'Banking',
          description: `Banking ${item.transaction_count} transactions`,
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
          description: `${item.service}${item.customer_name ? ` - ${item.customer_name}` : ''}`,
          amount: item.total,
          date: item.date,
          icon: 'online',
          color: 'primary'
        });
      });

      // Fetch applications
      let appsQuery = supabase.from('applications').select('*');
      if (filterDate) {
        appsQuery = appsQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59.999');
      } else if (startDate && endDate) {
        appsQuery = appsQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data: apps } = await appsQuery.order('created_at', { ascending: false }).limit(10);

      apps?.forEach(item => {
        activities.push({
          id: `app-${item.id}`,
          type: 'Application',
          description: `Application - ${item.customer_name}`,
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
          description: `Photostat work`,
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
          description: `Expense - ${item.name}`,
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
          description: `${item.account_type} - ${item.customer_name} (${formatCurrency(item.amount)})`,
          amount: item.margin || 0,
          date: item.date,
          icon: 'banking',
          color: 'accent'
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
  const bankingAccountsMargin = bankingAccountsData?.reduce((sum, entry) => sum + Number(entry.amount || 0), 0) || 0;
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
                      <span className="text-2xl font-bold">{bankingData?.length || 0}</span>
                    </div>
                    <span className="text-xs opacity-80">Txn Days</span>
                  </div>
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
              <DashCard onClick={() => setOnlineServicesDialogOpen(true)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Online Services</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(onlineServicesTotal)}</p>
                      <p className="text-xs text-muted-foreground">{onlineServicesCount} services • Click to view</p>
                    </div>
                  </div>
                </div>
              </DashCard>

              {/* Banking Amount */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Banking Amount</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(bankingServicesTotal)}</p>
                      <p className="text-xs text-muted-foreground">Margin: {formatCurrency(bankingMargin)}</p>
                    </div>
                  </div>
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
              <DashCard onClick={() => setApplicationsDialogOpen(true)}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Applications</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(applicationsTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{applicationsCount} applications • Click to view</p>
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
              <DashCard 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setPendingDialogOpen(true)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="font-medium text-foreground">Pending Balance</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingBalanceTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingBalanceData?.length || 0} pending entries • Click to view</p>
              </DashCard>
            </div>

            {/* Third Row - Recent Activities (Vertical Ticker) */}
            <div className="grid grid-cols-4 gap-4">
              <DashCard className="col-span-3">
                <h3 className="font-medium text-foreground mb-3">Recent Activities {viewMode === 'day' ? '(Today)' : '(This Month)'}</h3>
                <div className="relative overflow-hidden h-48">
                  {recentActivitiesData && recentActivitiesData.length > 0 ? (
                    <div className="animate-vertical-ticker">
                      {[...recentActivitiesData, ...recentActivitiesData].map((activity, idx) => (
                        <div key={`${activity.id}-${idx}`} className="flex items-center gap-3 py-2.5 border-b border-border/20 hover:bg-muted/30 transition-colors rounded-lg px-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                            activity.color === 'destructive' 
                              ? 'bg-gradient-to-br from-destructive/20 to-destructive/5' 
                              : activity.color === 'accent'
                              ? 'bg-gradient-to-br from-accent/30 to-accent/10'
                              : 'bg-gradient-to-br from-primary/20 to-primary/5'
                          }`}>
                            {activity.icon === 'banking' && <CreditCard className={`h-4 w-4 ${activity.color === 'destructive' ? 'text-destructive' : activity.color === 'accent' ? 'text-accent-foreground' : 'text-primary'}`} />}
                            {activity.icon === 'online' && <Globe className={`h-4 w-4 ${activity.color === 'destructive' ? 'text-destructive' : 'text-primary'}`} />}
                            {activity.icon === 'expense' && <Receipt className="h-4 w-4 text-destructive" />}
                            {activity.icon === 'application' && <FileText className="h-4 w-4 text-primary" />}
                            {activity.icon === 'photostat' && <Printer className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground block truncate">{activity.description}</span>
                            <span className="text-xs text-muted-foreground/70">{activity.type}</span>
                          </div>
                          <span className={`text-sm font-semibold flex-shrink-0 px-2 py-1 rounded-md ${
                            activity.amount < 0 
                              ? 'text-destructive bg-destructive/10' 
                              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          }`}>
                            {activity.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(activity.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No activities {viewMode === 'day' ? 'today' : 'this month'}</p>
                  )}
                </div>
              </DashCard>
              
              {/* Quick Stats */}
              <DashCard>
                <h3 className="font-medium text-foreground mb-3">Today's Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Entries</span>
                    <span className="text-sm font-semibold text-foreground">
                      {(bankingData?.length || 0) + (onlineData?.length || 0) + (applicationsData?.length || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Banking Margin</span>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(bankingMargin)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Other Banking</span>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(bankingAccountsMargin)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Online Services</span>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(onlineMargin)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Expenses</span>
                    <span className="text-sm font-semibold text-destructive">{formatCurrency(expensesTotal)}</span>
                  </div>
                </div>
              </DashCard>
            </div>

            {/* Fourth Row - Other Banking & Summary */}
            <div className="grid grid-cols-2 gap-4">
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

      {/* Pending Balance Dialog */}
      <Dialog open={pendingDialogOpen} onOpenChange={setPendingDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Pending Balance Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {pendingBalanceData && pendingBalanceData.length > 0 ? (
              <div className="space-y-3">
                {pendingBalanceData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{item.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.address}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📞 {item.phone}</span>
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {item.service === 'Other' ? item.custom_service : item.service}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(item.amount)}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Pending</span>
                    <span className="text-destructive">{formatCurrency(pendingBalanceTotal)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending balances found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog open={applicationsDialogOpen} onOpenChange={setApplicationsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Applications Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {applicationsData && applicationsData.length > 0 ? (
              <div className="space-y-3">
                {applicationsData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{item.customer_name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                          {item.expense && (
                            <span className="text-destructive">Expense: {formatCurrency(item.expense)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(item.amount)}</p>
                        <p className="text-xs text-muted-foreground">Amount</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Applications</span>
                    <span className="text-primary">{formatCurrency(applicationsTotal)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No applications found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Online Services Dialog */}
      <Dialog open={onlineServicesDialogOpen} onOpenChange={setOnlineServicesDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Online Services Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {onlineData && onlineData.length > 0 ? (
              <div className="space-y-3">
                {onlineData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">
                          {item.service === 'Other' ? item.custom_service : item.service}
                        </h4>
                        {item.customer_name && (
                          <p className="text-sm text-muted-foreground mt-1">{item.customer_name}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                          {item.expense && (
                            <span className="text-destructive">Expense: {formatCurrency(item.expense)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(item.total)}</p>
                        <p className="text-xs text-muted-foreground">Amount: {formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Online Services</span>
                    <span className="text-primary">{formatCurrency(onlineServicesTotal)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No online services found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
