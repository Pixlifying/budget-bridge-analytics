import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, Trash2, Edit, Search, Download, Save } from 'lucide-react';
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

interface AccountRecord {
  id: string;
  account_number: string;
  account_type: string;
  name: string | null;
  aadhar_number: string | null;
  mobile_number: string | null;
  address: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface ExtractedAccount {
  accountNumber: string;
  type: 'from' | 'to' | 'both';
}

const AccountRecords = () => {
  const [editingRecord, setEditingRecord] = useState<AccountRecord | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    aadhar_number: '',
    mobile_number: '',
    address: '',
    remarks: '',
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: records = [], refetch: refetchRecords } = useQuery({
    queryKey: ['accountRecords'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccountRecord[];
    }
  });

  const extractAccountNumbers = (row: Record<string, string>): { fromAccount: string | null; toAccount: string | null } => {
    let fromAccount: string | null = null;
    let toAccount: string | null = null;

    for (const [key, value] of Object.entries(row)) {
      const keyLower = key.toLowerCase().trim();
      const val = String(value || '').trim();
      
      // Check for FROM ACCOUNT
      if (keyLower.includes('from') && keyLower.includes('account') || keyLower === 'from_account' || keyLower === 'fromaccount') {
        if (val && val.length >= 5 && /^\d+$/.test(val)) {
          fromAccount = val;
        }
      }
      
      // Check for TO ACCOUNT
      if (keyLower.includes('to') && keyLower.includes('account') || keyLower === 'to_account' || keyLower === 'toaccount') {
        if (val && val.length >= 5 && /^\d+$/.test(val)) {
          toAccount = val;
        }
      }
    }

    return { fromAccount, toAccount };
  };

  const parseCSVWithPapaparse = (content: string): ExtractedAccount[] => {
    const accountsMap = new Map<string, 'from' | 'to' | 'both'>();

    const result = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    for (const row of result.data as Record<string, string>[]) {
      const { fromAccount, toAccount } = extractAccountNumbers(row);
      
      if (fromAccount) {
        const existing = accountsMap.get(fromAccount);
        if (existing === 'to') {
          accountsMap.set(fromAccount, 'both');
        } else if (!existing) {
          accountsMap.set(fromAccount, 'from');
        }
      }
      
      if (toAccount) {
        const existing = accountsMap.get(toAccount);
        if (existing === 'from') {
          accountsMap.set(toAccount, 'both');
        } else if (!existing) {
          accountsMap.set(toAccount, 'to');
        }
      }
    }

    return Array.from(accountsMap.entries()).map(([accountNumber, type]) => ({
      accountNumber,
      type,
    }));
  };

  const parseExcelFile = async (file: File): Promise<ExtractedAccount[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
          const accountsMap = new Map<string, 'from' | 'to' | 'both'>();
          
          for (const row of jsonData) {
            const stringRow: Record<string, string> = {};
            for (const [key, value] of Object.entries(row)) {
              stringRow[key] = String(value || '');
            }
            
            const { fromAccount, toAccount } = extractAccountNumbers(stringRow);
            
            if (fromAccount) {
              const existing = accountsMap.get(fromAccount);
              if (existing === 'to') {
                accountsMap.set(fromAccount, 'both');
              } else if (!existing) {
                accountsMap.set(fromAccount, 'from');
              }
            }
            
            if (toAccount) {
              const existing = accountsMap.get(toAccount);
              if (existing === 'from') {
                accountsMap.set(toAccount, 'both');
              } else if (!existing) {
                accountsMap.set(toAccount, 'to');
              }
            }
          }
          
          resolve(Array.from(accountsMap.entries()).map(([accountNumber, type]) => ({
            accountNumber,
            type,
          })));
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
      let extractedAccounts: ExtractedAccount[];
      
      if (isExcel) {
        extractedAccounts = await parseExcelFile(file);
      } else {
        const content = await file.text();
        extractedAccounts = parseCSVWithPapaparse(content);
      }

      if (extractedAccounts.length === 0) {
        toast({
          title: "No Accounts Found",
          description: "Could not find FROM ACCOUNT or TO ACCOUNT columns in the file",
          variant: "destructive",
        });
        return;
      }

      // Get existing account numbers
      const { data: existingAccounts } = await supabase
        .from('account_records')
        .select('account_number, account_type');

      const existingMap = new Map(
        (existingAccounts || []).map(a => [a.account_number, a.account_type])
      );

      // Filter out duplicates and prepare new records
      const newAccounts = extractedAccounts.filter(acc => !existingMap.has(acc.accountNumber));

      if (newAccounts.length === 0) {
        toast({
          title: "No New Accounts",
          description: "All accounts in the file already exist in the database",
        });
        return;
      }

      // Insert new accounts
      const { error } = await supabase
        .from('account_records')
        .insert(newAccounts.map(acc => ({
          account_number: acc.accountNumber,
          account_type: acc.type,
        })));

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Added ${newAccounts.length} new account(s) from file`,
      });
      
      refetchRecords();
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Error",
        description: "Failed to parse file or save accounts",
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

  const handleEdit = (record: AccountRecord) => {
    setEditingRecord(record);
    setEditForm({
      name: record.name || '',
      aadhar_number: record.aadhar_number || '',
      mobile_number: record.mobile_number || '',
      address: record.address || '',
      remarks: record.remarks || '',
    });
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('account_records')
        .update({
          name: editForm.name || null,
          aadhar_number: editForm.aadhar_number || null,
          mobile_number: editForm.mobile_number || null,
          address: editForm.address || null,
          remarks: editForm.remarks || null,
        })
        .eq('id', editingRecord.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Account record updated successfully",
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
        .from('account_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Account record deleted successfully",
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

  const handleDownloadCSV = () => {
    const filteredData = filteredRecords.map(record => ({
      'Account Number': record.account_number,
      'Account Type': record.account_type,
      'Name': record.name || '',
      'Aadhar Number': record.aadhar_number || '',
      'Mobile Number': record.mobile_number || '',
      'Address': record.address || '',
      'Remarks': record.remarks || '',
      'Created At': format(new Date(record.created_at), 'dd/MM/yyyy'),
    }));

    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `account-records-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const filteredRecords = records.filter(record => {
    const query = searchQuery.toLowerCase();
    return (
      record.account_number.toLowerCase().includes(query) ||
      (record.name?.toLowerCase() || '').includes(query) ||
      (record.aadhar_number?.toLowerCase() || '').includes(query) ||
      (record.mobile_number?.toLowerCase() || '').includes(query) ||
      (record.address?.toLowerCase() || '').includes(query)
    );
  });

  return (
    <PageWrapper title="Account Records">
      <div className="space-y-6">
        {/* Upload Section */}
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
                Upload a file with "FROM ACCOUNT" and "TO ACCOUNT" columns. The system will extract unique account numbers 
                and save them automatically. Duplicate accounts will be skipped.
              </p>
              
              <div 
                className={`
                  relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
                  transition-all duration-300
                  ${isDragging 
                    ? 'border-primary bg-primary/20 scale-[1.01]' 
                    : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'
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
                    <p className="text-lg font-medium text-foreground">
                      {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse • Supports CSV, XLSX, XLS
                    </p>
                  </div>
                  
                  {isLoading && (
                    <div className="flex items-center gap-2 text-primary mt-2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Processing file...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <CardTitle>Account Records ({filteredRecords.length})</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" onClick={handleDownloadCSV} disabled={records.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Aadhar No.</TableHead>
                    <TableHead>Mobile No.</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono font-medium">{record.account_number}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          record.account_type === 'from' 
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' 
                            : record.account_type === 'to' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {record.account_type.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{record.name || '-'}</TableCell>
                      <TableCell>{record.aadhar_number || '-'}</TableCell>
                      <TableCell>{record.mobile_number || '-'}</TableCell>
                      <TableCell className="max-w-32 truncate">{record.address || '-'}</TableCell>
                      <TableCell className="max-w-32 truncate">{record.remarks || '-'}</TableCell>
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
                  {filteredRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        {searchQuery ? 'No matching records found' : 'No account records found. Upload a CSV or Excel file to extract accounts.'}
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
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Account Record</AlertDialogTitle>
              <AlertDialogDescription>
                Update the account details for: {editingRecord?.account_number}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit_name">Name</Label>
                <Input
                  id="edit_name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="edit_aadhar">Aadhar Number</Label>
                <Input
                  id="edit_aadhar"
                  value={editForm.aadhar_number}
                  onChange={(e) => setEditForm({ ...editForm, aadhar_number: e.target.value })}
                  placeholder="Enter Aadhar number"
                />
              </div>
              <div>
                <Label htmlFor="edit_mobile">Mobile Number</Label>
                <Input
                  id="edit_mobile"
                  value={editForm.mobile_number}
                  onChange={(e) => setEditForm({ ...editForm, mobile_number: e.target.value })}
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <Label htmlFor="edit_address">Address (Optional)</Label>
                <Input
                  id="edit_address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div>
                <Label htmlFor="edit_remarks">Remarks (Optional)</Label>
                <Input
                  id="edit_remarks"
                  value={editForm.remarks}
                  onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  placeholder="Enter remarks"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleUpdateRecord} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                Update
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => setDeleteConfirm({ isOpen: open, id: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this account record? This action cannot be undone.
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

export default AccountRecords;
