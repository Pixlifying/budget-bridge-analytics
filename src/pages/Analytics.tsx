
import { useState, useEffect } from 'react';
import { BarChart, LineChart } from 'lucide-react';
import { 
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import PageWrapper from '@/components/layout/PageWrapper';
import DateRangePicker from '@/components/ui/DateRangePicker';
import useLocalStorage from '@/hooks/useLocalStorage';
import { 
  filterByMonth,
  formatCurrency
} from '@/utils/calculateUtils';

// Analytics component
const Analytics = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  
  // Retrieve data from localStorage
  const [panCards] = useLocalStorage('panCards', []);
  const [passports] = useLocalStorage('passports', []);
  const [bankingServices] = useLocalStorage('bankingServices', []);
  const [onlineServices] = useLocalStorage('onlineServices', []);
  const [expenses] = useLocalStorage('expenses', []);
  
  // Filter data based on selected date and view mode
  const filteredPanCards = filterByMonth(panCards, date);
  const filteredPassports = filterByMonth(passports, date);
  const filteredBankingServices = filterByMonth(bankingServices, date);
  const filteredOnlineServices = filterByMonth(onlineServices, date);
  const filteredExpenses = filterByMonth(expenses, date);
  
  // Calculate total margins
  const totalPanCardMargin = filteredPanCards.reduce((sum, entry) => sum + entry.margin, 0);
  const totalPassportMargin = filteredPassports.reduce((sum, entry) => sum + entry.margin, 0);
  const totalBankingMargin = filteredBankingServices.reduce((sum, entry) => sum + entry.margin, 0);
  const totalMargin = totalPanCardMargin + totalPassportMargin + totalBankingMargin;
  
  // Prepare data for charts
  const marginData = [
    { name: 'Pan Card', value: totalPanCardMargin, color: '#3b82f6' },
    { name: 'Passport', value: totalPassportMargin, color: '#10b981' },
    { name: 'Banking', value: totalBankingMargin, color: '#8b5cf6' },
  ];
  
  const serviceCountData = [
    { name: 'Pan Card', count: filteredPanCards.reduce((sum, entry) => sum + entry.count, 0) },
    { name: 'Passport', count: filteredPassports.reduce((sum, entry) => sum + entry.count, 0) },
    { name: 'Banking', count: filteredBankingServices.length },
    { name: 'Online', count: filteredOnlineServices.reduce((sum, entry) => sum + entry.count, 0) },
  ];
  
  // Group expenses by day/category for line chart
  const expensesByDay = filteredExpenses.reduce((acc, expense) => {
    const day = new Date(expense.date).getDate();
    acc[day] = (acc[day] || 0) + expense.amount;
    return acc;
  }, {});
  
  const expenseLineData = Object.entries(expensesByDay).map(([day, amount]) => ({
    day: `Day ${day}`,
    amount,
  })).sort((a, b) => parseInt(a.day.split(' ')[1]) - parseInt(b.day.split(' ')[1]));
  
  // COLORS for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <PageWrapper
      title="Analytics"
      subtitle="View insights and trends for your services and expenses"
      action={
        <DateRangePicker 
          date={date} 
          onDateChange={setDate} 
          mode={viewMode} 
          onModeChange={setViewMode} 
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Total Margin Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Margin Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={marginData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {marginData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center mt-4 text-muted-foreground text-sm">
            Total Margin: {formatCurrency(totalMargin)}
          </p>
        </div>
        
        {/* Service Count Comparison */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" />
            Service Count Comparison
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart
              data={serviceCountData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Count" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Expenses Over Time */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-border lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LineChart className="h-5 w-5 text-primary" />
            Expenses Over Time
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart
              data={expenseLineData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#ef4444"
                name="Expense Amount"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 8 }}
              />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Analytics;
