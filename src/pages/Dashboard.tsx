
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

  // Card component for consistent styling
  const DashboardCard = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-[0_4px_20px_rgba(124,58,237,0.08)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.12)] transition-all duration-300 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-violet-100 dark:border-slate-700 px-6 py-4">
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
              <DashboardCard onClick={() => setMarginDialogOpen(true)} className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      className="text-violet-100 dark:text-slate-700"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-violet-500"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="42"
                      cx="50"
                      cy="50"
                      strokeDasharray={`${totalMargin > 0 ? 264 : 0} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-violet-600 dark:text-violet-400">₹{Math.round(totalMargin / 1000)}k</span>
                  </div>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Total Margin</p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalMargin)}</p>
                  <button className="mt-2 px-3 py-1 bg-violet-500 text-white text-xs rounded-full hover:bg-violet-600 transition-colors">
                    VIEW DETAILS
                  </button>
                </div>
              </DashboardCard>

              {/* Banking Services Card */}
              <DashboardCard>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Banking Services</h3>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mb-3">{formatCurrency(bankingServicesTotal)}</p>
                {/* Mini line chart visual */}
                <div className="h-12 flex items-end gap-1">
                  {[40, 60, 45, 70, 55, 80, 65].map((height, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t opacity-80"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>Margin: {formatCurrency(bankingMargin)}</span>
                  <span>{bankingServicesCount} txns</span>
                </div>
              </DashboardCard>

              {/* Online Services Card */}
              <DashboardCard>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Online Services</h3>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mb-3">{formatCurrency(onlineServicesTotal)}</p>
                {/* Mini bar chart */}
                <div className="h-12 flex items-end gap-2">
                  {[60, 80, 40, 90, 70, 50, 85].map((height, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-gradient-to-t from-violet-500 to-violet-400 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>Margin: {formatCurrency(onlineMargin)}</span>
                  <span>{onlineServicesCount} txns</span>
                </div>
              </DashboardCard>
            </div>

            {/* Second Row - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Applications Card with 3D bars */}
              <DashboardCard>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-slate-800 dark:text-white font-semibold">Applications</h3>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-end gap-2 h-20">
                    <div className="w-10 bg-gradient-to-t from-pink-500 to-pink-400 rounded-t relative" style={{ height: '80%' }}>
                      <div className="absolute -top-1 left-0 w-full h-3 bg-pink-300 rounded-t transform skew-x-12 origin-bottom-left"></div>
                    </div>
                    <div className="w-10 bg-gradient-to-t from-violet-500 to-violet-400 rounded-t relative" style={{ height: '100%' }}>
                      <div className="absolute -top-1 left-0 w-full h-3 bg-violet-300 rounded-t transform skew-x-12 origin-bottom-left"></div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                      <span className="text-xs text-slate-500">Amount</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(applicationsTotal)}</p>
                    <div className="flex items-center gap-2 mt-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                      <span className="text-xs text-slate-500">Count</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{applicationsCount}</p>
                  </div>
                </div>
              </DashboardCard>

              {/* Printout & Photostat with 3D hexagon style */}
              <DashboardCard>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-slate-800 dark:text-white font-semibold">Printout & Photostat</h3>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 relative">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <polygon 
                        points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5" 
                        fill="url(#hexGradient)" 
                        stroke="#10b981" 
                        strokeWidth="2"
                      />
                      <defs>
                        <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs text-slate-500">Amount</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(photostatTotal)}</p>
                    <div className="flex items-center gap-2 mt-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                      <span className="text-xs text-slate-500">Margin</span>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(photostatMarginTotal)}</p>
                  </div>
                </div>
              </DashboardCard>

              {/* Pending Balance with gauge style */}
              <DashboardCard>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-slate-800 dark:text-white font-semibold">Pending Balance</h3>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-12 relative">
                    <svg viewBox="0 0 100 50" className="w-full h-full">
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                        strokeLinecap="round"
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                      <span className="text-xs text-slate-500">Total Pending</span>
                    </div>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{formatCurrency(pendingBalanceTotal)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs text-slate-500">Count: {pendingBalanceData?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </DashboardCard>
            </div>

            {/* Third Row - Expenses and Margin Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Expenses Card */}
              <DashboardCard>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-slate-800 dark:text-white font-semibold">Expenses</h3>
                    <p className="text-xs text-slate-500 mt-1">{expensesCount} entries this period</p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-4xl font-bold text-slate-800 dark:text-white">{formatCurrency(expensesTotal)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingUp className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-500">Track your expenses</span>
                    </div>
                  </div>
                  <div className="w-24 h-24">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#fee2e2" strokeWidth="12" />
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
              <DashboardCard>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-slate-800 dark:text-white font-semibold">Margin Distribution</h3>
                  <MoreHorizontal className="h-4 w-4 text-slate-400" />
                </div>
                <Pie3DChart
                  data={marginProportions}
                  getColor={getServiceColor}
                />
              </DashboardCard>
            </div>

            {/* Cash in Hand Banner */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute right-20 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-white/80 text-sm mb-1">Cash in Hand</h3>
                  <p className="text-4xl font-bold">{formatCurrency(latestCashInHand)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <span className="text-2xl font-bold">{bankingServicesCount}</span>
                  </div>
                  <div className="bg-white/20 rounded-full p-2">
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