import { useState, useEffect } from 'react';
import { FileText, CreditCard, Globe, Receipt, PiggyBank, AlertCircle, FilePen } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { supabase } from '@/integrations/supabase/client';
import { 
  filterByDate, 
  filterByMonth, 
  formatCurrency, 
  getTotalMargin,
  calculateOnlineServiceMargin 
} from '@/utils/calculateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface ApplicationEntry {
  id: string;
  date: Date;
  customer_name: string;
  pages_count: number;
  amount: number;
}

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [showMarginDetails, setShowMarginDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [panCards, setPanCards] = useState<PanCardEntry[]>([]);
  const [passports, setPassports] = useState<PassportEntry[]>([]);
  const [bankingServices, setBankingServices] = useState<BankingServiceEntry[]>([]);
  const [onlineServices, setOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [pendingBalances, setPendingBalances] = useState<PendingBalanceEntry[]>([]);
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);

  const [filteredPanCards, setFilteredPanCards] = useState<PanCardEntry[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [filteredBankingServices, setFilteredBankingServices] = useState<BankingServiceEntry[]>([]);
  const [filteredOnlineServices, setFilteredOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [filteredPendingBalances, setFilteredPendingBalances] = useState<PendingBalanceEntry[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationEntry[]>([]);
  
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
      
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select('*')
        .order('date', { ascending: false });
      
      if (applicationsError) throw applicationsError;
      
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
      
      const formattedApplications = applicationsData.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        customer_name: entry.customer_name,
        pages_count: entry.pages_count,
        amount: Number(entry.amount)
      }));
      
      setPanCards(formattedPanCards);
      setPassports(formattedPassports);
      setBankingServices(formattedBankingServices);
      setOnlineServices(formattedOnlineServices);
      setExpenses(formattedExpenses);
      setPendingBalances(formattedPendingBalances);
      setApplications(formattedApplications);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      setFilteredApplications(filterByDate(applications, date));
    } else {
      setFilteredPanCards(filterByMonth(panCards, date));
      setFilteredPassports(filterByMonth(passports, date));
      setFilteredBankingServices(filterByMonth(bankingServices, date));
      setFilteredOnlineServices(filterByMonth(onlineServices, date));
      setFilteredExpenses(filterByMonth(expenses, date));
      setFilteredPendingBalances(filterByMonth(pendingBalances, date));
      setFilteredApplications(filterByMonth(applications, date));
    }
  }, [date, viewMode, panCards, passports, bankingServices, onlineServices, expenses, pendingBalances, applications]);

  const totalMargin = getTotalMargin(
    filteredPanCards,
    filteredPassports,
    filteredBankingServices,
    filteredOnlineServices,
    filteredApplications
  );

  const panCardCount = filteredPanCards.reduce((sum, entry) => sum + entry.count, 0);
  const passportCount = filteredPassports.reduce((sum, entry) => sum + entry.count, 0);
  const bankingServicesCount = filteredBankingServices.length;
  const onlineServicesCount = filteredOnlineServices.reduce((sum, entry) => sum + entry.count, 0);
  const expensesTotal = filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  const pendingBalanceTotal = filteredPendingBalances.reduce((sum, entry) => sum + entry.amount, 0);
  const applicationsCount = filteredApplications.length;
  const applicationsPagesCount = filteredApplications.reduce((sum, entry) => sum + entry.pages_count, 0);
  const applicationsAmount = filteredApplications.reduce((sum, entry) => sum + entry.amount, 0);

  const panCardMargin = filteredPanCards.reduce((total, item) => total + item.margin, 0);
  const passportMargin = filteredPassports.reduce((total, item) => total + item.margin, 0);
  const bankingMargin = filteredBankingServices.reduce((total, item) => total + item.margin, 0);
  const onlineServicesMargin = filteredOnlineServices.reduce((total, item) => total + calculateOnlineServiceMargin(item.amount), 0);
  const applicationsMargin = applicationsAmount;

  return (
    <PageWrapper
      title="Hisab Kitab"
      subtitle={`Summary for ${viewMode === 'day' ? 'today' : 'this month'}`}
      action={
        <DateRangePicker 
          date={date} 
          onDateChange={setDate} 
          mode={viewMode} 
          onModeChange={setViewMode} 
        />
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Pan Cards"
          value={panCardCount}
          icon={<FileText size={20} />}
        />
        <StatCard 
          title="Passports"
          value={passportCount}
          icon={<Receipt size={20} />}
        />
        <StatCard 
          title="Banking Services"
          value={bankingServicesCount}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Online Services"
          value={onlineServicesCount}
          icon={<Globe size={20} />}
        />
        <StatCard 
          title="Applications"
          value={applicationsCount}
          icon={<FilePen size={20} />}
        />
        <StatCard 
          title="Total Applications Pages"
          value={applicationsPagesCount.toString()}
          icon={<FilePen size={20} />}
        />
        <StatCard 
          title="Expenses"
          value={formatCurrency(expensesTotal)}
          icon={<PiggyBank size={20} />}
        />
        <StatCard 
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          className="bg-primary/10 cursor-pointer"
          onClick={() => setShowMarginDetails(true)}
        />
        <StatCard 
          title="Pending Balance"
          value={formatCurrency(pendingBalanceTotal)}
          icon={<AlertCircle size={20} />}
          className="bg-amber-50"
        />
      </div>

      <Dialog open={showMarginDetails} onOpenChange={setShowMarginDetails}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Margin Details</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Pan Card Margin:</span>
                <span>{formatCurrency(panCardMargin)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Passport Margin:</span>
                <span>{formatCurrency(passportMargin)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Banking Services Margin:</span>
                <span>{formatCurrency(bankingMargin)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Online Services Margin:</span>
                <span>{formatCurrency(onlineServicesMargin)}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Applications Margin:</span>
                <span>{formatCurrency(applicationsMargin)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold">Total Margin:</span>
                <span className="font-bold text-primary">{formatCurrency(totalMargin)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Dashboard;
