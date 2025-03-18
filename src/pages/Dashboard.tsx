
import { useState, useEffect } from 'react';
import { FileText, CreditCard, Globe, Receipt, PiggyBank, AlertCircle } from 'lucide-react';
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

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [showMarginDetails, setShowMarginDetails] = useState(false);
  
  const [panCards] = useLocalStorage<PanCardEntry[]>('panCards', []);
  const [passports] = useLocalStorage<PassportEntry[]>('passports', []);
  const [bankingServices] = useLocalStorage<BankingServiceEntry[]>('bankingServices', []);
  const [onlineServices] = useLocalStorage<OnlineServiceEntry[]>('onlineServices', []);
  const [expenses] = useLocalStorage<ExpenseEntry[]>('expenses', []);
  const [pendingBalances] = useLocalStorage<PendingBalanceEntry[]>('pendingBalances', []);

  const [filteredPanCards, setFilteredPanCards] = useState<PanCardEntry[]>([]);
  const [filteredPassports, setFilteredPassports] = useState<PassportEntry[]>([]);
  const [filteredBankingServices, setFilteredBankingServices] = useState<BankingServiceEntry[]>([]);
  const [filteredOnlineServices, setFilteredOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<ExpenseEntry[]>([]);
  const [filteredPendingBalances, setFilteredPendingBalances] = useState<PendingBalanceEntry[]>([]);
  
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
  const pendingBalanceTotal = filteredPendingBalances.reduce((sum, entry) => sum + entry.amount, 0);

  const panCardMargin = filteredPanCards.reduce((total, item) => total + item.margin, 0);
  const passportMargin = filteredPassports.reduce((total, item) => total + item.margin, 0);
  const bankingMargin = filteredBankingServices.reduce((total, item) => total + item.margin, 0);

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
