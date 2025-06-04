
import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';

// Layout components
import Sidebar from '@/components/layout/Sidebar';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import BankingServices from '@/pages/BankingServices';
import OnlineServices from '@/pages/OnlineServices';
import PendingBalance from '@/pages/PendingBalance';
import Analytics from '@/pages/Analytics';
import Calculator from '@/pages/Calculator';
import AgeCalculator from '@/pages/AgeCalculator';
import Expenses from '@/pages/Expenses';
import FeeExpenses from '@/pages/FeeExpenses';
import MiscExpenses from '@/pages/MiscExpenses';
import BankingAccounts from '@/pages/BankingAccounts';
import PanCard from '@/pages/PanCard';
import Passport from '@/pages/Passport';
import Photostat from '@/pages/Photostat';
import Applications from '@/pages/Applications';
import Customers from '@/pages/Customers';
import CustomerDetails from '@/pages/CustomerDetails';
import Ledger from '@/pages/Ledger';
import AccountDetails from '@/pages/AccountDetails';
import Khata from '@/pages/Khata';
import Papers from '@/pages/Papers';
import Templates from '@/pages/Templates';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NotificationProvider>
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/banking-services" element={<BankingServices />} />
                <Route path="/online-services" element={<OnlineServices />} />
                <Route path="/pending-balance" element={<PendingBalance />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/age-calculator" element={<AgeCalculator />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/fee-expenses" element={<FeeExpenses />} />
                <Route path="/misc-expenses" element={<MiscExpenses />} />
                <Route path="/banking-accounts" element={<BankingAccounts />} />
                <Route path="/pan-card" element={<PanCard />} />
                <Route path="/passport" element={<Passport />} />
                <Route path="/photostat" element={<Photostat />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/:id" element={<CustomerDetails />} />
                <Route path="/ledger" element={<Ledger />} />
                <Route path="/account-details" element={<AccountDetails />} />
                <Route path="/khata" element={<Khata />} />
                <Route path="/papers" element={<Papers />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </NotificationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
