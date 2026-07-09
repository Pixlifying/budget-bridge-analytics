
import { useState, useEffect } from 'react';
import { useHighlight } from '@/hooks/useHighlight';
import { FileText, Plus, Edit, Printer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import PageWrapper from '@/components/layout/PageWrapper';
import ServiceCard from '@/components/ui/ServiceCard';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, filterByDate, filterByMonth, filterByQuarter } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import { format } from 'date-fns';

interface ApplicationEntry {
  id: string;
  date: Date;
  customer_name: string;
  mobile_number?: string;
  expense: number;
  amount: number;
  created_at?: string;
}

const Applications = () => {
  const [applications, setApplications] = useState<ApplicationEntry[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<ApplicationEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterMode, setFilterMode] = useState<'day' | 'month' | 'quarter'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const { isHighlighted, dateParam } = useHighlight();

  useEffect(() => {
    if (dateParam) {
      const navDate = new Date(dateParam);
      if (!isNaN(navDate.getTime())) {
        setSelectedDate(navDate);
        setFilterMode('month');
      }
    }
  }, [dateParam]);

  // Form state for inline entry
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    mobile_number: '',
    expense: 0,
    amount: 0,
    service_type: '',
    custom_service: '',
  });

  const [editForm, setEditForm] = useState({
    date: '',
    mobile_number: '',
    expense: 0,
    amount: 0,
  });

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('applications')
        .select('*')
        .order('date', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        customer_name: entry.customer_name,
        mobile_number: (entry as any).mobile_number || '',
        expense: Number(entry.expense || 0),
        amount: Number(entry.amount),
        created_at: entry.created_at
      }));

      console.log('Applications data fetched:', formattedData.length, 'for date:', selectedDate, 'mode:', filterMode);
      setApplications(formattedData);
      applyDateFilter(formattedData, selectedDate, filterMode);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications data');
    } finally {
      setIsLoading(false);
    }
  };

  const applyDateFilter = (data: ApplicationEntry[], date: Date, mode: 'day' | 'month' | 'quarter', search: string = '') => {
    let filtered: ApplicationEntry[];
    if (mode === 'day') {
      filtered = filterByDate(data, date);
    } else if (mode === 'month') {
      filtered = filterByMonth(data, date);
    } else {
      filtered = filterByQuarter(data, date);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(e =>
        e.customer_name.toLowerCase().includes(q)
      );
    }

    setFilteredApplications(filtered);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    applyDateFilter(applications, selectedDate, filterMode, searchQuery);
  }, [selectedDate, filterMode, applications, searchQuery]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleModeChange = (mode: 'day' | 'month' | 'quarter') => {
    setFilterMode(mode);
  };

  const handleAddEntry = async () => {
    if (!newEntry.amount) {
      toast.error('Please fill in the amount');
      return;
    }

    const serviceName = newEntry.service_type === 'Other' ? newEntry.custom_service : newEntry.service_type;
    if (!serviceName) {
      toast.error('Please select a service');
      return;
    }

    try {
      const total = newEntry.amount - newEntry.expense;
      
      const { data, error } = await supabase
        .from('applications')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          customer_name: serviceName,
          mobile_number: null,
          expense: newEntry.expense,
          amount: total,
        } as any)
        .select();

      if (error) throw error;

      // Save expense to expenses table
      if (newEntry.expense > 0) {
        await supabase
          .from('expenses')
          .insert({
            date: new Date(newEntry.date).toISOString(),
            name: `Application - ${serviceName}`,
            amount: newEntry.expense,
          });
      }

      if (data && data.length > 0) {
        const newApplicationEntry: ApplicationEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          customer_name: data[0].customer_name,
          mobile_number: (data[0] as any).mobile_number || '',
          expense: Number(data[0].expense || 0),
          amount: Number(data[0].amount),
          created_at: data[0].created_at
        };

        setApplications(prev => [newApplicationEntry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          mobile_number: '',
          expense: 0,
          amount: 0,
          service_type: '',
          custom_service: '',
        });
        toast.success('Application added successfully');
      }
    } catch (error) {
      console.error('Error adding application:', error);
      toast.error('Failed to add application');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    try {
      const total = editForm.amount - editForm.expense;
      
      const { error } = await supabase
        .from('applications')
        .update({
          date: new Date(editForm.date).toISOString(),
          customer_name: editForm.customer_name,
          mobile_number: editForm.mobile_number || null,
          expense: editForm.expense,
          amount: total,
        } as any)
        .eq('id', editingEntry.id);

      if (error) throw error;

      // Update or insert expense - prevent double entry
      if (editForm.expense > 0) {
        const oldExpenseName = `Application - ${editingEntry.customer_name}`;
        const newExpenseName = `Application - ${editForm.customer_name}`;
        
        const { data: existingExpense } = await supabase
          .from('expenses')
          .select('id')
          .eq('name', oldExpenseName)
          .gte('date', format(editingEntry.date, 'yyyy-MM-dd'))
          .lt('date', format(editingEntry.date, 'yyyy-MM-dd') + 'T23:59:59.999')
          .limit(1);
        
        if (existingExpense && existingExpense.length > 0) {
          await supabase
            .from('expenses')
            .update({ name: newExpenseName, amount: editForm.expense, date: new Date(editForm.date).toISOString() })
            .eq('id', existingExpense[0].id);
        } else {
          await supabase
            .from('expenses')
            .insert({
              date: new Date(editForm.date).toISOString(),
              name: newExpenseName,
              amount: editForm.expense,
            });
        }
      }

      const updatedEntry: ApplicationEntry = {
        ...editingEntry,
        date: new Date(editForm.date),
        customer_name: editForm.customer_name,
        mobile_number: editForm.mobile_number,
        expense: editForm.expense,
        amount: total,
      };

      setApplications(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      toast.success('Application updated successfully');
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApplications(prev => prev.filter(entry => entry.id !== id));
      toast.success('Application deleted successfully');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  };

  const openEditEntry = (entry: ApplicationEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      customer_name: entry.customer_name,
      mobile_number: entry.mobile_number || '',
      expense: entry.expense,
      amount: entry.amount + entry.expense, // Show original amount before expense deduction
    });
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Applications Report</title>
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
          <h1>Applications Report</h1>
          <div class="total">Total Applications: ${totalApplications} | Total Amount: ₹${totalAmount.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Amount</th>
                <th>Expense</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredApplications.map((application) => `
                <tr>
                  <td>${escapeHtml(format(application.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(application.customer_name)}</td>
                  <td>₹${escapeHtml((application.amount + application.expense).toFixed(2))}</td>
                  <td>₹${escapeHtml(application.expense.toFixed(2))}</td>
                  <td>₹${escapeHtml(application.amount.toFixed(2))}</td>
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

  const totalApplications = filteredApplications.length;

  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n: number): string => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
      if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
      if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
      return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
    };
    return inWords(Math.floor(num)) + ' Rupees Only';
  };

  const handlePrintBill = async (entry: ApplicationEntry) => {
    const modeInput = (window.prompt('Payment Mode (UPI / Cash):', 'Cash') || '').trim();
    const paymentMode = /upi/i.test(modeInput) ? 'UPI' : 'Cash';
    const year = format(entry.date, 'yyyy');
    const prefix = 'OFF';
    let seqNum = 1;
    try {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31T23:59:59.999`;
      const { data: yearEntries } = await supabase
        .from('applications')
        .select('id, created_at')
        .gte('date', yearStart).lte('date', yearEnd)
        .order('created_at', { ascending: true });
      if (yearEntries) {
        const idx = yearEntries.findIndex((e: any) => e.id === entry.id);
        seqNum = (idx >= 0 ? idx : yearEntries.length) + 1;
      }
    } catch {}
    const serial = `KC/${year}/${prefix}/${String(seqNum).padStart(3, '0')}`;
    const billDate = format(new Date(), 'dd/MM/yyyy');
    const totalAmt = entry.amount + entry.expense;
    const amountWords = numberToWords(totalAmt);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const html = `<!DOCTYPE html><html><head><title>Bill - ${escapeHtml(entry.customer_name)}</title>
      <style>
        @page { size: A6; margin: 5mm; }
        @media print { html, body { margin: 0 !important; padding: 0 !important; } }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 10.5px; margin: 0; padding: 0; color: #000; }
        .bill { width: 105mm; min-height: 148mm; padding: 5mm; }
        .title { text-align: center; font-size: 15px; font-weight: 700; margin: 0 0 1mm; letter-spacing: 1px; }
        .addr { text-align: center; font-size: 10px; margin-bottom: 3mm; }
        .row { display: flex; justify-content: space-between; padding: 1mm 0; border-bottom: 1px dashed #999; font-size: 10.5px; gap: 4mm; }
        .row span:first-child { font-weight: 600; white-space: nowrap; }
        .row span:last-child { text-align: right; word-break: break-word; }
        .amt { margin-top: 3mm; padding: 2.5mm; border: 1.5px solid #000; text-align: center; font-size: 13px; font-weight: 700; }
        .words { margin-top: 2mm; font-size: 10px; font-style: italic; text-align: center; }
        .footer { margin-top: 6mm; display: flex; align-items: flex-end; justify-content: space-between; gap: 4mm; }
        .sig { flex: 1; font-size: 10.5px; text-align: center; }
        .sig-img { height: 12mm; margin: 1mm auto 0; display: block; }
        .sig-line { border-bottom: 1px solid #000; height: 1px; margin-top: 1mm; }
        .qr { width: 22mm; height: 22mm; }
        .thanks { text-align: center; font-size: 10px; font-weight: 600; margin-top: 4mm; }
      </style></head><body>
      <div class="bill">
        <div class="title">KHIDMAT CENTER</div>
        <div class="addr">Address: Ward No 6, R.S. Pura</div>
        <div class="row"><span>Serial No:</span><span>${escapeHtml(serial)}</span></div>
        <div class="row"><span>Date:</span><span>${escapeHtml(billDate)}</span></div>
        <div class="row"><span>Customer Name:</span><span>${escapeHtml(entry.customer_name)}</span></div>
        <div class="row"><span>Service Type:</span><span>Offline Service</span></div>
        <div class="row"><span>Payment Mode:</span><span>${escapeHtml(paymentMode)}</span></div>
        <div class="amt">Amount: ₹ ${totalAmt.toFixed(2)}</div>
        <div class="words">In Words: ${escapeHtml(amountWords)}</div>
        <div class="footer">
          <div class="sig">Signature
            <img class="sig-img" src="${window.location.origin}/signature.png" alt="Signature" onerror="this.style.display='none'" />
            <div class="sig-line"></div>
          </div>
          <img class="qr" src="${window.location.origin}/bill-qr.png" alt="QR" onerror="this.style.display='none'" />
        </div>
        <div class="thanks">Thank You, Visit Again</div>
      </div>
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
      </body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleWhatsApp = (entry: ApplicationEntry) => {
    const raw = (entry.mobile_number || '').replace(/\D/g, '');
    if (!raw) {
      toast.error('No mobile number saved for this entry');
      return;
    }
    const phone = raw.length === 10 ? `91${raw}` : raw;
    const totalAmt = entry.amount + entry.expense;
    const msg = `Hello ${entry.customer_name},\n\nYour offline service has been processed.\nAmount: ₹${totalAmt.toFixed(2)}\nDate: ${format(entry.date, 'dd/MM/yyyy')}\n\nThank you,\nKHIDMAT CENTER`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const totalAmount = filteredApplications.reduce((sum, app) => sum + app.amount, 0);

  return (
    <PageWrapper
      title="Applications"
      subtitle="Manage your application services"
      action={
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <DateRangePicker
            date={selectedDate}
            onDateChange={handleDateChange}
            mode={filterMode}
            onModeChange={handleModeChange}
          />
          <div className="flex flex-wrap gap-2 items-center">
            <Input
              placeholder="Search by customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[180px] h-9 bg-sidebar-accent text-sidebar-accent-foreground placeholder:text-sidebar-accent-foreground/50 border-sidebar-border"
            />
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton 
              data={applications}
              filename="applications"
              currentData={filteredApplications}
            />
          </div>
        </div>
      }
    >
      {/* Add Application Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Application</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
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
            <Label htmlFor="service_type">Service</Label>
            <Select
              value={newEntry.service_type}
              onValueChange={(value) => setNewEntry(prev => ({ ...prev, service_type: value, custom_service: value === 'Other' ? prev.custom_service : '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Adhar">Adhar</SelectItem>
                <SelectItem value="Application">Application</SelectItem>
                <SelectItem value="Printout">Printout</SelectItem>
                <SelectItem value="Forms">Forms</SelectItem>
                <SelectItem value="Pension Forms">Pension Forms</SelectItem>
                <SelectItem value="Affidavit">Affidavit</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newEntry.service_type === 'Other' && (
            <div>
              <Label htmlFor="custom_service">Custom Service</Label>
              <Input
                id="custom_service"
                value={newEntry.custom_service}
                onChange={(e) => setNewEntry(prev => ({ ...prev, custom_service: e.target.value }))}
                placeholder="Enter service name"
              />
            </div>
          )}
          <div>
            <Label htmlFor="customer">Customer Name</Label>
            <Input
              id="customer"
              value={newEntry.customer_name}
              onChange={(e) => setNewEntry(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label htmlFor="mobile_number">Mobile Number</Label>
            <Input
              id="mobile_number"
              type="tel"
              value={newEntry.mobile_number}
              onChange={(e) => setNewEntry(prev => ({ ...prev, mobile_number: e.target.value }))}
              placeholder="10-digit mobile"
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
          <div>
            <Label htmlFor="expense">Expense</Label>
            <Input
              id="expense"
              type="number"
              value={newEntry.expense}
              onChange={(e) => setNewEntry(prev => ({ ...prev, expense: Number(e.target.value) }))}
              placeholder="Expense"
              min="0"
            />
          </div>
          <Button onClick={handleAddEntry}>
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <ServiceCard 
          id="summary-applications"
          title="Total Applications"
          date={selectedDate}
          data={{ 
            value: totalApplications,
          }}
          labels={{ 
            value: "Count",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-blue-50"
          showActions={false}
        />
        <ServiceCard 
          id="summary-amount"
          title="Total Margin"
          date={selectedDate}
          data={{ 
            value: formatCurrency(totalAmount),
          }}
          labels={{ 
            value: "Margin",
          }}
          onEdit={() => {}}
          onDelete={() => {}}
          className="bg-emerald-50"
          showActions={false}
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>Loading applications data...</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Applications</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {applications.length > 0 
              ? `No applications found for the selected ${filterMode === 'day' ? 'day' : 'month'}.` 
              : 'Add a new application to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApplications.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={`Application - ${entry.customer_name}`}
              date={entry.date}
              data={{
                customer: entry.customer_name,
                ...(entry.mobile_number && { mobile: entry.mobile_number }),
                amount: formatCurrency(entry.amount + entry.expense),
                expense: formatCurrency(entry.expense),
                margin: formatCurrency(entry.amount),
              }}
              labels={{
                customer: 'Customer',
                mobile: 'Mobile',
                amount: 'Amount',
                expense: 'Expense',
                margin: 'Margin',
              }}
              onEdit={() => openEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
              onPrint={() => handlePrintBill(entry)}
              onWhatsApp={entry.mobile_number ? () => handleWhatsApp(entry) : undefined}
              isHighlighted={isHighlighted(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
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
              <Label htmlFor="edit_customer">Customer Name</Label>
              <Input
                id="edit_customer"
                value={editForm.customer_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, customer_name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_mobile">Mobile Number</Label>
              <Input
                id="edit_mobile"
                type="tel"
                value={editForm.mobile_number}
                onChange={(e) => setEditForm(prev => ({ ...prev, mobile_number: e.target.value }))}
                placeholder="10-digit mobile"
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
              <Label htmlFor="edit_expense">Expense</Label>
              <Input
                id="edit_expense"
                type="number"
                value={editForm.expense}
                onChange={(e) => setEditForm(prev => ({ ...prev, expense: Number(e.target.value) }))}
                placeholder="Expense"
                min="0"
              />
            </div>
            <Button onClick={handleEditEntry}>Update Application</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Applications;
