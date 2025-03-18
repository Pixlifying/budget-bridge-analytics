
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import PanCard from "@/pages/PanCard";
import Passport from "@/pages/Passport";
import BankingServices from "@/pages/BankingServices";
import OnlineServices from "@/pages/OnlineServices";
import Analytics from "@/pages/Analytics";
import Expenses from "@/pages/Expenses";
import PendingBalance from "@/pages/PendingBalance";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pan-card" element={<PanCard />} />
              <Route path="/passport" element={<Passport />} />
              <Route path="/banking-services" element={<BankingServices />} />
              <Route path="/online-services" element={<OnlineServices />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/pending-balance" element={<PendingBalance />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
