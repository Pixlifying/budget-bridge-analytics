import { useEffect, useState } from 'react';
import { CreditCard, FileText, Globe, BarChart3, AlertCircle, Wallet, Printer, Receipt, TrendingUp, Search, Bell, MessageSquare, Users, ArrowUpRight, ArrowDownRight, Upload, Clock, BookOpen, Menu } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import DateRangePicker from '@/components/ui/DateRangePicker';
import NotificationBox from '@/components/ui/NotificationBox';
import ReminderCalendar from '@/components/ui/ReminderCalendar';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatCurrency } from '@/utils/calculateUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

const Dashboard = () => {
  const { setOpen: setMobileMenuOpen } = useMobileMenu();
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'quarter'>('day');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marginDialogOpen, setMarginDialogOpen] = useState(false);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(false);
  const [applicationsDialogOpen, setApplicationsDialogOpen] = useState(false);
  const [onlineServicesDialogOpen, setOnlineServicesDialogOpen] = useState(false);
  const [documentationDialogOpen, setDocumentationDialogOpen] = useState(false);
  const [expensesDialogOpen, setExpensesDialogOpen] = useState(false);
  const [photostatDialogOpen, setPhotostatDialogOpen] = useState(false);
  const [khataDialogOpen, setKhataDialogOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Previous month for comparison
  const previousMonth = subMonths(date, 1);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const {
    data: bankingData,
    error: bankingError
  } = useQuery({
    queryKey: ['bankingServices', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('banking_services').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      } else if (viewMode === 'quarter') {
        const startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
        const endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Previous month banking data for comparison
  const { data: prevBankingData } = useQuery({
    queryKey: ['bankingServicesPrev', previousMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      return data;
    }
  });

  const {
    data: onlineData,
    error: onlineError
  } = useQuery({
    queryKey: ['onlineServices', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('online_services').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      } else if (viewMode === 'quarter') {
        const startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
        const endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Previous month online services for comparison
  const { data: prevOnlineData } = useQuery({
    queryKey: ['onlineServicesPrev', previousMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('online_services')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59.999');
      if (error) throw error;
      return data;
    }
  });

  const {
    data: applicationsData,
    error: applicationsError
  } = useQuery({
    queryKey: ['applications', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('applications').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      } else if (viewMode === 'quarter') {
        const startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
        const endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const {
    data: photostatData,
    error: photostatError
  } = useQuery({
    queryKey: ['photostat', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('photostats').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      } else if (viewMode === 'quarter') {
        const startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
        const endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const {
    data: bankingAccountsData,
    error: bankingAccountsError
  } = useQuery({
    queryKey: ['bankingAccounts', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('banking_accounts').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      } else if (viewMode === 'quarter') {
        const startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
        const endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const {
    data: pendingBalanceData,
    error: pendingBalanceError
  } = useQuery({
    queryKey: ['pendingBalances', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('pending_balances').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      } else if (viewMode === 'quarter') {
        const startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
        const endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const {
    data: expensesData,
    error: expensesError
  } = useQuery({
    queryKey: ['expenses', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('expenses').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      } else if (viewMode === 'quarter') {
        const startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
        const endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Previous month expenses for comparison
  const { data: prevExpensesData } = useQuery({
    queryKey: ['expensesPrev', previousMonth],
    queryFn: async () => {
      const startDate = format(startOfMonth(previousMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(previousMonth), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate + 'T23:59:59');
      if (error) throw error;
      return data;
    }
  });

  const {
    data: odRecordsData,
    refetch: refetchOdRecords
  } = useQuery({
    queryKey: ['odRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('od_detail_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return data;
    }
  });

  // Documentation data
  const { data: documentationData } = useQuery({
    queryKey: ['documentation', viewMode, date],
    queryFn: async () => {
      let query = supabase.from('documentation').select('*');
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.gte('date', dateStr).lt('date', dateStr + 'T23:59:59.999');
      } else if (viewMode === 'month') {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      } else if (viewMode === 'quarter') {
        const startDate = format(startOfQuarter(date), 'yyyy-MM-dd');
        const endDate = format(endOfQuarter(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Khata data
  const { data: khataCustomersData } = useQuery({
    queryKey: ['khataCustomers'],
    queryFn: async () => {
      const [customersResult, transactionsResult] = await Promise.all([
        supabase.from('khata_customers').select('*'),
        supabase.from('khata_transactions').select('*')
      ]);
      if (customersResult.error) throw customersResult.error;
      if (transactionsResult.error) throw transactionsResult.error;
      const customers = customersResult.data || [];
      const transactions = transactionsResult.data || [];
      return customers.map(customer => {
        const customerTxns = transactions.filter(t => t.customer_id === customer.id);
        const txnTotal = customerTxns.reduce((sum, t) => sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount)), 0);
        return { ...customer, current_balance: Number(customer.opening_balance) + txnTotal };
      });
    }
  });

  const khataTotal = khataCustomersData?.reduce((sum, c) => sum + c.current_balance, 0) || 0;

  // Recent activities - fetch today's data for day mode, or filtered data for month mode
  const { data: recentActivitiesData } = useQuery({
    queryKey: ['recentActivities', viewMode, date],
    queryFn: async () => {
      const activities: Array<{
        id: string;
        type: string;
        description: string;
        amount: number;
        date: string;
        icon: string;
        color: string;
      }> = [];

      const filterDate = viewMode === 'day' ? format(date, 'yyyy-MM-dd') : null;
      const startDate = viewMode === 'month' ? format(startOfMonth(date), 'yyyy-MM-dd') 
        : viewMode === 'quarter' ? format(startOfQuarter(date), 'yyyy-MM-dd') : null;
      const endDate = viewMode === 'month' ? format(endOfMonth(date), 'yyyy-MM-dd')
        : viewMode === 'quarter' ? format(endOfQuarter(date), 'yyyy-MM-dd') : null;

      // Fetch banking services
      let bankingQuery = supabase.from('banking_services').select('*');
      if (filterDate) {
        bankingQuery = bankingQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59.999');
      } else if (startDate && endDate) {
        bankingQuery = bankingQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data: banking } = await bankingQuery.order('created_at', { ascending: false }).limit(10);
      
      banking?.forEach(item => {
        activities.push({
          id: `banking-${item.id}`,
          type: 'Banking',
          description: `Banking ${item.transaction_count} transactions`,
          amount: item.margin,
          date: item.date,
          icon: 'banking',
          color: 'primary'
        });
      });

      // Fetch online services
      let onlineQuery = supabase.from('online_services').select('*');
      if (filterDate) {
        onlineQuery = onlineQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        onlineQuery = onlineQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: online } = await onlineQuery.order('created_at', { ascending: false }).limit(10);

      online?.forEach(item => {
        activities.push({
          id: `online-${item.id}`,
          type: 'Online',
          description: `${item.service}${item.customer_name ? ` - ${item.customer_name}` : ''}`,
          amount: item.total,
          date: item.date,
          icon: 'online',
          color: 'primary'
        });
      });

      // Fetch applications
      let appsQuery = supabase.from('applications').select('*');
      if (filterDate) {
        appsQuery = appsQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59.999');
      } else if (startDate && endDate) {
        appsQuery = appsQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59.999');
      }
      const { data: apps } = await appsQuery.order('created_at', { ascending: false }).limit(10);

      apps?.forEach(item => {
        activities.push({
          id: `app-${item.id}`,
          type: 'Application',
          description: `Application - ${item.customer_name}`,
          amount: item.amount,
          date: item.date,
          icon: 'application',
          color: 'primary'
        });
      });

      // Fetch photostat
      let photoQuery = supabase.from('photostats').select('*');
      if (filterDate) {
        photoQuery = photoQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        photoQuery = photoQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: photos } = await photoQuery.order('created_at', { ascending: false }).limit(5);

      photos?.forEach(item => {
        activities.push({
          id: `photo-${item.id}`,
          type: 'Photostat',
          description: `Photostat work`,
          amount: item.margin,
          date: item.date,
          icon: 'photostat',
          color: 'primary'
        });
      });

      // Fetch expenses
      let expenseQuery = supabase.from('expenses').select('*');
      if (filterDate) {
        expenseQuery = expenseQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        expenseQuery = expenseQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: expenses } = await expenseQuery.order('created_at', { ascending: false }).limit(5);

      expenses?.forEach(item => {
        activities.push({
          id: `expense-${item.id}`,
          type: 'Expense',
          description: `Expense - ${item.name}`,
          amount: -item.amount,
          date: item.date,
          icon: 'expense',
          color: 'destructive'
        });
      });

      // Fetch banking accounts (Other Banking)
      let bankingAccQuery = supabase.from('banking_accounts').select('*');
      if (filterDate) {
        bankingAccQuery = bankingAccQuery.gte('date', filterDate).lt('date', filterDate + 'T23:59:59');
      } else if (startDate && endDate) {
        bankingAccQuery = bankingAccQuery.gte('date', startDate).lte('date', endDate + 'T23:59:59');
      }
      const { data: bankingAccounts } = await bankingAccQuery.order('created_at', { ascending: false }).limit(5);

      bankingAccounts?.forEach(item => {
        activities.push({
          id: `bankingAcc-${item.id}`,
          type: 'Other Banking',
          description: `${item.account_type} - ${item.customer_name} (${formatCurrency(item.amount)})`,
          amount: item.margin || 0,
          date: item.date,
          icon: 'banking',
          color: 'accent'
        });
      });

      // Sort by date and created_at
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  });

  // Fetch daily margin data for the current month for charts
  const { data: dailyMarginData } = useQuery({
    queryKey: ['dailyMargin', date],
    queryFn: async () => {
      const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('banking_services')
        .select('date, margin')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Global search query
  const { data: searchResults } = useQuery({
    queryKey: ['globalSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const q = searchQuery.toLowerCase();
      const results: Array<{ type: string; title: string; subtitle: string; route: string; id: string; date: string }> = [];

      // Search online services
      const { data: osData } = await supabase.from('online_services').select('*').or(`service.ilike.%${q}%,customer_name.ilike.%${q}%`).limit(5);
      osData?.forEach(item => results.push({ type: 'Online Service', title: item.customer_name || item.service, subtitle: `${item.service} - ₹${item.total}`, route: '/online-services', id: item.id, date: item.date }));

      // Search applications
      const { data: appData } = await supabase.from('applications').select('*').ilike('customer_name', `%${q}%`).limit(5);
      appData?.forEach(item => results.push({ type: 'Application', title: item.customer_name, subtitle: `₹${item.amount}`, route: '/applications', id: item.id, date: item.date }));

      // Search banking accounts
      const { data: baData } = await supabase.from('banking_accounts').select('*').or(`customer_name.ilike.%${q}%,account_type.ilike.%${q}%`).limit(5);
      baData?.forEach(item => results.push({ type: 'Banking Account', title: item.customer_name, subtitle: `${item.account_type} - ₹${item.amount}`, route: '/banking-accounts', id: item.id, date: item.date }));

      // Search documentation
      const { data: docData } = await supabase.from('documentation').select('*').or(`name.ilike.%${q}%,service_type.ilike.%${q}%`).limit(5);
      docData?.forEach(item => results.push({ type: 'Documentation', title: item.name, subtitle: `${item.service_type} - ₹${item.amount}`, route: '/documentation', id: item.id, date: item.date }));

      // Search expenses
      const { data: expData } = await supabase.from('expenses').select('*').ilike('name', `%${q}%`).limit(5);
      expData?.forEach(item => results.push({ type: 'Expense', title: item.name, subtitle: `₹${item.amount}`, route: '/expenses', id: item.id, date: item.date }));

      // Search pending balances
      const { data: pbData } = await supabase.from('pending_balances').select('*').or(`name.ilike.%${q}%,phone.ilike.%${q}%`).limit(5);
      pbData?.forEach(item => results.push({ type: 'Pending Balance', title: item.name, subtitle: `${item.service} - ₹${item.amount}`, route: '/pending-balance', id: item.id, date: item.date }));

      // Search forms
      const { data: fData } = await supabase.from('forms').select('*').or(`name.ilike.%${q}%,mobile.ilike.%${q}%`).limit(5);
      fData?.forEach(item => results.push({ type: 'Form', title: item.name, subtitle: `${item.department} - ${item.mobile}`, route: '/forms', id: item.id, date: item.date }));

      // Search customers
      const { data: custData } = await supabase.from('customers').select('*').or(`name.ilike.%${q}%,phone.ilike.%${q}%`).limit(5);
      custData?.forEach(item => results.push({ type: 'Customer', title: item.name, subtitle: `${item.phone}`, route: '/customers', id: item.id, date: item.created_at || '' }));

      // Search banking services
      const { data: bsData } = await supabase.from('banking_services').select('*').limit(5);
      bsData?.forEach(item => {
        if (`banking ${item.transaction_count} transactions`.includes(q) || `₹${item.amount}`.includes(q) || item.date.includes(q)) {
          results.push({ type: 'Banking', title: `Banking - ${item.transaction_count} txns`, subtitle: `₹${item.amount} | Margin: ₹${item.margin}`, route: '/banking', id: item.id, date: item.date });
        }
      });

      // Search photostats
      const { data: photoData } = await supabase.from('photostats').select('*').limit(5);
      photoData?.forEach(item => {
        if (item.date.includes(q) || `₹${item.amount}`.includes(q)) {
          results.push({ type: 'Photostat', title: `Photostat - ${item.is_double_sided ? 'Double' : 'Single'} Sided`, subtitle: `₹${item.amount} | Margin: ₹${item.margin}`, route: '/photostat', id: item.id, date: item.date });
        }
      });

      // Search khata customers
      const { data: khataData } = await supabase.from('khata_customers').select('*').or(`name.ilike.%${q}%,phone.ilike.%${q}%`).limit(5);
      khataData?.forEach(item => results.push({ type: 'Khata', title: item.name, subtitle: `${item.phone}`, route: '/khata', id: item.id, date: item.opening_date }));

      // Search social security
      const { data: ssData } = await supabase.from('social_security').select('*').or(`name.ilike.%${q}%,account_number.ilike.%${q}%,scheme_type.ilike.%${q}%`).limit(5);
      ssData?.forEach(item => results.push({ type: 'Social Security', title: item.name, subtitle: `${item.scheme_type} - ${item.account_number}`, route: '/social-security', id: item.id, date: item.date }));

      // Search fee expenses
      const { data: feeData } = await supabase.from('fee_expenses').select('*').ilike('customer_name', `%${q}%`).limit(5);
      feeData?.forEach(item => results.push({ type: 'Fee Expense', title: item.customer_name, subtitle: `₹${item.fee}`, route: '/fee-expenses', id: item.id, date: item.date }));

      // Search misc expenses
      const { data: miscData } = await supabase.from('misc_expenses').select('*').ilike('name', `%${q}%`).limit(5);
      miscData?.forEach(item => results.push({ type: 'Misc Expense', title: item.name, subtitle: `₹${item.fee}`, route: '/misc-expenses', id: item.id, date: item.date }));

      // Search pan cards
      const { data: panData } = await supabase.from('pan_cards').select('*').limit(5);
      panData?.forEach(item => {
        if (item.date.includes(q) || `₹${item.amount}`.includes(q)) {
          results.push({ type: 'PAN Card', title: `PAN Card - ${item.count} cards`, subtitle: `₹${item.amount} | Margin: ₹${item.margin}`, route: '/pan-card', id: item.id, date: item.date });
        }
      });

      // Search passports
      const { data: passData } = await supabase.from('passports').select('*').limit(5);
      passData?.forEach(item => {
        if (item.date.includes(q) || `₹${item.amount}`.includes(q)) {
          results.push({ type: 'Passport', title: `Passport - ${item.count} entries`, subtitle: `₹${item.amount} | Margin: ₹${item.margin}`, route: '/passport', id: item.id, date: item.date });
        }
      });

      // Search account records (Other Banking Services)
      const { data: arData } = await supabase.from('account_records').select('*').or(`name.ilike.%${q}%,account_number.ilike.%${q}%,account_type.ilike.%${q}%`).limit(5);
      arData?.forEach(item => results.push({ type: 'Account Record', title: item.name || item.account_number, subtitle: `${item.account_type}`, route: '/other-banking-services', id: item.id, date: item.created_at }));

      // Search ledger customers
      const { data: ledgerData } = await supabase.from('ledger_customers').select('*').or(`name.ilike.%${q}%,account_number.ilike.%${q}%,adhar_number.ilike.%${q}%`).limit(5);
      ledgerData?.forEach(item => results.push({ type: 'Ledger', title: item.name, subtitle: `A/C: ${item.account_number}`, route: '/ledger', id: item.id, date: item.created_at }));

      return results;
    },
    enabled: searchQuery.length >= 2,
  });

  useEffect(() => {
    const channel = supabase.channel('od-records-realtime').on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'od_detail_records'
    }, () => {
      refetchOdRecords();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchOdRecords]);

  useEffect(() => {
    if (bankingError || bankingAccountsError || onlineError || applicationsError || photostatError || pendingBalanceError || expensesError) {
      toast.error('Failed to load data');
    }
  }, [bankingError, bankingAccountsError, onlineError, applicationsError, photostatError, pendingBalanceError, expensesError]);

  // Calculate metrics
  const bankingServicesTotal = bankingData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const bankingServicesCount = bankingData?.reduce((sum, entry) => sum + (entry.transaction_count || 1), 0) || 0;
  const bankingMargin = bankingData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const bankingAccountsMargin = bankingAccountsData?.reduce((sum, entry) => sum + Number(entry.amount || 0), 0) || 0;
  const onlineServicesTotal = onlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;
  const onlineServicesCount = onlineData?.length || 0;
  const onlineMargin = onlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;
  const applicationsTotal = applicationsData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const applicationsCount = applicationsData?.length || 0;
  const applicationsMargin = applicationsData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const photostatTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const photostatMarginTotal = photostatData?.reduce((sum, entry) => sum + Number(entry.margin), 0) || 0;
  const pendingBalanceTotal = pendingBalanceData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const expensesTotal = expensesData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const expensesCount = expensesData?.length || 0;
  const latestCashInHand = odRecordsData?.[0]?.cash_in_hand || 0;
  const documentationMargin = documentationData?.reduce((sum, d) => sum + (Number(d.amount) - Number(d.expense)), 0) || 0;
  const totalMargin = bankingMargin + bankingAccountsMargin + onlineMargin + applicationsMargin + photostatMarginTotal + documentationMargin;

  // Previous month calculations for comparison
  const prevBankingMargin = prevBankingData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const prevOnlineMargin = prevOnlineData?.reduce((sum, entry) => sum + Number(entry.total || 0), 0) || 0;
  const prevExpensesTotal = prevExpensesData?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const prevBankingCount = prevBankingData?.reduce((sum, entry) => sum + (entry.transaction_count || 1), 0) || 0;

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const marginChange = calculateChange(totalMargin, prevBankingMargin + prevOnlineMargin);
  const bankingChange = calculateChange(bankingServicesCount, prevBankingCount);
  const expenseChange = calculateChange(expensesTotal, prevExpensesTotal);

  const marginDetails = [{
    name: 'Banking Services',
    value: bankingMargin,
    color: 'hsl(var(--chart-1))'
  }, {
    name: 'Other Banking',
    value: bankingAccountsMargin,
    color: 'hsl(var(--chart-2))'
  }, {
    name: 'Online Services',
    value: onlineMargin,
    color: 'hsl(var(--chart-3))'
  }, {
    name: 'Applications',
    value: applicationsMargin,
    color: 'hsl(var(--chart-4))'
  }, {
    name: 'Printout & Photostat',
    value: photostatMarginTotal,
    color: 'hsl(var(--chart-5))'
  }, {
    name: 'Documentation',
    value: documentationMargin,
    color: 'hsl(220, 70%, 50%)'
  }];

  const handleDateChange = (newDate: Date) => setDate(newDate);
  const handleViewModeChange = (mode: 'day' | 'month' | 'quarter') => setViewMode(mode);

  // Generate real chart data from daily margin
  const generateChartData = (): number[] => {
    if (!dailyMarginData || dailyMarginData.length === 0) {
      return [0, 0, 0, 0, 0, 0, 0];
    }
    // Group by date and sum margins
    const marginByDate: { [key: string]: number } = {};
    dailyMarginData.forEach(item => {
      const dateKey = item.date;
      marginByDate[dateKey] = (marginByDate[dateKey] || 0) + item.margin;
    });
    const values = Object.values(marginByDate);
    // Return last 7 values or pad with zeros
    if (values.length >= 7) return values.slice(-7);
    return [...Array(7 - values.length).fill(0), ...values];
  };

  // Mini line chart for cards
  const MiniLineChart = ({
    data,
    color = 'primary'
  }: {
    data: number[];
    color?: string;
  }) => {
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const height = 40;
    const width = 80;
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={width} height={height} className="overflow-hidden">
        <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  // Mini bar chart with real data
  const MiniBarChart = ({
    data
  }: {
    data: number[];
  }) => {
    const max = Math.max(...data, 1);
    return (
      <div className="flex items-end gap-1 h-10 overflow-hidden">
        {data.map((value, i) => (
          <div 
            key={i} 
            className="w-2 bg-primary rounded-t flex-shrink-0" 
            style={{ height: `${Math.max((value / max) * 100, 5)}%` }} 
          />
        ))}
      </div>
    );
  };

  // Dashboard Card component matching reference image style
  const DashCard = ({
    children,
    className = '',
    onClick
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <div 
      onClick={onClick} 
      className={`
        bg-card rounded-2xl p-5 border border-border/50
        transition-all duration-200 hover:shadow-lg
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );

  const chartData = generateChartData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border px-3 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground shrink-0">
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-semibold text-foreground truncate">Hello, Harry</h1>
              <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">Explore information</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search..." 
                    className="pl-9 w-36 sm:w-72 bg-background border-border" 
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                    onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                  />
                </div>
              </PopoverTrigger>
              {searchQuery.length >= 2 && (
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandList>
                      {(!searchResults || searchResults.length === 0) ? (
                        <CommandEmpty>No results found.</CommandEmpty>
                      ) : (
                        <CommandGroup heading={`${searchResults.length} results found`}>
                          {searchResults.map((result, idx) => (
                            <CommandItem 
                              key={idx} 
                              onSelect={() => { navigate(`${result.route}?highlight=${result.id}&date=${result.date}`); setSearchOpen(false); setSearchQuery(''); }}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{result.type}</span>
                                  <span className="font-medium text-foreground">{result.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              )}
            </Popover>
            <div className="hidden sm:block">
              <DateRangePicker date={date} onDateChange={handleDateChange} mode={viewMode} onModeChange={handleViewModeChange} />
            </div>
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-full bg-background border border-border hover:bg-muted transition-colors relative">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <NotificationBox />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Mobile date picker */}
        <div className="sm:hidden mt-3">
          <DateRangePicker date={date} onDateChange={handleDateChange} mode={viewMode} onModeChange={handleViewModeChange} />
        </div>
      </div>

      <div className="p-3 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-5 min-w-0">
            {/* Cash in Hand Banner - Moved to Top */}
            <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
              <div className="absolute right-0 top-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-5 w-5 opacity-80" />
                      <h3 className="text-sm opacity-80">Cash in Hand</h3>
                    </div>
                    <p className="text-3xl sm:text-4xl font-bold">{formatCurrency(latestCashInHand)}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 opacity-80" />
                      <span className="text-xs opacity-80">Current Time</span>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold font-mono tracking-wider">{format(currentTime, 'HH:mm:ss')}</p>
                    <p className="text-xs opacity-70 mt-0.5">{format(currentTime, 'EEEE, MMM d')}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 pt-3 border-t border-white/20">
                  <div className="flex-1 bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                    <span className="text-lg font-bold block">{bankingData?.length || 0}</span>
                    <span className="text-[10px] opacity-80">Txn Days</span>
                  </div>
                  <div className="flex-1 bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                    <span className="text-lg font-bold block">{bankingServicesCount}</span>
                    <span className="text-[10px] opacity-80">Banking Txn</span>
                  </div>
                  <div className="flex-1 bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                    <span className="text-lg font-bold block">{onlineServicesCount}</span>
                    <span className="text-[10px] opacity-80">Online</span>
                  </div>
                  <div className="flex-1 bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                    <span className="text-lg font-bold block">{applicationsCount}</span>
                    <span className="text-[10px] opacity-80">Applications</span>
                  </div>
                  <div className="flex-1 bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                    <span className="text-lg font-bold block">{formatCurrency(bankingAccountsMargin)}</span>
                    <span className="text-[10px] opacity-80">Other Banking</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Margin */}
              <DashCard onClick={() => setMarginDialogOpen(true)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Margin</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(totalMargin)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {marginChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-destructive" />
                      )}
                      <span className={`text-xs ${marginChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {Math.abs(marginChange).toFixed(1)}% vs last month
                      </span>
                    </div>
                  </div>
                  <MiniBarChart data={chartData} />
                </div>
              </DashCard>

              {/* Banking Transactions */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Banking Txn</p>
                      <p className="text-xl font-bold text-foreground">{bankingServicesCount}</p>
                      <div className="flex items-center gap-1">
                        {bankingChange >= 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-destructive" />
                        )}
                        <span className={`text-xs ${bankingChange >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                          {Math.abs(bankingChange).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <MiniLineChart data={chartData} />
                </div>
              </DashCard>

              {/* Online Services */}
              <DashCard onClick={() => setOnlineServicesDialogOpen(true)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Online Services</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(onlineServicesTotal)}</p>
                      <p className="text-xs text-muted-foreground">{onlineServicesCount} services • Click to view</p>
                    </div>
                  </div>
                </div>
              </DashCard>

              {/* Banking Amount */}
              <DashCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Banking Amount</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(bankingServicesTotal)}</p>
                      <p className="text-xs text-muted-foreground">Margin: {formatCurrency(bankingMargin)}</p>
                    </div>
                  </div>
                </div>
              </DashCard>
            </div>

            {/* Second Row - More Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Expenses */}
              <DashCard onClick={() => setExpensesDialogOpen(true)} className="cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <Receipt className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="font-medium text-foreground">Expenses</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(expensesTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{expensesCount} entries • Click to view</p>
              </DashCard>

              {/* Applications */}
              <DashCard onClick={() => setApplicationsDialogOpen(true)}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Applications</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(applicationsTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{applicationsCount} applications • Click to view</p>
              </DashCard>

              {/* Photostat */}
              <DashCard onClick={() => setPhotostatDialogOpen(true)} className="cursor-pointer">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Printer className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Photostat</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(photostatTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">Margin: {formatCurrency(photostatMarginTotal)} • Click to view</p>
              </DashCard>

              {/* Pending Balance */}
              <DashCard 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setPendingDialogOpen(true)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <h3 className="font-medium text-foreground">Pending Balance</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(pendingBalanceTotal)}</p>
                <p className="text-xs text-muted-foreground mt-1">{pendingBalanceData?.length || 0} pending entries • Click to view</p>
              </DashCard>
            </div>

            {/* Third Row - Recent Activities, Khata, Documentation */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DashCard>
                <h3 className="font-medium text-foreground mb-3">Recent Activities {viewMode === 'day' ? '(Today)' : '(This Month)'}</h3>
                <div className="relative overflow-hidden h-48">
                  {recentActivitiesData && recentActivitiesData.length > 0 ? (
                    <div className="animate-vertical-ticker">
                      {[...recentActivitiesData, ...recentActivitiesData].map((activity, idx) => (
                        <div key={`${activity.id}-${idx}`} className="flex items-center gap-3 py-2.5 border-b border-border/20 hover:bg-muted/30 transition-colors rounded-lg px-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                            activity.color === 'destructive' 
                              ? 'bg-gradient-to-br from-destructive/20 to-destructive/5' 
                              : activity.color === 'accent'
                              ? 'bg-gradient-to-br from-accent/30 to-accent/10'
                              : 'bg-gradient-to-br from-primary/20 to-primary/5'
                          }`}>
                            {activity.icon === 'banking' && <CreditCard className={`h-4 w-4 ${activity.color === 'destructive' ? 'text-destructive' : activity.color === 'accent' ? 'text-accent-foreground' : 'text-primary'}`} />}
                            {activity.icon === 'online' && <Globe className={`h-4 w-4 ${activity.color === 'destructive' ? 'text-destructive' : 'text-primary'}`} />}
                            {activity.icon === 'expense' && <Receipt className="h-4 w-4 text-destructive" />}
                            {activity.icon === 'application' && <FileText className="h-4 w-4 text-primary" />}
                            {activity.icon === 'photostat' && <Printer className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-foreground block truncate">{activity.description}</span>
                            <span className="text-xs text-muted-foreground/70">{activity.type}</span>
                          </div>
                          <span className={`text-sm font-semibold flex-shrink-0 px-2 py-1 rounded-md ${
                            activity.amount < 0 
                              ? 'text-destructive bg-destructive/10' 
                              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          }`}>
                            {activity.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(activity.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No activities {viewMode === 'day' ? 'today' : viewMode === 'month' ? 'this month' : 'this quarter'}</p>
                  )}
                </div>
              </DashCard>
              
              {/* Khata */}
              <DashCard onClick={() => setKhataDialogOpen(true)} className="cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Khata</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-foreground">
                    {khataCustomersData?.length || 0} customers
                  </p>
                  <p className="text-xs text-muted-foreground">Click to view details</p>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-muted-foreground">Net Balance: <span className={`font-medium ${khataTotal >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCurrency(khataTotal)}</span></span>
                  </div>
                </div>
              </DashCard>

              {/* Documentation */}
              <DashCard onClick={() => setDocumentationDialogOpen(true)} className="cursor-pointer">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground">Documentation</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-foreground">
                    {documentationData?.length || 0} entries
                  </p>
                  <p className="text-xs text-muted-foreground">Click to view customer summary</p>
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-muted-foreground">Amount: <span className="text-primary font-medium">{formatCurrency(documentationData?.reduce((sum, d) => sum + Number(d.amount), 0) || 0)}</span></span>
                  </div>
                </div>
              </DashCard>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 space-y-5">

            <NotificationBox />
            <ReminderCalendar />
          </div>
        </div>
      </div>

      {/* Margin Dialog */}
      <Dialog open={marginDialogOpen} onOpenChange={setMarginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Margin Breakdown</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {marginDetails.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-foreground">{item.name}</span>
                </div>
                <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between font-bold">
                <span className="text-foreground">Total Margin</span>
                <span className="text-foreground">{formatCurrency(totalMargin)}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Balance Dialog */}
      <Dialog open={pendingDialogOpen} onOpenChange={setPendingDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Pending Balance Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {pendingBalanceData && pendingBalanceData.length > 0 ? (
              <div className="space-y-3">
                {pendingBalanceData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{item.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.address}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📞 {item.phone}</span>
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {item.service === 'Other' ? item.custom_service : item.service}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(item.amount)}</p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Pending</span>
                    <span className="text-destructive">{formatCurrency(pendingBalanceTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setPendingDialogOpen(false); navigate('/pending-balance'); }}
                  className="w-full mt-2 text-sm text-primary hover:underline text-center"
                >
                  View full Pending Balance page →
                </button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No pending balances found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Applications Dialog */}
      <Dialog open={applicationsDialogOpen} onOpenChange={setApplicationsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Applications Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {applicationsData && applicationsData.length > 0 ? (
              <div className="space-y-3">
                {applicationsData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{item.customer_name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                          {item.expense && (
                            <span className="text-destructive">Expense: {formatCurrency(item.expense)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(item.amount)}</p>
                        <p className="text-xs text-muted-foreground">Amount</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Applications</span>
                    <span className="text-primary">{formatCurrency(applicationsTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setApplicationsDialogOpen(false); navigate('/applications'); }}
                  className="w-full mt-2 text-sm text-primary hover:underline text-center"
                >
                  View full Applications page →
                </button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No applications found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Online Services Dialog */}
      <Dialog open={onlineServicesDialogOpen} onOpenChange={setOnlineServicesDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Online Services Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {onlineData && onlineData.length > 0 ? (
              <div className="space-y-3">
                {onlineData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">
                          {item.service === 'Other' ? item.custom_service : item.service}
                        </h4>
                        {item.customer_name && (
                          <p className="text-sm text-muted-foreground mt-1">{item.customer_name}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                          {item.expense && (
                            <span className="text-destructive">Expense: {formatCurrency(item.expense)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{formatCurrency(item.total)}</p>
                        <p className="text-xs text-muted-foreground">Amount: {formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Online Services</span>
                    <span className="text-primary">{formatCurrency(onlineServicesTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setOnlineServicesDialogOpen(false); navigate('/online-services'); }}
                  className="w-full mt-2 text-sm text-primary hover:underline text-center"
                >
                  View full Online Services page →
                </button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No online services found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Documentation Dialog */}
      <Dialog open={documentationDialogOpen} onOpenChange={setDocumentationDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Documentation Summary
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {documentationData && documentationData.length > 0 ? (
              <div className="space-y-3">
                {documentationData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{item.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {item.service_type === 'Other' ? item.custom_service : item.service_type}
                          </span>
                        </div>
                        {item.mobile && (
                          <p className="text-xs text-muted-foreground mt-1">📞 {item.mobile}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{formatCurrency(item.amount)}</p>
                        {item.expense > 0 && (
                          <p className="text-xs text-destructive">Exp: {formatCurrency(item.expense)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Amount</span>
                    <span className="text-primary">{formatCurrency(documentationData.reduce((sum, d) => sum + Number(d.amount), 0))}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setDocumentationDialogOpen(false); navigate('/documentation'); }}
                  className="w-full mt-2 text-sm text-primary hover:underline text-center"
                >
                  View full Documentation page →
                </button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No documentation entries found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Expenses Dialog */}
      <Dialog open={expensesDialogOpen} onOpenChange={setExpensesDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-destructive" />
              Expenses Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {expensesData && expensesData.length > 0 ? (
              <div className="space-y-3">
                {expensesData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{item.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-destructive">{formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Expenses</span>
                    <span className="text-destructive">{formatCurrency(expensesTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setExpensesDialogOpen(false); navigate('/expenses'); }}
                  className="w-full mt-2 text-sm text-primary hover:underline text-center"
                >
                  View full Expenses page →
                </button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No expenses found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photostat Dialog */}
      <Dialog open={photostatDialogOpen} onOpenChange={setPhotostatDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              Photostat Details
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {photostatData && photostatData.length > 0 ? (
              <div className="space-y-3">
                {photostatData.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-muted-foreground">📅 {format(new Date(item.date), 'dd MMM yyyy')}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {item.is_double_sided ? 'Double Sided' : 'Single Sided'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-primary">{formatCurrency(item.amount)}</p>
                        <p className="text-xs text-muted-foreground">Margin: {formatCurrency(item.margin)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Total Photostat</span>
                    <span className="text-primary">{formatCurrency(photostatTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Total Margin</span>
                    <span className="text-primary">{formatCurrency(photostatMarginTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setPhotostatDialogOpen(false); navigate('/photostat'); }}
                  className="w-full mt-2 text-sm text-primary hover:underline text-center"
                >
                  View full Photostat page →
                </button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No photostat entries found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Khata Dialog */}
      <Dialog open={khataDialogOpen} onOpenChange={setKhataDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Khata Summary
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {khataCustomersData && khataCustomersData.length > 0 ? (
              <div className="space-y-3">
                {khataCustomersData.map((customer) => (
                  <div 
                    key={customer.id} 
                    className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{customer.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">📞 {customer.phone}</span>
                          <span className="text-muted-foreground">📅 {format(new Date(customer.opening_date), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${customer.current_balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          {formatCurrency(customer.current_balance)}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <span className="text-foreground">Net Balance</span>
                    <span className={khataTotal >= 0 ? 'text-primary' : 'text-destructive'}>{formatCurrency(khataTotal)}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setKhataDialogOpen(false); navigate('/khata'); }}
                  className="w-full mt-2 text-sm text-primary hover:underline text-center"
                >
                  View full Khata page →
                </button>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No khata customers found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
