
import { useEffect, useState } from 'react';
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  LucideIcon,
  ScrollText,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import StatCard from '@/components/ui/StatCard';
import DoughnutChart from '@/components/ui/DoughnutChart';
import {
  formatCurrency,
  getTotalMargin,
} from '@/utils/calculateUtils';

interface ServiceData {
  margin: number;
  amount: number;
  count: number;
}

const Dashboard = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [isLoading, setIsLoading] = useState(true);

  const { data: panCardData, error: panCardError } = useQuery({
    queryKey: ['panCards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pan_cards')
        .select('*')
        .order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: passportData, error: passportError } = useQuery({
    queryKey: ['passports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passports')
        .select('*')
        .order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: bankingData, error: bankingError } = useQuery({
    queryKey: ['bankingServices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: onlineData, error: onlineError } = useQuery({
    queryKey: ['onlineServices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('online_services')
        .select('*')
        .order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: applicationsData, error: applicationsError } = useQuery({
    queryKey: ['applications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  const { data: photostatData, error: photostatError } = useQuery({
    queryKey: ['photostat'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photostats')
        .select('*')
        .order('date', { ascending: false });
      if (error) {
        throw error;
      }
      return data;
    }
  });

  useEffect(() => {
    if (
      panCardError ||
      passportError ||
      bankingError ||
      onlineError ||
      applicationsError ||
      photostatError
    ) {
      toast.error('Failed to load data');
    }
  }, [
    panCardError,
    passportError,
    bankingError,
    onlineError,
    applicationsError,
    photostatError,
  ]);

  // Get total margin
  const totalMargin = getTotalMargin(
    panCardData || [],
    passportData || [],
    bankingData || [],
    onlineData || [],
    applicationsData || [],
    photostatData || []
  );

  // Calculate service specific totals
  const panCardMargin = panCardData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const passportMargin = passportData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const bankingMargin = bankingData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;
  const onlineMargin = onlineData?.reduce((sum, entry) => {
    return sum + (entry.amount * entry.count);
  }, 0) || 0;
  const applicationsMargin = applicationsData?.reduce((sum, entry) => sum + entry.amount, 0) || 0;
  
  // Calculate photostat margin
  const photostatMarginTotal = photostatData?.reduce((sum, entry) => sum + entry.margin, 0) || 0;

  // Calculate proportions for the chart
  const marginProportions = [
    { name: 'PAN Card', value: panCardMargin },
    { name: 'Passport', value: passportMargin },
    { name: 'Banking', value: bankingMargin },
    { name: 'Online', value: onlineMargin },
    { name: 'Applications', value: applicationsMargin },
    { name: 'Photostat', value: photostatMarginTotal },
  ];

  const getServiceColor = (serviceName: string): string => {
    switch (serviceName) {
      case 'PAN Card':
        return '#FFD480'; // Light Orange
      case 'Passport':
        return '#90CAF9'; // Light Blue
      case 'Banking':
        return '#A5D6A7'; // Light Green
      case 'Online':
        return '#FFAB91'; // Light Red
      case 'Applications':
        return '#B39DDB'; // Light Purple
      case 'Photostat':
        return '#F48FB1'; // Light Pink
      default:
        return '#BDBDBD'; // Light Gray
    }
  };

  // Render component
  return (
    <PageWrapper
      title="Dashboard"
      subtitle="At a glance summary of your business"
    >
      <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="PAN Cards"
          value={panCardData?.length || 0}
          icon={<CreditCard className="h-5 w-5" />}
        />
        <StatCard
          title="Passports"
          value={passportData?.length || 0}
          icon={<ScrollText className="h-5 w-5" />}
        />
        <StatCard
          title="Photostat"
          value={photostatData?.length || 0}
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glassmorphism rounded-xl p-5 animate-scale-in">
          <h3 className="font-semibold text-lg mb-4">Margin Distribution</h3>
          <DoughnutChart
            data={marginProportions}
            getColor={getServiceColor}
          />
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
