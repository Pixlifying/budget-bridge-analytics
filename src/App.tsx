
import React from "react";
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
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
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

export default App;
