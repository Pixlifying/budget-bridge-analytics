import { useState, useEffect, useRef } from 'react';
import { CreditCard, Plus, Edit, Trash2, Printer, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, filterByDate, filterByMonth, calculateBankingServicesMargin } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/ui/ServiceCard';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface BankingService {
  id: string;
  date: Date;
  amount: number;
  margin: number;
  transaction_count: number;
  extra_amount: number;
  created_at?: string;
}

const BankingServices = () => {
  const [bankingServices, setBankingServices] = useState<BankingService[]>([]);
  const [bankingAccounts, setBankingAccounts] = useState<any[]>([]);
  const [filteredServices, setFilteredServices] = useState<BankingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<BankingService | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    transaction_count: 1,
    extra_amount: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    amount: 0,
    transaction_count: 1,
    extra_amount: 0,
  });

  const fetchBankingServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banking_services')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount: Number(entry.amount),
        margin: Number(entry.margin),
        transaction_count: Number(entry.transaction_count),
        extra_amount: Number(entry.extra_amount || 0),
        created_at: entry.created_at
      }));

      setBankingServices(formattedData);

      // Fetch banking accounts (Other Banking Services)
      const { data: accountsData, error: accountsError } = await supabase
        .from('banking_accounts')
        .select('*')
        .order('date', { ascending: false });

      if (accountsError) throw accountsError;

      setBankingAccounts(accountsData || []);
    } catch (error) {
      console.error('Error fetching banking services:', error);
      toast.error('Failed to load banking services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBankingServices();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredServices(filterByDate(bankingServices, date));
    } else {
      setFilteredServices(filterByMonth(bankingServices, date));
    }
  }, [date, viewMode, bankingServices]);

  // Process CSV/Excel file using PapaParse
  const processFile = async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let rows: any[] = [];
      
      if (fileExtension === 'csv') {
        // Parse CSV with PapaParse
        const result = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject,
          });
        });
        rows = result.data;
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        rows = XLSX.utils.sheet_to_json(worksheet);
      } else {
        toast.error('Please upload a CSV or Excel file');
        return;
      }

      if (rows.length === 0) {
        toast.error('No data found in file');
        return;
      }

      // Find AMOUNT and TRANSACTION ID columns (case-insensitive)
      const headers = Object.keys(rows[0]);
      const amountKey = headers.find(h => h.toUpperCase().includes('AMOUNT'));
      const transactionIdKey = headers.find(h => 
        h.toUpperCase().includes('TRANSACTION') || 
        h.toUpperCase().includes('TXN') ||
        h.toUpperCase().includes('ID')
      );

      if (!amountKey) {
        toast.error('AMOUNT column not found in file');
        return;
      }

      // Process each row and calculate amounts
      let totalAmount = 0;
      let extraAmount = 0;
      let transactionCount = 0;

      rows.forEach((row) => {
        // Parse amount value
        let amount = 0;
        const amountValue = row[amountKey];
        
        if (typeof amountValue === 'number') {
          amount = amountValue;
        } else if (typeof amountValue === 'string') {
          // Remove currency symbols and commas
          const cleanedAmount = amountValue.replace(/[₹$,\s]/g, '');
          amount = parseFloat(cleanedAmount) || 0;
        }

        // Skip if amount is 0 or negative
        if (amount <= 0) return;

        // If amount > 10000, cap at 10000 and add excess to extra_amount
        if (amount > 10000) {
          totalAmount += 10000;
          extraAmount += (amount - 10000);
        } else {
          totalAmount += amount;
        }

        // Count transaction
        transactionCount++;
      });

      if (transactionCount === 0) {
        toast.error('No valid transactions found in file');
        return;
      }

      // Calculate margin only on the capped amount (not extra_amount)
      const margin = calculateBankingServicesMargin(totalAmount);

      // Update form with extracted data
      setNewEntry({
        date: new Date().toISOString().split('T')[0],
        amount: totalAmount,
        transaction_count: transactionCount,
        extra_amount: extraAmount,
      });

      toast.success(`Extracted ${transactionCount} transactions. Total: ₹${totalAmount.toLocaleString()}, Extra: ₹${extraAmount.toLocaleString()}`);

      // Auto-save the entry
      const { data, error } = await supabase
        .from('banking_services')
        .insert({
          date: new Date().toISOString(),
          amount: totalAmount,
          margin: margin,
          transaction_count: transactionCount,
          extra_amount: extraAmount,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newService: BankingService = {
          id: data[0].id,
          date: new Date(data[0].date),
          amount: Number(data[0].amount),
          margin: Number(data[0].margin),
          transaction_count: Number(data[0].transaction_count),
          extra_amount: Number(data[0].extra_amount || 0),
          created_at: data[0].created_at
        };

        setBankingServices(prev => [newService, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          transaction_count: 1,
          extra_amount: 0,
        });
        toast.success('Banking service saved successfully');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.amount || !newEntry.transaction_count) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const margin = calculateBankingServicesMargin(newEntry.amount);
      
      const { data, error } = await supabase
        .from('banking_services')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          amount: newEntry.amount,
          margin: margin,
          transaction_count: newEntry.transaction_count,
          extra_amount: newEntry.extra_amount,
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newService: BankingService = {
          id: data[0].id,
          date: new Date(data[0].date),
          amount: Number(data[0].amount),
          margin: Number(data[0].margin),
          transaction_count: Number(data[0].transaction_count),
          extra_amount: Number(data[0].extra_amount || 0),
          created_at: data[0].created_at
        };

        setBankingServices(prev => [newService, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          transaction_count: 1,
          extra_amount: 0,
        });
        toast.success('Banking service added successfully');
      }
    } catch (error) {
      console.error('Error adding banking service:', error);
      toast.error('Failed to add banking service');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    try {
      const margin = calculateBankingServicesMargin(editForm.amount);
      
      const { error } = await supabase
        .from('banking_services')
        .update({
          date: new Date(editForm.date).toISOString(),
          amount: editForm.amount,
          margin: margin,
          transaction_count: editForm.transaction_count,
          extra_amount: editForm.extra_amount,
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      const updatedEntry: BankingService = {
        ...editingEntry,
        date: new Date(editForm.date),
        amount: editForm.amount,
        margin: margin,
        transaction_count: editForm.transaction_count,
        extra_amount: editForm.extra_amount,
      };

      setBankingServices(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      toast.success('Banking service updated successfully');
    } catch (error) {
      console.error('Error updating banking service:', error);
      toast.error('Failed to update banking service');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banking_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBankingServices(prev => prev.filter(entry => entry.id !== id));
      toast.success('Banking service deleted successfully');
    } catch (error) {
      console.error('Error deleting banking service:', error);
      toast.error('Failed to delete banking service');
    }
  };

  const openEditEntry = (entry: BankingService) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      amount: entry.amount,
      transaction_count: entry.transaction_count,
      extra_amount: entry.extra_amount || 0,
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Banking Services Report</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Banking Services Report</h1>
          <div class="total">Total Services: ${totalServices} | Total Amount: ₹${totalAmount.toFixed(2)} | Total Margin: ₹${totalMargin.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction Count</th>
                <th>Amount</th>
                <th>Extra Amount</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredServices.map((service) => `
                <tr>
                  <td>${escapeHtml(format(service.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(service.transaction_count.toString())}</td>
                  <td>₹${escapeHtml(service.amount.toFixed(2))}</td>
                  <td>₹${escapeHtml((service.extra_amount || 0).toFixed(2))}</td>
                  <td>₹${escapeHtml(service.margin.toFixed(2))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const totalServices = filteredServices.length;
  const totalAmount = filteredServices.reduce((sum, service) => sum + service.amount, 0);
  const totalTransactions = filteredServices.reduce((sum, service) => sum + service.transaction_count, 0);
  const totalExtraAmount = filteredServices.reduce((sum, service) => sum + (service.extra_amount || 0), 0);
  
  // Filter banking accounts by date/month
  const filteredBankingAccounts = viewMode === 'day' 
    ? bankingAccounts.filter(account => {
        const accountDate = new Date(account.date);
        return accountDate.toDateString() === date.toDateString();
      })
    : bankingAccounts.filter(account => {
        const accountDate = new Date(account.date);
        return accountDate.getMonth() === date.getMonth() && 
               accountDate.getFullYear() === date.getFullYear();
      });
  
  const bankingAccountsMargin = filteredBankingAccounts.reduce((sum, account) => 
    sum + Number(account.margin || 0), 0);
  
  const totalMargin = filteredServices.reduce((sum, service) => sum + service.margin, 0) + bankingAccountsMargin;

  return (
    <PageWrapper
      title="Banking Services"
      subtitle="Manage banking services and view analytics"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker 
            date={date} 
            onDateChange={setDate} 
            mode={viewMode} 
            onModeChange={setViewMode} 
          />
          <div className="flex gap-2">
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton
              data={bankingServices}
              filename="banking-services-data"
              currentData={filteredServices}
            />
          </div>
        </div>
      }
    >
      {/* Add Banking Service Form */}
      <div className="mb-6 p-4 bg-card backdrop-blur-sm rounded-lg shadow-lg border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Add Banking Service</h3>
          {/* Small Browse Button */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1"
            >
              <Upload size={14} />
              Browse CSV/Excel
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="transaction_count">Transaction Count</Label>
            <Input
              id="transaction_count"
              type="number"
              value={newEntry.transaction_count}
              onChange={(e) => setNewEntry(prev => ({ ...prev, transaction_count: Number(e.target.value) }))}
              placeholder="Transaction count"
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (Max ₹10,000/txn)</Label>
            <Input
              id="amount"
              type="number"
              value={newEntry.amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="Amount"
            />
          </div>
          <div>
            <Label htmlFor="extra_amount">Extra Amount</Label>
            <Input
              id="extra_amount"
              type="number"
              value={newEntry.extra_amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, extra_amount: Number(e.target.value) }))}
              placeholder="Extra Amount"
            />
          </div>
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          * Margin is calculated only on Amount (capped at ₹10,000 per transaction). Extra amount is saved separately.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard 
          title="Total Services"
          value={totalServices.toString()}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Transactions"
          value={totalTransactions.toString()}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Extra Amount"
          value={formatCurrency(totalExtraAmount)}
          icon={<CreditCard size={20} />}
        />
        <StatCard 
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          icon={<CreditCard size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No banking services found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredServices.map(entry => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Banking Service"
              date={entry.date}
              data={{
                transactions: entry.transaction_count,
                amount: formatCurrency(entry.amount),
                extra_amount: formatCurrency(entry.extra_amount),
                margin: formatCurrency(entry.margin)
              }}
              labels={{
                transactions: 'Transactions',
                amount: 'Amount',
                extra_amount: 'Extra Amount',
                margin: 'Margin'
              }}
              onEdit={() => openEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
            />
          ))
        )}
      </div>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Banking Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_date">Date</Label>
              <Input
                id="edit_date"
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_transaction_count">Transaction Count</Label>
              <Input
                id="edit_transaction_count"
                type="number"
                value={editForm.transaction_count}
                onChange={(e) => setEditForm(prev => ({ ...prev, transaction_count: Number(e.target.value) }))}
                placeholder="Transaction count"
                min="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_amount">Amount</Label>
              <Input
                id="edit_amount"
                type="number"
                value={editForm.amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                placeholder="Amount"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_extra_amount">Extra Amount</Label>
              <Input
                id="edit_extra_amount"
                type="number"
                value={editForm.extra_amount}
                onChange={(e) => setEditForm(prev => ({ ...prev, extra_amount: Number(e.target.value) }))}
                placeholder="Extra Amount"
              />
            </div>
            <Button onClick={handleEditEntry}>Update Banking Service</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default BankingServices;
