
export const calculatePanCardTotal = (count: number, amount: number): number => {
  return count * amount;
};

export const calculatePanCardMargin = (count: number): number => {
  return count * 150;
};

export const calculatePassportTotal = (count: number, amount: number): number => {
  return count * amount;
};

export const calculatePassportMargin = (count: number): number => {
  return count * 200;
};

export const calculateBankingServicesMargin = (amount: number): number => {
  return amount * 0.5;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const filterByDate = <T extends { date: Date }>(data: T[], date: Date): T[] => {
  return data.filter(item => isSameDay(new Date(item.date), date));
};

export const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getMonthEnd = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const filterByMonth = <T extends { date: Date }>(data: T[], date: Date): T[] => {
  const start = getMonthStart(date);
  const end = getMonthEnd(date);
  return data.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
};

export const getTotalMargin = (
  panCards: Array<{ count: number }>, 
  passports: Array<{ count: number }>, 
  bankingServices: Array<{ margin: number }>
): number => {
  const panCardMargin = panCards.reduce((total, item) => total + calculatePanCardMargin(item.count), 0);
  const passportMargin = passports.reduce((total, item) => total + calculatePassportMargin(item.count), 0);
  const bankingMargin = bankingServices.reduce((total, item) => total + item.margin, 0);
  
  return panCardMargin + passportMargin + bankingMargin;
};
