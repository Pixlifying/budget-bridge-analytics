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
  Printer,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  Filter,
  Download,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import StatCard from '@/components/ui/StatCard';
import ModernChart from '@/components/ui/ModernChart';
import WeeklyChart from '@/components/ui/WeeklyChart';
import DistributionChart from '@/components/ui/DistributionChart';
import IntegrationList from '@/components/ui/IntegrationList';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { formatCurrency } from '@/utils/calculateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
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

  const totalMargin = bankingMargin + onlineMargin + applicationsMargin + photostatMarginTotal;
  const totalRevenue = bankingServicesTotal + onlineServicesTotal + applicationsTotal + photostatTotal;

  // Chart data for sales overview
  const salesChartData = {
    labels: ['Oct', 'Nov', 'Dec'],
    datasets: [{
      data: [bankingMargin, onlineMargin, applicationsMargin],
      backgroundColor: [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      ],
      borderRadius: 8,
    }]
  };

  // Weekly activity data
  const weeklyData = [2100, 1800, 2400, 3200, 2800, 1900, 2600];
  const weeklyLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Distribution data
  const distributionData = [
    { name: 'Banking', value: bankingMargin, color: '#667eea' },
    { name: 'Online', value: onlineMargin, color: '#f093fb' },
    { name: 'Applications', value: applicationsMargin, color: '#4facfe' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Oct 18 - Nov 18</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Monthly</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-scale-in">
          <StatCard
            title="Page Views"
            description="Total visits today"
            value="12,450"
            trend={{ value: 15.8, isPositive: true }}
            icon={<Eye className="w-5 h-5" />}
          />
          <StatCard
            title="Total Revenue"
            description="Revenue this month"
            value={formatCurrency(totalRevenue)}
            trend={{ value: 34.0, isPositive: false }}
            icon={<DollarSign className="w-5 h-5" />}
          />
          <StatCard
            title="Bounce Rate"
            description="Average bounce rate"
            value="86.5%"
            trend={{ value: 24.2, isPositive: true }}
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Overview Chart */}
          <div className="lg:col-span-2 chart-card animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Sales Overview</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="text-2xl font-bold text-foreground">{formatCurrency(totalMargin)}</span>
                  <span className="trend-positive">15.8% ↗ +₹143.50 increased</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button variant="ghost" size="sm">
                  Sort
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <ModernChart data={salesChartData} height={280} />
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <span>Banking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-pink-500 to-red-500"></div>
                <span>Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gradient-to-r from-cyan-400 to-blue-500"></div>
                <span>Applications</span>
              </div>
            </div>
          </div>

          {/* Total Subscriber */}
          <div className="chart-card animate-slide-in" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-1">Total Subscriber</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Weekly</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1">24,473</div>
                <div className="text-sm text-emerald-500 font-medium">8.3% ↗ +749 increased</div>
              </div>
              <WeeklyChart data={weeklyData} labels={weeklyLabels} maxValue={Math.max(...weeklyData)} />
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Distribution */}
          <div className="chart-card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Sales Distribution</h3>
              <Button variant="ghost" size="sm">Monthly</Button>
            </div>
            <DistributionChart data={distributionData} total={totalMargin} />
          </div>

          {/* List of Integration */}
          <div className="chart-card animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">List of Integration</h3>
              <Button variant="ghost" size="sm" className="text-primary">See All</Button>
            </div>
            <IntegrationList />
          </div>
        </div>

        {/* Margin Dialog */}
        <Dialog open={marginDialogOpen} onOpenChange={setMarginDialogOpen}>
          <DialogContent className="sm:max-w-md modern-card">
            <DialogHeader>
              <DialogTitle>Margin Breakdown</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                {[
                  { name: 'Banking Services', value: bankingMargin, color: '#667eea' },
                  { name: 'Online Services', value: onlineMargin, color: '#f093fb' },
                  { name: 'Applications', value: applicationsMargin, color: '#4facfe' },
                  { name: 'Printout and Photostat', value: photostatMarginTotal, color: '#10b981' },
                  { name: 'Pending Balance', value: pendingBalanceTotal, color: '#f59e0b' },
                  { name: 'Expenses', value: expensesTotal, color: '#ef4444' },
                ].map((item) => (
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
    </div>
  );
};

export default Dashboard;
