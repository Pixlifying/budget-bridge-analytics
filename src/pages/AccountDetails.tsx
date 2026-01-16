import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Download, Printer, Upload, Save, X, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
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

interface AccountDetail {
  id: string;
  name: string;
  account_number: string;
  aadhar_number: string;
  mobile_number?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

const AccountDetails = () => {
  const [accountDetails, setAccountDetails] = useState<AccountDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountDetail | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedAccounts, setExtractedAccounts] = useState<{ accountNumber: string; type: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    account_number: '',
    aadhar_number: '',
    mobile_number: '',
    address: ''
  });

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('account_details')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccountDetails(data || []);
    } catch (error) {
      console.error('Error fetching account details:', error);
      toast.error("Failed to load account details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
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

  // Extract account numbers from CSV/Excel
  const extractAccountNumbers = (data: Record<string, any>[]): { accountNumber: string; type: string }[] => {
    const accountSet = new Map<string, string>();
    
    for (const row of data) {
      // Look for FROM ACCOUNT
      for (const [key, value] of Object.entries(row)) {
        const keyLower = key.toLowerCase();
        const val = String(value || '').trim();
        
        if (val && /^\d{9,18}$/.test(val.replace(/\s/g, ''))) {
          const cleanAccount = val.replace(/\s/g, '');
          if (keyLower.includes('from') || keyLower.includes('source') || keyLower.includes('debit')) {
            if (!accountSet.has(cleanAccount)) accountSet.set(cleanAccount, 'from');
            else if (accountSet.get(cleanAccount) === 'to') accountSet.set(cleanAccount, 'both');
          } else if (keyLower.includes('to') || keyLower.includes('dest') || keyLower.includes('credit') || keyLower.includes('beneficiary')) {
            if (!accountSet.has(cleanAccount)) accountSet.set(cleanAccount, 'to');
            else if (accountSet.get(cleanAccount) === 'from') accountSet.set(cleanAccount, 'both');
          } else if (keyLower.includes('account')) {
            if (!accountSet.has(cleanAccount)) accountSet.set(cleanAccount, 'unknown');
          }
        }
      }
    }
    
    return Array.from(accountSet.entries()).map(([accountNumber, type]) => ({ accountNumber, type }));
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

      const accounts = extractAccountNumbers(data);
      
      if (accounts.length === 0) {
        toast.error("No account numbers found in the file");
        return;
      }

      // Filter out existing accounts
      const existingNumbers = new Set(accountDetails.map(a => a.account_number));
      const newAccounts = accounts.filter(a => !existingNumbers.has(a.accountNumber));
      
      if (newAccounts.length === 0) {
        toast.info("All accounts already exist in the system");
        return;
      }

      // Save new accounts
      const insertData = newAccounts.map(a => ({
        account_number: a.accountNumber,
        name: '',
        aadhar_number: '',
        mobile_number: null,
        address: null,
      }));

      const { error } = await supabase.from('account_details').insert(insertData);
      if (error) throw error;

      toast.success(`${newAccounts.length} account(s) added successfully`);
      await fetchAccountDetails();
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
        .from('account_details')
        .select('id')
        .eq('account_number', form.account_number)
        .single();

      if (existingAccount) {
        toast.error("An account with this account number already exists");
        return;
      }

      const { error } = await supabase
        .from('account_details')
        .insert({
          name: form.name,
          account_number: form.account_number,
          aadhar_number: cleanAadhar,
          mobile_number: form.mobile_number || null,
          address: form.address || null,
        });

      if (error) throw error;
      
      toast.success("Account details added successfully");
      await fetchAccountDetails();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error adding account details:', error);
      toast.error("Failed to add account details");
    }
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;

    try {
      const cleanAadhar = form.aadhar_number.replace(/\s/g, '');
      
      const { data: existingAccount } = await supabase
        .from('account_details')
        .select('id')
        .eq('account_number', form.account_number)
        .neq('id', editingAccount.id)
        .single();

      if (existingAccount) {
        toast.error("An account with this account number already exists");
        return;
      }

      const { error } = await supabase
        .from('account_details')
        .update({
          name: form.name,
          account_number: form.account_number,
          aadhar_number: cleanAadhar,
          mobile_number: form.mobile_number || null,
          address: form.address || null,
        })
        .eq('id', editingAccount.id);

      if (error) throw error;
      
      toast.success("Account details updated successfully");
      await fetchAccountDetails();
      setShowDialog(false);
      setEditingAccount(null);
      resetForm();
    } catch (error) {
      console.error('Error updating account details:', error);
      toast.error("Failed to update account details");
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('account_details')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      
      toast.success("Account details deleted successfully");
      await fetchAccountDetails();
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting account details:', error);
      toast.error("Failed to delete account details");
    }
  };

  const resetForm = () => {
    setForm({ name: '', account_number: '', aadhar_number: '', mobile_number: '', address: '' });
  };

  const openEdit = (account: AccountDetail) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      account_number: account.account_number,
      aadhar_number: formatAadhar(account.aadhar_number),
      mobile_number: account.mobile_number || '',
      address: account.address || ''
    });
    setShowDialog(true);
  };

  const initiateDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDownloadCSV = () => {
    const csvData = filteredAccountDetails.map((account, index) => ({
      'S.No': index + 1,
      'Name': account.name,
      'Account Number': account.account_number,
      'Aadhar Number': formatAadhar(account.aadhar_number),
      'Address': account.address || '',
      'Mobile Number': account.mobile_number || '',
    }));
    
    exportToExcel(csvData, 'account-details');
    toast.success("Account details exported successfully");
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Account Details</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Account Details</h1>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Account Number</th>
                <th>Aadhar Number</th>
                <th>Address</th>
                <th>Mobile Number</th>
              </tr>
            </thead>
            <tbody>
              ${filteredAccountDetails.map((account, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${escapeHtml(account.name)}</td>
                  <td>${escapeHtml(account.account_number)}</td>
                  <td>${escapeHtml(formatAadhar(account.aadhar_number))}</td>
                  <td>${escapeHtml(account.address || '-')}</td>
                  <td>${escapeHtml(account.mobile_number || '-')}</td>
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

  const filteredAccountDetails = useMemo(() => {
    return accountDetails.filter(account =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_number.includes(searchTerm) ||
      account.aadhar_number.includes(searchTerm.replace(/\s/g, '')) ||
      (account.mobile_number && account.mobile_number.includes(searchTerm))
    );
  }, [accountDetails, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Account Details"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name, account number, aadhar, or mobile..."
      >
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingAccount(null); }}>
              <Plus size={16} className="mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Edit Account Details' : 'Add New Account Details'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Customer name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_number">Account Number *</Label>
                <Input id="account_number" value={form.account_number} onChange={(e) => setForm(prev => ({ ...prev, account_number: e.target.value }))} placeholder="Account number" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="aadhar_number">Aadhar Number *</Label>
                <Input id="aadhar_number" value={form.aadhar_number} onChange={handleAadharChange} placeholder="1234 5678 9012" maxLength={14} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Address (optional)" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input id="mobile_number" value={form.mobile_number} onChange={(e) => setForm(prev => ({ ...prev, mobile_number: e.target.value }))} placeholder="Mobile number (optional)" />
              </div>
              <Button onClick={editingAccount ? handleEditAccount : handleAddAccount} disabled={!form.name || !form.account_number || !form.aadhar_number}>
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
        {/* Compact Upload Section */}
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
                Upload CSV or Excel file to extract account numbers (duplicates will be skipped)
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

        <div className="bg-card rounded-lg shadow-sm border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">S.No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Aadhar Number</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading account details...
                  </TableCell>
                </TableRow>
              ) : filteredAccountDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No account details found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccountDetails.map((account, index) => (
                  <TableRow key={account.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{account.name || '-'}</TableCell>
                    <TableCell>{account.account_number}</TableCell>
                    <TableCell>{account.aadhar_number ? formatAadhar(account.aadhar_number) : '-'}</TableCell>
                    <TableCell>{account.address || '-'}</TableCell>
                    <TableCell>{account.mobile_number || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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

export default AccountDetails;
