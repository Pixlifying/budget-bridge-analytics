import { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import PageWrapper from '@/components/layout/PageWrapper';
import DateRangePicker from '@/components/ui/DateRangePicker';
import StatCard from '@/components/ui/StatCard';
import { supabase } from '@/integrations/supabase/client';
import { 
  filterByDate, 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  TableCaption 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

interface PendingBalanceEntry {
  id: string;
  date: Date;
  name: string;
  address: string;
  phone: string;
  service: string;
  amount: number;
}

const Analytics = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);
  
  const [panCards, setPanCards] = useState<PanCardEntry[]>([]);
  const [passports, setPassports] = useState<PassportEntry[]>([]);
  const [bankingServices, setBankingServices] = useState<BankingServiceEntry[]>([]);
  const [onlineServices, setOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [pendingBalances, setPendingBalances] = useState<PendingBalanceEntry[]>([]);

  const [filteredPanCards, setFilteredPanCards] = useState<PanCardEntry[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [filteredBankingServices, setFilteredBankingServices] = useState<BankingServiceEntry[]>([]);
  const [filteredOnlineServices, setFilteredOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [filteredPendingBalances, setFilteredPendingBalances] = useState<PendingBalanceEntry[]>([]);
  
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const { data: panCardData, error: panCardError } = await supabase
        .from('pan_cards')
        .select('*')
        .order('date', { ascending: false });
      
      if (panCardError) throw panCardError;
      
      const { data: passportData, error: passportError } = await supabase
        .from('passports')
        .select('*')
        .order('date', { ascending: false });
      
      if (passportError) throw passportError;
      
      const { data: bankingData, error: bankingError } = await supabase
        .from('banking_services')
        .select('*')
        .order('date', { ascending: false });
      
      if (bankingError) throw bankingError;
      
      const { data: onlineData, error: onlineError } = await supabase
        .from('online_services')
        .select('*')
        .order('date', { ascending: false });
      
      if (onlineError) throw onlineError;
      
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });
      
      if (expenseError) throw expenseError;
      
      const { data: pendingData, error: pendingError } = await supabase
        .from('pending_balances')
        .select('*')
        .order('date', { ascending: false });
      
      if (pendingError) throw pendingError;
      
      const formattedPanCards = panCardData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        count: entry.count,
        amount: Number(entry.amount),
        total: Number(entry.total),
        margin: Number(entry.margin)
      }));
      
      const formattedPassports = passportData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        count: entry.count,
        amount: Number(entry.amount),
        total: Number(entry.total),
        margin: Number(entry.margin)
      }));
      
      const formattedBankingServices = bankingData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount: Number(entry.amount),
        margin: Number(entry.margin)
      }));
      
      const formattedOnlineServices = onlineData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        service: entry.service,
        amount: Number(entry.amount),
        count: entry.count
      }));
      
      const formattedExpenses = expenseData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        amount: Number(entry.amount)
      }));
      
      const formattedPendingBalances = pendingData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        name: entry.name,
        address: entry.address,
        phone: entry.phone,
        service: entry.service,
        amount: Number(entry.amount)
      }));
      
      setPanCards(formattedPanCards);
      setPassports(formattedPassports);
      setBankingServices(formattedBankingServices);
      setOnlineServices(formattedOnlineServices);
      setExpenses(formattedExpenses);
      setPendingBalances(formattedPendingBalances);
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
      setFilteredPanCards(filterByDate(panCards, date));
      setFilteredPassports(filterByDate(passports, date));
      setFilteredBankingServices(filterByDate(bankingServices, date));
      setFilteredOnlineServices(filterByDate(onlineServices, date));
      setFilteredExpenses(filterByDate(expenses, date));
      setFilteredPendingBalances(filterByDate(pendingBalances, date));
    } else {
      setFilteredPanCards(filterByMonth(panCards, date));
      setFilteredPassports(filterByMonth(passports, date));
      setFilteredBankingServices(filterByMonth(bankingServices, date));
      setFilteredOnlineServices(filterByMonth(onlineServices, date));
      setFilteredExpenses(filterByMonth(expenses, date));
      setFilteredPendingBalances(filterByMonth(pendingBalances, date));
    }
  }, [date, viewMode, panCards, passports, bankingServices, onlineServices, expenses, pendingBalances]);

  const expenseData = {
    labels: filteredExpenses.map(item => item.name),
    datasets: [
      {
        label: 'Expenses',
        data: filteredExpenses.map(item => item.amount),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const onlineServicesData = {
    labels: filteredOnlineServices.map(item => item.service),
    datasets: [
      {
        label: 'Online Services',
        data: filteredOnlineServices.map(item => item.count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  const pendingBalancesData = {
    labels: filteredPendingBalances.map(item => item.name),
    datasets: [
      {
        label: 'Pending Balances',
        data: filteredPendingBalances.map(item => item.amount),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const totalExpenses = filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  const totalOnlineServices = filteredOnlineServices.reduce((sum, entry) => sum + entry.amount, 0);
  const totalPendingBalances = filteredPendingBalances.reduce((sum, entry) => sum + entry.amount, 0);

  const pieChartData = {
    labels: ['Expenses', 'Online Services', 'Pending Balances'],
    datasets: [
      {
        label: 'Total Amounts',
        data: [totalExpenses, totalOnlineServices, totalPendingBalances],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Financial Overview',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';

            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  const marginTableData = [
    { service: 'PAN Card', margin: '₹100 per card', calculation: 'Fixed ₹100 margin for each PAN Card' },
    { service: 'Passport', margin: '₹200 per passport', calculation: 'Fixed ₹200 margin for each Passport' },
    { service: 'Banking Service', margin: '10% of amount', calculation: 'Calculated as 10% of the transaction amount' },
    { service: 'Online Service', margin: 'Varies', calculation: 'Depends on service type and count' },
  ];

  return (
    <PageWrapper
      title="Analytics"
      subtitle={`Insights for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <DateRangePicker 
          date={date} 
          onDateChange={setDate} 
          mode={viewMode} 
          onModeChange={setViewMode} 
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={<BarChart3 size={20} />}
        />
        <StatCard 
          title="Total Online Services"
          value={formatCurrency(totalOnlineServices)}
          icon={<BarChart3 size={20} />}
        />
        <StatCard 
          title="Total Pending Balances"
          value={formatCurrency(totalPendingBalances)}
          icon={<BarChart3 size={20} />}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Expenses Chart</h3>
          <Bar options={chartOptions} data={expenseData} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Online Services Chart</h3>
          <Bar options={chartOptions} data={onlineServicesData} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Pending Balances Chart</h3>
          <Bar options={chartOptions} data={pendingBalancesData} />
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-medium mb-4">Financial Overview</h3>
          <Pie data={pieChartData} options={chartOptions} />
        </div>
        
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Margin Calculation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Details on how margin is calculated for different services</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Margin Rate</TableHead>
                  <TableHead>Calculation Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marginTableData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.service}</TableCell>
                    <TableCell>{item.margin}</TableCell>
                    <TableCell>{item.calculation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Analytics;
