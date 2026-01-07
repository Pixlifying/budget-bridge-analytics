
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/layout/PageHeader';
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

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
  const [marginDialogOpen, setMarginDialogOpen] = useState(false);

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
      case 'Banking': return '#7c3aed';
      case 'Other Banking': return '#a78bfa';
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
    { name: 'Banking Services', value: bankingMargin, color: '#7c3aed' },
    { name: 'Other Banking Services', value: bankingAccountsMargin, color: '#a78bfa' },
    { name: 'Online Services', value: onlineMargin, color: '#f97316' },
    { name: 'Applications', value: applicationsMargin, color: '#10b981' },
    { name: 'Printout and Photostat', value: photostatMarginTotal, color: '#ec4899' },
    { name: 'Pending Balance', value: pendingBalanceTotal, color: '#eab308' },
    { name: 'Expenses', value: expensesTotal, color: '#06b6d4' },
  ];

  // 3D Card component for dashboard stats - matching dark sleek reference image style
  const DashboardCard = ({ 
    children, 
    className = '', 
    onClick, 
    badge,
    gradient
  }: { 
    children: React.ReactNode; 
    className?: string; 
    onClick?: () => void; 
    badge?: { value: string; positive: boolean };
    gradient?: 'violet' | 'orange' | 'emerald' | 'pink' | 'blue';
  }) => {
    const gradientStyles: Record<string, string> = {
      violet: 'from-violet-500/20 via-purple-500/10 to-transparent',
      orange: 'from-orange-500/20 via-amber-500/10 to-transparent',
      emerald: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      pink: 'from-pink-500/20 via-rose-500/10 to-transparent',
      blue: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    };
    
    return (
      <div 
        onClick={onClick}
        className={`
          relative rounded-2xl p-5 overflow-hidden
          transition-all duration-300 ease-out
          hover:translate-y-[-2px] hover:shadow-2xl
          bg-card border border-border/50
          dark:bg-[hsl(240,6%,10%)] dark:border-white/5
          ${onClick ? 'cursor-pointer' : ''} ${className}
        `}
        style={{
          boxShadow: 'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), 0 10px 40px -15px rgba(0,0,0,0.3)',
        }}
      >
        {/* Gradient overlay for dark mode */}
        {gradient && (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientStyles[gradient] || ''} pointer-events-none`} />
        )}
        
        {/* Subtle inner glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent dark:from-white/[0.02] pointer-events-none" />
        
        {/* Badge indicator */}
        {badge && (
          <div className={`
            absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1
            ${badge.positive 
              ? 'bg-emerald-500/20 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-400' 
              : 'bg-rose-500/20 text-rose-400 dark:bg-rose-500/20 dark:text-rose-400'
            }
          `}>
            <span className={`w-1.5 h-1.5 rounded-full ${badge.positive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {badge.positive ? '+' : ''}{badge.value}
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  };

  // Mini line chart component for cards
  const MiniLineChart = ({ data, color = 'violet' }: { data: number[]; color?: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const height = 40;
    const width = 120;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const colorMap: Record<string, { stroke: string; fill: string }> = {
      violet: { stroke: '#a78bfa', fill: 'url(#violetGrad)' },
      orange: { stroke: '#fb923c', fill: 'url(#orangeGrad)' },
      emerald: { stroke: '#34d399', fill: 'url(#emeraldGrad)' },
      pink: { stroke: '#f472b6', fill: 'url(#pinkGrad)' },
      blue: { stroke: '#60a5fa', fill: 'url(#blueGrad)' },
    };

    const colors = colorMap[color] || colorMap.violet;

    return (
      <svg width={width} height={height + 10} className="overflow-visible">
        <defs>
          <linearGradient id="violetGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="pinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Area fill */}
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={colors.fill}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End dot */}
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r="4"
          fill={colors.stroke}
        />
      </svg>
    );
  };

  // Icon container matching reference style
  const IconBox = ({ children, color = 'violet' }: { children: React.ReactNode; color?: string }) => {
    const colorMap: Record<string, string> = {
      violet: 'from-violet-500 to-purple-600 text-white shadow-violet-500/30',
      orange: 'from-orange-500 to-amber-600 text-white shadow-orange-500/30',
      emerald: 'from-emerald-500 to-teal-600 text-white shadow-emerald-500/30',
      pink: 'from-pink-500 to-rose-600 text-white shadow-pink-500/30',
      blue: 'from-blue-500 to-cyan-600 text-white shadow-blue-500/30',
    };
    
    return (
      <div className={`
        w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.violet}
        flex items-center justify-center shadow-lg
      `}>
        {children}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50 dark:from-[hsl(240,10%,4%)] dark:via-[hsl(240,10%,6%)] dark:to-[hsl(260,10%,8%)]">
      {/* Header */}
      <div className="bg-white/80 dark:bg-[hsl(240,6%,8%)]/90 backdrop-blur-sm border-b border-slate-200/50 dark:border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Welcome back! Here's your business summary</p>
          </div>
          <DateRangePicker 
            date={date}
            onDateChange={handleDateChange}
            mode={viewMode}
            onModeChange={handleViewModeChange}
          />
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-6">
          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Top Stats Row - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Total Margin Card with Ring Chart */}
              <DashboardCard onClick={() => setMarginDialogOpen(true)} badge={{ value: '12%', positive: true }} gradient="violet">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        className="text-violet-500/20 dark:text-violet-500/30"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <circle
                        className="text-violet-500"
                        strokeWidth="10"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                        strokeDasharray={`${totalMargin > 0 ? 251 : 0} 251`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-violet-500 dark:text-violet-400">₹{Math.round(totalMargin / 1000)}k</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Total Margin</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalMargin)}</p>
                    <button className="mt-2 px-3 py-1 bg-violet-500 hover:bg-violet-600 text-white text-xs rounded-full transition-colors">
                      VIEW DETAILS
                    </button>
                  </div>
                </div>
              </DashboardCard>

              {/* Banking Services Card */}
              <DashboardCard badge={{ value: '22%', positive: true }} gradient="orange">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <IconBox color="orange">
                      <CreditCard className="h-5 w-5" />
                    </IconBox>
                    <div>
                      <p className="text-muted-foreground text-sm">Banking Services</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(bankingServicesTotal)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Margin: {formatCurrency(bankingMargin)}</p>
                    </div>
                  </div>
                </div>
                {/* Mini line chart */}
                <div className="flex justify-end mt-2">
                  <MiniLineChart data={[40, 60, 45, 70, 55, 80, 65, 90]} color="orange" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-emerald-500">+₹2,956</span> from last period
                </p>
              </DashboardCard>

              {/* Online Services Card */}
              <DashboardCard badge={{ value: '5%', positive: false }} gradient="violet">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <IconBox color="violet">
                      <Globe className="h-5 w-5" />
                    </IconBox>
                    <div>
                      <p className="text-muted-foreground text-sm">Online Services</p>
                      <p className="text-2xl font-bold text-foreground">{formatCurrency(onlineServicesTotal)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Margin: {formatCurrency(onlineMargin)}</p>
                    </div>
                  </div>
                </div>
                {/* Mini line chart */}
                <div className="flex justify-end mt-2">
                  <MiniLineChart data={[60, 80, 40, 90, 70, 50, 85, 75]} color="violet" />
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-rose-500">-₹987</span> from last period
                </p>
              </DashboardCard>
            </div>

            {/* Second Row - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Applications Card */}
              <DashboardCard gradient="pink">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-pink-500" />
                    Applications
                  </h3>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(applicationsTotal)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{applicationsCount} applications</p>
                  </div>
                  <MiniLineChart data={[30, 50, 40, 60, 45, 70, 55]} color="pink" />
                </div>
              </DashboardCard>

              {/* Printout & Photostat */}
              <DashboardCard gradient="emerald">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <Printer className="h-4 w-4 text-emerald-500" />
                    Printout & Photostat
                  </h3>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(photostatTotal)}</p>
                    <p className="text-sm text-muted-foreground mt-1">Margin: {formatCurrency(photostatMarginTotal)}</p>
                  </div>
                  <MiniLineChart data={[25, 45, 35, 55, 40, 65, 50]} color="emerald" />
                </div>
              </DashboardCard>

              {/* Pending Balance */}
              <DashboardCard gradient="orange">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Pending Balance
                  </h3>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-foreground">{formatCurrency(pendingBalanceTotal)}</p>
                    <p className="text-sm text-muted-foreground mt-1">{pendingBalanceData?.length || 0} pending entries</p>
                  </div>
                  <div className="w-16 h-16 relative">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        className="text-orange-500/20"
                      />
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="url(#gaugeGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${pendingBalanceTotal > 0 ? 126 * 0.7 : 0} 126`}
                      />
                      <defs>
                        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f97316" />
                          <stop offset="100%" stopColor="#ef4444" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </DashboardCard>
            </div>

            {/* Third Row - Expenses and Margin Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Expenses Card */}
              <DashboardCard gradient="pink">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-foreground font-semibold flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-rose-500" />
                      Expenses
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{expensesCount} entries this period</p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-4xl font-bold text-foreground">{formatCurrency(expensesTotal)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="h-4 w-4 text-rose-500" />
                      <span className="text-sm text-rose-500">Track your expenses</span>
                    </div>
                  </div>
                  <div className="w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-rose-500/20" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="40" 
                        fill="none" 
                        stroke="#ef4444" 
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
              <DashboardCard gradient="violet">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-foreground font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-500" />
                    Margin Distribution
                  </h3>
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
                <Pie3DChart
                  data={marginProportions}
                  getColor={getServiceColor}
                />
              </DashboardCard>
            </div>

            {/* Cash in Hand Banner */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-violet-500/20">
              <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="absolute right-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 blur-xl"></div>
              <div className="absolute left-10 top-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 blur-lg"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-5 w-5 text-white/70" />
                    <h3 className="text-white/80 text-sm">Cash in Hand</h3>
                  </div>
                  <p className="text-5xl font-bold">{formatCurrency(latestCashInHand)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm mb-1">
                      <span className="text-3xl font-bold">{bankingServicesCount}</span>
                    </div>
                    <span className="text-xs text-white/70">Banking</span>
                  </div>
                  <div className="text-center">
                    <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm mb-1">
                      <span className="text-3xl font-bold">{onlineServicesCount}</span>
                    </div>
                    <span className="text-xs text-white/70">Online</span>
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