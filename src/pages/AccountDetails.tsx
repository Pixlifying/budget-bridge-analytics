
import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Edit, Trash2, Download } from 'lucide-react';
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
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { exportToExcel } from '@/utils/calculateUtils';

interface AccountDetail {
  id: string;
  name: string;
  account_number: string;
  aadhar_number: string;
  mobile_number?: string;
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

  // Form state
  const [form, setForm] = useState({
    name: '',
    account_number: '',
    aadhar_number: '',
    mobile_number: ''
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
    // Remove all non-digits
    const numbers = value.replace(/\D/g, '');
    // Add space after every 4 digits
    return numbers.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAadhar(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 12) {
      setForm(prev => ({ ...prev, aadhar_number: formatted }));
    }
  };

  const handleAddAccount = async () => {
    try {
      const cleanAadhar = form.aadhar_number.replace(/\s/g, '');
      
      // Check for duplicates before inserting
      const { data: existingAadhar } = await supabase
        .from('account_details')
        .select('id')
        .eq('aadhar_number', cleanAadhar)
        .single();

      if (existingAadhar) {
        toast.error("An account with this Aadhar number already exists");
        return;
      }

      const { data: existingAccount } = await supabase
        .from('account_details')
        .select('id')
        .eq('account_number', form.account_number)
        .single();

      if (existingAccount) {
        toast.error("An account with this account number already exists");
        return;
      }

      const { data, error } = await supabase
        .from('account_details')
        .insert({
          name: form.name,
          account_number: form.account_number,
          aadhar_number: cleanAadhar,
          mobile_number: form.mobile_number || null,
        })
        .select();

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('unique_aadhar_number')) {
            toast.error("An account with this Aadhar number already exists");
          } else if (error.message.includes('unique_account_number')) {
            toast.error("An account with this account number already exists");
          } else {
            toast.error("This data already exists in the system");
          }
        } else {
          throw error;
        }
        return;
      }
      
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
      
      // Check for duplicates before updating (excluding current record)
      const { data: existingAadhar } = await supabase
        .from('account_details')
        .select('id')
        .eq('aadhar_number', cleanAadhar)
        .neq('id', editingAccount.id)
        .single();

      if (existingAadhar) {
        toast.error("An account with this Aadhar number already exists");
        return;
      }

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
        })
        .eq('id', editingAccount.id);

      if (error) {
        if (error.code === '23505') {
          if (error.message.includes('unique_aadhar_number')) {
            toast.error("An account with this Aadhar number already exists");
          } else if (error.message.includes('unique_account_number')) {
            toast.error("An account with this account number already exists");
          } else {
            toast.error("This data already exists in the system");
          }
        } else {
          throw error;
        }
        return;
      }
      
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
    setForm({
      name: '',
      account_number: '',
      aadhar_number: '',
      mobile_number: ''
    });
  };

  const openEdit = (account: AccountDetail) => {
    setEditingAccount(account);
    setForm({
      name: account.name,
      account_number: account.account_number,
      aadhar_number: formatAadhar(account.aadhar_number),
      mobile_number: account.mobile_number || ''
    });
    setShowDialog(true);
  };

  const initiateDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleDownloadCSV = () => {
    const csvData = filteredAccountDetails.map(account => ({
      'Name': account.name,
      'Account Number': account.account_number,
      'Aadhar Number': formatAadhar(account.aadhar_number),
      'Mobile Number': account.mobile_number || '',
      'Created Date': format(new Date(account.created_at), 'dd/MM/yyyy')
    }));
    
    exportToExcel(csvData, 'account-details');
    toast.success("Account details exported successfully");
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
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
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  value={form.account_number}
                  onChange={(e) => setForm(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="Account number"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="aadhar_number">Aadhar Number *</Label>
                <Input
                  id="aadhar_number"
                  value={form.aadhar_number}
                  onChange={handleAadharChange}
                  placeholder="1234 5678 9012"
                  maxLength={14}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile_number">Mobile Number</Label>
                <Input
                  id="mobile_number"
                  value={form.mobile_number}
                  onChange={(e) => setForm(prev => ({ ...prev, mobile_number: e.target.value }))}
                  placeholder="Mobile number (optional)"
                />
              </div>
              <Button 
                onClick={editingAccount ? handleEditAccount : handleAddAccount}
                disabled={!form.name || !form.account_number || !form.aadhar_number}
              >
                {editingAccount ? 'Update Account' : 'Save Account'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" onClick={handleDownloadCSV}>
          <Download size={16} className="mr-2" />
          Download CSV
        </Button>
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Aadhar Number</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading account details...
                  </TableCell>
                </TableRow>
              ) : filteredAccountDetails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No account details found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccountDetails.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.account_number}</TableCell>
                    <TableCell>{formatAadhar(account.aadhar_number)}</TableCell>
                    <TableCell>{account.mobile_number || '-'}</TableCell>
                    <TableCell>{format(new Date(account.created_at), 'dd/MM/yyyy')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(account)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => initiateDelete(account.id)}
                        >
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
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteId(null);
        }}
        onConfirm={handleDeleteAccount}
        title="Delete Account Details?"
        description="Are you sure you want to delete this account details? This action cannot be undone."
      />
    </div>
  );
};

export default AccountDetails;
