import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Edit, Trash2, Printer, Download, Upload, FileSpreadsheet, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { exportToExcel } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ODDetailRecord {
  id: string;
  date: string;
  od_from_bank: number;
  last_balance: number;
  amount_received: number;
  amount_distributed: number;
  cash_in_hand: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

const RECORDS_PER_PAGE = 15;
const WITHDRAWAL_TYPES = ['AEPS Cash Withdrawal', 'Withdrawal'];
const DEPOSIT_TYPES = ['Savings Deposit By Cash', 'AEPS Cash Deposit', 'IMPS Transaction', 'BBPS Make Payment'];

const ODDetailRecords = () => {
  const [records, setRecords] = useState<ODDetailRecord[]>([]);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    od_from_bank: 0,
    last_balance: 0,
    amount_received: 0,
    amount_distributed: 0,
    remarks: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditData, setInlineEditData] = useState<Partial<ODDetailRecord>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [isLoading, setIsLoading] = useState(false);
  const [printMode, setPrintMode] = useState<'range' | 'month'>('range');
  const [printDateRange, setPrintDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [printMonth, setPrintMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [analysisResult, setAnalysisResult] = useState<{ totalWithdrawal: number; totalDeposit: number; cashInHand: number; fileName: string } | null>(null);
  
  // Time filter state for CSV/Excel parsing
  const [timeFilterMode, setTimeFilterMode] = useState<'all' | 'before' | 'after'>('all');
  const [filterTime, setFilterTime] = useState('12:00');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const cashInHand = formData.last_balance + formData.od_from_bank + formData.amount_received - formData.amount_distributed;

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('od_detail_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedRecords: ODDetailRecord[] = (data || []).map(record => ({
        id: record.id,
        date: record.date,
        od_from_bank: record.od_from_bank || 0,
        last_balance: record.last_balance,
        amount_received: record.amount_received,
        amount_distributed: record.amount_given || 0,
        cash_in_hand: record.cash_in_hand,
        remarks: record.remarks || '',
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));
      
      setRecords(mappedRecords);
      if (mappedRecords.length > 0) {
        setFormData(prev => ({ ...prev, last_balance: mappedRecords[0].cash_in_hand }));
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({ title: "Error", description: "Failed to fetch OD records", variant: "destructive" });
    }
  };

  // CSV/Excel parsing functions
  const findTransactionTypeAndAmount = (row: Record<string, string>): { type: string; amount: number } | null => {
    let transactionType = '';
    let amount = 0;

    for (const [key, value] of Object.entries(row)) {
      const val = String(value || '').trim();
      const matchedWithdrawal = WITHDRAWAL_TYPES.find(t => val.toLowerCase() === t.toLowerCase());
      const matchedDeposit = DEPOSIT_TYPES.find(t => val.toLowerCase() === t.toLowerCase());
      
      if (matchedWithdrawal || matchedDeposit) transactionType = val;
      
      const keyLower = key.toLowerCase();
      if (keyLower.includes('amount') || keyLower.includes('debit') || keyLower.includes('credit') || keyLower.includes('value')) {
        const parsed = parseFloat(val.replace(/[₹,\s]/g, ''));
        if (!isNaN(parsed) && parsed > 0) amount = parsed;
      }
    }

    if (amount === 0) {
      for (const value of Object.values(row)) {
        const val = String(value || '').trim();
        const parsed = parseFloat(val.replace(/[₹,\s]/g, ''));
        if (!isNaN(parsed) && parsed > 0) { amount = parsed; break; }
      }
    }

    if (transactionType && amount > 0) return { type: transactionType, amount };
    return null;
  };

  // Extract transaction time from row and check if it passes the filter
  const getTransactionTime = (row: Record<string, string>): string | null => {
    for (const [key, value] of Object.entries(row)) {
      const keyLower = key.toLowerCase().trim();
      if (keyLower === 'transaction time' || keyLower === 'transactiontime' || keyLower.includes('transaction') && keyLower.includes('time')) {
        const val = String(value || '').trim();
        // Expected format: YYYY-MM-DD HH:MM:SS (e.g., 2026-01-31 15:52:49)
        const timeMatch = val.match(/\d{2}:\d{2}:\d{2}$/);
        if (timeMatch) {
          return timeMatch[0]; // Returns "HH:MM:SS"
        }
        // Also try to extract just time if full datetime
        const dateTimeMatch = val.match(/(\d{2}:\d{2})/);
        if (dateTimeMatch) {
          return dateTimeMatch[1] + ':00';
        }
      }
    }
    return null;
  };

  const passesTimeFilter = (rowTime: string | null): boolean => {
    if (timeFilterMode === 'all' || !rowTime) return true;
    
    const [filterHour, filterMinute] = filterTime.split(':').map(Number);
    const filterMinutes = filterHour * 60 + filterMinute;
    
    const [rowHour, rowMinute] = rowTime.split(':').map(Number);
    const rowMinutes = rowHour * 60 + rowMinute;
    
    if (timeFilterMode === 'before') {
      return rowMinutes < filterMinutes;
    } else {
      return rowMinutes >= filterMinutes;
    }
  };

  const parseCSVWithPapaparse = (content: string): { totalWithdrawal: number; totalDeposit: number } => {
    let totalWithdrawal = 0;
    let totalDeposit = 0;

    const result = Papa.parse(content, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });

    for (const row of result.data as Record<string, string>[]) {
      const transactionTime = getTransactionTime(row);
      if (!passesTimeFilter(transactionTime)) continue;
      
      const transaction = findTransactionTypeAndAmount(row);
      if (transaction) {
        if (WITHDRAWAL_TYPES.some(t => t.toLowerCase() === transaction.type.toLowerCase())) totalWithdrawal += transaction.amount;
        else if (DEPOSIT_TYPES.some(t => t.toLowerCase() === transaction.type.toLowerCase())) totalDeposit += transaction.amount;
      }
    }
    return { totalWithdrawal, totalDeposit };
  };

  const parseExcelFile = async (file: File): Promise<{ totalWithdrawal: number; totalDeposit: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
          
          let totalWithdrawal = 0;
          let totalDeposit = 0;
          
          for (const row of jsonData) {
            const stringRow: Record<string, string> = {};
            for (const [key, value] of Object.entries(row)) stringRow[key] = String(value || '');
            
            const transactionTime = getTransactionTime(stringRow);
            if (!passesTimeFilter(transactionTime)) continue;
            
            const transaction = findTransactionTypeAndAmount(stringRow);
            if (transaction) {
              if (WITHDRAWAL_TYPES.some(t => t.toLowerCase() === transaction.type.toLowerCase())) totalWithdrawal += transaction.amount;
              else if (DEPOSIT_TYPES.some(t => t.toLowerCase() === transaction.type.toLowerCase())) totalDeposit += transaction.amount;
            }
          }
          resolve({ totalWithdrawal, totalDeposit });
        } catch (error) { reject(error); }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const processFile = async (file: File) => {
    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    if (!isCSV && !isExcel) {
      toast({ title: "Invalid File", description: "Please upload a CSV or Excel file", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      let result: { totalWithdrawal: number; totalDeposit: number };
      if (isExcel) result = await parseExcelFile(file);
      else {
        const content = await file.text();
        result = parseCSVWithPapaparse(content);
      }
      
      const latestBalance = records.length > 0 ? records[0].cash_in_hand : 0;
      const newCashInHand = latestBalance + result.totalDeposit - result.totalWithdrawal;
      
      setAnalysisResult({
        totalWithdrawal: result.totalWithdrawal,
        totalDeposit: result.totalDeposit,
        cashInHand: newCashInHand,
        fileName: file.name,
      });
      
      toast({ title: "File Analyzed", description: "Review the results and save to add to records." });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({ title: "Error", description: "Failed to parse file", variant: "destructive" });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleSaveAnalysis = async () => {
    if (!analysisResult) return;
    setIsLoading(true);
    
    try {
      const latestBalance = records.length > 0 ? records[0].cash_in_hand : 0;
      const newCashInHand = latestBalance + analysisResult.totalDeposit - analysisResult.totalWithdrawal;

      const { error } = await supabase.from('od_detail_records').insert([{
        date: format(new Date(), 'yyyy-MM-dd'),
        od_from_bank: 0,
        last_balance: latestBalance,
        amount_received: analysisResult.totalDeposit,
        amount_given: analysisResult.totalWithdrawal,
        cash_in_hand: newCashInHand,
        remarks: `From file: ${analysisResult.fileName}`,
      }]);

      if (error) throw error;
      toast({ title: "Success", description: "Analysis saved to OD Records" });
      setAnalysisResult(null);
      await fetchRecords();
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast({ title: "Error", description: "Failed to save analysis", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const recordData = {
        date: formData.date,
        od_from_bank: formData.od_from_bank,
        last_balance: formData.last_balance,
        amount_received: formData.amount_received,
        amount_given: formData.amount_distributed,
        cash_in_hand: cashInHand,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        const { error } = await supabase.from('od_detail_records').update({ ...recordData, updated_at: new Date().toISOString() }).eq('id', editingId);
        if (error) throw error;
        toast({ title: "Success", description: "OD record updated successfully" });
      } else {
        const { error } = await supabase.from('od_detail_records').insert([recordData]);
        if (error) throw error;
        toast({ title: "Success", description: "OD record added successfully" });
      }

      await fetchRecords();
      resetForm();
    } catch (error) {
      console.error('Error saving record:', error);
      toast({ title: "Error", description: "Failed to save OD record", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: ODDetailRecord) => {
    setFormData({
      date: record.date,
      od_from_bank: record.od_from_bank,
      last_balance: record.last_balance,
      amount_received: record.amount_received,
      amount_distributed: record.amount_distributed,
      remarks: record.remarks || '',
    });
    setEditingId(record.id);
  };

  const startInlineEdit = (record: ODDetailRecord) => {
    setInlineEditId(record.id);
    setInlineEditData({
      amount_received: record.amount_received,
      amount_distributed: record.amount_distributed,
      remarks: record.remarks,
    });
  };

  const saveInlineEdit = async () => {
    if (!inlineEditId) return;
    setIsLoading(true);
    
    try {
      const record = records.find(r => r.id === inlineEditId);
      if (!record) return;
      
      const newCashInHand = record.last_balance + record.od_from_bank + 
        (inlineEditData.amount_received || 0) - (inlineEditData.amount_distributed || 0);
      
      const { error } = await supabase.from('od_detail_records').update({
        amount_received: inlineEditData.amount_received,
        amount_given: inlineEditData.amount_distributed,
        cash_in_hand: newCashInHand,
        remarks: inlineEditData.remarks,
        updated_at: new Date().toISOString(),
      }).eq('id', inlineEditId);

      if (error) throw error;
      toast({ title: "Success", description: "Record updated" });
      setInlineEditId(null);
      await fetchRecords();
    } catch (error) {
      console.error('Error updating:', error);
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('od_detail_records').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Success", description: "OD record deleted successfully" });
      await fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({ title: "Error", description: "Failed to delete OD record", variant: "destructive" });
    }
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const resetForm = () => {
    const latestCashInHand = records.length > 0 ? records[0].cash_in_hand : 0;
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      od_from_bank: 0,
      last_balance: latestCashInHand,
      amount_received: 0,
      amount_distributed: 0,
      remarks: '',
    });
    setEditingId(null);
  };

  const getFilteredRecordsForPrint = () => {
    let startDate: Date, endDate: Date;
    
    if (printMode === 'month') {
      const [year, month] = printMonth.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, 1);
      startDate = startOfMonth(selectedDate);
      endDate = endOfMonth(selectedDate);
    } else {
      startDate = new Date(printDateRange.startDate);
      endDate = new Date(printDateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    return records
      .filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        const dateCompare = dateA.getTime() - dateB.getTime();
        if (dateCompare !== 0) return dateCompare;
        const createdA = new Date(a.created_at || 0).getTime();
        const createdB = new Date(b.created_at || 0).getTime();
        return createdA - createdB;
      });
  };

  const handlePrint = () => {
    const filteredRecords = getFilteredRecordsForPrint();
    const recordsPerPage = 20;
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    
    let dateRangeText = '';
    if (printMode === 'month') {
      const [year, month] = printMonth.split('-').map(Number);
      dateRangeText = format(new Date(year, month - 1, 1), 'MMMM yyyy');
    } else {
      dateRangeText = `${format(new Date(printDateRange.startDate), 'dd/MM/yyyy')} to ${format(new Date(printDateRange.endDate), 'dd/MM/yyyy')}`;
    }
    
    const totalODFromBank = filteredRecords.reduce((sum, r) => sum + r.od_from_bank, 0);
    const totalReceived = filteredRecords.reduce((sum, r) => sum + r.amount_received, 0);
    const totalDistributed = filteredRecords.reduce((sum, r) => sum + r.amount_distributed, 0);
    
    let pagesHtml = '';
    for (let page = 0; page < totalPages; page++) {
      const pageRecords = filteredRecords.slice(page * recordsPerPage, (page + 1) * recordsPerPage);
      
      pagesHtml += `
        <div class="print-page" ${page > 0 ? 'style="page-break-before: always;"' : ''}>
          <div class="header">
            <h1>OD Records</h1>
            <p class="subtitle">Period: ${dateRangeText}</p>
            <p class="page-info">Page ${page + 1} of ${totalPages} | Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>OD from Bank</th>
                <th>Last Balance</th>
                <th>Deposit</th>
                <th>Withdrawal</th>
                <th>Cash in Hand</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${pageRecords.map((record, idx) => `
                <tr>
                  <td style="text-align: center;">${page * recordsPerPage + idx + 1}</td>
                  <td style="text-align: center;">${format(new Date(record.date), 'dd/MM/yyyy')}</td>
                  <td style="text-align: right;">₹${record.od_from_bank.toLocaleString('en-IN')}</td>
                  <td style="text-align: right;">₹${record.last_balance.toLocaleString('en-IN')}</td>
                  <td style="text-align: right;">₹${record.amount_received.toLocaleString('en-IN')}</td>
                  <td style="text-align: right;">₹${record.amount_distributed.toLocaleString('en-IN')}</td>
                  <td style="text-align: right; font-weight: 600;">₹${record.cash_in_hand.toLocaleString('en-IN')}</td>
                  <td style="text-align: left;">${record.remarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${page === totalPages - 1 ? `
            <div class="summary">
              <h3>Summary</h3>
              <div class="summary-grid">
                <div class="summary-item"><span>Total Records:</span><span>${filteredRecords.length}</span></div>
                <div class="summary-item"><span>Total OD from Bank:</span><span>₹${totalODFromBank.toLocaleString('en-IN')}</span></div>
                <div class="summary-item"><span>Total Deposit:</span><span>₹${totalReceived.toLocaleString('en-IN')}</span></div>
                <div class="summary-item"><span>Total Withdrawal:</span><span>₹${totalDistributed.toLocaleString('en-IN')}</span></div>
                <div class="summary-item highlight"><span>Final Cash in Hand:</span><span>₹${filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1].cash_in_hand.toLocaleString('en-IN') : '0'}</span></div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    const printContent = `<!DOCTYPE html><html><head><title>OD Records - ${dateRangeText}</title>
      <style>
        @page { size: A4 portrait; margin: 15mm 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333; }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .header .subtitle { font-size: 16px; color: #444; }
        .page-info { font-size: 11px; color: #666; margin-top: 8px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #444; padding: 10px 8px; }
        th { background-color: #2c3e50; color: white; text-align: center; }
        tbody tr:nth-child(even) { background-color: #f8f9fa; }
        .summary { margin-top: 25px; padding: 20px; border: 2px solid #2c3e50; background-color: #f8f9fa; border-radius: 8px; }
        .summary h3 { font-size: 18px; margin-bottom: 15px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .summary-item { display: flex; justify-content: space-between; padding: 8px 12px; background: white; border-radius: 4px; border: 1px solid #ddd; }
        .summary-item.highlight { background: #2c3e50; color: white; grid-column: span 2; }
      </style>
    </head><body>${pagesHtml}</body></html>`;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const handleDownload = () => {
    const exportData = records.map(record => ({
      Date: format(new Date(record.date), 'dd/MM/yyyy'),
      'OD from Bank': record.od_from_bank,
      'Last Balance': record.last_balance,
      'Deposit': record.amount_received,
      'Withdrawal': record.amount_distributed,
      'Cash in Hand': record.cash_in_hand,
      'Remarks': record.remarks || '',
    }));
    exportToExcel(exportData, 'od-detail-records');
  };

  return (
    <PageWrapper title="OD Detail Records">
      <div className="space-y-6">
        {/* Compact Upload Section with Time Filter */}
        <Card className="border-primary/20">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
              
              {/* Time Filter Controls */}
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Transaction Time:</Label>
                <Select value={timeFilterMode} onValueChange={(v: 'all' | 'before' | 'after') => setTimeFilterMode(v)}>
                  <SelectTrigger className="w-28 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="before">Before</SelectItem>
                    <SelectItem value="after">After</SelectItem>
                  </SelectContent>
                </Select>
                {timeFilterMode !== 'all' && (
                  <Input
                    type="time"
                    value={filterTime}
                    onChange={(e) => setFilterTime(e.target.value)}
                    className="w-28 h-9"
                  />
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Browse CSV/Excel
              </Button>
              
              <span className="text-sm text-muted-foreground">
                {timeFilterMode === 'all' 
                  ? 'Upload CSV or Excel file to auto-calculate deposit, withdrawal & cash in hand'
                  : `Filters transactions ${timeFilterMode} ${filterTime}`
                }
              </span>
              
              {isLoading && (
                <div className="flex items-center gap-2 text-primary">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis Result - Inline Save */}
        {analysisResult && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <span className="font-medium text-foreground">{analysisResult.fileName}</span>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground">Deposit: </span>
                      <span className="font-semibold text-primary">₹{analysisResult.totalDeposit.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Withdrawal: </span>
                      <span className="font-semibold text-destructive">₹{analysisResult.totalWithdrawal.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Cash in Hand: </span>
                      <span className="font-bold text-foreground">₹{analysisResult.cashInHand.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveAnalysis} disabled={isLoading} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save to Records
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAnalysisResult(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingId ? 'Edit Record' : 'Add New Record'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input type="date" id="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="od_from_bank">OD from Bank</Label>
                  <Input type="number" id="od_from_bank" value={formData.od_from_bank} onChange={(e) => setFormData({ ...formData, od_from_bank: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_balance">Last Balance</Label>
                  <Input type="number" id="last_balance" value={formData.last_balance} onChange={(e) => setFormData({ ...formData, last_balance: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_received">Deposit</Label>
                  <Input type="number" id="amount_received" value={formData.amount_received} onChange={(e) => setFormData({ ...formData, amount_received: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount_distributed">Withdrawal</Label>
                  <Input type="number" id="amount_distributed" value={formData.amount_distributed} onChange={(e) => setFormData({ ...formData, amount_distributed: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Cash in Hand</Label>
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center font-semibold text-primary">
                    ₹{cashInHand.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea id="remarks" value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Optional remarks..." rows={2} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>{editingId ? 'Update Record' : 'Add Record'}</Button>
                {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Print Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Print & Export
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select value={printMode} onValueChange={(v: 'range' | 'month') => setPrintMode(v)}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="range">Date Range</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {printMode === 'range' ? (
                <>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={printDateRange.startDate} onChange={(e) => setPrintDateRange({ ...printDateRange, startDate: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={printDateRange.endDate} onChange={(e) => setPrintDateRange({ ...printDateRange, endDate: e.target.value })} />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Input type="month" value={printMonth} onChange={(e) => setPrintMonth(e.target.value)} />
                </div>
              )}
              <Button onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" />Print</Button>
              <Button variant="outline" onClick={handleDownload} className="gap-2"><Download className="h-4 w-4" />Download Excel</Button>
            </div>
          </CardContent>
        </Card>

        {/* Records Table with Inline Edit */}
        <Card>
          <CardHeader>
            <CardTitle>OD Records ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>S.No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>OD from Bank</TableHead>
                    <TableHead>Last Balance</TableHead>
                    <TableHead>Deposit</TableHead>
                    <TableHead>Withdrawal</TableHead>
                    <TableHead>Cash in Hand</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.slice(0, RECORDS_PER_PAGE).map((record, index) => (
                    <TableRow key={record.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>₹{record.od_from_bank.toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{record.last_balance.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {inlineEditId === record.id ? (
                          <Input
                            type="number"
                            className="w-24 h-8"
                            value={inlineEditData.amount_received || 0}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, amount_received: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <span className="text-primary">₹{record.amount_received.toLocaleString('en-IN')}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {inlineEditId === record.id ? (
                          <Input
                            type="number"
                            className="w-24 h-8"
                            value={inlineEditData.amount_distributed || 0}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, amount_distributed: parseFloat(e.target.value) || 0 })}
                          />
                        ) : (
                          <span className="text-destructive">₹{record.amount_distributed.toLocaleString('en-IN')}</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">₹{record.cash_in_hand.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        {inlineEditId === record.id ? (
                          <Input
                            className="w-32 h-8"
                            value={inlineEditData.remarks || ''}
                            onChange={(e) => setInlineEditData({ ...inlineEditData, remarks: e.target.value })}
                          />
                        ) : (
                          record.remarks || '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {inlineEditId === record.id ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={saveInlineEdit} disabled={isLoading}><Save className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setInlineEditId(null)}><X className="h-4 w-4" /></Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => startInlineEdit(record)}><Edit className="h-4 w-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ isOpen: true, id: record.id })}><Trash2 className="h-4 w-4" /></Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(isOpen) => setDeleteConfirm({ isOpen, id: deleteConfirm.id })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this record? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageWrapper>
  );
};

export default ODDetailRecords;
