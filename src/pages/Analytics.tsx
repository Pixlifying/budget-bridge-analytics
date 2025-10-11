import { useState, useEffect, useMemo } from 'react';
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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell,
  ComposedChart,
  RadialBarChart,
  RadialBar,
  PolarGrid,
  Label
} from 'recharts';
import { format } from 'date-fns';

interface ODRecord {
  id: string;
  date: Date;
  amount_received: number;
  amount_given: number;
  cash_in_hand: number;
  od_from_bank: number;
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

interface MiscExpenseEntry {
  id: string;
  date: Date;
  name: string;
  fee: number;
}

interface SocialSecurityEntry {
  id: string;
  date: Date;
  name: string;
  account_number: string;
  scheme_type: string;
}

interface AccountDetailEntry {
  id: string;
  name: string;
  account_number: string;
  aadhar_number: string;
  created_at: Date;
}

const chartConfig = {
  received: {
    label: "Amount Received",
    color: "hsl(var(--primary))",
  },
  given: {
    label: "Amount Given", 
    color: "hsl(var(--destructive))",
  },
  cash_in_hand: {
    label: "Cash in Hand",
    color: "hsl(var(--accent))",
  },
  od_from_bank: {
    label: "OD from Bank",
    color: "hsl(var(--muted-foreground))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
  },
  margin: {
    label: "Margin",
    color: "hsl(var(--accent))",
  },
  panCards: {
    label: "PAN Cards",
    color: "hsl(var(--primary))",
  },
  passports: {
    label: "Passports",
    color: "hsl(var(--sidebar-accent))",
  },
  bankingServices: {
    label: "Banking Services",
    color: "hsl(var(--destructive))",
  },
  onlineServices: {
    label: "Online Services",
    color: "hsl(var(--muted-foreground))",
  },
  applications: {
    label: "Applications",
    color: "hsl(var(--accent))",
  },
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--sidebar-accent))',
  'hsl(var(--destructive))',
  'hsl(var(--muted-foreground))',
  'hsl(var(--accent))',
  'hsl(var(--secondary-foreground))'
];

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
  const [miscExpenses, setMiscExpenses] = useState<MiscExpenseEntry[]>([]);
  const [socialSecurity, setSocialSecurity] = useState<SocialSecurityEntry[]>([]);
  const [accountDetails, setAccountDetails] = useState<AccountDetailEntry[]>([]);

  const [filteredOdRecords, setFilteredOdRecords] = useState<ODRecord[]>([]);
  const [filteredPanCards, setFilteredPanCards] = useState<PanCardEntry[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [filteredBankingServices, setFilteredBankingServices] = useState<BankingServiceEntry[]>([]);
  const [filteredOnlineServices, setFilteredOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationEntry[]>([]);
  const [filteredMiscExpenses, setFilteredMiscExpenses] = useState<MiscExpenseEntry[]>([]);
  const [filteredSocialSecurity, setFilteredSocialSecurity] = useState<SocialSecurityEntry[]>([]);
  const [filteredAccountDetails, setFilteredAccountDetails] = useState<AccountDetailEntry[]>([]);
  
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

      // Fetch Misc Expenses
      const { data: miscExpensesData, error: miscExpensesError } = await supabase
        .from('misc_expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (miscExpensesError) throw miscExpensesError;

      // Fetch Social Security
      const { data: socialSecurityData, error: socialSecurityError } = await supabase
        .from('social_security')
        .select('*')
        .order('date', { ascending: false });
      
      if (socialSecurityError) throw socialSecurityError;

      // Fetch Account Details
      const { data: accountDetailsData, error: accountDetailsError } = await supabase
        .from('account_details')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (accountDetailsError) throw accountDetailsError;

      // Format OD Records
      const formattedOdRecords = odData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount_received: Number(entry.amount_received),
        amount_given: Number(entry.amount_given),
        cash_in_hand: Number(entry.cash_in_hand),
        od_from_bank: Number(entry.od_from_bank)
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

      // Format Misc Expenses
      const formattedMiscExpenses = miscExpensesData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        fee: Number(entry.fee)
      }));

      // Format Social Security
      const formattedSocialSecurity = socialSecurityData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        account_number: entry.account_number,
        scheme_type: entry.scheme_type
      }));

      // Format Account Details
      const formattedAccountDetails = accountDetailsData.map(entry => ({
        id: entry.id,
        name: entry.name,
        account_number: entry.account_number,
        aadhar_number: entry.aadhar_number,
        created_at: new Date(entry.created_at)
      }));
      
      setOdRecords(formattedOdRecords);
      setPanCards(formattedPanCards);
      setPassports(formattedPassports);
      setBankingServices(formattedBankingServices);
      setOnlineServices(formattedOnlineServices);
      setExpenses(formattedExpenses);
      setApplications(formattedApplications);
      setMiscExpenses(formattedMiscExpenses);
      setSocialSecurity(formattedSocialSecurity);
      setAccountDetails(formattedAccountDetails);
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
      setFilteredMiscExpenses(filterByDate(miscExpenses, date));
      setFilteredSocialSecurity(filterByDate(socialSecurity, date));
      setFilteredAccountDetails(accountDetails.filter(entry => 
        entry.created_at.toDateString() === date.toDateString()
      ));
    } else {
      setFilteredOdRecords(filterByMonth(odRecords, date));
      setFilteredPanCards(filterByMonth(panCards, date));
      setFilteredPassports(filterByMonth(passports, date));
      setFilteredBankingServices(filterByMonth(bankingServices, date));
      setFilteredOnlineServices(filterByMonth(onlineServices, date));
      setFilteredExpenses(filterByMonth(expenses, date));
      setFilteredApplications(filterByMonth(applications, date));
      setFilteredMiscExpenses(filterByMonth(miscExpenses, date));
      setFilteredSocialSecurity(filterByMonth(socialSecurity, date));
      setFilteredAccountDetails(accountDetails.filter(entry => 
        entry.created_at.getMonth() === date.getMonth() && 
        entry.created_at.getFullYear() === date.getFullYear()
      ));
    }
  }, [date, viewMode, odRecords, panCards, passports, bankingServices, onlineServices, expenses, applications, miscExpenses, socialSecurity, accountDetails]);

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
      od_from_bank: record.od_from_bank,
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

  // Service-wise margin breakdown data
  const serviceBreakdownData = [
    { service: 'PAN Cards', margin: totalPanMargin, count: filteredPanCards.length },
    { service: 'Passports', margin: totalPassportMargin, count: filteredPassports.length },
    { service: 'Banking Services', margin: totalBankingMargin, count: filteredBankingServices.length },
    { service: 'Online Services', margin: totalOnlineServices, count: filteredOnlineServices.length },
    { service: 'Applications', margin: totalApplications, count: filteredApplications.length }
  ].filter(item => item.margin > 0);

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

  // Bar chart data for individual expense types
  const expensesBarData = filteredExpenses.map(expense => ({
    name: expense.name.length > 20 ? expense.name.substring(0, 20) + '...' : expense.name,
    amount: expense.amount,
    date: format(expense.date, 'MMM dd')
  }));

  const miscExpensesBarData = filteredMiscExpenses.map(expense => ({
    name: expense.name.length > 20 ? expense.name.substring(0, 20) + '...' : expense.name,
    amount: expense.fee,
    date: format(expense.date, 'MMM dd')
  }));

  const socialSecurityBarData = filteredSocialSecurity.reduce((acc, entry) => {
    const existing = acc.find(item => item.scheme === entry.scheme_type);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ scheme: entry.scheme_type, count: 1 });
    }
    return acc;
  }, [] as Array<{ scheme: string; count: number }>);

  const accountDetailsBarData = [
    { category: 'Total Accounts', count: filteredAccountDetails.length }
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
          <Card className="flex flex-col animate-scale-in">
            <CardHeader className="items-center pb-0">
              <CardTitle>Revenue Breakdown</CardTitle>
              <CardDescription>{format(date, 'MMMM yyyy')}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square max-h-[300px]"
              >
                <RechartsPieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={revenueBreakdownData.map(item => ({ ...item, visitors: item.value }))}
                    dataKey="visitors"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {revenueBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {formatCurrency(totalRevenue)}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Total Revenue
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                </RechartsPieChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
              <div className="flex items-center gap-2 leading-none font-medium">
                Total revenue across all services <TrendingUp className="h-4 w-4" />
              </div>
            </CardFooter>
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
        {/* Service Margin Breakdown - Radial Chart */}
        <Card className="flex flex-col animate-fade-in">
          <CardHeader className="items-center pb-0">
            <CardTitle>Service Margin Breakdown</CardTitle>
            <CardDescription>{format(date, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <RadialBarChart 
                data={serviceBreakdownData.map((item, index) => ({ 
                  ...item, 
                  visitors: item.margin,
                  fill: COLORS[index % COLORS.length]
                }))} 
                innerRadius={30} 
                outerRadius={110}
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="service" />}
                />
                <PolarGrid gridType="circle" />
                <RadialBar dataKey="visitors" />
              </RadialBarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none font-medium">
              Margin comparison by service type <Activity className="h-4 w-4" />
            </div>
          </CardFooter>
        </Card>

        {/* OD Flow Analytics - Stacked Bar Chart */}
        {odTrendData.length > 0 && (
          <Card className="animate-scale-in">
            <CardHeader>
              <CardTitle>OD Flow Analytics</CardTitle>
              <CardDescription>Amount flow including bank OD over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={odTrendData}>
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Bar
                    dataKey="od_from_bank"
                    stackId="a"
                    fill="hsl(var(--muted-foreground))"
                    radius={[0, 0, 0, 0]}
                    name="OD from Bank"
                  />
                  <Bar
                    dataKey="received"
                    stackId="a"
                    fill="hsl(var(--primary))"
                    radius={[0, 0, 0, 0]}
                    name="Amount Received"
                  />
                  <Bar
                    dataKey="given"
                    stackId="a"
                    fill="hsl(var(--destructive))"
                    radius={[4, 4, 0, 0]}
                    name="Amount Given"
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          return format(new Date(value), 'dd MMMM yyyy');
                        }}
                      />
                    }
                    cursor={false}
                    defaultIndex={1}
                  />
                </BarChart>
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
                  <Bar dataKey="panCards" stackId="services" fill="hsl(var(--primary))" name="PAN Cards" />
                  <Bar dataKey="passports" stackId="services" fill="hsl(var(--sidebar-accent))" name="Passports" />
                  <Bar dataKey="bankingServices" stackId="services" fill="hsl(var(--destructive))" name="Banking Services" />
                  <Bar dataKey="onlineServices" stackId="services" fill="hsl(var(--muted-foreground))" name="Online Services" />
                  <Bar dataKey="applications" stackId="services" fill="hsl(var(--accent))" name="Applications" />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={3}
                    name="Expenses"
                    dot={{ fill: 'hsl(var(--destructive))', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses Trend */}
      <div className="grid grid-cols-1 gap-6 mb-8">
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
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--sidebar-accent))" 
                    strokeWidth={3}
                    name="Revenue Trend"
                    dot={{ fill: 'hsl(var(--sidebar-accent))', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Individual Category Bar Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Expenses Bar Chart */}
        {expensesBarData.length > 0 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={20} />
                Expenses Breakdown
              </CardTitle>
              <CardDescription>Individual expense entries</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expensesBarData}>
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(var(--primary))" 
                      name="Amount" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Misc Expenses Bar Chart */}
        {miscExpensesBarData.length > 0 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity size={20} />
                Misc. Expenses Breakdown
              </CardTitle>
              <CardDescription>Miscellaneous expense entries</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={miscExpensesBarData}>
                    <XAxis 
                      dataKey="name" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={10}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="amount" 
                      fill="hsl(var(--sidebar-accent))" 
                      name="Amount" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Social Security and Account Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Security Bar Chart */}
        {socialSecurityBarData.length > 0 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 size={20} />
                Social Security by Scheme Type
              </CardTitle>
              <CardDescription>Distribution of schemes</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={socialSecurityBarData}>
                    <XAxis 
                      dataKey="scheme" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--destructive))" 
                      name="Count" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Account Details Bar Chart */}
        {accountDetailsBarData.length > 0 && (
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Account Details Summary
              </CardTitle>
              <CardDescription>Total accounts in the period</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={accountDetailsBarData}>
                    <XAxis 
                      dataKey="category" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--accent))" 
                      name="Count" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
};

export default Analytics;
