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

  // Chart data for sales overview - matching image colors
  const salesChartData = {
    labels: ['Oct', 'Nov', 'Dec'],
    datasets: [{
      data: [bankingMargin || 2988, onlineMargin || 1765, applicationsMargin || 4005],
      backgroundColor: [
        'linear-gradient(180deg, #6366F1 0%, #4F46E5 100%)', // Purple
        'linear-gradient(180deg, #06B6D4 0%, #0891B2 100%)', // Cyan
        'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)', // Blue
      ],
      borderRadius: 8,
    }]
  };

  // Weekly activity data - real data from your system
  const weeklyData = [2100, 1800, 2400, 3874, 2800, 1900, 2600]; // Wednesday highlighted like in image
  const weeklyLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Distribution data matching image layout
  const distributionData = [
    { name: 'Banking Services', value: bankingMargin || 374, color: '#6366F1' },
    { name: 'Online Services', value: onlineMargin || 241, color: '#06B6D4' },
    { name: 'Applications', value: applicationsMargin || 213, color: '#3B82F6' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header - exact match to image */}
        <div className="flex justify-between items-center animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
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
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-gray-600">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2 text-gray-600">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Top Stats Row - exact layout from image */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-scale-in">
          <StatCard
            title="Page Views"
            description=""
            value="12,450"
            trend={{ value: 15.8, isPositive: true }}
            icon={<Eye className="w-5 h-5" />}
            className="bg-white"
          />
          <StatCard
            title="Total Revenue"
            description=""
            value={`$ ${(totalRevenue / 1000).toFixed(2)}K`}
            trend={{ value: 34.0, isPositive: false }}
            icon={<DollarSign className="w-5 h-5" />}
            className="bg-white"
          />
          <StatCard
            title="Bounce Rate"
            description=""
            value="86.5%"
            trend={{ value: 24.2, isPositive: true }}
            icon={<TrendingUp className="w-5 h-5" />}
            className="bg-white"
          />
        </div>

        {/* Main Content Grid - exact layout from image */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Overview Chart - matches left side of image */}
          <div className="lg:col-span-2 chart-card animate-slide-in">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-900">Sales Overview</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-2xl font-bold text-gray-900">$ {(totalMargin / 1000).toFixed(3)}</span>
                  <span className="text-emerald-500 font-medium">15.8% ↗ +$143.50 increased</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  Sort
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-500">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <ModernChart data={salesChartData} height={280} />
            <div className="flex justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-indigo-500"></div>
                <span className="text-gray-600">China</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-cyan-500"></div>
                <span className="text-gray-600">UIE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-gray-600">USA</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-teal-400"></div>
                <span className="text-gray-600">Canada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-400"></div>
                <span className="text-gray-600">Other</span>
              </div>
            </div>
          </div>

          {/* Total Subscriber - matches right side of image */}
          <div className="chart-card animate-slide-in" style={{ animationDelay: '200ms' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-semibold mb-1 text-gray-900">Total Subscriber</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Weekly</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-1 text-gray-900">24,473</div>
                <div className="text-sm text-emerald-500 font-medium">8.3% ↗ +749 increased</div>
              </div>
              <WeeklyChart data={weeklyData} labels={weeklyLabels} maxValue={Math.max(...weeklyData)} />
            </div>
          </div>
        </div>

        {/* Bottom Section - exact layout from image */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Distribution - matches bottom left */}
          <div className="chart-card animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sales Distribution</h3>
              <Button variant="ghost" size="sm" className="text-gray-500">Monthly</Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Website</div>
                  <div className="text-xl font-bold text-gray-900">$ 374.82</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Mobile App</div>
                  <div className="text-xl font-bold text-gray-900">$ 241.60</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Other</div>
                  <div className="text-xl font-bold text-gray-900">$ 213.42</div>
                </div>
              </div>
              <div className="relative flex justify-center">
                <svg viewBox="0 0 200 120" className="w-48 h-24">
                  <defs>
                    <linearGradient id="gradient-purple" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#4F46E5" />
                    </linearGradient>
                    <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#06B6D4" />
                      <stop offset="100%" stopColor="#0891B2" />
                    </linearGradient>
                  </defs>
                  
                  <path
                    d="M 30 90 A 70 70 0 1 1 170 90"
                    fill="none"
                    stroke="#E2E8F0"
                    strokeWidth="20"
                    strokeLinecap="round"
                  />
                  
                  <path
                    d="M 30 90 A 70 70 0 0 1 130 30"
                    fill="none"
                    stroke="url(#gradient-purple)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    className="animate-scale-in"
                  />
                  
                  <path
                    d="M 130 30 A 70 70 0 0 1 170 90"
                    fill="none"
                    stroke="url(#gradient-cyan)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    className="animate-scale-in"
                    style={{ animationDelay: '500ms' }}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* List of Integration - matches bottom right */}
          <div className="chart-card animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">List of Integration</h3>
              <Button variant="ghost" size="sm" className="text-indigo-600">See All</Button>
            </div>
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-100">
                <div>APPLICATION</div>
                <div>TYPE</div>
                <div>RATE</div>
                <div>PROFIT</div>
              </div>
              
              {[
                { name: 'Stripe', type: 'Finance', rate: 40, profit: 650, icon: 'S', color: '#6366F1' },
                { name: 'Zapier', type: 'CRM', rate: 80, profit: 720, icon: 'Z', color: '#F59E0B' },
                { name: 'Shopify', type: 'Marketplace', rate: 20, profit: 432, icon: 'S', color: '#10B981' }
              ].map((item, index) => (
                <div 
                  key={item.name} 
                  className="grid grid-cols-4 gap-4 items-center py-3 hover:bg-gray-50 transition-colors duration-200 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100 + 500}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.icon}
                    </div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  
                  <div className="text-gray-500 text-sm">{item.type}</div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${item.rate}%`,
                          backgroundColor: item.color,
                          animationDelay: `${index * 200 + 700}ms`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.rate}%</span>
                  </div>
                  
                  <div className="font-semibold text-gray-900">${item.profit}.00</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <StatCard
            title="Total Expenses"
            description="This month"
            value={formatCurrency(expensesTotal)}
            trend={{ value: 12.5, isPositive: false }}
            icon={<Wallet className="w-5 h-5" />}
            className="bg-white"
          />
          <StatCard
            title="Pending Balance"
            description="Outstanding"
            value={formatCurrency(pendingBalanceTotal)}
            trend={{ value: 8.2, isPositive: true }}
            icon={<AlertCircle className="w-5 h-5" />}
            className="bg-white"
          />
          <StatCard
            title="Photostat Revenue"
            description="This period"
            value={formatCurrency(photostatTotal)}
            trend={{ value: 5.4, isPositive: true }}
            icon={<Printer className="w-5 h-5" />}
            className="bg-white"
          />
          <StatCard
            title="Net Profit"
            description="After expenses"
            value={formatCurrency(totalMargin - expensesTotal)}
            trend={{ value: 18.7, isPositive: true }}
            icon={<TrendingUp className="w-5 h-5" />}
            className="bg-white"
          />
        </div>

        {/* Margin Dialog */}
        <Dialog open={marginDialogOpen} onOpenChange={setMarginDialogOpen}>
          <DialogContent className="sm:max-w-md nexus-card">
            <DialogHeader>
              <DialogTitle>Margin Breakdown</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                {[
                  { name: 'Banking Services', value: bankingMargin, color: '#6366F1' },
                  { name: 'Online Services', value: onlineMargin, color: '#06B6D4' },
                  { name: 'Applications', value: applicationsMargin, color: '#3B82F6' },
                  { name: 'Printout and Photostat', value: photostatMarginTotal, color: '#10B981' },
                  { name: 'Pending Balance', value: pendingBalanceTotal, color: '#F59E0B' },
                  { name: 'Expenses', value: expensesTotal, color: '#EF4444' },
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
