
import { format, isSameDay, isSameMonth } from 'date-fns';
import * as XLSX from 'xlsx';

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

// PanCard utility functions
export const calculatePanCardTotal = (count: number, amount: number): number => {
  return count * amount;
};

export const calculatePanCardMargin = (count: number): number => {
  // Fixed margin of ₹150 per PAN card
  return count * 150;
};

// Passport utility functions
export const calculatePassportTotal = (count: number, amount: number): number => {
  return count * amount;
};

export const calculatePassportMargin = (count: number): number => {
  // Fixed margin of ₹200 per passport
  return count * 200;
};

// Banking services utility function
export const calculateBankingServicesMargin = (amount: number): number => {
  // Updated formula: amount * 0.5 / 100
  return (amount * 0.5) / 100;
};

export const calculateOnlineServiceMargin = (amount: number): number => {
  // Now the full amount is the margin (no 10% calculation)
  return amount;
};

export const calculateApplicationsMargin = (amount: number): number => {
  // The total amount of the application is the margin
  return amount;
};

export const getTotalMargin = (
  panCards: { margin: number }[],
  passports: { margin: number }[],
  bankingServices: { margin: number }[],
  onlineServices: { amount: number, count: number }[],
  applications: { amount: number }[] = [],
  photostats: { margin: number }[] = []
): number => {
  const panCardMargin = panCards.reduce((total, item) => total + item.margin, 0);
  const passportMargin = passports.reduce((total, item) => total + item.margin, 0);
  const bankingMargin = bankingServices.reduce((total, item) => total + item.margin, 0);
  
  // Calculate online services margin (now the full amount)
  const onlineServicesMargin = onlineServices.reduce((total, item) => {
    return total + (item.amount * item.count);
  }, 0);
  
  // Calculate applications margin
  const applicationsMargin = applications.reduce((total, item) => total + item.amount, 0);
  
  // Calculate photostat margin
  const photostatMargin = photostats.reduce((total, item) => total + item.margin, 0);
  
  return panCardMargin + passportMargin + bankingMargin + onlineServicesMargin + applicationsMargin + photostatMargin;
};

// Export to Excel function with proper type constraint
export const exportToExcel = <T extends object>(data: T[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  // Create a buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Create a Blob from the buffer
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create a download link and click it
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
