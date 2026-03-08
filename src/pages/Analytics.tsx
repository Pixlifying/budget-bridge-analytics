import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, PieChart, Activity, DollarSign, CreditCard, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { supabase } from '@/integrations/supabase/client';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import AnimatedAreaChart from '@/components/ui/AnimatedAreaChart';
import AnimatedBarChart from '@/components/ui/AnimatedBarChart';
import AnimatedRadialChart from '@/components/ui/AnimatedRadialChart';
import AnimatedODFlowChart from '@/components/ui/AnimatedODFlowChart';

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
  const totalMiscExpenses = filteredMiscExpenses.reduce((sum, entry) => sum + entry.fee, 0);

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
    { name: 'Forms', value: totalApplications, color: COLORS[4] }
  ].filter(item => item.value > 0);

  const serviceBreakdownData = [
    { service: 'PAN Cards', margin: totalPanMargin },
    { service: 'Passports', margin: totalPassportMargin },
    { service: 'Banking', margin: totalBankingMargin },
    { service: 'Online', margin: totalOnlineServices },
    { service: 'Forms', margin: totalApplications }
  ].filter(item => item.margin > 0);

  const monthlyTrendData: { month: string; revenue: number; expenses: number }[] = [];
  const last6Months: Date[] = [];
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

  const metricCards = [
    {
      title: 'Total Revenue',
      value: totalRevenue,
      icon: DollarSign,
      trend: '+12%',
      trendUp: true,
      gradient: 'from-emerald-500/15 to-emerald-500/5',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Net Profit',
      value: netProfit,
      icon: TrendingUp,
      trend: '+8%',
      trendUp: true,
      gradient: 'from-blue-500/15 to-blue-500/5',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Cash in Hand',
      value: latestCashInHand,
      icon: Wallet,
      trend: '-3%',
      trendUp: false,
      gradient: 'from-amber-500/15 to-amber-500/5',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: Activity,
      trend: '+5%',
      trendUp: true,
      gradient: 'from-rose-500/15 to-rose-500/5',
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-3 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Advanced insights for {viewMode === 'day' ? format(date, 'dd MMM yyyy') : format(date, 'MMMM yyyy')}
            </p>
          </div>
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {metricCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className={`relative overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-500 group bg-gradient-to-br ${card.gradient} animate-fade-in`}
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
              >
                {/* Decorative blob */}
                <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-primary/5 group-hover:scale-150 transition-transform duration-700" />
                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${card.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                    <div className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${card.trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                      {card.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {card.trend}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 tracking-tight">
                    {formatCurrency(card.value)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Revenue Trend & Revenue Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Revenue vs Expenses</CardTitle>
                  <CardDescription className="text-xs">6-month trend overview</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <AnimatedAreaChart data={monthlyTrendData} />
            </CardContent>
          </Card>

          {revenueBreakdownData.length > 0 && (
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <PieChart className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Revenue by Source</CardTitle>
                    <CardDescription className="text-xs">{format(date, 'MMMM yyyy')}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <AnimatedRadialChart data={revenueBreakdownData} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Service Performance & OD Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {serviceBreakdownData.length > 0 && (
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Service Performance</CardTitle>
                    <CardDescription className="text-xs">Margin by service type</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <AnimatedBarChart data={serviceBreakdownData} />
              </CardContent>
            </Card>
          )}

          {odTrendData.length > 0 && (
            <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 animate-fade-in" style={{ animationDelay: '700ms', animationFillMode: 'both' }}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <CreditCard className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">OD Flow Analytics</CardTitle>
                    <CardDescription className="text-xs">Cash flow breakdown</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <AnimatedODFlowChart data={odTrendData} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Stats Summary */}
        <Card className="border-none shadow-md animate-fade-in" style={{ animationDelay: '800ms', animationFillMode: 'both' }}>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'PAN Cards', value: totalPanMargin, color: 'bg-primary/10 text-primary' },
                { label: 'Passports', value: totalPassportMargin, color: 'bg-blue-500/10 text-blue-600' },
                { label: 'Banking', value: totalBankingMargin, color: 'bg-pink-500/10 text-pink-600' },
                { label: 'Online', value: totalOnlineServices, color: 'bg-teal-500/10 text-teal-600' },
                { label: 'Forms', value: totalApplications, color: 'bg-purple-500/10 text-purple-600' },
                { label: 'Misc Exp.', value: totalMiscExpenses, color: 'bg-orange-500/10 text-orange-600' },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-sm sm:text-base font-bold text-foreground">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
