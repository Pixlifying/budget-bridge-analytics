
import { format, isSameDay, isSameMonth } from 'date-fns';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => jsPDF;
  }
}

export const filterByDate = <T extends { date: Date }>(items: T[], date: Date): T[] => {
  console.log('Filtering by date:', date);
  return items.filter(item => {
    const itemDate = new Date(item.date);
    const result = isSameDay(itemDate, date);
    return result;
  });
};

export const filterByMonth = <T extends { date: Date }>(items: T[], date: Date): T[] => {
  return items.filter(item => {
    const itemDate = new Date(item.date);
    return isSameMonth(itemDate, date);
  });
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
  return (amount * 0.5) / 100;
};

export const calculateOnlineServiceMargin = (amount: number): number => {
  return amount;
};

export const calculateApplicationsMargin = (amount: number): number => {
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
  
  const onlineServicesMargin = onlineServices.reduce((total, item) => {
    return total + (item.amount * item.count);
  }, 0);
  
  const applicationsMargin = applications.reduce((total, item) => total + item.amount, 0);
  
  const photostatMargin = photostats.reduce((total, item) => total + item.margin, 0);
  
  return panCardMargin + passportMargin + bankingMargin + onlineServicesMargin + applicationsMargin + photostatMargin;
};

export const exportToExcel = <T extends object>(data: T[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = <T extends object>(data: T[], filename: string) => {
  try {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`${filename.charAt(0).toUpperCase() + filename.slice(1)} Report`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, 14, 30);
    
    const tableData = data.map(item => Object.values(item));
    
    let headers: string[] = [];
    if (data.length > 0) {
      headers = Object.keys(data[0]).map(key => {
        return key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .replace(/^\w/, c => c.toUpperCase());
      });
    }
    
    doc.autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [66, 66, 66],
        textColor: [250, 250, 250],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        text: { cellWidth: 'auto' },
      },
    });
    
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    exportToExcel(data, filename);
  }
};
