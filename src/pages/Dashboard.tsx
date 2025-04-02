
import { useEffect, useState } from 'react';
import {
  CreditCard,
  FileText,
  ScrollText,
  Wallet,
  BarChart3,
  Globe,
  FilePenLine,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';

import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import StatCard from '@/components/ui/StatCard';
import DoughnutChart from '@/components/ui/DoughnutChart';
import DateRangePicker from '@/components/ui/DateRangePicker';
import {
  formatCurrency,
  getTotalMargin,
} from '@/utils/calculateUtils';

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);

  const { data: panCardData, error: panCardError } = useQuery({
    queryKey: ['panCards', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('pan_cards').select('*');
      
      if (viewMode === 'day') {
        // Filter by exact date
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      } else if (viewMode === 'month') {
        // Filter by month range
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

  const { data: passportData, error: passportError } = useQuery({
    queryKey: ['passports', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('passports').select('*');
      
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

  const { data: applicationsData, error: applicationsError } = useQuery({
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

  const { data: pendingBalanceData, error: pendingBalanceError } = useQuery({
    queryKey: ['pendingBalances', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('pending_balances').select('*');
      
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

  useEffect(() => {
    if (
      panCardError ||
      passportError ||
      bankingError ||
      onlineError ||
      applicationsError ||
      photostatError ||
      pendingBalanceError
    ) {
      toast.error('Failed to load data');
    }
  }, [
    panCardError,
    passportError,
    bankingError,
    onlineError,
    applicationsError,
    photostatError,
    pendingBalanceError,
  ]);

  // Get total margin
  const totalMargin = getTotalMargin(
    panCardData || [],
    passportData || [],
    bankingData || [],
    onlineData || [],
    applicationsData || [],
    photostatData || []
  );

  // Calculate service specific totals
  const panCardMargin = panCardData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const passportMargin = passportData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const bankingMargin = bankingData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const onlineMargin = onlineData?.reduce((sum, entry) => {
    return sum + (entry.amount * entry.count);
  }, 0) || 0;
  const applicationsMargin = applicationsData?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
  // Calculate photostat margin
  const photostatMarginTotal = photostatData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;

  // Calculate pending balance total
  const pendingBalanceTotal = pendingBalanceData?.reduce((sum, entry) => sum + entry.amount, 0) || 0;

  // Calculate banking services stats
  const bankingServicesTotal = bankingData?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const bankingServicesCount = bankingData?.length || 0;
  
  // Calculate online services stats
  const onlineServicesTotal = onlineData?.reduce((sum, entry) => sum + entry.total, 0) || 0;
  const onlineServicesCount = onlineData?.length || 0;
  
  // Calculate applications stats
  const applicationsTotal = applicationsData?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
  const applicationsCount = applicationsData?.length || 0;

  // Calculate proportions for the chart
  const marginProportions = [
    { name: 'PAN Card', value: panCardMargin },
    { name: 'Passport', value: passportMargin },
    { name: 'Banking', value: bankingMargin },
    { name: 'Online', value: onlineMargin },
    { name: 'Applications', value: applicationsMargin },
    { name: 'Photostat', value: photostatMarginTotal },
  ];

  const getServiceColor = (serviceName: string): string => {
    switch (serviceName) {
      case 'PAN Card':
        return '#FFD480'; // Light Orange
      case 'Passport':
        return '#90CAF9'; // Light Blue
      case 'Banking':
        return '#A5D6A7'; // Light Green
      case 'Online':
        return '#FFAB91'; // Light Red
      case 'Applications':
        return '#B39DDB'; // Light Purple
      case 'Photostat':
        return '#F48FB1'; // Light Pink
      default:
        return '#BDBDBD'; // Light Gray
    }
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewModeChange = (mode: 'day' | 'month') => {
    setViewMode(mode);
  };

  // Render component
  return (
    <PageWrapper
      title="Dashboard"
      subtitle="At a glance summary of your business"
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
      <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="PAN Cards"
          value={panCardData?.length || 0}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Passports"
          value={passportData?.length || 0}
          icon={<ScrollText className="h-5 w-5" />}
        />
        <StatCard
          title="Photostat"
          value={photostatData?.length || 0}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Banking Services Block */}
        <div className="glassmorphism rounded-xl p-5 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Banking Services</h3>
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
        
        {/* Online Services Block */}
        <div className="glassmorphism rounded-xl p-5 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Online Services</h3>
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
        {/* Applications Block */}
        <div className="glassmorphism rounded-xl p-5 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Applications</h3>
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
        
        {/* Pending Balance Block */}
        <div className="glassmorphism rounded-xl p-5 animate-scale-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">Pending Balance</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glassmorphism rounded-xl p-5 animate-scale-in">
          <h3 className="font-semibold text-lg mb-4">Margin Distribution</h3>
          <DoughnutChart
            data={marginProportions}
            getColor={getServiceColor}
          />
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
