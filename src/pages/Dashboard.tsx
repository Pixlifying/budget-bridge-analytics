
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/layout/PageHeader';
import StatCard from '@/components/ui/StatCard';
import DoughnutChart from '@/components/ui/DoughnutChart';
import DateRangePicker from '@/components/ui/DateRangePicker';
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
      
      console.log('Online services data fetched:', data, 'for date:', date, 'mode:', viewMode);
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
      console.log('Applications data fetched:', data, 'for date:', date, 'mode:', viewMode);
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
      console.log('Photostat data fetched:', data, 'for date:', date, 'mode:', viewMode);
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
      console.log('Pending balances data fetched:', data, 'for date:', date, 'mode:', viewMode);
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
      console.log('Expenses data fetched:', data, 'for date:', date, 'mode:', viewMode);
      return data;
    }
  });

  useEffect(() => {
    if (
      bankingError ||
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

  const onlineServicesTotal = onlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;
  const onlineServicesCount = onlineData?.length || 0;
  const onlineMargin = onlineData?.reduce((sum, entry) => sum + (entry.amount * entry.count), 0) || 0;

  const applicationsTotal = applicationsData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const applicationsCount = applicationsData?.length || 0;
  const applicationsMargin = applicationsData?.reduce((sum, entry) => sum + entry.amount, 0) || 0;

  // 1. Calculate Printout/Photostat Totals and Margins
  const photostatTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.total_amount), 0) || 0;
  const photostatCount = photostatData?.length || 0;
  const photostatMarginTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.margin), 0) || 0;

  const pendingBalanceTotal = pendingBalanceData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  const expensesTotal = expensesData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const expensesCount = expensesData?.length || 0;

  // Calculate total margin including Photostat
  const totalMargin = bankingMargin + onlineMargin + applicationsMargin + photostatMarginTotal;

  // 2. Update marginProportions and marginDetails to include Printout and Photostat
  const marginProportions = [
    { name: 'Banking', value: bankingMargin },
    { name: 'Online', value: onlineMargin },
    { name: 'Applications', value: applicationsMargin },
    { name: 'Printout and Photostat', value: photostatMarginTotal },
    { name: 'Pending Balance', value: pendingBalanceTotal },
    { name: 'Expenses', value: expensesTotal },
  ];

  const getServiceColor = (serviceName: string): string => {
    switch (serviceName) {
      case 'Banking': return '#A5D6A7';
      case 'Online': return '#FFAB91';
      case 'Applications': return '#B39DDB';
      case 'Printout and Photostat': return '#F48FB1';
      case 'Photostat': return '#F48FB1'; // compatibility
      case 'Pending Balance': return '#FFB74D';
      case 'Expenses': return '#4FC3F7';
      default: return '#BDBDBD';
    }
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewModeChange = (mode: 'day' | 'month') => {
    setViewMode(mode);
  };

  const marginDetails = [
    { name: 'Banking Services', value: bankingMargin, color: '#A5D6A7' },
    { name: 'Online Services', value: onlineMargin, color: '#FFAB91' },
    { name: 'Applications', value: applicationsMargin, color: '#B39DDB' },
    { name: 'Printout and Photostat', value: photostatMarginTotal, color: '#F48FB1' },
    { name: 'Pending Balance', value: pendingBalanceTotal, color: '#FFB74D' },
    { name: 'Expenses', value: expensesTotal, color: '#4FC3F7' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      <PageHeader
        title="Dashboard"
        showThemeToggle={true}
      >
        <div className="flex items-center">
          <DateRangePicker 
            date={date}
            onDateChange={handleDateChange}
            mode={viewMode}
            onModeChange={handleViewModeChange}
          />
        </div>
      </PageHeader>

      <div className="p-6">
        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Total Margin"
            value={formatCurrency(totalMargin)}
            icon={<Wallet className="h-5 w-5" />}
            onClick={() => setMarginDialogOpen(true)}
            className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-200/50 dark:border-emerald-800/50 hover:scale-105 transition-all duration-300"
          />
          <StatCard
            title="Banking Services"
            value={bankingServicesCount}
            icon={<CreditCard className="h-5 w-5" />}
            className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-200/50 dark:border-blue-800/50 hover:scale-105 transition-all duration-300"
          />
          <StatCard
            title="Printout and Photostat"
            value={photostatCount}
            icon={<Printer className="h-5 w-5" />}
            className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-200/50 dark:border-orange-800/50 hover:scale-105 transition-all duration-300"
          />
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-5 border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Banking Services</h3>
              <BarChart3 className="h-5 w-5 text-primary opacity-70" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(bankingServicesTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margin</p>
                <p className="text-xl font-bold">{formatCurrency(bankingMargin)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{bankingServicesCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-5 border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Online Services</h3>
              <Globe className="h-5 w-5 text-primary opacity-70" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(onlineServicesTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margin</p>
                <p className="text-xl font-bold">{formatCurrency(onlineMargin)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-xl font-bold">{onlineServicesCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-5 border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Applications</h3>
              <FilePenLine className="h-5 w-5 text-primary opacity-70" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(applicationsTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Count</p>
                <p className="text-xl font-bold">{applicationsCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-5 border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Pending Balance</h3>
              <AlertCircle className="h-5 w-5 text-primary opacity-70" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(pendingBalanceTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Count</p>
                <p className="text-xl font-bold">{pendingBalanceData?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-5 border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">Printout and Photostat</h3>
              <Printer className="h-5 w-5 text-primary opacity-70" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(photostatTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Count</p>
                <p className="text-xl font-bold">{photostatCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margin</p>
                <p className="text-xl font-bold">{formatCurrency(photostatMarginTotal)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-5 border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Expenses</h3>
              <Receipt className="h-5 w-5 text-primary opacity-70" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-xl font-bold">{formatCurrency(expensesTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Count</p>
                <p className="text-xl font-bold">{expensesCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-5 border border-white/20 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] animate-scale-in">
            <h3 className="font-semibold text-lg mb-4 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Margin Distribution</h3>
            <DoughnutChart
              data={marginProportions}
              getColor={getServiceColor}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
