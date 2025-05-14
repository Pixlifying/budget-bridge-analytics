
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
import Query from "@/pages/Query";
import Customers from "@/pages/Customers";
import CustomerDetails from "@/pages/CustomerDetails";
import AgeCalculator from "@/pages/AgeCalculator";
import Calculator from "@/pages/Calculator";
import FeeExpenses from "@/pages/FeeExpenses";
import MiscExpenses from "@/pages/MiscExpenses";
import NotFound from "@/pages/NotFound";
import { TooltipProvider } from "@radix-ui/react-tooltip";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/banking-services" element={<BankingServices />} />
              <Route path="/banking-accounts" element={<BankingAccounts />} />
              <Route path="/online-services" element={<OnlineServices />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/photostat" element={<Photostat />} />
              <Route path="/queries" element={<Query />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/fee-expenses" element={<FeeExpenses />} />
              <Route path="/misc-expenses" element={<MiscExpenses />} />
              <Route path="/pending-balance" element={<PendingBalance />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetails />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/age-calculator" element={<AgeCalculator />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
