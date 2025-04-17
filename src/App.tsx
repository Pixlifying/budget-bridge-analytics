
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import BankingServices from "@/pages/BankingServices";
import OnlineServices from "@/pages/OnlineServices";
import Applications from "@/pages/Applications";
import Analytics from "@/pages/Analytics";
import Expenses from "@/pages/Expenses";
import PendingBalance from "@/pages/PendingBalance";
import Photostat from "@/pages/Photostat";
import NotFound from "@/pages/NotFound";
import { TooltipProvider } from "@radix-ui/react-tooltip";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/banking-services" element={<BankingServices />} />
              <Route path="/online-services" element={<OnlineServices />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/photostat" element={<Photostat />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/pending-balance" element={<PendingBalance />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
