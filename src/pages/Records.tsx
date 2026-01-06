import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Edit, Download, Calculator } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const parseCSV = (content: string): { type: string; amount: number }[] => {
    const lines = content.split('\n');
    const transactions: { type: string; amount: number }[] = [];
    
    // Skip header row if it exists
    const startIndex = lines[0]?.toLowerCase().includes('type') || lines[0]?.toLowerCase().includes('amount') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Try different CSV formats
      const cells = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
      
      // Look for type and amount in the cells
      for (let j = 0; j < cells.length; j++) {
        const cellLower = cells[j].toLowerCase();
        
        // Check if this cell contains transaction type
        if (cellLower.includes('withdrawal') || cellLower.includes('withdraw') || cellLower === 'w') {
          // Find amount in adjacent cells or same cell
          const amountCell = cells.find((c, idx) => idx !== j && !isNaN(parseFloat(c.replace(/[₹,]/g, ''))));
          if (amountCell) {
            transactions.push({ type: 'withdrawal', amount: Math.abs(parseFloat(amountCell.replace(/[₹,]/g, ''))) });
          }
        } else if (cellLower.includes('deposit') || cellLower.includes('imps') || cellLower === 'd' || cellLower === 'cr') {
          const amountCell = cells.find((c, idx) => idx !== j && !isNaN(parseFloat(c.replace(/[₹,]/g, ''))));
          if (amountCell) {
            transactions.push({ type: 'deposit', amount: Math.abs(parseFloat(amountCell.replace(/[₹,]/g, ''))) });
          }
        }
      }
      
      // Alternative: Check for credit/debit columns with amounts
      if (cells.length >= 2) {
        // Check if the line has a transaction type column and amount column
        const typeCell = cells.find(c => 
          c.toLowerCase().includes('withdrawal') || 
          c.toLowerCase().includes('deposit') || 
          c.toLowerCase().includes('imps') ||
          c.toLowerCase().includes('cr') ||
          c.toLowerCase().includes('dr')
        );
        
        if (!typeCell && cells.length >= 3) {
          // Try format: Description, Debit, Credit
          const debitAmount = parseFloat(cells[cells.length - 2]?.replace(/[₹,]/g, '') || '0');
          const creditAmount = parseFloat(cells[cells.length - 1]?.replace(/[₹,]/g, '') || '0');
          
          if (!isNaN(debitAmount) && debitAmount > 0) {
            transactions.push({ type: 'withdrawal', amount: debitAmount });
          }
          if (!isNaN(creditAmount) && creditAmount > 0) {
            transactions.push({ type: 'deposit', amount: creditAmount });
          }
        }
      }
    }
    
    return transactions;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const content = await file.text();
      const transactions = parseCSV(content);
      
      if (transactions.length === 0) {
        // If our parsing didn't work, try a simpler approach
        const lines = content.split('\n');
        let totalWithdrawal = 0;
        let totalDeposit = 0;
        
        for (const line of lines) {
          const cells = line.split(',').map(c => c.trim().replace(/"/g, '').toLowerCase());
          
          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const amount = parseFloat(cells[i]?.replace(/[₹,]/g, '') || '0');
            
            if (!isNaN(amount) && amount !== 0) {
              // Check previous cells for type indicators
              const prevCells = cells.slice(0, i).join(' ');
              if (prevCells.includes('withdraw') || prevCells.includes('dr') || prevCells.includes('debit')) {
                totalWithdrawal += Math.abs(amount);
              } else if (prevCells.includes('deposit') || prevCells.includes('imps') || prevCells.includes('cr') || prevCells.includes('credit')) {
                totalDeposit += Math.abs(amount);
              }
            }
          }
        }
        
        const cashInHand = totalDeposit - totalWithdrawal;
        
        setAnalysisResult({
          totalWithdrawal,
          totalDeposit,
          cashInHand,
          fileName: file.name,
        });
      } else {
        const totalWithdrawal = transactions
          .filter(t => t.type === 'withdrawal')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const totalDeposit = transactions
          .filter(t => t.type === 'deposit')
          .reduce((sum, t) => sum + t.amount, 0);
          
        const cashInHand = totalDeposit - totalWithdrawal;
        
        setAnalysisResult({
          totalWithdrawal,
          totalDeposit,
          cashInHand,
          fileName: file.name,
        });
      }
      
      toast({
        title: "CSV Analyzed",
        description: "File has been analyzed successfully. Review the results below.",
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Error",
        description: "Failed to parse CSV file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
    <PageWrapper title="Records - CSV Analysis">
      <div className="space-y-6">
        {/* Upload Section */}
        <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file to analyze. The system will sum all Withdrawal types, sum all Deposit and IMPS types,
                and calculate Cash in Hand (Deposit - Withdrawal). If withdrawal is greater, the result will be negative.
              </p>
              
              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="max-w-xs"
                  disabled={isLoading}
                />
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Browse
                </Button>
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
                        No records found. Upload a CSV file to analyze.
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
