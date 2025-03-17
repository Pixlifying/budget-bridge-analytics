import { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import useLocalStorage from '@/hooks/useLocalStorage';
import { filterByMonth, formatCurrency } from '@/utils/calculateUtils';
import StatCard from '@/components/ui/StatCard';

const Analytics = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  const [activeTab, setActiveTab] = useState('overview');

  // Get data from localStorage
  const [bankingServices] = useLocalStorage('bankingServices', []);
  const [onlineServices] = useLocalStorage('onlineServices', []);
  const [panCards] = useLocalStorage('panCards', []);
  const [passports] = useLocalStorage('passports', []);
  const [expenses] = useLocalStorage('expenses', []);

  // Filter data by month
  const filteredBankingServices = filterByMonth(bankingServices, date);
  const filteredOnlineServices = filterByMonth(onlineServices, date);
  const filteredPanCards = filterByMonth(panCards, date);
  const filteredPassports = filterByMonth(passports, date);
  const filteredExpenses = filterByMonth(expenses, date);

  // Calculate totals
  const totalBankingAmount = filteredBankingServices.reduce((sum, entry) => sum + entry.amount, 0);
  const totalBankingMargin = filteredBankingServices.reduce((sum, entry) => sum + entry.margin, 0);
  
  const totalOnlineAmount = filteredOnlineServices.reduce((sum, entry) => sum + entry.total, 0);
  const totalOnlineCount = filteredOnlineServices.reduce((sum, entry) => sum + entry.count, 0);
  
  const totalPanAmount = filteredPanCards.reduce((sum, entry) => sum + entry.total, 0);
  const totalPanCount = filteredPanCards.length;
  
  const totalPassportAmount = filteredPassports.reduce((sum, entry) => sum + entry.total, 0);
  const totalPassportCount = filteredPassports.length;
  
  const totalExpenses = filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);

  // Calculate total revenue and profit
  const totalRevenue = totalBankingAmount + totalOnlineAmount + totalPanAmount + totalPassportAmount;
  const totalProfit = totalBankingMargin + totalOnlineAmount + totalPanAmount + totalPassportAmount - totalExpenses;

  // Prepare data for charts
  const marginDistribution = [
    { name: 'Banking', value: totalBankingMargin },
    { name: 'Online', value: totalOnlineAmount },
    { name: 'PAN Card', value: totalPanAmount },
    { name: 'Passport', value: totalPassportAmount },
    { name: 'Expenses', value: -totalExpenses },
  ];

  const serviceDistribution = [
    { name: 'Banking', value: filteredBankingServices.length },
    { name: 'Online', value: totalOnlineCount },
    { name: 'PAN Card', value: totalPanCount },
    { name: 'Passport', value: totalPassportCount },
  ];

  return (
    <PageWrapper
      title="Analytics"
      subtitle="Visualize your business data"
      action={
        <DateRangePicker 
          date={date} 
          onDateChange={setDate} 
          mode={viewMode} 
          onModeChange={setViewMode} 
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Margin Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  width={500}
                  height={300}
                  data={marginDistribution}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    format={(value) => formatCurrency(value)}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Service Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  width={500}
                  height={300}
                  data={serviceDistribution}
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
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)}
          icon={<Calendar size={20} />}
          className="bg-blue-50"
        />
        <StatCard 
          title="Total Profit" 
          value={formatCurrency(totalProfit)}
          icon={<Calendar size={20} />}
          className="bg-green-50"
        />
        <StatCard 
          title="Total Expenses" 
          value={formatCurrency(totalExpenses)}
          icon={<Calendar size={20} />}
          className="bg-rose-50"
        />
        <StatCard 
          title="Total Services" 
          value={filteredBankingServices.length + totalOnlineCount + totalPanCount + totalPassportCount}
          icon={<Calendar size={20} />}
          className="bg-purple-50"
        />
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
          <TabsTrigger value="online">Online Services</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Revenue Breakdown</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Banking Services:</span>
                      <span className="font-medium">{formatCurrency(totalBankingAmount)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Online Services:</span>
                      <span className="font-medium">{formatCurrency(totalOnlineAmount)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">PAN Card:</span>
                      <span className="font-medium">{formatCurrency(totalPanAmount)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Passport:</span>
                      <span className="font-medium">{formatCurrency(totalPassportAmount)}</span>
                    </li>
                    <li className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-medium">Total Revenue:</span>
                      <span className="font-bold">{formatCurrency(totalRevenue)}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Profit Analysis</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Banking Margin:</span>
                      <span className="font-medium">{formatCurrency(totalBankingMargin)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Online Services:</span>
                      <span className="font-medium">{formatCurrency(totalOnlineAmount)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Documents:</span>
                      <span className="font-medium">{formatCurrency(totalPanAmount + totalPassportAmount)}</span>
                    </li>
                    <li className="flex justify-between text-rose-500">
                      <span>Expenses:</span>
                      <span>-{formatCurrency(totalExpenses)}</span>
                    </li>
                    <li className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-medium">Net Profit:</span>
                      <span className="font-bold">{formatCurrency(totalProfit)}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="banking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Banking Services Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Banking Overview</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Services:</span>
                      <span className="font-medium">{filteredBankingServices.length}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(totalBankingAmount)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Margin:</span>
                      <span className="font-medium">{formatCurrency(totalBankingMargin)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Average Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(filteredBankingServices.length > 0 
                          ? totalBankingAmount / filteredBankingServices.length 
                          : 0)}
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Average Margin:</span>
                      <span className="font-medium">
                        {formatCurrency(filteredBankingServices.length > 0 
                          ? totalBankingMargin / filteredBankingServices.length 
                          : 0)}
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Margin Analysis</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Margin Percentage:</span>
                      <span className="font-medium">
                        {totalBankingAmount > 0 
                          ? ((totalBankingMargin / totalBankingAmount) * 100).toFixed(2) 
                          : 0}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Contribution to Revenue:</span>
                      <span className="font-medium">
                        {totalRevenue > 0 
                          ? ((totalBankingAmount / totalRevenue) * 100).toFixed(2) 
                          : 0}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Contribution to Profit:</span>
                      <span className="font-medium">
                        {totalProfit > 0 
                          ? ((totalBankingMargin / totalProfit) * 100).toFixed(2) 
                          : 0}%
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="online" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Online Services Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Online Services Overview</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Services:</span>
                      <span className="font-medium">{totalOnlineCount}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(totalOnlineAmount)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Average Amount per Service:</span>
                      <span className="font-medium">
                        {formatCurrency(totalOnlineCount > 0 
                          ? totalOnlineAmount / totalOnlineCount 
                          : 0)}
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Performance Analysis</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Contribution to Revenue:</span>
                      <span className="font-medium">
                        {totalRevenue > 0 
                          ? ((totalOnlineAmount / totalRevenue) * 100).toFixed(2) 
                          : 0}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Contribution to Profit:</span>
                      <span className="font-medium">
                        {totalProfit > 0 
                          ? ((totalOnlineAmount / totalProfit) * 100).toFixed(2) 
                          : 0}%
                      </span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Services per Transaction:</span>
                      <span className="font-medium">
                        {filteredOnlineServices.length > 0 
                          ? (totalOnlineCount / filteredOnlineServices.length).toFixed(2) 
                          : 0}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documents Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">PAN Card Overview</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Applications:</span>
                      <span className="font-medium">{totalPanCount}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(totalPanAmount)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Average Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(totalPanCount > 0 
                          ? totalPanAmount / totalPanCount 
                          : 0)}
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Passport Overview</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Applications:</span>
                      <span className="font-medium">{totalPassportCount}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(totalPassportAmount)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Average Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(totalPassportCount > 0 
                          ? totalPassportAmount / totalPassportCount 
                          : 0)}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
};

export default Analytics;
