import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity, DollarSign, CreditCard } from 'lucide-react';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { supabase } from '@/integrations/supabase/client';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  expense: number;
  total: number;
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
  expense: number;
  amount: number;
}

interface MiscExpenseEntry {
  id: string;
  date: Date;
  name: string;
  fee: number;
}

const chartConfig = {
  received: {
    label: "Amount Received",
    color: "hsl(var(--primary))",
  },
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
  },
};

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 90%, 56%)',
  'hsl(340, 82%, 52%)',
  'hsl(180, 90%, 45%)',
  'hsl(280, 85%, 60%)',
  'hsl(25, 95%, 53%)'
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

  const [filteredOdRecords, setFilteredOdRecords] = useState<ODRecord[]>([]);
  const [filteredPanCards, setFilteredPanCards] = useState<PanCardEntry[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [filteredBankingServices, setFilteredBankingServices] = useState<BankingServiceEntry[]>([]);
  const [filteredOnlineServices, setFilteredOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationEntry[]>([]);
  const [filteredMiscExpenses, setFilteredMiscExpenses] = useState<MiscExpenseEntry[]>([]);
  
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data: odData } = await supabase.from('od_detail_records').select('*').order('date', { ascending: false });
      const { data: panCardData } = await supabase.from('pan_cards').select('*').order('date', { ascending: false });
      const { data: passportData } = await supabase.from('passports').select('*').order('date', { ascending: false });
      const { data: bankingData } = await supabase.from('banking_services').select('*').order('date', { ascending: false });
      const { data: onlineData } = await supabase.from('online_services').select('*').order('date', { ascending: false });
      const { data: expenseData } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      const { data: applicationsData } = await supabase.from('applications').select('*').order('date', { ascending: false });
      const { data: miscExpensesData } = await supabase.from('misc_expenses').select('*').order('date', { ascending: false });

      setOdRecords(odData?.map(e => ({ ...e, date: new Date(e.date), amount_received: Number(e.amount_received), amount_given: Number(e.amount_given), cash_in_hand: Number(e.cash_in_hand), od_from_bank: Number(e.od_from_bank) })) || []);
      setPanCards(panCardData?.map(e => ({ ...e, date: new Date(e.date), amount: Number(e.amount), total: Number(e.total), margin: Number(e.margin) })) || []);
      setPassports(passportData?.map(e => ({ ...e, date: new Date(e.date), amount: Number(e.amount), total: Number(e.total), margin: Number(e.margin) })) || []);
      setBankingServices(bankingData?.map(e => ({ ...e, date: new Date(e.date), amount: Number(e.amount), margin: Number(e.margin) })) || []);
      setOnlineServices(onlineData?.map(e => ({ ...e, date: new Date(e.date), amount: Number(e.amount), expense: Number(e.expense || 0), total: Number(e.total) })) || []);
      setExpenses(expenseData?.map(e => ({ ...e, date: new Date(e.date), amount: Number(e.amount) })) || []);
      setApplications(applicationsData?.map(e => ({ ...e, date: new Date(e.date), expense: Number(e.expense || 0), amount: Number(e.amount) })) || []);
      setMiscExpenses(miscExpensesData?.map(e => ({ ...e, date: new Date(e.date), fee: Number(e.fee) })) || []);
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
    } else {
      setFilteredOdRecords(filterByMonth(odRecords, date));
      setFilteredPanCards(filterByMonth(panCards, date));
      setFilteredPassports(filterByMonth(passports, date));
      setFilteredBankingServices(filterByMonth(bankingServices, date));
      setFilteredOnlineServices(filterByMonth(onlineServices, date));
      setFilteredExpenses(filterByMonth(expenses, date));
      setFilteredApplications(filterByMonth(applications, date));
      setFilteredMiscExpenses(filterByMonth(miscExpenses, date));
    }
  }, [date, viewMode, odRecords, panCards, passports, bankingServices, onlineServices, expenses, applications, miscExpenses]);

  const latestOdRecord = odRecords.length > 0 ? odRecords[0] : null;
  const latestCashInHand = latestOdRecord ? latestOdRecord.cash_in_hand : 0;
  const totalExpenses = filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  const totalOnlineServices = filteredOnlineServices.reduce((sum, entry) => sum + entry.total, 0);
  const totalApplications = filteredApplications.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPanMargin = filteredPanCards.reduce((sum, entry) => sum + entry.margin, 0);
  const totalPassportMargin = filteredPassports.reduce((sum, entry) => sum + entry.margin, 0);
  const totalBankingMargin = filteredBankingServices.reduce((sum, entry) => sum + entry.margin, 0);

  const totalRevenue = totalOnlineServices + totalApplications + totalPanMargin + totalPassportMargin + totalBankingMargin;
  const netProfit = totalRevenue - totalExpenses;

  const odTrendData = filteredOdRecords.slice().reverse().map((record) => ({
    date: format(new Date(record.date), 'MMM dd'),
    received: record.amount_received,
    given: record.amount_given,
    cash_in_hand: record.cash_in_hand,
    od_from_bank: record.od_from_bank,
  }));

  const revenueBreakdownData = [
    { name: 'PAN Cards', value: totalPanMargin, color: COLORS[0] },
    { name: 'Passports', value: totalPassportMargin, color: COLORS[1] },
    { name: 'Banking', value: totalBankingMargin, color: COLORS[2] },
    { name: 'Online', value: totalOnlineServices, color: COLORS[3] },
    { name: 'Applications', value: totalApplications, color: COLORS[4] }
  ].filter(item => item.value > 0);

  const serviceBreakdownData = [
    { service: 'PAN Cards', margin: totalPanMargin },
    { service: 'Passports', margin: totalPassportMargin },
    { service: 'Banking', margin: totalBankingMargin },
    { service: 'Online', margin: totalOnlineServices },
    { service: 'Applications', margin: totalApplications }
  ].filter(item => item.margin > 0);

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
    };

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
      monthlyOnline.reduce((sum, entry) => sum + entry.total, 0) +
      monthlyApplications.reduce((sum, entry) => sum + entry.amount, 0);

    monthData.expenses = monthlyExpenses.reduce((sum, entry) => sum + entry.amount, 0);

    monthlyTrendData.push(monthData);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Advanced insights for {viewMode === 'day' ? 'today' : 'this month'}
            </p>
          </div>
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-green-600 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +12%
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold">{formatCurrency(netProfit)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-green-600 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +8%
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-indigo-500/10 p-3">
                  <TrendingUp className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Cash in Hand</p>
                  <p className="text-2xl font-bold">{formatCurrency(latestCashInHand)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-red-600 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3 rotate-180" />
                      -3%
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-orange-500/10 p-3">
                  <CreditCard className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-green-600 flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +5%
                    </span>
                  </div>
                </div>
                <div className="rounded-xl bg-cyan-500/10 p-3">
                  <Activity className="h-6 w-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend & Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Trend Line Chart */}
          <Card className="border-none shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Monthly Trend</CardTitle>
              <CardDescription className="text-xs">Revenue over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendData}>
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Revenue Breakdown Donut Chart */}
          {revenueBreakdownData.length > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Revenue by Source</CardTitle>
                <CardDescription className="text-xs">{format(date, 'MMMM yyyy')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
                  <RechartsPieChart>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={revenueBreakdownData.map(item => ({ ...item, visitors: item.value }))}
                      dataKey="visitors"
                      nameKey="name"
                      innerRadius={70}
                      strokeWidth={5}
                    >
                      {revenueBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-bold">
                                  100%
                                </tspan>
                              </text>
                            )
                          }
                        }}
                      />
                    </Pie>
                  </RechartsPieChart>
                </ChartContainer>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {revenueBreakdownData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Service Performance & OD Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Service Performance Bar Chart */}
          {serviceBreakdownData.length > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Service Performance</CardTitle>
                <CardDescription className="text-xs">Margin by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={serviceBreakdownData}>
                      <XAxis 
                        dataKey="service" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        angle={-15}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="margin" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                        {serviceBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* OD Flow Bar Chart */}
          {odTrendData.length > 0 && (
            <Card className="border-none shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">OD Flow Analytics</CardTitle>
                <CardDescription className="text-xs">Cash flow breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={odTrendData} barGap={2}>
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="od_from_bank" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} name="OD from Bank" />
                      <Bar dataKey="received" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} name="Amount Received" />
                      <Bar dataKey="given" fill="hsl(280, 85%, 55%)" radius={[4, 4, 0, 0]} name="Amount Given" />
                      <Bar dataKey="cash_in_hand" fill="hsl(340, 82%, 52%)" radius={[4, 4, 0, 0]} name="Cash in Hand" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }}></div>
                    <span>OD from Bank</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(160, 84%, 39%)' }}></div>
                    <span>Amount Received</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(280, 85%, 55%)' }}></div>
                    <span>Amount Given</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(340, 82%, 52%)' }}></div>
                    <span>Cash in Hand</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Revenue vs Expenses */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue vs Expenses
            </CardTitle>
            <CardDescription className="text-xs">6-month comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrendData}>
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(220, 90%, 56%)" 
                    strokeWidth={2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
