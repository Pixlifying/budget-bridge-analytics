import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DoughnutChart } from '@/components/ui/DoughnutChart';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import DateRangePicker, { ViewModeType } from '@/components/ui/DateRangePicker';
import { CalendarDays, TrendingDown, TrendingUp, DollarSign, FileText, Users, Calculator, CreditCard } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';

interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  totalApplications: number;
  totalCustomers: number;
  netProfit: number;
  photostats: number;
  bankingServices: number;
  onlineServices: number;
  panCards: number;
  passports: number;
  miscExpenses: number;
  feeExpenses: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    totalApplications: 0,
    totalCustomers: 0,
    netProfit: 0,
    photostats: 0,
    bankingServices: 0,
    onlineServices: 0,
    panCards: 0,
    passports: 0,
    miscExpenses: 0,
    feeExpenses: 0,
  });
  
  const [filterDate, setFilterDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewModeType>('month');
  const [isLoading, setIsLoading] = useState(true);

  const getDateRange = () => {
    switch (viewMode) {
      case 'day':
        return {
          start: startOfDay(filterDate),
          end: endOfDay(filterDate)
        };
      case 'month':
        return {
          start: startOfMonth(filterDate),
          end: endOfMonth(filterDate)
        };
      case 'year':
        return {
          start: startOfYear(filterDate),
          end: endOfYear(filterDate)
        };
      default:
        return {
          start: startOfMonth(filterDate),
          end: endOfMonth(filterDate)
        };
    }
  };

  const fetchStats = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();
    
    try {
      // Fetch total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('banking_services')
        .select('amount')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (revenueError) throw revenueError;
      const totalRevenue = revenueData?.reduce((sum, item) => sum + item.amount, 0) || 0;

      // Fetch total expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (expensesError) throw expensesError;
      const totalExpenses = expensesData?.reduce((sum, item) => sum + item.amount, 0) || 0;

      // Fetch total applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (applicationsError) throw applicationsError;

      // Fetch total customers
      const { data: customersData, error: customersError } = await supabase
        .from('account_details')
        .select('*')
         .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (customersError) throw customersError;

      // Fetch photostat revenue
      const { data: photostatsData, error: photostatsError } = await supabase
        .from('photostat')
        .select('total_amount')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (photostatsError) throw photostatsError;

      // Fetch banking services revenue
      const { data: bankingServicesData, error: bankingServicesError } = await supabase
        .from('banking_services')
        .select('amount')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (bankingServicesError) throw bankingServicesError;

      // Fetch online services revenue
      const { data: onlineServicesData, error: onlineServicesError } = await supabase
        .from('online_services')
        .select('total')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (onlineServicesError) throw onlineServicesError;

      // Fetch pan cards revenue
       const { data: panCardsData, error: panCardsError } = await supabase
        .from('pan_cards')
        .select('total')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (panCardsError) throw panCardsError;

      // Fetch passports revenue
      const { data: passportsData, error: passportsError } = await supabase
        .from('passports')
        .select('total')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (passportsError) throw passportsError;

      // Fetch misc expenses
      const { data: miscExpensesData, error: miscExpensesError } = await supabase
        .from('misc_expenses')
        .select('fee')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (miscExpensesError) throw miscExpensesError;

      // Fetch fee expenses
      const { data: feeExpensesData, error: feeExpensesError } = await supabase
        .from('expenses')
        .select('fee')
        .gte('date', start.toISOString())
        .lte('date', end.toISOString());

      if (feeExpensesError) throw feeExpensesError;
      
      // Calculate net profit
      const netProfit = totalRevenue - totalExpenses;

      setStats({
        totalRevenue,
        totalExpenses,
        totalApplications: applicationsData?.length || 0,
        totalCustomers: customersData?.length || 0,
        netProfit,
        photostats: photostatsData?.reduce((sum, item) => sum + item.total_amount, 0) || 0,
        bankingServices: bankingServicesData?.reduce((sum, item) => sum + item.amount, 0) || 0,
        onlineServices: onlineServicesData?.reduce((sum, item) => sum + item.total, 0) || 0,
        panCards: panCardsData?.reduce((sum, item) => sum + item.total, 0) || 0,
        passports: passportsData?.reduce((sum, item) => sum + item.total, 0) || 0,
        miscExpenses: miscExpensesData?.reduce((sum, item) => sum + item.fee, 0) || 0,
        feeExpenses: feeExpensesData?.reduce((sum, item) => sum + item.fee, 0) || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterDate, viewMode]);

  const chartData = [
    { name: 'Revenue', value: stats.totalRevenue, color: '#10b981' },
    { name: 'Expenses', value: stats.totalExpenses, color: '#ef4444' },
  ];

  const serviceData = [
    { name: 'Photostats', value: stats.photostats, color: '#3b82f6' },
    { name: 'Banking Services', value: stats.bankingServices, color: '#8b5cf6' },
    { name: 'Online Services', value: stats.onlineServices, color: '#f59e0b' },
    { name: 'PAN Cards', value: stats.panCards, color: '#ef4444' },
    { name: 'Passports', value: stats.passports, color: '#10b981' },
  ];

  const expenseData = [
    { name: 'Misc Expenses', value: stats.miscExpenses, color: '#f59e0b' },
    { name: 'Fee Expenses', value: stats.feeExpenses, color: '#ef4444' },
  ];

  return (
    <PageWrapper title="Dashboard" subtitle="Overview of your business metrics">
      <div className="space-y-6">
        {/* Date Filter */}
        <div className="flex justify-center">
          <DateRangePicker
            date={filterDate}
            onDateChange={setFilterDate}
            mode={viewMode}
            onModeChange={setViewMode}
            className="w-full max-w-sm"
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs opacity-90">
                {format(filterDate, viewMode === 'day' ? 'dd MMM yyyy' : viewMode === 'month' ? 'MMM yyyy' : 'yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.netProfit.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Applications</CardTitle>
              <FileText className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue vs Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <DoughnutChart data={chartData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Services Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <DoughnutChart data={serviceData} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <DoughnutChart data={expenseData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
