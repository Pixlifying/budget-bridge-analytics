import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import PanCard from './pages/PanCard';
import Passport from './pages/Passport';
import BankingServices from './pages/BankingServices';
import OnlineServices from './pages/OnlineServices';
import Applications from './pages/Applications';
import Photostat from './pages/Photostat';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Expenses from './pages/Expenses';
import FeeExpenses from './pages/FeeExpenses';
import MiscExpenses from './pages/MiscExpenses';
import PendingBalance from './pages/PendingBalance';
import Query from './pages/Query';
import Analytics from './pages/Analytics';
import NotFound from './pages/NotFound';
import Calculator from './pages/Calculator';
import AgeCalculator from './pages/AgeCalculator';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/age-calculator" element={<AgeCalculator />} />
        <Route path="/pan-card" element={<PanCard />} />
        <Route path="/passport" element={<Passport />} />
        <Route path="/banking-services" element={<BankingServices />} />
        <Route path="/online-services" element={<OnlineServices />} />
        <Route path="/applications" element={<Applications />} />
        <Route path="/photostat" element={<Photostat />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetails />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/fee-expenses" element={<FeeExpenses />} />
        <Route path="/misc-expenses" element={<MiscExpenses />} />
        <Route path="/pending-balance" element={<PendingBalance />} />
        <Route path="/queries" element={<Query />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
