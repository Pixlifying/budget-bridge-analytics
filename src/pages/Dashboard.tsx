
import { useState, useEffect } from 'react';
import { FileText, CreditCard, Globe, Receipt, PiggyBank } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import useLocalStorage from '@/hooks/useLocalStorage';
import { 
  filterByDate, 
  filterByMonth, 
  formatCurrency, 
  getTotalMargin 
} from '@/utils/calculateUtils';

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

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  
  const [panCards] = useLocalStorage<PanCardEntry[]>('panCards', []);
  const [passports] = useLocalStorage<PassportEntry[]>('passports', []);
  const [bankingServices] = useLocalStorage<BankingServiceEntry[]>('bankingServices', []);
  const [onlineServices] = useLocalStorage<OnlineServiceEntry[]>('onlineServices', []);
  const [expenses] = useLocalStorage<ExpenseEntry[]>('expenses', []);

  const [filteredPanCards, setFilteredPanCards] = useState<PanCardEntry[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [filteredBankingServices, setFilteredBankingServices] = useState<BankingServiceEntry[]>([]);
  const [filteredOnlineServices, setFilteredOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  
  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredPanCards(filterByDate(panCards, date));
      setFilteredPassports(filterByDate(passports, date));
      setFilteredBankingServices(filterByDate(bankingServices, date));
      setFilteredOnlineServices(filterByDate(onlineServices, date));
      setFilteredExpenses(filterByDate(expenses, date));
    } else {
      setFilteredPanCards(filterByMonth(panCards, date));
      setFilteredPassports(filterByMonth(passports, date));
      setFilteredBankingServices(filterByMonth(bankingServices, date));
      setFilteredOnlineServices(filterByMonth(onlineServices, date));
      setFilteredExpenses(filterByMonth(expenses, date));
    }
  }, [date, viewMode, panCards, passports, bankingServices, onlineServices, expenses]);

  const totalMargin = getTotalMargin(
    filteredPanCards,
    filteredPassports,
    filteredBankingServices
  );

  const panCardCount = filteredPanCards.reduce((sum, entry) => sum + entry.count, 0);
  const passportCount = filteredPassports.reduce((sum, entry) => sum + entry.count, 0);
  const bankingServicesCount = filteredBankingServices.length;
  const onlineServicesCount = filteredOnlineServices.reduce((sum, entry) => sum + entry.count, 0);
  const expensesTotal = filteredExpenses.reduce((sum, entry) => sum + entry.amount, 0);

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
          title="Expenses"
          value={formatCurrency(expensesTotal)}
          icon={<PiggyBank size={20} />}
        />
        <StatCard 
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          className="bg-primary/10"
        />
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
