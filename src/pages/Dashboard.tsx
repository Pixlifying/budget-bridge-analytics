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
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import StatCard from '@/components/ui/StatCard';
import ModernChart from '@/components/ui/ModernChart';
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

  const photostatTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.total_amount), 0) || 0;
  const photostatCount = photostatData?.length || 0;
  const photostatMarginTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.margin), 0) || 0;

  const pendingBalanceTotal = pendingBalanceData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  const expensesTotal = expensesData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const expensesCount = expensesData?.length || 0;

  // Calculate total margin and profit
  const totalMargin = bankingMargin + onlineMargin + applicationsMargin + photostatMarginTotal;
  const totalIncome = bankingServicesTotal + onlineServicesTotal + applicationsTotal + photostatTotal + pendingBalanceTotal;
  const netProfit = totalMargin - expensesTotal;

  // Chart data
  const monthlyData = [
    { name: 'Banking', value: bankingMargin, income: bankingServicesTotal, expenses: 0 },
    { name: 'Online', value: onlineMargin, income: onlineServicesTotal, expenses: 0 },
    { name: 'Applications', value: applicationsMargin, income: applicationsTotal, expenses: 0 },
    { name: 'Photostat', value: photostatMarginTotal, income: photostatTotal, expenses: 0 },
    { name: 'Expenses', value: expensesTotal, income: 0, expenses: expensesTotal },
  ];

  const pieData = [
    { name: 'Banking Services', value: bankingMargin },
    { name: 'Online Services', value: onlineMargin },
    { name: 'Applications', value: applicationsMargin },
    { name: 'Printout & Photostat', value: photostatMarginTotal },
  ].filter(item => item.value > 0);

  const getServiceColor = (serviceName: string): string => {
    switch (serviceName) {
      case 'Banking': return '#A5D6A7';
      case 'Online': return '#FFAB91';
      case 'Applications': return '#B39DDB';
      case 'Printout & Photostat': return '#F48FB1';
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
    { name: 'Banking Services', value: bankingMargin, color: '#3B82F6' },
    { name: 'Online Services', value: onlineMargin, color: '#8B5CF6' },
    { name: 'Applications', value: applicationsMargin, color: '#06D6A0' },
    { name: 'Printout & Photostat', value: photostatMarginTotal, color: '#F59E0B' },
    { name: 'Pending Balance', value: pendingBalanceTotal, color: '#EF4444' },
    { name: 'Expenses', value: expensesTotal, color: '#EC4899' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <PageWrapper
        title="Financial Analytics"
        subtitle="Real-time business insights and performance metrics"
        action={
          <div className="flex items-center">
            <DateRangePicker 
              date={date}
              onDateChange={handleDateChange}
              mode={viewMode}
              onModeChange={handleViewModeChange}
            />
          </div>
        }
      >
        {/* Main Stats Cards */}
        <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Income"
            value={formatCurrency(totalIncome)}
            icon={<TrendingUp className="h-6 w-6" />}
            trend={{ value: 8.7, isPositive: true }}
            gradient="income"
          />
          <StatCard
            title="Total Expenses" 
            value={formatCurrency(expensesTotal)}
            icon={<TrendingDown className="h-6 w-6" />}
            trend={{ value: 6.3, isPositive: false }}
            gradient="expense"
          />
          <StatCard
            title="Net Profit"
            value={formatCurrency(netProfit)}
            icon={<Wallet className="h-6 w-6" />}
            trend={{ value: 21.4, isPositive: true }}
            onClick={() => setMarginDialogOpen(true)}
            gradient="profit"
          />
          <StatCard
            title="Total Transactions"
            value={bankingServicesCount + onlineServicesCount + applicationsCount + photostatCount}
            icon={<BarChart3 className="h-6 w-6" />}
            trend={{ value: 12.5, isPositive: true }}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Overview Chart */}
          <div className="glassmorphism rounded-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">Revenue Overview</h3>
              <BarChart3 className="h-5 w-5 text-primary opacity-70" />
            </div>
            <ModernChart data={monthlyData} type="bar" height={300} />
          </div>

          {/* Margin Distribution */}
          <div className="glassmorphism rounded-2xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-foreground">Margin Distribution</h3>
              <Wallet className="h-5 w-5 text-primary opacity-70" />
            </div>
            <ModernChart data={pieData} type="pie" height={300} />
          </div>
        </div>

        {/* Service Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="glassmorphism rounded-2xl p-6 animate-scale-in gradient-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-foreground">Banking Services</h3>
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(bankingServicesTotal)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Margin</p>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(bankingMargin)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transactions</p>
                  <p className="text-xl font-bold text-foreground">{bankingServicesCount}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glassmorphism rounded-2xl p-6 animate-scale-in gradient-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-foreground">Online Services</h3>
              <Globe className="h-5 w-5 text-purple-400" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(onlineServicesTotal)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Margin</p>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(onlineMargin)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="text-xl font-bold text-foreground">{onlineServicesCount}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glassmorphism rounded-2xl p-6 animate-scale-in gradient-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-foreground">Applications</h3>
              <FilePenLine className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(applicationsTotal)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Count</p>
                  <p className="text-xl font-bold text-foreground">{applicationsCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margin</p>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(applicationsMargin)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glassmorphism rounded-2xl p-6 animate-scale-in gradient-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-foreground">Printout & Photostat</h3>
              <Printer className="h-5 w-5 text-orange-400" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(photostatTotal)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Count</p>
                  <p className="text-xl font-bold text-foreground">{photostatCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margin</p>
                  <p className="text-xl font-bold text-green-400">{formatCurrency(photostatMarginTotal)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glassmorphism rounded-2xl p-6 animate-scale-in gradient-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-foreground">Pending Balance</h3>
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingBalanceTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Count</p>
                <p className="text-xl font-bold text-foreground">{pendingBalanceData?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="glassmorphism rounded-2xl p-6 animate-scale-in gradient-expense">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-foreground">Total Expenses</h3>
              <DollarSign className="h-5 w-5 text-red-400" />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-red-400">{formatCurrency(expensesTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Count</p>
                <p className="text-xl font-bold text-foreground">{expensesCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Margin Breakdown Dialog */}
        <Dialog open={marginDialogOpen} onOpenChange={setMarginDialogOpen}>
          <DialogContent className="sm:max-w-md glassmorphism border-border/50">
            <DialogHeader>
              <DialogTitle className="text-foreground">Margin Breakdown</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                {marginDetails.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="border-t border-border/50 pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg p-3 rounded-lg bg-primary/20">
                    <span className="text-foreground">Total Margin</span>
                    <span className="text-primary">{formatCurrency(totalMargin)}</span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PageWrapper>
    </div>
  );
};

export default Dashboard;
