import { useEffect, useState } from 'react';
import { CreditCard, FileText, Globe, BarChart3, AlertCircle, Wallet, Printer, Receipt, TrendingUp, Search, Bell, MessageSquare, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
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
      const {
        data,
        error
      } = await query.order('date', {
        ascending: false
      });
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
        const startDateStr = format(startOfDay(date), 'yyyy-MM-dd');
        const endDateStr = format(endOfDay(date), 'yyyy-MM-dd');
        query = query.gte('date', startDateStr).lt('date', endDateStr + 'T23:59:59');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const {
        data,
        error
      } = await query.order('date', {
        ascending: false
      });
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
        const startDateStr = format(startOfDay(date), 'yyyy-MM-dd');
        const endDateStr = format(endOfDay(date), 'yyyy-MM-dd');
        query = query.gte('date', startDateStr).lt('date', endDateStr + 'T23:59:59');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const {
        data,
        error
      } = await query.order('date', {
        ascending: false
      });
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
        const startDateStr = format(startOfDay(date), 'yyyy-MM-dd');
        const endDateStr = format(endOfDay(date), 'yyyy-MM-dd');
        query = query.gte('date', startDateStr).lt('date', endDateStr + 'T23:59:59');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const {
        data,
        error
      } = await query.order('date', {
        ascending: false
      });
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
        const startDateStr = format(startOfDay(date), 'yyyy-MM-dd');
        const endDateStr = format(endOfDay(date), 'yyyy-MM-dd');
        query = query.gte('date', startDateStr).lt('date', endDateStr + 'T23:59:59');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const {
        data,
        error
      } = await query.order('date', {
        ascending: false
      });
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
        const startDateStr = format(startOfDay(date), 'yyyy-MM-dd');
        const endDateStr = format(endOfDay(date), 'yyyy-MM-dd');
        query = query.gte('date', startDateStr).lt('date', endDateStr + 'T23:59:59');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const {
        data,
        error
      } = await query.order('date', {
        ascending: false
      });
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
        const startDateStr = format(startOfDay(date), 'yyyy-MM-dd');
        const endDateStr = format(endOfDay(date), 'yyyy-MM-dd');
        query = query.gte('date', startDateStr).lt('date', endDateStr + 'T23:59:59');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const {
        data,
        error
      } = await query.order('date', {
        ascending: false
      });
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
      const {
        data,
        error
      } = await supabase.from('od_detail_records').select('cash_in_hand').order('date', {
        ascending: false
      }).order('created_at', {
        ascending: false
      }).limit(1);
      if (error) throw error;
      return data;
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

  // Mini line chart for cards
  const MiniLineChart = ({
    data,
    color = 'primary'
  }: {
    data: number[];
    color?: string;
  }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const height = 40;
    const width = 80;
    const points = data.map((value, index) => {
      const x = index / (data.length - 1) * width;
      const y = height - (value - min) / range * height;
      return `${x},${y}`;
    }).join(' ');
    return <svg width={width} height={height} className="overflow-visible">
        <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      </svg>;
  };

  // Mini bar chart
  const MiniBarChart = ({
    data
  }: {
    data: number[];
  }) => {
    const max = Math.max(...data);
    return <div className="flex items-end gap-1 h-10">
        {data.map((value, i) => <div key={i} className="w-2 bg-primary rounded-t" style={{
        height: `${value / max * 100}%`
      }} />)}
      </div>;
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
  }) => <div onClick={onClick} className={`
        bg-card rounded-2xl p-5 border border-border/50
        transition-all duration-200 hover:shadow-lg
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} 
        ${className}
      `}>
      {children}
    </div>;
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Hello, User!</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Explore information and activity about your property</p>
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
            {/* Top Stats Row */}
            <div className="grid grid-cols-4 gap-4">
              {/* Spent This Month */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground"> Margin</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalMargin)}</p>
                  </div>
                  <MiniBarChart data={[40, 65, 45, 80, 55, 70, 60]} />
                </div>
              </DashCard>

              {/* Banking Services */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Banking Txn</p>
                      <p className="text-xl font-bold text-foreground">{bankingServicesCount}</p>
                    </div>
                  </div>
                  <MiniLineChart data={[30, 50, 35, 60, 45, 70, 55]} />
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
                    </div>
                  </div>
                </div>
              </DashCard>

              {/* Activity */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Activity</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(bankingServicesTotal)}</p>
                  </div>
                  <MiniLineChart data={[20, 40, 30, 50, 45, 60, 55, 70]} />
                </div>
              </DashCard>
            </div>

            {/* Balance Section */}
            <div className="grid grid-cols-3 gap-4">
              {/* Balance Card - Large */}
              <DashCard className="col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">Balance</h3>
                    <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      On track
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">Monthly</span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Deposit</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(latestCashInHand)}</p>
                    
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Withdrawal</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(expensesTotal)}</p>
                    
                  </div>
                  {/* Line chart placeholder */}
                  <svg width="200" height="60" className="overflow-visible">
                    <path d="M 0 50 Q 30 45, 50 30 T 100 25 T 150 35 T 200 20" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
                    <path d="M 0 50 Q 30 45, 50 30 T 100 25 T 150 35 T 200 20 L 200 60 L 0 60 Z" fill="hsl(var(--primary) / 0.1)" />
                  </svg>
                </div>
              </DashCard>

              {/* Earnings Card */}
              <DashCard onClick={() => setMarginDialogOpen(true)}>
                <div className="mb-3">
                  <p className="text-sm text-muted-foreground">Earnings</p>
                  <p className="text-xs text-muted-foreground">Total Expense</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{formatCurrency(totalMargin)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Profit is <span className="text-primary font-medium">34%</span> More than last Month
                </p>
                {/* Circular progress */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-2xl font-bold text-primary">80%</span>
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="25" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <circle cx="30" cy="30" r="25" fill="none" stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round" strokeDasharray="126 157" transform="rotate(-90 30 30)" />
                  </svg>
                </div>
              </DashCard>
            </div>

            {/* Third Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Applications Card */}
              <DashCard>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Applications</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(applicationsTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{applicationsCount} applications</p>
              </DashCard>

              {/* Transfers Card */}
              <DashCard>
                <h3 className="font-medium text-foreground mb-3">Recent Activities</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Banking Services</p>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                    </div>
                    <span className="text-xs text-primary">+2.45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Expenses</p>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                    </div>
                    <span className="text-xs text-destructive">-4.75%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Printer className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Printout & Photostat</p>
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                    </div>
                    <span className="text-xs text-primary">+2.45%</span>
                  </div>
                </div>
              </DashCard>

              {/* Pending Balance */}
              <DashCard>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="font-medium text-foreground">Pending Balance</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingBalanceTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingBalanceData?.length || 0} pending entries</p>
              </DashCard>
            </div>

            {/* Cash in Hand Banner */}
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
                    <span className="text-xs opacity-80">Banking</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm mb-1">
                      <span className="text-2xl font-bold">{onlineServicesCount}</span>
                    </div>
                    <span className="text-xs opacity-80">Online</span>
                  </div>
                </div>
              </div>
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
            {marginDetails.map(item => <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{
                backgroundColor: item.color
              }}></div>
                  <span className="text-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
              </div>)}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-foreground">Total Margin</span>
                <span className="text-foreground">{formatCurrency(totalMargin)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Dashboard;