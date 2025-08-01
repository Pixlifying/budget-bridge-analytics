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
  panCards: {
    label: "PAN Cards",
    color: "#8b5cf6",
  },
  passports: {
    label: "Passports",
    color: "#10b981",
  },
  bankingServices: {
    label: "Banking Services",
    color: "#ef4444",
  },
  onlineServices: {
    label: "Online Services",
    color: "#f59e0b",
  },
  applications: {
    label: "Applications",
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
  
  // Get latest cash in hand from OD records (most recent actual value)
  const latestOdRecord = odRecords.length > 0 ? odRecords[0] : null;
  const latestCashInHand = latestOdRecord ? latestOdRecord.cash_in_hand : 0;
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

  // Revenue Breakdown Pie Chart
  const revenueBreakdownData = [
    { name: 'PAN Cards', value: totalPanMargin, color: COLORS[0] },
    { name: 'Passports', value: totalPassportMargin, color: COLORS[1] },
    { name: 'Banking Services', value: totalBankingMargin, color: COLORS[2] },
    { name: 'Online Services', value: totalOnlineServices, color: COLORS[3] },
    { name: 'Applications', value: totalApplications, color: COLORS[4] }
  ].filter(item => item.value > 0);

  // Service-wise breakdown data
  const serviceBreakdownData = [
    { service: 'PAN Cards', revenue: totalPanMargin, count: filteredPanCards.length },
    { service: 'Passports', revenue: totalPassportMargin, count: filteredPassports.length },
    { service: 'Banking Services', revenue: totalBankingMargin, count: filteredBankingServices.length },
    { service: 'Online Services', revenue: totalOnlineServices, count: filteredOnlineServices.length },
    { service: 'Applications', revenue: totalApplications, count: filteredApplications.length }
  ].filter(item => item.revenue > 0);

  // Monthly comparison data
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
      panCards: 0,
      passports: 0,
      bankingServices: 0,
      onlineServices: 0,
      applications: 0
    };

    // Calculate monthly data
    const monthlyPanCards = filterByMonth(panCards, monthDate);
    const monthlyPassports = filterByMonth(passports, monthDate);
    const monthlyBanking = filterByMonth(bankingServices, monthDate);
    const monthlyOnline = filterByMonth(onlineServices, monthDate);
    const monthlyApplications = filterByMonth(applications, monthDate);
    const monthlyExpenses = filterByMonth(expenses, monthDate);

    monthData.panCards = monthlyPanCards.reduce((sum, entry) => sum + entry.margin, 0);
    monthData.passports = monthlyPassports.reduce((sum, entry) => sum + entry.margin, 0);
    monthData.bankingServices = monthlyBanking.reduce((sum, entry) => sum + entry.margin, 0);
    monthData.onlineServices = monthlyOnline.reduce((sum, entry) => sum + entry.amount, 0);
    monthData.applications = monthlyApplications.reduce((sum, entry) => sum + entry.amount, 0);
    monthData.expenses = monthlyExpenses.reduce((sum, entry) => sum + entry.amount, 0);

    monthData.revenue = monthData.panCards + monthData.passports + monthData.bankingServices + 
                       monthData.onlineServices + monthData.applications;

    monthlyTrendData.push(monthData);
  });

  // Expenses breakdown
  const expenseCategories = {};
  filteredExpenses.forEach(expense => {
    const category = expense.name.toLowerCase().includes('rent') ? 'Rent' :
                    expense.name.toLowerCase().includes('electricity') ? 'Utilities' :
                    expense.name.toLowerCase().includes('internet') ? 'Internet' :
                    expense.name.toLowerCase().includes('salary') ? 'Salary' :
                    'Other';
    
    expenseCategories[category] = (expenseCategories[category] || 0) + expense.amount;
  });

  const expenseBreakdownData = Object.entries(expenseCategories).map(([name, value], index) => ({
    name,
    value,
    color: COLORS[index % COLORS.length]
  }));

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
          title="Latest Cash in Hand"
          value={formatCurrency(latestCashInHand)}
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

      {/* Revenue Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        {/* Expense Breakdown */}
        {expenseBreakdownData.length > 0 && (
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={20} />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={expenseBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseBreakdownData.map((entry, index) => (
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

      {/* Service Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Service Revenue Comparison */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Service Revenue Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceBreakdownData}>
                  <XAxis 
                    dataKey="service" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* OD Flow Analytics */}
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
      </div>

      {/* Monthly Trend Analysis */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              6-Month Service Trends & Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-96 w-full">
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
                  <Bar dataKey="panCards" stackId="services" fill="#8b5cf6" name="PAN Cards" />
                  <Bar dataKey="passports" stackId="services" fill="#10b981" name="Passports" />
                  <Bar dataKey="bankingServices" stackId="services" fill="#ef4444" name="Banking Services" />
                  <Bar dataKey="onlineServices" stackId="services" fill="#f59e0b" name="Online Services" />
                  <Bar dataKey="applications" stackId="services" fill="#06b6d4" name="Applications" />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ec4899" 
                    strokeWidth={3}
                    name="Expenses"
                    dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses Trend */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Revenue vs Expenses - Monthly Comparison
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
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Revenue Trend"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Analytics;
