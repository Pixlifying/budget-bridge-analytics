import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, Edit, Calculator, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import PageWrapper from '@/components/layout/PageWrapper';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface CSVRecord {
  id: string;
  date: string;
  file_name: string;
  total_withdrawal: number;
  total_deposit: number;
  cash_in_hand: number;
  created_at: string;
  updated_at: string;
}

interface AnalysisResult {
  totalWithdrawal: number;
  totalDeposit: number;
  cashInHand: number;
  fileName: string;
}

// Specific transaction types to filter
const WITHDRAWAL_TYPES = ['AEPS Cash Withdrawal', 'Withdrawal'];
const DEPOSIT_TYPES = ['Savings Deposit By Cash', 'AEPS Cash Deposit', 'IMPS Transaction'];

const Records = () => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [editingRecord, setEditingRecord] = useState<CSVRecord | null>(null);
  const [editForm, setEditForm] = useState({
    total_withdrawal: 0,
    total_deposit: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: records = [], refetch: refetchRecords } = useQuery({
    queryKey: ['csvAnalysisRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csv_analysis_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      return data as CSVRecord[];
    }
  });

  const findTransactionTypeAndAmount = (row: Record<string, string>): { type: string; amount: number } | null => {
    // Look for transaction type in any column
    let transactionType = '';
    let amount = 0;

    for (const [key, value] of Object.entries(row)) {
      const val = String(value || '').trim();
      
      // Check if this cell matches any withdrawal or deposit type
      const matchedWithdrawal = WITHDRAWAL_TYPES.find(t => val.toLowerCase() === t.toLowerCase());
      const matchedDeposit = DEPOSIT_TYPES.find(t => val.toLowerCase() === t.toLowerCase());
      
      if (matchedWithdrawal || matchedDeposit) {
        transactionType = val;
      }
      
      // Try to parse amount from numeric columns
      const keyLower = key.toLowerCase();
      if (keyLower.includes('amount') || keyLower.includes('debit') || keyLower.includes('credit') || keyLower.includes('value')) {
        const parsed = parseFloat(val.replace(/[₹,\s]/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed;
        }
      }
    }

    // If no amount found in named columns, look for any numeric value in the row
    if (amount === 0) {
      for (const value of Object.values(row)) {
        const val = String(value || '').trim();
        const parsed = parseFloat(val.replace(/[₹,\s]/g, ''));
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed;
          break;
        }
      }
    }

    if (transactionType && amount > 0) {
      return { type: transactionType, amount };
    }
    return null;
  };

  const parseCSVWithPapaparse = (content: string): { totalWithdrawal: number; totalDeposit: number } => {
    let totalWithdrawal = 0;
    let totalDeposit = 0;

    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    for (const row of result.data as Record<string, string>[]) {
      const transaction = findTransactionTypeAndAmount(row);
      
      if (transaction) {
        const isWithdrawal = WITHDRAWAL_TYPES.some(t => t.toLowerCase() === transaction.type.toLowerCase());
        const isDeposit = DEPOSIT_TYPES.some(t => t.toLowerCase() === transaction.type.toLowerCase());
        
        if (isWithdrawal) {
          totalWithdrawal += transaction.amount;
        } else if (isDeposit) {
          totalDeposit += transaction.amount;
        }
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
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with headers
          const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
          
          let totalWithdrawal = 0;
          let totalDeposit = 0;
          
          for (const row of jsonData) {
            // Convert row values to strings for processing
            const stringRow: Record<string, string> = {};
            for (const [key, value] of Object.entries(row)) {
              stringRow[key] = String(value || '');
            }
            
            const transaction = findTransactionTypeAndAmount(stringRow);
            
            if (transaction) {
              const isWithdrawal = WITHDRAWAL_TYPES.some(t => t.toLowerCase() === transaction.type.toLowerCase());
              const isDeposit = DEPOSIT_TYPES.some(t => t.toLowerCase() === transaction.type.toLowerCase());
              
              if (isWithdrawal) {
                totalWithdrawal += transaction.amount;
              } else if (isDeposit) {
                totalDeposit += transaction.amount;
              }
            }
          }
          
          resolve({ totalWithdrawal, totalDeposit });
        } catch (error) {
          reject(error);
        }
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
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or Excel (.xlsx, .xls) file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let result: { totalWithdrawal: number; totalDeposit: number };
      
      if (isExcel) {
        result = await parseExcelFile(file);
      } else {
        const content = await file.text();
        result = parseCSVWithPapaparse(content);
      }
      
      const cashInHand = result.totalDeposit - result.totalWithdrawal;
      
      setAnalysisResult({
        totalWithdrawal: result.totalWithdrawal,
        totalDeposit: result.totalDeposit,
        cashInHand,
        fileName: file.name,
      });
      
      toast({
        title: "File Analyzed",
        description: `${isExcel ? 'Excel' : 'CSV'} file has been analyzed successfully. Review the results below.`,
      });
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error",
        description: "Failed to parse file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFile(files[0]);
    }
  }, []);

  const handleSaveAnalysis = async () => {
    if (!analysisResult) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('csv_analysis_records')
        .insert([{
          file_name: analysisResult.fileName,
          total_withdrawal: analysisResult.totalWithdrawal,
          total_deposit: analysisResult.totalDeposit,
          cash_in_hand: analysisResult.cashInHand,
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Analysis saved successfully",
      });
      
      setAnalysisResult(null);
      refetchRecords();
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: CSVRecord) => {
    setEditingRecord(record);
    setEditForm({
      total_withdrawal: record.total_withdrawal,
      total_deposit: record.total_deposit,
    });
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    
    setIsLoading(true);
    
    try {
      const cashInHand = editForm.total_deposit - editForm.total_withdrawal;
      
      const { error } = await supabase
        .from('csv_analysis_records')
        .update({
          total_withdrawal: editForm.total_withdrawal,
          total_deposit: editForm.total_deposit,
          cash_in_hand: cashInHand,
        })
        .eq('id', editingRecord.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
      
      setEditingRecord(null);
      refetchRecords();
    } catch (error) {
      console.error('Error updating record:', error);
      toast({
        title: "Error",
        description: "Failed to update record",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('csv_analysis_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
      
      refetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    }
    setDeleteConfirm({ isOpen: false, id: null });
  };

  return (
    <PageWrapper title="Records - File Analysis">
      <div className="space-y-6">
        {/* Upload Section with Drag & Drop */}
        <Card 
          ref={dropZoneRef}
          className={`
            border-2 border-dashed transition-all duration-300
            ${isDragging 
              ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/20' 
              : 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent'
            }
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV or Excel File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Drag & drop or browse to upload a CSV or Excel file. The system will sum all Withdrawal types, 
                sum all Deposit and IMPS types, and calculate Cash in Hand (Deposit - Withdrawal).
              </p>
              
              {/* Drag & Drop Zone */}
              <div 
                className={`
                  relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
                  transition-all duration-300
                  ${isDragging 
                    ? 'border-primary bg-primary/20 scale-[1.01]' 
                    : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                    p-4 rounded-full transition-all duration-300
                    ${isDragging 
                      ? 'bg-primary/30 scale-110' 
                      : 'bg-gradient-to-br from-primary/20 to-primary/10'
                    }
                  `}>
                    {isDragging ? (
                      <Upload className="h-8 w-8 text-primary animate-bounce" />
                    ) : (
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-slate-700 dark:text-slate-200">
                      {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse • Supports CSV, XLSX, XLS
                    </p>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-2 text-primary mt-2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Analyzing file...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Result */}
        {analysisResult && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Calculator className="h-5 w-5" />
                Analysis Result - {analysisResult.fileName}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border">
                  <p className="text-sm text-muted-foreground">Total Withdrawal</p>
                  <p className="text-2xl font-bold text-red-600">₹{analysisResult.totalWithdrawal.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border">
                  <p className="text-sm text-muted-foreground">Total Deposit (+ IMPS)</p>
                  <p className="text-2xl font-bold text-green-600">₹{analysisResult.totalDeposit.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border">
                  <p className="text-sm text-muted-foreground">Cash in Hand</p>
                  <p className={`text-2xl font-bold ${analysisResult.cashInHand >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    ₹{analysisResult.cashInHand.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveAnalysis} disabled={isLoading}>
                  Save Analysis
                </Button>
                <Button variant="outline" onClick={() => setAnalysisResult(null)}>
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Analysis Records ({records.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead className="text-right">Total Withdrawal</TableHead>
                    <TableHead className="text-right">Total Deposit</TableHead>
                    <TableHead className="text-right">Cash in Hand</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="max-w-32 truncate">{record.file_name}</TableCell>
                      <TableCell className="text-right text-red-600">₹{record.total_withdrawal.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right text-green-600">₹{record.total_deposit.toLocaleString('en-IN')}</TableCell>
                      <TableCell className={`text-right font-semibold ${record.cash_in_hand >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₹{record.cash_in_hand.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(record)}>
                            <Edit size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => setDeleteConfirm({ isOpen: true, id: record.id })}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No records found. Upload a CSV or Excel file to analyze.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <AlertDialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Record</AlertDialogTitle>
              <AlertDialogDescription>
                Update the withdrawal and deposit amounts. Cash in Hand will be recalculated automatically.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit_withdrawal">Total Withdrawal</Label>
                <Input
                  id="edit_withdrawal"
                  type="number"
                  step="0.01"
                  value={editForm.total_withdrawal}
                  onChange={(e) => setEditForm({ ...editForm, total_withdrawal: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="edit_deposit">Total Deposit</Label>
                <Input
                  id="edit_deposit"
                  type="number"
                  step="0.01"
                  value={editForm.total_deposit}
                  onChange={(e) => setEditForm({ ...editForm, total_deposit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Cash in Hand (Auto-calculated)</Label>
                <Input
                  type="text"
                  value={`₹${(editForm.total_deposit - editForm.total_withdrawal).toLocaleString('en-IN')}`}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdateRecord} disabled={isLoading}>
                Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => setDeleteConfirm({ isOpen: open, id: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this record? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageWrapper>
  );
};

export default Records;
