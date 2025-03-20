
import { format, isSameDay, isSameMonth } from 'date-fns';

export const filterByDate = <T extends { date: Date }>(items: T[], date: Date): T[] => {
  return items.filter(item => isSameDay(new Date(item.date), new Date(date)));
};

export const filterByMonth = <T extends { date: Date }>(items: T[], date: Date): T[] => {
  return items.filter(item => isSameMonth(new Date(item.date), new Date(date)));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return format(new Date(date), 'dd MMM yyyy');
};

export const calculateOnlineServiceMargin = (amount: number): number => {
  // Now the full amount is the margin (no 10% calculation)
  return amount;
};

export const getTotalMargin = (
  panCards: { margin: number }[],
  passports: { margin: number }[],
  bankingServices: { margin: number }[],
  onlineServices: { amount: number, count: number }[]
): number => {
  const panCardMargin = panCards.reduce((total, item) => total + item.margin, 0);
  const passportMargin = passports.reduce((total, item) => total + item.margin, 0);
  const bankingMargin = bankingServices.reduce((total, item) => total + item.margin, 0);
  
  // Calculate online services margin (now the full amount)
  const onlineServicesMargin = onlineServices.reduce((total, item) => {
    return total + (item.amount * item.count);
  }, 0);
  
  return panCardMargin + passportMargin + bankingMargin + onlineServicesMargin;
};
