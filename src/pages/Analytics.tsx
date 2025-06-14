import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, DollarSign, CreditCard } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import DateRangePicker from '@/components/ui/DateRangePicker';
import StatCard from '@/components/ui/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  ComposedChart
} from 'recharts';
import { format } from 'date-fns';

interface ODRecord {
  id: string;
  date: Date;
  amount_received: number;
  amount_given: number;
  cash_in_hand: number;
}

interface PanCardEntry {
  id: string;
  date: Date;
  count: number;
  amount: number;
  total: number;
  margin: number;
}

interface PassportEntry {
  id: string;
  date: Date;
  count: number;
  amount: number;
  total: number;
  margin: number;
}

interface BankingServiceEntry {
  id: string;
  date: Date;
  amount: number;
  margin: number;
}

interface OnlineServiceEntry {
  id: string;
  date: Date;
  service: string;
  amount: number;
  count: number;
}

interface ExpenseEntry {
  id: string;
  date: Date;
  name: string;
  amount: number;
}

interface ApplicationEntry {
  id: string;
  date: Date;
  customer_name: string;
  pages_count: number;
  amount: number;
}

const chartConfig = {
  received: {
    label: "Amount Received",
    color: "#10b981",
  },
  given: {
    label: "Amount Given", 
    color: "#ef4444",
  },
  cash_in_hand: {
    label: "Cash in Hand",
    color: "#3b82f6",
  },
  revenue: {
    label: "Revenue",
    color: "#8b5cf6",
  },
  expenses: {
    label: "Expenses",
    color: "#f59e0b",
  },
  margin: {
    label: "Margin",
    color: "#06b6d4",
  },
};

const COLORS = ['#8b5cf6', '#10b981', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899'];

const Analytics = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
  
  const [odRecords, setOdRecords] = useState<ODRecord[]>([]);
  const [panCards, setPanCards] = useState<PanCardEntry[]>([]);
  const [passports, setPassports] = useState<PassportEntry[]>([]);
  const [bankingServices, setBankingServices] = useState<BankingServiceEntry[]>([]);
  const [onlineServices, setOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);

  const [filteredOdRecords, setFilteredOdRecords] = useState<ODRecord[]>([]);
  const [filteredPanCards, setFilteredPanCards] = useState<PanCardEntry[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [filteredBankingServices, setFilteredBankingServices] = useState<BankingServiceEntry[]>([]);
  const [filteredOnlineServices, setFilteredOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationEntry[]>([]);
  
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // Fetch OD Records
      const { data: odData, error: odError } = await supabase
        .from('od_records')
        .select('*')
        .order('date', { ascending: false });
      
      if (odError) throw odError;

      // Fetch Pan Cards
      const { data: panCardData, error: panCardError } = await supabase
        .from('pan_cards')
        .select('*')
        .order('date', { ascending: false });
      
      if (panCardError) throw panCardError;
      
      // Fetch Passports
      const { data: passportData, error: passportError } = await supabase
        .from('passports')
        .select('*')
        .order('date', { ascending: false });
      
      if (passportError) throw passportError;
      
      // Fetch Banking Services
      const { data: bankingData, error: bankingError } = await supabase
        .from('banking_services')
        .select('*')
        .order('date', { ascending: false });
      
      if (bankingError) throw bankingError;
      
      // Fetch Online Services
      const { data: onlineData, error: onlineError } = await supabase
        .from('online_services')
        .select('*')
        .order('date', { ascending: false });
      
      if (onlineError) throw onlineError;
      
      // Fetch Expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (expenseError) throw expenseError;
      
      // Fetch Applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .order('date', { ascending: false });
      
      if (applicationsError) throw applicationsError;

      // Format OD Records
      const formattedOdRecords = odData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount_received: Number(entry.amount_received),
        amount_given: Number(entry.amount_given),
        cash_in_hand: Number(entry.cash_in_hand)
      }));
      
      // Format Pan Cards
      const formattedPanCards = panCardData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        count: entry.count,
        amount: Number(entry.amount),
        total: Number(entry.total),
        margin: Number(entry.margin)
      }));
      
      // Format Passports
      const formattedPassports = passportData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        count: entry.count,
        amount: Number(entry.amount),
        total: Number(entry.total),
        margin: Number(entry.margin)
      }));
      
      // Format Banking Services
      const formattedBankingServices = bankingData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount: Number(entry.amount),
        margin: Number(entry.margin)
      }));
      
      // Format Online Services
      const formattedOnlineServices = onlineData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        service: entry.service,
        amount: Number(entry.amount),
        count: entry.count
      }));
      
      // Format Expenses
      const formattedExpenses = expenseData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        amount: Number(entry.amount)
      }));
      
      // Format Applications
      const formattedApplications = applicationsData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        customer_name: entry.customer_name,
        pages_count: entry.pages_count,
        amount: Number(entry.amount)
      }));
      
      setOdRecords(formattedOdRecords);
      setPanCards(formattedPanCards);
      setPassports(formattedPassports);
      setBankingServices(formattedBankingServices);
      setOnlineServices(formattedOnlineServices);
      setExpenses(formattedExpenses);
      setApplications(formattedApplications);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllData();
  }, []);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredOdRecords(filterByDate(odRecords, date));
      setFilteredPanCards(filterByDate(panCards, date));
      setFilteredPassports(filterByDate(passports, date));
      setFilteredBankingServices(filterByDate(bankingServices, date));
      setFilteredOnlineServices(filterByDate(onlineServices, date));
      setFilteredExpenses(filterByDate(expenses, date));
      setFilteredApplications(filterByDate(applications, date));
    } else {
      setFilteredOdRecords(filterByMonth(odRecords, date));
      setFilteredPanCards(filterByMonth(panCards, date));
      setFilteredPassports(filterByMonth(passports, date));
      setFilteredBankingServices(filterByMonth(bankingServices, date));
      setFilteredOnlineServices(filterByMonth(onlineServices, date));
      setFilteredExpenses(filterByMonth(expenses, date));
      setFilteredApplications(filterByMonth(applications, date));
    }
  }, [date, viewMode, odRecords, panCards, passports, bankingServices, onlineServices, expenses, applications]);

  // Calculate totals
  const totalOdReceived = filteredOdRecords.reduce((sum, entry) => sum + entry.amount_received, 0);
  const totalOdGiven = filteredOdRecords.reduce((sum, entry) => sum + entry.amount_given, 0);
  const totalOdCashInHand = totalOdReceived - totalOdGiven;
  const totalExpenses = filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  const totalOnlineServices = filteredOnlineServices.reduce((sum, entry) => sum + entry.amount, 0);
  const totalApplications = filteredApplications.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPanMargin = filteredPanCards.reduce((sum, entry) => sum + entry.margin, 0);
  const totalPassportMargin = filteredPassports.reduce((sum, entry) => sum + entry.margin, 0);
  const totalBankingMargin = filteredBankingServices.reduce((sum, entry) => sum + entry.margin, 0);

  const totalRevenue = totalOnlineServices + totalApplications + totalPanMargin + totalPassportMargin + totalBankingMargin;
  const netProfit = totalRevenue - totalExpenses;

  // Prepare chart data
  const odTrendData = filteredOdRecords
    .slice()
    .reverse()
    .map((record, index) => ({
      date: format(new Date(record.date), 'MMM dd'),
      received: record.amount_received,
      given: record.amount_given,
      cash_in_hand: record.cash_in_hand,
      index
    }));

  const revenueBreakdownData = [
    { name: 'PAN Cards', value: totalPanMargin, color: COLORS[0] },
    { name: 'Passports', value: totalPassportMargin, color: COLORS[1] },
    { name: 'Banking Services', value: totalBankingMargin, color: COLORS[2] },
    { name: 'Online Services', value: totalOnlineServices, color: COLORS[3] },
    { name: 'Applications', value: totalApplications, color: COLORS[4] }
  ].filter(item => item.value > 0);

  const monthlyTrendData = [];
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date();
    monthDate.setMonth(monthDate.getMonth() - i);
    last6Months.push(monthDate);
  }

  last6Months.forEach(monthDate => {
    const monthData = {
      month: format(monthDate, 'MMM'),
      revenue: 0,
      expenses: 0,
      margin: 0
    };

    // Calculate monthly data
    const monthlyPanCards = filterByMonth(panCards, monthDate);
    const monthlyPassports = filterByMonth(passports, monthDate);
    const monthlyBanking = filterByMonth(bankingServices, monthDate);
    const monthlyOnline = filterByMonth(onlineServices, monthDate);
    const monthlyApplications = filterByMonth(applications, monthDate);
    const monthlyExpenses = filterByMonth(expenses, monthDate);

    monthData.revenue = 
      monthlyPanCards.reduce((sum, entry) => sum + entry.margin, 0) +
      monthlyPassports.reduce((sum, entry) => sum + entry.margin, 0) +
      monthlyBanking.reduce((sum, entry) => sum + entry.margin, 0) +
      monthlyOnline.reduce((sum, entry) => sum + entry.amount, 0) +
      monthlyApplications.reduce((sum, entry) => sum + entry.amount, 0);

    monthData.expenses = monthlyExpenses.reduce((sum, entry) => sum + entry.amount, 0);
    monthData.margin = monthData.revenue - monthData.expenses;

    monthlyTrendData.push(monthData);
  });

  const performanceData = [
    { 
      name: 'Revenue Target', 
      value: totalRevenue, 
      target: 50000, 
      fill: '#8b5cf6' 
    },
    { 
      name: 'Expense Control', 
      value: 50000 - totalExpenses, 
      target: 50000, 
      fill: '#10b981' 
    }
  ];

  return (
    <PageWrapper
      title="Analytics Dashboard"
      subtitle={`Advanced insights for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <DateRangePicker 
          date={date} 
          onDateChange={setDate} 
          mode={viewMode} 
          onModeChange={setViewMode} 
        />
      }
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<DollarSign size={20} />}
          className="animate-fade-in"
        />
        <StatCard 
          title="Net Profit"
          value={formatCurrency(netProfit)}
          icon={<TrendingUp size={20} />}
          className="animate-fade-in"
        />
        <StatCard 
          title="OD Cash in Hand"
          value={formatCurrency(totalOdCashInHand)}
          icon={<CreditCard size={20} />}
          className="animate-fade-in"
        />
        <StatCard 
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<Activity size={20} />}
          className="animate-fade-in"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* OD Analytics Chart */}
        {odTrendData.length > 0 && (
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                OD Flow Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={odTrendData}>
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <defs>
                      <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="givenGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="received"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#receivedGradient)"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="given"
                      stroke="#ef4444"
                      fillOpacity={1}
                      fill="url(#givenGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Revenue Breakdown Pie Chart */}
        {revenueBreakdownData.length > 0 && (
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart size={20} />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={revenueBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* 6-Month Trend */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              6-Month Performance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrendData}>
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  <Line 
                    type="monotone" 
                    dataKey="margin" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Net Margin"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Performance Radial Chart */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={performanceData}>
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff' }}
                    background
                    clockWise
                    dataKey="value"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadialBarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Analytics;
