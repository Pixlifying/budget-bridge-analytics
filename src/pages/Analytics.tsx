
import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  FileText,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';
import { addDays, addWeeks, addMonths, startOfDay, endOfDay, format } from 'date-fns';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [latestODCashInHand, setLatestODCashInHand] = useState<number>(0);

  // Fetch latest OD Cash in Hand
  const { data: odData } = useQuery({
    queryKey: ['latest-od-cash'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('od_records')
        .select('cash_in_hand, date')
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching latest OD cash in hand:', error);
        return null;
      }

      return data;
    }
  });

  useEffect(() => {
    if (odData) {
      setLatestODCashInHand(odData.cash_in_hand || 0);
    }
  }, [odData]);

  const getDateRange = () => {
    const now = new Date();
    const endDate = endOfDay(now);
    
    switch (timeRange) {
      case '1d':
        return { startDate: startOfDay(now), endDate };
      case '7d':
        return { startDate: startOfDay(addDays(now, -7)), endDate };
      case '30d':
        return { startDate: startOfDay(addDays(now, -30)), endDate };
      case '90d':
        return { startDate: startOfDay(addDays(now, -90)), endDate };
      default:
        return { startDate: startOfDay(addDays(now, -7)), endDate };
    }
  };

  const { startDate, endDate } = getDateRange();

  // Banking Services Analytics
  const { data: bankingData } = useQuery({
    queryKey: ['analytics-banking', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
      
      if (error) throw error;
      return data || [];
    }
  });

  // Online Services Analytics
  const { data: onlineData } = useQuery({
    queryKey: ['analytics-online', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('online_services')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
      
      if (error) throw error;
      return data || [];
    }
  });

  // Applications Analytics
  const { data: applicationsData } = useQuery({
    queryKey: ['analytics-applications', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
      
      if (error) throw error;
      return data || [];
    }
  });

  // Expenses Analytics
  const { data: expensesData } = useQuery({
    queryKey: ['analytics-expenses', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());
      
      if (error) throw error;
      return data || [];
    }
  });

  // Calculate metrics
  const bankingTotal = bankingData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  const bankingMargin = bankingData?.reduce((sum, item) => sum + Number(item.margin), 0) || 0;
  const bankingCount = bankingData?.reduce((sum, item) => sum + (item.transaction_count || 1), 0) || 0;

  const onlineTotal = onlineData?.reduce((sum, item) => sum + Number(item.total), 0) || 0;
  const onlineMargin = onlineData?.reduce((sum, item) => sum + (Number(item.amount) * item.count), 0) || 0;
  const onlineCount = onlineData?.length || 0;

  const applicationsTotal = applicationsData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  const applicationsCount = applicationsData?.length || 0;

  const expensesTotal = expensesData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
  const expensesCount = expensesData?.length || 0;

  const totalRevenue = bankingTotal + onlineTotal + applicationsTotal;
  const totalMargin = bankingMargin + onlineMargin + applicationsTotal;
  const netProfit = totalMargin - expensesTotal;

  return (
    <PageWrapper
      title="Analytics"
      subtitle="Business insights and performance metrics"
      action={
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Today</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      }
    >
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From all services
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMargin)}</div>
            <p className="text-xs text-muted-foreground">
              Gross profit margin
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
            <p className="text-xs text-muted-foreground">
              After expenses
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest OD Cash in Hand</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(latestODCashInHand)}</div>
            <p className="text-xs text-muted-foreground">
              {odData?.date ? format(new Date(odData.date), 'MMM dd, yyyy') : 'Not available'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Banking Services
            </CardTitle>
            <CardDescription>
              {bankingCount} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium">{formatCurrency(bankingTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Margin</span>
                <span className="font-medium">{formatCurrency(bankingMargin)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Services
            </CardTitle>
            <CardDescription>
              {onlineCount} services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium">{formatCurrency(onlineTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Margin</span>
                <span className="font-medium">{formatCurrency(onlineMargin)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Applications
            </CardTitle>
            <CardDescription>
              {applicationsCount} applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="font-medium">{formatCurrency(applicationsTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Count</span>
                <span className="font-medium">{applicationsCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Total Expenses
            </CardTitle>
            <CardDescription>
              {expensesCount} expense entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(expensesTotal)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Operating expenses for selected period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
          <CardHeader>
            <CardTitle>Profit Margin</CardTitle>
            <CardDescription>
              Revenue vs Expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Net profit as percentage of revenue
            </p>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Analytics;
