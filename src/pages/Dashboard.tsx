
import { useEffect, useState } from 'react';
import {
  CreditCard,
  FileText,
  Globe, 
  BarChart3,
  FilePenLine,
  AlertCircle,
  DollarSign,
  Wallet,
  X,
  Printer,
  Receipt,
  MoreHorizontal,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import Pie3DChart from '@/components/ui/Pie3DChart';
import DateRangePicker from '@/components/ui/DateRangePicker';
import NotificationBox from '@/components/ui/NotificationBox';
import ReminderCalendar from '@/components/ui/ReminderCalendar';
import DigitalClock from '@/components/ui/DigitalClock';
import {
  formatCurrency,
  getTotalMargin,
} from '@/utils/calculateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [marginDialogOpen, setMarginDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: bankingData, error: bankingError } = useQuery({
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
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: onlineData, error: onlineError } = useQuery({
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
      
      const { data, error } = await query.order('date', { ascending: false });
      if (error) {
        throw error;
      }
      
      return data;
    }
  });

  const { data: applicationsData, error: applicationsError } = useQuery({
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
      
      const { data, error } = await query.order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: photostatData, error: photostatError } = useQuery({
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
      
      const { data, error } = await query.order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: bankingAccountsData, error: bankingAccountsError } = useQuery({
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
      
      const { data, error } = await query.order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: pendingBalanceData, error: pendingBalanceError } = useQuery({
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
      
      const { data, error } = await query.order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: expensesData, error: expensesError } = useQuery({
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
      
      const { data, error } = await query.order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  // Fetch latest cash in hand from OD detail records with real-time updates
  const { data: odRecordsData, refetch: refetchOdRecords } = useQuery({
    queryKey: ['odRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('od_detail_records')
        .select('cash_in_hand')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      return data;
    }
  });

  // Real-time subscription for OD records
  useEffect(() => {
    const channel = supabase
      .channel('od-records-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'od_detail_records'
        },
        () => {
          refetchOdRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchOdRecords]);

  useEffect(() => {
    if (
      bankingError ||
      bankingAccountsError ||
      onlineError ||
      applicationsError ||
      photostatError ||
      pendingBalanceError ||
      expensesError
    ) {
      toast.error('Failed to load data');
    }
  }, [
    bankingError,
    bankingAccountsError,
    onlineError,
    applicationsError,
    photostatError,
    pendingBalanceError,
    expensesError,
  ]);

  // Calculate metrics from fetched data
  const bankingServicesTotal = bankingData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const bankingServicesCount = bankingData?.reduce((sum, entry) => sum + (entry.transaction_count || 1), 0) || 0;
  const bankingMargin = bankingData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const bankingServicesDays = bankingData?.reduce((uniqueDays, entry) => {
    const dateStr = format(new Date(entry.date), 'yyyy-MM-dd');
    return uniqueDays.includes(dateStr) ? uniqueDays : [...uniqueDays, dateStr];
  }, [] as string[])?.length || 0;
  
  const bankingAccountsMargin = bankingAccountsData?.reduce((sum, entry) => sum + Number(entry.margin || 0), 0) || 0;

  const onlineServicesTotal = onlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;
  const onlineServicesCount = onlineData?.length || 0;
  const onlineMargin = onlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;

  const applicationsTotal = applicationsData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const applicationsCount = applicationsData?.length || 0;
  const applicationsMargin = applicationsData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  const photostatTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const photostatCount = photostatData?.length || 0;
  const photostatMarginTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.margin), 0) || 0;

  const pendingBalanceTotal = pendingBalanceData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  const expensesTotal = expensesData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const expensesCount = expensesData?.length || 0;

  // Get latest cash in hand
  const latestCashInHand = odRecordsData?.[0]?.cash_in_hand || 0;

  // Calculate total margin including Photostat and Other Banking Services
  const totalMargin = bankingMargin + bankingAccountsMargin + onlineMargin + applicationsMargin + photostatMarginTotal;

  const marginProportions = [
    { name: 'Banking', value: bankingMargin },
    { name: 'Other Banking', value: bankingAccountsMargin },
    { name: 'Online', value: onlineMargin },
    { name: 'Applications', value: applicationsMargin },
    { name: 'Printout and Photostat', value: photostatMarginTotal },
    { name: 'Pending Balance', value: pendingBalanceTotal },
    { name: 'Expenses', value: expensesTotal },
  ];

  const getServiceColor = (serviceName: string): string => {
    switch (serviceName) {
      case 'Banking': return 'hsl(var(--primary))';
      case 'Other Banking': return 'hsl(var(--accent))';
      case 'Online': return '#f97316';
      case 'Applications': return '#10b981';
      case 'Printout and Photostat': return '#ec4899';
      case 'Photostat': return '#ec4899';
      case 'Pending Balance': return '#eab308';
      case 'Expenses': return '#06b6d4';
      default: return '#94a3b8';
    }
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewModeChange = (mode: 'day' | 'month') => {
    setViewMode(mode);
  };

  const marginDetails = [
    { name: 'Banking Services', value: bankingMargin, color: 'hsl(var(--primary))' },
    { name: 'Other Banking Services', value: bankingAccountsMargin, color: 'hsl(var(--accent))' },
    { name: 'Online Services', value: onlineMargin, color: '#f97316' },
    { name: 'Applications', value: applicationsMargin, color: '#10b981' },
    { name: 'Printout and Photostat', value: photostatMarginTotal, color: '#ec4899' },
    { name: 'Pending Balance', value: pendingBalanceTotal, color: '#eab308' },
    { name: 'Expenses', value: expensesTotal, color: '#06b6d4' },
  ];

  // 3D Dashboard Card component
  const DashboardCard = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={`card-3d bg-card dark:bg-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );

  // Stats card for top row
  const StatsCard = ({ 
    title, 
    value, 
    subValue, 
    icon, 
    trend, 
    trendValue,
    colorClass = 'bg-primary/10 text-primary'
  }: { 
    title: string; 
    value: string; 
    subValue?: string; 
    icon: React.ReactNode;
    trend?: 'up' | 'down';
    trendValue?: string;
    colorClass?: string;
  }) => (
    <DashboardCard className="flex items-start justify-between">
      <div className="flex-1">
        <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {subValue && <span className="text-sm text-muted-foreground">- {subValue}</span>}
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
            <span className={`px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {trend === 'up' ? '+' : '-'}{trendValue}
            </span>
          </div>
        )}
      </div>
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
          <circle
            className="text-muted/30"
            strokeWidth="3"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="18"
            cy="18"
          />
          <circle
            className="text-primary"
            strokeWidth="3"
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r="16"
            cx="18"
            cy="18"
            strokeDasharray="75 100"
          />
        </svg>
      </div>
    </DashboardCard>
  );

  return (
    <div className="min-h-screen theme-gradient-bg">
      {/* Header */}
      <div className="glassmorphism border-b border-border/50 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">WELCOME BACK</h1>
            <p className="text-sm text-muted-foreground mt-1">Here's your business summary</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Input 
                placeholder="Search here" 
                className="w-64 pl-10 bg-card border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <DateRangePicker 
              date={date}
              onDateChange={handleDateChange}
              mode={viewMode}
              onModeChange={handleViewModeChange}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Section: Bills */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Bills</h2>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard 
                  title="Total Margin"
                  value={formatCurrency(totalMargin).split('₹')[1] || '0'}
                  subValue={bankingServicesCount.toString()}
                  icon={<CreditCard className="w-5 h-5" />}
                  trend="up"
                  trendValue="42%"
                />
                <StatsCard 
                  title="Banking Services"
                  value={bankingServicesCount.toString()}
                  subValue={bankingServicesDays.toString()}
                  icon={<Wallet className="w-5 h-5" />}
                  trend="up"
                  trendValue="22%"
                  colorClass="bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600"
                />
                <StatsCard 
                  title="Pending Balance"
                  value={(pendingBalanceData?.length || 0).toString()}
                  icon={<AlertCircle className="w-5 h-5" />}
                  trend="down"
                  trendValue="5%"
                  colorClass="bg-red-100 dark:bg-red-900/30 text-red-600"
                />
                <StatsCard 
                  title="Applications"
                  value={applicationsCount.toString()}
                  subValue={onlineServicesCount.toString()}
                  icon={<FileText className="w-5 h-5" />}
                  trend="up"
                  trendValue="5%"
                  colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                />
              </div>
            </div>

            {/* Section: Invoices */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Invoices</h2>
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Amount Owed Card - Purple gradient card */}
                <DashboardCard onClick={() => setMarginDialogOpen(true)} className="primary-gradient text-primary-foreground relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-16 h-10 relative">
                        <svg viewBox="0 0 100 50" className="w-full h-full">
                          <path
                            d="M 10 45 A 35 35 0 0 1 90 45"
                            fill="none"
                            stroke="rgba(255,255,255,0.3)"
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          <path
                            d="M 10 45 A 35 35 0 0 1 90 45"
                            fill="none"
                            stroke="#facc15"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${45 * 1.1} 110`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-bold text-white">45%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3 inline-block mb-4">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <p className="text-white/80 text-sm">Amount Owed</p>
                    <p className="text-3xl font-bold">{formatCurrency(totalMargin)}</p>
                    <p className="text-white/60 text-sm mt-1">{formatCurrency(bankingAccountsMargin)}</p>
                  </div>
                </DashboardCard>

                {/* Paid Invoices & Live Jobs */}
                <div className="space-y-4">
                  <DashboardCard>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                        <span>+5%</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">Paid Invoices</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(bankingServicesTotal)}</p>
                    <p className="text-xs text-muted-foreground">Current Financial Year</p>
                  </DashboardCard>

                  <DashboardCard>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-accent" />
                      </div>
                      <div className="relative w-10 h-10">
                        <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
                          <circle className="text-muted/20" strokeWidth="3" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" />
                          <circle className="text-primary" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="transparent" r="14" cx="18" cy="18" strokeDasharray="85 100" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">85%</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">Live Jobs Value</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(onlineServicesTotal)}</p>
                    <p className="text-xs text-muted-foreground">Current Financial Year</p>
                  </DashboardCard>
                </div>

                {/* Bar Chart Card */}
                <DashboardCard>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{format(date, 'MMM yyyy')}</span>
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="h-40 flex items-end gap-2 px-2">
                    {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, i) => {
                      const heights = [45, 60, 40, 75, 55, 50, 70, 65];
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <div 
                            className="w-full bg-primary/80 rounded-t animate-bar-grow"
                            style={{ 
                              height: `${heights[i]}%`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                          <span className="text-xs text-muted-foreground">{month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-4">
                    <Button variant="ghost" size="sm" className="text-xs">Yearly Statement</Button>
                    <Button variant="ghost" size="sm" className="text-xs">View History</Button>
                  </div>
                </DashboardCard>
              </div>
            </div>

            {/* Third Row - Expenses and Margin Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Expenses Card */}
              <DashboardCard>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Expenses</h3>
                    <p className="text-xs text-muted-foreground mt-1">{expensesCount} entries this period</p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-4xl font-bold text-foreground">{formatCurrency(expensesTotal)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">Track your expenses</span>
                    </div>
                  </div>
                  <div className="w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${expensesTotal > 0 ? 180 : 0} 251`}
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                  </div>
                </div>
              </DashboardCard>

              {/* Margin Distribution Chart */}
              <DashboardCard>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground">Margin Distribution</h3>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                <Pie3DChart
                  data={marginProportions}
                  getColor={getServiceColor}
                />
              </DashboardCard>
            </div>

            {/* Cash in Hand Banner */}
            <div className="primary-gradient rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-primary-foreground/80 text-sm mb-1">Cash in Hand</h3>
                  <p className="text-4xl font-bold">{formatCurrency(latestCashInHand)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full px-4 py-2">
                    <span className="text-2xl font-bold">{bankingServicesCount}</span>
                  </div>
                  <div className="bg-white/20 rounded-full px-4 py-2">
                    <span className="text-2xl font-bold">{onlineServicesCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 space-y-5">
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
          <div className="py-4">
            <div className="space-y-4">
              {marginDetails.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.value)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex items-center justify-between font-bold">
                  <span>Total Margin</span>
                  <span>{formatCurrency(totalMargin)}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
