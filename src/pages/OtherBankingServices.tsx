import { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit, Trash2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate, filterByDate, filterByMonth, calculateBankingServicesMargin } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import ServiceCard from '@/components/ui/ServiceCard';
import StatCard from '@/components/ui/StatCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface OtherBankingService {
  id: string;
  date: Date;
  amount: number;
  margin: number;
  transaction_count: number;
  account_type?: string;
  insurance_type?: string;
  created_at?: string;
}

const OtherBankingServices = () => {
  const [otherBankingServices, setOtherBankingServices] = useState<OtherBankingService[]>([]);
  const [filteredServices, setFilteredServices] = useState<OtherBankingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<OtherBankingService | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    transaction_count: 1,
    account_type: '',
    insurance_type: '',
  });

  const [editForm, setEditForm] = useState({
    date: '',
    amount: 0,
    transaction_count: 1,
    account_type: '',
    insurance_type: '',
  });

  const accountTypes = ['Saving A/C', 'FD/RD'];
  const insuranceTypes = ['PMJJY', 'PMSBY'];
  const showInsuranceField = newEntry.account_type === 'Saving A/C' || newEntry.account_type === 'FD/RD';
  const showEditInsuranceField = editForm.account_type === 'Saving A/C' || editForm.account_type === 'FD/RD';

  const fetchOtherBankingServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('banking_accounts')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        amount: Number(entry.amount),
        margin: calculateBankingServicesMargin(Number(entry.amount)),
        transaction_count: 1, // Default since banking_accounts doesn't have this field
        account_type: entry.account_type,
        insurance_type: entry.insurance_type,
        created_at: entry.created_at
      }));

      setOtherBankingServices(formattedData);
    } catch (error) {
      console.error('Error fetching other banking services:', error);
      toast.error('Failed to load other banking services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOtherBankingServices();
  }, []);

  useEffect(() => {
    if (viewMode === 'day') {
      setFilteredServices(filterByDate(otherBankingServices, date));
    } else {
      setFilteredServices(filterByMonth(otherBankingServices, date));
    }
  }, [date, viewMode, otherBankingServices]);

  const handleAddEntry = async () => {
    if (!newEntry.amount || !newEntry.transaction_count || !newEntry.account_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (showInsuranceField && !newEntry.insurance_type) {
      toast.error('Please select an insurance type');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('banking_accounts')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          amount: newEntry.amount,
          account_type: newEntry.account_type,
          insurance_type: showInsuranceField ? newEntry.insurance_type : null,
          customer_name: 'N/A', // Required field in banking_accounts
        })
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        const newService: OtherBankingService = {
          id: data[0].id,
          date: new Date(data[0].date),
          amount: Number(data[0].amount),
          margin: calculateBankingServicesMargin(Number(data[0].amount)),
          transaction_count: newEntry.transaction_count,
          account_type: data[0].account_type,
          insurance_type: data[0].insurance_type,
          created_at: data[0].created_at
        };

        setOtherBankingServices(prev => [newService, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          transaction_count: 1,
          account_type: '',
          insurance_type: '',
        });
        toast.success('Other banking service added successfully');
      }
    } catch (error) {
      console.error('Error adding other banking service:', error);
      toast.error('Failed to add other banking service');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    if (!editForm.account_type) {
      toast.error('Please select an account type');
      return;
    }

    if (showEditInsuranceField && !editForm.insurance_type) {
      toast.error('Please select an insurance type');
      return;
    }

    try {
      const { error } = await supabase
        .from('banking_accounts')
        .update({
          date: new Date(editForm.date).toISOString(),
          amount: editForm.amount,
          account_type: editForm.account_type,
          insurance_type: showEditInsuranceField ? editForm.insurance_type : null,
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      const updatedEntry: OtherBankingService = {
        ...editingEntry,
        date: new Date(editForm.date),
        amount: editForm.amount,
        margin: calculateBankingServicesMargin(editForm.amount),
        transaction_count: editForm.transaction_count,
        account_type: editForm.account_type,
        insurance_type: showEditInsuranceField ? editForm.insurance_type : undefined,
      };

      setOtherBankingServices(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      toast.success('Other banking service updated successfully');
    } catch (error) {
      console.error('Error updating other banking service:', error);
      toast.error('Failed to update other banking service');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('banking_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOtherBankingServices(prev => prev.filter(entry => entry.id !== id));
      toast.success('Other banking service deleted successfully');
    } catch (error) {
      console.error('Error deleting other banking service:', error);
      toast.error('Failed to delete other banking service');
    }
  };

  const openEditEntry = (entry: OtherBankingService) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      amount: entry.amount,
      transaction_count: entry.transaction_count,
      account_type: entry.account_type || '',
      insurance_type: entry.insurance_type || '',
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Other Banking Services Report</title>
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
          <h1>Other Banking Services Report</h1>
          <div class="total">Total Services: ${totalServices} | Total Amount: ₹${totalAmount.toFixed(2)} | Total Margin: ₹${totalMargin.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Account Type</th>
                <th>Insurance Type</th>
                <th>Transaction Count</th>
                <th>Amount</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredServices.map((service) => `
                <tr>
                  <td>${format(service.date, 'dd/MM/yyyy')}</td>
                  <td>${service.account_type || '-'}</td>
                  <td>${service.insurance_type || '-'}</td>
                  <td>${service.transaction_count}</td>
                  <td>₹${service.amount.toFixed(2)}</td>
                  <td>₹${service.margin.toFixed(2)}</td>
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
  const totalMargin = filteredServices.reduce((sum, service) => sum + service.margin, 0);
  const totalTransactions = filteredServices.reduce((sum, service) => sum + service.transaction_count, 0);

  return (
    <PageWrapper
      title="Other Banking Services"
      subtitle="Manage other banking services with account types and insurance options"
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
              data={otherBankingServices}
              filename="other-banking-services-data"
              currentData={filteredServices}
            />
          </div>
        </div>
      }
    >
      {/* Add Other Banking Service Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Other Banking Service</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
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
            <Label htmlFor="account_type">Account Type</Label>
            <Select
              value={newEntry.account_type}
              onValueChange={(value) => setNewEntry(prev => ({ 
                ...prev, 
                account_type: value,
                insurance_type: '' // Reset insurance type when account type changes
              }))}
            >
              <SelectTrigger className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 z-50">
                {accountTypes.map((type) => (
                  <SelectItem key={type} value={type} className="hover:bg-gray-100 dark:hover:bg-slate-700">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {showInsuranceField && (
            <div>
              <Label htmlFor="insurance_type">Insurance Type</Label>
              <Select
                value={newEntry.insurance_type}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, insurance_type: value }))}
              >
                <SelectTrigger className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600">
                  <SelectValue placeholder="Select insurance type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 z-50">
                  {insuranceTypes.map((type) => (
                    <SelectItem key={type} value={type} className="hover:bg-gray-100 dark:hover:bg-slate-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
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
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={newEntry.amount}
              onChange={(e) => setNewEntry(prev => ({ ...prev, amount: Number(e.target.value) }))}
              placeholder="Amount"
            />
          </div>
          
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          title="Total Margin"
          value={formatCurrency(totalMargin)}
          icon={<CreditCard size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.length === 0 ? (
          <div className="col-span-full text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No other banking services found for this {viewMode === 'day' ? 'day' : 'month'}.</p>
          </div>
        ) : (
          filteredServices.map(entry => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title="Other Banking Service"
              date={entry.date}
              data={{
                account_type: entry.account_type || 'N/A',
                insurance_type: entry.insurance_type || 'N/A',
                transactions: entry.transaction_count,
                amount: formatCurrency(entry.amount),
                margin: formatCurrency(entry.margin)
              }}
              labels={{
                account_type: 'Account Type',
                insurance_type: 'Insurance Type',
                transactions: 'Transactions',
                amount: 'Amount',
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
        <DialogContent className="bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle>Edit Other Banking Service</DialogTitle>
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
              <Label htmlFor="edit_account_type">Account Type</Label>
              <Select
                value={editForm.account_type}
                onValueChange={(value) => setEditForm(prev => ({ 
                  ...prev, 
                  account_type: value,
                  insurance_type: '' // Reset insurance type when account type changes
                }))}
              >
                <SelectTrigger className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 z-50">
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type} className="hover:bg-gray-100 dark:hover:bg-slate-700">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {showEditInsuranceField && (
              <div className="grid gap-2">
                <Label htmlFor="edit_insurance_type">Insurance Type</Label>
                <Select
                  value={editForm.insurance_type}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, insurance_type: value }))}
                >
                  <SelectTrigger className="w-full bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600">
                    <SelectValue placeholder="Select insurance type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 z-50">
                    {insuranceTypes.map((type) => (
                      <SelectItem key={type} value={type} className="hover:bg-gray-100 dark:hover:bg-slate-700">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
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
            
            <Button onClick={handleEditEntry}>Update Other Banking Service</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default OtherBankingServices;
