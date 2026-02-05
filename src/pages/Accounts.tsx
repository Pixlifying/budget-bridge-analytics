 import { useState, useEffect, useMemo, useRef } from 'react';
 import { Search, Plus, Edit, Trash2, Download, Printer, Upload, MessageCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from "sonner";
 import PageHeader from '@/components/layout/PageHeader';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
 } from '@/components/ui/dialog';
 import { Label } from '@/components/ui/label';
 import { Card, CardContent } from '@/components/ui/card';
 import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
 import { exportToExcel } from '@/utils/calculateUtils';
 import { escapeHtml } from '@/lib/sanitize';
 import * as XLSX from 'xlsx';
 import Papa from 'papaparse';
 import {
   Pagination,
   PaginationContent,
   PaginationEllipsis,
   PaginationItem,
   PaginationLink,
   PaginationNext,
   PaginationPrevious,
 } from '@/components/ui/pagination';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 
 interface AccountRecord {
   id: string;
   name: string | null;
   account_number: string;
   account_type: string;
   aadhar_number: string | null;
   mobile_number: string | null;
   address: string | null;
   remarks: string | null;
   created_at: string;
   updated_at: string;
 }
 
 const ITEMS_PER_PAGE = 500;
 
 const ACCOUNT_TYPES = [
   'Savings',
   'Current',
   'Fixed Deposit',
   'Recurring Deposit',
   'PPF',
   'NPS',
   'Other'
 ];
 
 const Accounts = () => {
   const [accounts, setAccounts] = useState<AccountRecord[]>([]);
   const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [showDialog, setShowDialog] = useState(false);
   const [editingAccount, setEditingAccount] = useState<AccountRecord | null>(null);
   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [deleteId, setDeleteId] = useState<string | null>(null);
   const [isUploading, setIsUploading] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const [form, setForm] = useState({
     name: '',
     account_number: '',
     account_type: 'Savings',
     aadhar_number: '',
     mobile_number: '',
     address: '',
     remarks: ''
   });
 
   const fetchAccounts = async () => {
     try {
       setLoading(true);
       const { data, error } = await supabase
         .from('account_records')
         .select('*')
         .order('created_at', { ascending: false });
 
       if (error) throw error;
       setAccounts(data || []);
     } catch (error) {
       console.error('Error fetching accounts:', error);
       toast.error("Failed to load accounts");
     } finally {
       setLoading(false);
     }
   };
 
   useEffect(() => {
     fetchAccounts();
   }, []);
 
   const formatAadhar = (value: string) => {
     const numbers = value.replace(/\D/g, '');
     return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
   };
 
   const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const formatted = formatAadhar(e.target.value);
     if (formatted.replace(/\s/g, '').length <= 12) {
       setForm(prev => ({ ...prev, aadhar_number: formatted }));
     }
   };
 
  const extractAccountNumbers = (data: Record<string, any>[]): string[] => {
    const accountSet = new Set<string>();
    
    for (const row of data) {
      for (const value of Object.values(row)) {
        const val = String(value || '').trim();
        // Match account numbers: 9-18 digits (with or without spaces)
        const cleanVal = val.replace(/\s/g, '');
        if (cleanVal && /^\d{9,18}$/.test(cleanVal)) {
          accountSet.add(cleanVal);
        }
      }
    }
    
    return Array.from(accountSet);
  };
 
   const parseCSV = (content: string): Record<string, any>[] => {
     const result = Papa.parse(content, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
     return result.data as Record<string, any>[];
   };
 
   const parseExcel = async (file: File): Promise<Record<string, any>[]> => {
     return new Promise((resolve, reject) => {
       const reader = new FileReader();
       reader.onload = (e) => {
         try {
           const data = e.target?.result;
           const workbook = XLSX.read(data, { type: 'binary' });
           const sheet = workbook.Sheets[workbook.SheetNames[0]];
           const jsonData = XLSX.utils.sheet_to_json(sheet);
           resolve(jsonData);
         } catch (error) { reject(error); }
       };
       reader.onerror = reject;
       reader.readAsBinaryString(file);
     });
   };
 
   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file) return;
 
     const fileName = file.name.toLowerCase();
     const isCSV = fileName.endsWith('.csv');
     const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
 
     if (!isCSV && !isExcel) {
       toast.error("Please upload a CSV or Excel file");
       return;
     }
 
     setIsUploading(true);
     try {
       let data: Record<string, any>[];
       if (isExcel) data = await parseExcel(file);
       else {
         const content = await file.text();
         data = parseCSV(content);
       }
 
       const extractedAccounts = extractAccountNumbers(data);
       
       if (extractedAccounts.length === 0) {
         toast.error("No account numbers found in the file");
        setIsUploading(false);
         return;
       }
 
       const { data: existingDbAccounts, error: fetchError } = await supabase
         .from('account_records')
         .select('account_number');
       
       if (fetchError) throw fetchError;
 
       const existingNumbers = new Set(existingDbAccounts?.map(a => a.account_number) || []);
      const newAccounts = extractedAccounts.filter(acc => !existingNumbers.has(acc));
       
       if (newAccounts.length === 0) {
         toast.info("All accounts already exist in the system");
        setIsUploading(false);
         return;
       }
 
      const insertData = newAccounts.map(acc => ({
        account_number: acc,
         account_type: 'Savings',
         name: null,
         aadhar_number: null,
         mobile_number: null,
         address: null,
         remarks: null,
       }));
 
       const BATCH_SIZE = 500;
       let insertedCount = 0;
       
       for (let i = 0; i < insertData.length; i += BATCH_SIZE) {
         const batch = insertData.slice(i, i + BATCH_SIZE);
         const { error } = await supabase.from('account_records').insert(batch);
         if (error) throw error;
         insertedCount += batch.length;
         
         if (insertData.length > BATCH_SIZE) {
           toast.info(`Uploaded ${insertedCount} of ${insertData.length} accounts...`);
         }
       }
 
       toast.success(`${newAccounts.length} account(s) added successfully`);
       await fetchAccounts();
     } catch (error) {
       console.error('Error processing file:', error);
       toast.error("Failed to process file");
     } finally {
       setIsUploading(false);
       if (fileInputRef.current) fileInputRef.current.value = '';
     }
   };
 
   const handleAddAccount = async () => {
     try {
       const cleanAadhar = form.aadhar_number.replace(/\s/g, '');
       
       const { data: existingAccount } = await supabase
         .from('account_records')
         .select('id')
         .eq('account_number', form.account_number)
         .single();
 
       if (existingAccount) {
         toast.error("An account with this account number already exists");
         return;
       }
 
       const { error } = await supabase
         .from('account_records')
         .insert({
           name: form.name || null,
           account_number: form.account_number,
           account_type: form.account_type,
           aadhar_number: cleanAadhar || null,
           mobile_number: form.mobile_number || null,
           address: form.address || null,
           remarks: form.remarks || null,
         });
 
       if (error) throw error;
       
       toast.success("Account added successfully");
       await fetchAccounts();
       setShowDialog(false);
       resetForm();
     } catch (error) {
       console.error('Error adding account:', error);
       toast.error("Failed to add account");
     }
   };
 
   const handleEditAccount = async () => {
     if (!editingAccount) return;
 
     try {
       const cleanAadhar = form.aadhar_number.replace(/\s/g, '');
       
       const { data: existingAccount } = await supabase
         .from('account_records')
         .select('id')
         .eq('account_number', form.account_number)
         .neq('id', editingAccount.id)
         .single();
 
       if (existingAccount) {
         toast.error("An account with this account number already exists");
         return;
       }
 
       const { error } = await supabase
         .from('account_records')
         .update({
           name: form.name || null,
           account_number: form.account_number,
           account_type: form.account_type,
           aadhar_number: cleanAadhar || null,
           mobile_number: form.mobile_number || null,
           address: form.address || null,
           remarks: form.remarks || null,
         })
         .eq('id', editingAccount.id);
 
       if (error) throw error;
       
       toast.success("Account updated successfully");
       await fetchAccounts();
       setShowDialog(false);
       setEditingAccount(null);
       resetForm();
     } catch (error) {
       console.error('Error updating account:', error);
       toast.error("Failed to update account");
     }
   };
 
   const handleDeleteAccount = async () => {
     if (!deleteId) return;
 
     try {
       const { error } = await supabase
         .from('account_records')
         .delete()
         .eq('id', deleteId);
 
       if (error) throw error;
       
       toast.success("Account deleted successfully");
       await fetchAccounts();
       setShowDeleteConfirm(false);
       setDeleteId(null);
     } catch (error) {
       console.error('Error deleting account:', error);
       toast.error("Failed to delete account");
     }
   };
 
   const resetForm = () => {
     setForm({ name: '', account_number: '', account_type: 'Savings', aadhar_number: '', mobile_number: '', address: '', remarks: '' });
   };
 
   const openEdit = (account: AccountRecord) => {
     setEditingAccount(account);
     setForm({
       name: account.name || '',
       account_number: account.account_number,
       account_type: account.account_type,
       aadhar_number: account.aadhar_number ? formatAadhar(account.aadhar_number) : '',
       mobile_number: account.mobile_number || '',
       address: account.address || '',
       remarks: account.remarks || ''
     });
     setShowDialog(true);
   };
 
   const initiateDelete = (id: string) => {
     setDeleteId(id);
     setShowDeleteConfirm(true);
   };
 
   const handleDownloadCSV = () => {
     const csvData = filteredAccounts.map((account, index) => ({
       'S.No': index + 1,
       'Name': account.name || '',
       'Account Number': account.account_number,
       'Account Type': account.account_type,
       'Aadhar Number': account.aadhar_number ? formatAadhar(account.aadhar_number) : '',
       'Address': account.address || '',
       'Mobile Number': account.mobile_number || '',
       'Remarks': account.remarks || '',
     }));
     
     exportToExcel(csvData, 'accounts');
     toast.success("Accounts exported successfully");
   };
 
   const handlePrint = () => {
     const printWindow = window.open('', '_blank');
     if (!printWindow) return;
 
     const printContent = `
       <!DOCTYPE html>
       <html>
         <head>
           <title>Accounts</title>
           <style>
             @page { size: A4 landscape; margin: 15mm; }
             body { font-family: Arial, sans-serif; font-size: 11px; }
             h1 { text-align: center; margin-bottom: 20px; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #000; padding: 6px; text-align: left; }
             th { background-color: #f5f5f5; font-weight: bold; }
             tr:nth-child(even) { background-color: #f9f9f9; }
           </style>
         </head>
         <body>
           <h1>Accounts</h1>
           <table>
             <thead>
               <tr>
                 <th>S.No</th>
                 <th>Name</th>
                 <th>Account Number</th>
                 <th>Account Type</th>
                 <th>Aadhar Number</th>
                 <th>Address</th>
                 <th>Mobile Number</th>
                 <th>Remarks</th>
               </tr>
             </thead>
             <tbody>
               ${filteredAccounts.map((account, index) => `
                 <tr>
                   <td>${index + 1}</td>
                   <td>${escapeHtml(account.name || '-')}</td>
                   <td>${escapeHtml(account.account_number)}</td>
                   <td>${escapeHtml(account.account_type)}</td>
                   <td>${escapeHtml(account.aadhar_number ? formatAadhar(account.aadhar_number) : '-')}</td>
                   <td>${escapeHtml(account.address || '-')}</td>
                   <td>${escapeHtml(account.mobile_number || '-')}</td>
                   <td>${escapeHtml(account.remarks || '-')}</td>
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
 
   const filteredAccounts = useMemo(() => {
     return accounts.filter(account =>
       (account.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
       account.account_number.includes(searchTerm) ||
       (account.aadhar_number || '').includes(searchTerm.replace(/\s/g, '')) ||
       (account.mobile_number || '').includes(searchTerm) ||
       account.account_type.toLowerCase().includes(searchTerm.toLowerCase())
     );
   }, [accounts, searchTerm]);
 
   useEffect(() => {
     setCurrentPage(1);
   }, [searchTerm]);
 
   const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
   const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
   const endIndex = startIndex + ITEMS_PER_PAGE;
   const paginatedData = filteredAccounts.slice(startIndex, endIndex);
 
   const getPageNumbers = () => {
     const pages: (number | 'ellipsis')[] = [];
     const maxVisiblePages = 5;
     
     if (totalPages <= maxVisiblePages) {
       for (let i = 1; i <= totalPages; i++) pages.push(i);
     } else {
       if (currentPage <= 3) {
         for (let i = 1; i <= 4; i++) pages.push(i);
         pages.push('ellipsis');
         pages.push(totalPages);
       } else if (currentPage >= totalPages - 2) {
         pages.push(1);
         pages.push('ellipsis');
         for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
       } else {
         pages.push(1);
         pages.push('ellipsis');
         for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
         pages.push('ellipsis');
         pages.push(totalPages);
       }
     }
     return pages;
   };
 
   return (
     <div className="min-h-screen bg-background">
       <PageHeader
         title="Accounts"
         searchValue={searchTerm}
         onSearchChange={setSearchTerm}
         searchPlaceholder="Search by name, account number, aadhar, type, or mobile..."
       >
         <Dialog open={showDialog} onOpenChange={setShowDialog}>
           <DialogTrigger asChild>
             <Button onClick={() => { resetForm(); setEditingAccount(null); }}>
               <Plus size={16} className="mr-2" />
               Add Account
             </Button>
           </DialogTrigger>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle>{editingAccount ? 'Edit Account' : 'Add New Account'}</DialogTitle>
             </DialogHeader>
             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="name">Name</Label>
                 <Input id="name" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Customer name" />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="account_number">Account Number *</Label>
                 <Input id="account_number" value={form.account_number} onChange={(e) => setForm(prev => ({ ...prev, account_number: e.target.value }))} placeholder="Account number" required />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="account_type">Account Type *</Label>
                 <Select value={form.account_type} onValueChange={(value) => setForm(prev => ({ ...prev, account_type: value }))}>
                   <SelectTrigger>
                     <SelectValue placeholder="Select account type" />
                   </SelectTrigger>
                   <SelectContent>
                     {ACCOUNT_TYPES.map(type => (
                       <SelectItem key={type} value={type}>{type}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="aadhar_number">Aadhar Number</Label>
                 <Input id="aadhar_number" value={form.aadhar_number} onChange={handleAadharChange} placeholder="1234 5678 9012" maxLength={14} />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="address">Address</Label>
                 <Input id="address" value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Address (optional)" />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="mobile_number">Mobile Number</Label>
                 <Input id="mobile_number" value={form.mobile_number} onChange={(e) => setForm(prev => ({ ...prev, mobile_number: e.target.value }))} placeholder="Mobile number (optional)" />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="remarks">Remarks</Label>
                 <Input id="remarks" value={form.remarks} onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))} placeholder="Remarks (optional)" />
               </div>
               <Button onClick={editingAccount ? handleEditAccount : handleAddAccount} disabled={!form.account_number || !form.account_type}>
                 {editingAccount ? 'Update Account' : 'Save Account'}
               </Button>
             </div>
           </DialogContent>
         </Dialog>
 
         <Button variant="outline" onClick={handlePrint}>
           <Printer size={16} className="mr-2" />
           Print
         </Button>
 
         <Button variant="outline" onClick={handleDownloadCSV}>
           <Download size={16} className="mr-2" />
           Download CSV
         </Button>
       </PageHeader>
 
       <div className="flex-1 p-6 space-y-4">
         <Card className="border-primary/20">
           <CardContent className="py-4">
             <div className="flex items-center gap-4">
               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".csv,.xlsx,.xls"
                 onChange={handleFileUpload}
                 className="hidden"
                 disabled={isUploading}
               />
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => fileInputRef.current?.click()}
                 disabled={isUploading}
                 className="gap-2"
               >
                 <Upload className="h-4 w-4" />
                 Browse CSV/Excel
               </Button>
               <span className="text-sm text-muted-foreground">
                 Upload CSV or Excel file to extract account numbers (duplicates will be skipped, supports up to 5000 accounts)
               </span>
               {isUploading && (
                 <div className="flex items-center gap-2 text-primary">
                   <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                   <span className="text-sm">Processing...</span>
                 </div>
               )}
             </div>
           </CardContent>
         </Card>
 
         <div className="flex items-center justify-between">
           <div className="text-sm text-muted-foreground">
             Showing {startIndex + 1} - {Math.min(endIndex, filteredAccounts.length)} of {filteredAccounts.length} entries
             {searchTerm && ` (filtered from ${accounts.length} total)`}
           </div>
           <div className="flex items-center gap-2">
             <span className="text-sm text-muted-foreground">Go to page:</span>
             <Select value={currentPage.toString()} onValueChange={(val) => setCurrentPage(Number(val))}>
               <SelectTrigger className="w-20">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                   <SelectItem key={page} value={page.toString()}>
                     {page}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
           </div>
         </div>
 
         <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead className="w-16">S.No</TableHead>
                 <TableHead>Name</TableHead>
                 <TableHead>Account Number</TableHead>
                 <TableHead>Account Type</TableHead>
                 <TableHead>Aadhar Number</TableHead>
                 <TableHead>Address</TableHead>
                 <TableHead>Mobile Number</TableHead>
                 <TableHead>Remarks</TableHead>
                 <TableHead className="w-24">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading ? (
                 <TableRow>
                   <TableCell colSpan={9} className="text-center py-8">
                     Loading accounts...
                   </TableCell>
                 </TableRow>
               ) : paginatedData.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                     No accounts found
                   </TableCell>
                 </TableRow>
               ) : (
                 paginatedData.map((account, index) => (
                   <TableRow key={account.id}>
                     <TableCell>{startIndex + index + 1}</TableCell>
                     <TableCell className="font-medium">{account.name || '-'}</TableCell>
                     <TableCell>{account.account_number}</TableCell>
                     <TableCell>{account.account_type}</TableCell>
                     <TableCell>{account.aadhar_number ? formatAadhar(account.aadhar_number) : '-'}</TableCell>
                     <TableCell>{account.address || '-'}</TableCell>
                     <TableCell>{account.mobile_number || '-'}</TableCell>
                     <TableCell>{account.remarks || '-'}</TableCell>
                     <TableCell>
                       <div className="flex gap-1">
                         {account.mobile_number && (
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => window.open(`https://wa.me/91${account.mobile_number?.replace(/\D/g, '')}`, '_blank')}
                             className="text-primary hover:text-primary/80 hover:bg-primary/10"
                             title="Open WhatsApp"
                           >
                             <MessageCircle size={14} />
                           </Button>
                         )}
                         <Button variant="ghost" size="sm" onClick={() => openEdit(account)}>
                           <Edit size={14} />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => initiateDelete(account.id)}>
                           <Trash2 size={14} />
                         </Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
         </div>
 
         {totalPages > 1 && (
           <div className="flex items-center justify-center">
             <Pagination>
               <PaginationContent>
                 <PaginationItem>
                   <PaginationPrevious 
                     onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                     className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                   />
                 </PaginationItem>
                 
                 {getPageNumbers().map((page, idx) => (
                   <PaginationItem key={idx}>
                     {page === 'ellipsis' ? (
                       <PaginationEllipsis />
                     ) : (
                       <PaginationLink
                         onClick={() => setCurrentPage(page)}
                         isActive={currentPage === page}
                         className="cursor-pointer"
                       >
                         {page}
                       </PaginationLink>
                     )}
                   </PaginationItem>
                 ))}
                 
                 <PaginationItem>
                   <PaginationNext 
                     onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                     className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                   />
                 </PaginationItem>
               </PaginationContent>
             </Pagination>
           </div>
         )}
       </div>
 
       <DeleteConfirmation
         isOpen={showDeleteConfirm}
         onClose={() => { setShowDeleteConfirm(false); setDeleteId(null); }}
         onConfirm={handleDeleteAccount}
         title="Delete Account"
         description="Are you sure you want to delete this account? This action cannot be undone."
       />
     </div>
   );
 };
 
 export default Accounts;