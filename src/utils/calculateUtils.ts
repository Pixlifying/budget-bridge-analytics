
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
  return (amount / 100) * 0.5;
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
  panCards: Array<{ count: number; margin: number }>, 
  passports: Array<{ count: number; margin: number }>, 
  bankingServices: Array<{ margin: number }>
): number => {
  const panCardMargin = panCards.reduce((total, item) => total + item.margin, 0);
  const passportMargin = passports.reduce((total, item) => total + item.margin, 0);
  const bankingMargin = bankingServices.reduce((total, item) => total + item.margin, 0);
  
  return panCardMargin + passportMargin + bankingMargin;
};

export const exportToExcel = <T extends Record<string, any>>(data: T[], filename: string): void => {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value instanceof Date) {
          return formatDate(value);
        }
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if it contains commas or quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create a blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
