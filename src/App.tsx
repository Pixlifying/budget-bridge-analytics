
import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import BankingServices from "@/pages/BankingServices";
import BankingAccounts from "@/pages/BankingAccounts";
import OnlineServices from "@/pages/OnlineServices";
import Applications from "@/pages/Applications";
import Analytics from "@/pages/Analytics";
import Expenses from "@/pages/Expenses";
import PendingBalance from "@/pages/PendingBalance";
import Photostat from "@/pages/Photostat";
import Ledger from "@/pages/Ledger";
import AccountDetails from "@/pages/AccountDetails";
import Khata from "@/pages/Khata";
import Papers from "@/pages/Papers";
import CustomerDetails from "@/pages/CustomerDetails";
import AgeCalculator from "@/pages/AgeCalculator";
import Calculator from "@/pages/Calculator";
import MiscExpenses from "@/pages/MiscExpenses";
import Query from "@/pages/Query";
import Downloads from "@/pages/Downloads";
import UserAdmin from "@/pages/UserAdmin";
import ThemeSettings from "@/pages/ThemeSettings";
import NotFound from "@/pages/NotFound";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import OD from "@/pages/OD";
import Forms from "@/pages/Forms";
import Milk from "@/pages/Milk";
import SocialSecurity from "@/pages/SocialSecurity";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => {
  // Apply saved color theme on app load
  useEffect(() => {
    const savedTheme = localStorage.getItem('color-theme') || 'default';
    const root = document.documentElement;
    
    switch (savedTheme) {
      case 'green':
        root.style.setProperty('--primary', '142 69% 58%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '142 76% 36%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '142 69% 58%');
        root.style.setProperty('--sidebar-accent', '142 76% 36%');
        break;
      case 'black':
        root.style.setProperty('--primary', '215 28% 17%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '215 20% 27%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '215 28% 17%');
        root.style.setProperty('--sidebar-accent', '215 20% 27%');
        break;
      case 'gold':
        root.style.setProperty('--primary', '32 94% 43%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '38 92% 50%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '32 94% 43%');
        root.style.setProperty('--sidebar-accent', '38 92% 50%');
        break;
      case 'rosegold':
        root.style.setProperty('--primary', '13 66% 62%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '29 79% 68%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '13 66% 62%');
        root.style.setProperty('--sidebar-accent', '29 79% 68%');
        break;
      case 'yellow':
        root.style.setProperty('--primary', '47 96% 53%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '54 96% 64%');
        root.style.setProperty('--accent-foreground', '24 9% 10%');
        root.style.setProperty('--sidebar-background', '47 96% 53%');
        root.style.setProperty('--sidebar-accent', '54 96% 64%');
        break;
      case 'indigo':
        root.style.setProperty('--primary', '239 84% 67%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '243 75% 69%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '239 84% 67%');
        root.style.setProperty('--sidebar-accent', '243 75% 69%');
        break;
      case 'emerald':
        root.style.setProperty('--primary', '160 84% 39%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '158 64% 52%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '160 84% 39%');
        root.style.setProperty('--sidebar-accent', '158 64% 52%');
        break;
      case 'cyan':
        root.style.setProperty('--primary', '188 94% 43%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '186 94% 59%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '188 94% 43%');
        root.style.setProperty('--sidebar-accent', '186 94% 59%');
        break;
      case 'lime':
        root.style.setProperty('--primary', '84 81% 44%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '83 78% 56%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '84 81% 44%');
        root.style.setProperty('--sidebar-accent', '83 78% 56%');
        break;
      case 'amber':
        root.style.setProperty('--primary', '38 92% 50%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '48 96% 58%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '38 92% 50%');
        root.style.setProperty('--sidebar-accent', '48 96% 58%');
        break;
      case 'fuchsia':
        root.style.setProperty('--primary', '292 84% 61%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '291 64% 72%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '292 84% 61%');
        root.style.setProperty('--sidebar-accent', '291 64% 72%');
        break;
      case 'crimson':
        root.style.setProperty('--primary', '0 84% 60%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '0 72% 51%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '0 84% 60%');
        root.style.setProperty('--sidebar-accent', '0 72% 51%');
        break;
      case 'navy':
        root.style.setProperty('--primary', '219 79% 32%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '221 83% 53%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '219 79% 32%');
        root.style.setProperty('--sidebar-accent', '221 83% 53%');
        break;
      case 'mint':
        root.style.setProperty('--primary', '173 80% 40%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '172 82% 57%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '173 80% 40%');
        root.style.setProperty('--sidebar-accent', '172 82% 57%');
        break;
      case 'coral':
        root.style.setProperty('--primary', '0 77% 72%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '0 86% 80%');
        root.style.setProperty('--accent-foreground', '0 72% 51%');
        root.style.setProperty('--sidebar-background', '0 77% 72%');
        root.style.setProperty('--sidebar-accent', '0 86% 80%');
        break;
      case 'lavender':
        root.style.setProperty('--primary', '256 58% 76%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '262 68% 84%');
        root.style.setProperty('--accent-foreground', '262 83% 58%');
        root.style.setProperty('--sidebar-background', '256 58% 76%');
        root.style.setProperty('--sidebar-accent', '262 68% 84%');
        break;
      case 'slate':
        root.style.setProperty('--primary', '215 20% 40%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '215 16% 47%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '215 20% 40%');
        root.style.setProperty('--sidebar-accent', '215 16% 47%');
        break;
      case 'violet':
        root.style.setProperty('--primary', '262 83% 58%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '258 90% 66%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '262 83% 58%');
        root.style.setProperty('--sidebar-accent', '258 90% 66%');
        break;
      case 'pink':
        root.style.setProperty('--primary', '330 81% 60%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '330 77% 72%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '330 81% 60%');
        root.style.setProperty('--sidebar-accent', '330 77% 72%');
        break;
      case 'bronze':
        root.style.setProperty('--primary', '30 83% 34%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '42 78% 32%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '30 83% 34%');
        root.style.setProperty('--sidebar-accent', '42 78% 32%');
        break;
      case 'sapphire':
        root.style.setProperty('--primary', '202 96% 27%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '199 89% 48%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '202 96% 27%');
        root.style.setProperty('--sidebar-accent', '199 89% 48%');
        break;
      case 'grey':
        root.style.setProperty('--primary', '220 9% 46%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '220 13% 69%');
        root.style.setProperty('--accent-foreground', '220 9% 46%');
        root.style.setProperty('--sidebar-background', '220 9% 46%');
        root.style.setProperty('--sidebar-accent', '220 13% 69%');
        break;
      case 'sky':
        root.style.setProperty('--primary', '199 89% 48%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '198 93% 60%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '199 89% 48%');
        root.style.setProperty('--sidebar-accent', '198 93% 60%');
        break;
      case 'purple':
        root.style.setProperty('--primary', '262 83% 58%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '262 68% 70%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '262 83% 58%');
        root.style.setProperty('--sidebar-accent', '262 68% 70%');
        break;
      case 'rose':
        root.style.setProperty('--primary', '347 77% 50%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '347 89% 60%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '347 77% 50%');
        root.style.setProperty('--sidebar-accent', '347 89% 60%');
        break;
      case 'orange':
        root.style.setProperty('--primary', '20 91% 48%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '20 91% 67%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '20 91% 48%');
        root.style.setProperty('--sidebar-accent', '20 91% 67%');
        break;
      case 'teal':
        root.style.setProperty('--primary', '172 66% 50%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        root.style.setProperty('--accent', '172 44% 37%');
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--sidebar-background', '172 66% 50%');
        root.style.setProperty('--sidebar-accent', '172 44% 37%');
        break;
      default:
        root.style.setProperty('--primary', '221.2 83.2% 53.3%');
        root.style.setProperty('--primary-foreground', '210 40% 98%');
        root.style.setProperty('--accent', '221.2 83.2% 53.3%');
        root.style.setProperty('--accent-foreground', '222.2 47.4% 11.2%');
        root.style.setProperty('--sidebar-background', '221.2 83.2% 53.3%');
        root.style.setProperty('--sidebar-accent', '217 91.2% 59.8%');
        break;
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="dashboard-theme">
      <NotificationProvider>
        <BrowserRouter>
          <TooltipProvider>
            <ProtectedRoute>
              <div className="flex h-screen bg-background">
                <Sidebar />
                <main className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/banking-services" element={<BankingServices />} />
                    <Route path="/banking-accounts" element={<BankingAccounts />} />
                    <Route path="/od" element={<OD />} />
                    <Route path="/social-security" element={<SocialSecurity />} />
                    <Route path="/online-services" element={<OnlineServices />} />
                    <Route path="/applications" element={<Applications />} />
                    <Route path="/photostat" element={<Photostat />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/misc-expenses" element={<MiscExpenses />} />
                    <Route path="/pending-balance" element={<PendingBalance />} />
                    <Route path="/ledger" element={<Ledger />} />
                    <Route path="/ledger/:id" element={<CustomerDetails />} />
                    <Route path="/account-details" element={<AccountDetails />} />
                    <Route path="/khata" element={<Khata />} />
                    <Route path="/papers" element={<Papers />} />
                    <Route path="/calculator" element={<Calculator />} />
                    <Route path="/age-calculator" element={<AgeCalculator />} />
                    <Route path="/forms" element={<Forms />} />
                    <Route path="/milk" element={<Milk />} />
                    <Route path="/downloads" element={<Downloads />} />
                    <Route path="/user-admin" element={<UserAdmin />} />
                    <Route path="/theme-settings" element={<ThemeSettings />} />
                    <Route path="/query" element={<Query />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </BrowserRouter>
      </NotificationProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
