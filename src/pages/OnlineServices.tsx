import { useState, useEffect, useRef } from 'react';
import { useHighlight } from '@/hooks/useHighlight';
import { Globe, Plus, Edit, Printer, Upload } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
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
import { formatCurrency, filterByDate, filterByMonth, filterByQuarter } from '@/utils/calculateUtils';
import { escapeHtml } from '@/lib/sanitize';
import { format, startOfDay, endOfDay } from 'date-fns';

// Configure PDF.js worker - use legacy build without worker for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface OnlineServiceEntry {
  id: string;
  date: Date;
  service: string;
  custom_service?: string;
  customer_name?: string;
  reference_number?: string;
  amount: number;
  expense: number;
  total: number;
  created_at?: string;
}

const OnlineServices = () => {
  const [onlineServices, setOnlineServices] = useState<OnlineServiceEntry[]>([]);
  const [filteredServices, setFilteredServices] = useState<OnlineServiceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<OnlineServiceEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterMode, setFilterMode] = useState<'day' | 'month' | 'quarter'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const { isHighlighted, dateParam } = useHighlight();
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Set date from search navigation
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
    customer_name: '',
    service: '',
    custom_service: '',
    reference_number: '',
    amount: 0,
    expense: 0,
  });

  const [editForm, setEditForm] = useState({
    date: '',
    customer_name: '',
    service: '',
    custom_service: '',
    reference_number: '',
    amount: 0,
    expense: 0,
  });

  const defaultPricing: Record<string, { amount: number; expense: number }> = {
    'Income Certificate': { amount: 150, expense: 25 },
    'PAN Card': { amount: 250, expense: 100 },
    'Passport': { amount: 1750, expense: 1500 },
    'Character Certificate': { amount: 150, expense: 25 },
    'Marriage Certificate': { amount: 300, expense: 120 },
    'Pension Form': { amount: 150, expense: 25 },
    'Domicile': { amount: 150, expense: 25 },
    'Marriage Assistance Form': { amount: 250, expense: 25 },
    'Legal Heir': { amount: 500, expense: 50 },
    'Ayushman Card': { amount: 100, expense: 10 },
  };

  const serviceOptions = [
    { label: 'Income Certificate', value: 'Income Certificate' },
    { label: 'PAN Card', value: 'PAN Card' },
    { label: 'Passport', value: 'Passport' },
    { label: 'Character Certificate', value: 'Character Certificate' },
    { label: 'Marriage Certificate', value: 'Marriage Certificate' },
    { label: 'Railway Tickets', value: 'Railway Tickets' },
    { label: 'Pension Form', value: 'Pension Form' },
    { label: 'Domicile', value: 'Domicile' },
    { label: 'Marriage Assistance Form', value: 'Marriage Assistance Form' },
    { label: 'Legal Heir', value: 'Legal Heir' },
    { label: 'Ayushman Card', value: 'Ayushman Card' },
    { label: 'Other', value: 'Other' }
  ];

  const fetchOnlineServices = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('online_services')
        .select('*')
        .order('date', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data.map(entry => ({
        id: entry.id,
        date: new Date(entry.date),
        service: entry.service,
        custom_service: entry.custom_service,
        customer_name: entry.customer_name || '',
        reference_number: (entry as any).reference_number || '',
        amount: Number(entry.amount),
        expense: Number(entry.expense || 0),
        total: Number(entry.total),
        created_at: entry.created_at
      }));

      console.log('All online services:', formattedData.length);
      setOnlineServices(formattedData);
      applyDateFilter(formattedData, selectedDate, filterMode, searchQuery);
    } catch (error) {
      console.error('Error fetching online services:', error);
      toast.error('Failed to load online services data');
    } finally {
      setIsLoading(false);
    }
  };

  const applyDateFilter = (data: OnlineServiceEntry[], date: Date, mode: 'day' | 'month' | 'quarter', search: string = '') => {
    let filtered: OnlineServiceEntry[];
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
        (e.customer_name && e.customer_name.toLowerCase().includes(q)) ||
        e.service.toLowerCase().includes(q) ||
        (e.custom_service && e.custom_service.toLowerCase().includes(q))
      );
    }

    setFilteredServices(filtered);
  };

  useEffect(() => {
    fetchOnlineServices();
  }, []);

  useEffect(() => {
    applyDateFilter(onlineServices, selectedDate, filterMode, searchQuery);
  }, [selectedDate, filterMode, onlineServices, searchQuery]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleModeChange = (mode: 'day' | 'month') => {
    setFilterMode(mode);
  };

  const handleAddEntry = async () => {
    if (!newEntry.customer_name || !newEntry.service || !newEntry.amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      console.log('Adding online service:', newEntry);
      const total = newEntry.amount - newEntry.expense;
      const serviceName = newEntry.service === 'Other' && newEntry.custom_service 
        ? newEntry.custom_service 
        : newEntry.service;
      
      const { data, error } = await supabase
        .from('online_services')
        .insert({
          date: new Date(newEntry.date).toISOString(),
          service: newEntry.service,
          custom_service: newEntry.service === 'Other' ? newEntry.custom_service : null,
          customer_name: newEntry.customer_name,
          reference_number: newEntry.reference_number || null,
          amount: newEntry.amount,
          expense: newEntry.expense,
          total: total,
        } as any)
        .select();

      if (error) {
        console.error('Error adding online service:', error);
        throw error;
      }

      // Save expense to expenses table
      if (newEntry.expense > 0) {
        await supabase
          .from('expenses')
          .insert({
            date: new Date(newEntry.date).toISOString(),
            name: `Online Service - ${serviceName}`,
            amount: newEntry.expense,
          });
      }

      if (data && data.length > 0) {
        const newServiceEntry: OnlineServiceEntry = {
          id: data[0].id,
          date: new Date(data[0].date),
          service: data[0].service,
          custom_service: data[0].custom_service,
          customer_name: data[0].customer_name || '',
          reference_number: (data[0] as any).reference_number || '',
          amount: Number(data[0].amount),
          expense: Number(data[0].expense || 0),
          total: Number(data[0].total),
          created_at: data[0].created_at
        };

        setOnlineServices(prev => [newServiceEntry, ...prev]);
        setNewEntry({
          date: new Date().toISOString().split('T')[0],
          customer_name: '',
          service: '',
          custom_service: '',
          reference_number: '',
          amount: 0,
          expense: 0,
        });
        toast.success('Online service added successfully');
      }
    } catch (error) {
      console.error('Error adding online service:', error);
      toast.error('Failed to add online service');
    }
  };

  const handleEditEntry = async () => {
    if (!editingEntry) return;

    try {
      const total = editForm.amount - editForm.expense;
      const serviceName = editForm.service === 'Other' && editForm.custom_service 
        ? editForm.custom_service 
        : editForm.service;

      const { error } = await supabase
        .from('online_services')
        .update({
          date: new Date(editForm.date).toISOString(),
          service: editForm.service,
          custom_service: editForm.service === 'Other' ? editForm.custom_service : null,
          customer_name: editForm.customer_name,
          reference_number: editForm.reference_number || null,
          amount: editForm.amount,
          expense: editForm.expense,
          total: total,
        } as any)
        .eq('id', editingEntry.id);

      if (error) throw error;

      // Update or insert expense - check for existing entry first
      if (editForm.expense > 0) {
        const oldServiceName = editingEntry.service === 'Other' && editingEntry.custom_service 
          ? editingEntry.custom_service 
          : editingEntry.service;
        const oldExpenseName = `Online Service - ${oldServiceName}`;
        const newExpenseName = `Online Service - ${serviceName}`;
        
        // Try to find existing expense entry
        const { data: existingExpense } = await supabase
          .from('expenses')
          .select('id')
          .eq('name', oldExpenseName)
          .gte('date', new Date(editForm.date).toISOString().split('T')[0])
          .lt('date', new Date(editForm.date).toISOString().split('T')[0] + 'T23:59:59.999')
          .limit(1);
        
        if (existingExpense && existingExpense.length > 0) {
          await supabase
            .from('expenses')
            .update({ name: newExpenseName, amount: editForm.expense })
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

      const updatedEntry: OnlineServiceEntry = {
        ...editingEntry,
        date: new Date(editForm.date),
        service: editForm.service,
        custom_service: editForm.service === 'Other' ? editForm.custom_service : null,
        customer_name: editForm.customer_name,
        amount: editForm.amount,
        expense: editForm.expense,
        total: total,
      };

      setOnlineServices(prev =>
        prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
      );

      setEditingEntry(null);
      toast.success('Online service updated successfully');
    } catch (error) {
      console.error('Error updating online service:', error);
      toast.error('Failed to update online service');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('online_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setOnlineServices(prev => prev.filter(entry => entry.id !== id));
      toast.success('Online service deleted successfully');
    } catch (error) {
      console.error('Error deleting online service:', error);
      toast.error('Failed to delete online service');
    }
  };

  const openEditEntry = (entry: OnlineServiceEntry) => {
    setEditingEntry(entry);
    setEditForm({
      date: format(entry.date, 'yyyy-MM-dd'),
      customer_name: entry.customer_name || '',
      service: entry.service,
      custom_service: entry.custom_service || '',
      reference_number: entry.reference_number || '',
      amount: entry.amount,
      expense: entry.expense,
    });
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let lastY: number | null = null;
        const pageText = textContent.items.map((item: any) => {
          const currentY = item.transform ? item.transform[5] : null;
          let prefix = '';
          if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 5) {
            prefix = '\n';
          }
          lastY = currentY;
          return prefix + item.str;
        }).join(' ');
        fullText += pageText + '\n';
      }

      console.log('Extracted PDF text:', fullText);

      // Extract reference number
      const refMatch = fullText.match(/(?:Application\s+Reference\s+Number|Reference\s+Number|Ref\.?\s*No\.?)\s*[:\s]*([A-Z]{2}-[A-Z]+-[A-Z]+\/\d+\/\d+|[A-Z0-9\-\/]+)/i);
      const refNumber = refMatch ? refMatch[1].trim() : '';

      // Extract applicant name - try multiple patterns
      const namePatterns = [
        /Name\s+of\s+(?:the\s+)?Applicant\s*[:\s]*([A-Z][A-Z\s]+?)(?:\s{2,}|\n|$)/i,
        /NAME\s+OF\s+APPLICANT\s*[:\s]*([A-Z][A-Z\s]+?)(?:\s{2,}|\n|$)/i,
        /Name\s+of\s+Child\s*[:\s]*([A-Z][A-Z\s]+?)(?:\s{2,}|\n|$)/i,
        /Name\s+of\s+Dependent\s*[:\s]*([A-Z][A-Z\s]+?)(?:\s{2,}|\n|$)/i,
        /Applicant\s+Name\s*[:\s]*([A-Z][A-Z\s]+?)(?:\s{2,}|\n|$)/i,
      ];
      let applicantName = '';
      for (const pattern of namePatterns) {
        const match = fullText.match(pattern);
        if (match) {
          applicantName = match[1].trim();
          break;
        }
      }

      if (refNumber || applicantName) {
        setNewEntry(prev => ({
          ...prev,
          ...(refNumber && { reference_number: refNumber }),
          ...(applicantName && { customer_name: applicantName }),
        }));
        toast.success(`Extracted: ${refNumber ? 'Ref: ' + refNumber : ''} ${applicantName ? 'Name: ' + applicantName : ''}`);
      } else {
        toast.error('Could not extract reference number or name from PDF');
      }
    } catch (error) {
      console.error('Error parsing PDF:', error);
      toast.error('Failed to parse PDF');
    }

    // Reset input
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Online Services Report</title>
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
          <h1>Online Services Report</h1>
          <div class="total">Total Services: ${totalServices} | Total Amount: ₹${totalAmount.toFixed(2)}</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Customer</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Expense</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              ${filteredServices.map((service) => `
                <tr>
                  <td>${escapeHtml(format(service.date, 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(service.customer_name)}</td>
                  <td>${escapeHtml(service.service === 'Other' && service.custom_service ? service.custom_service : service.service)}</td>
                  <td>₹${escapeHtml(service.amount.toFixed(2))}</td>
                  <td>₹${escapeHtml(service.expense.toFixed(2))}</td>
                  <td>₹${escapeHtml(service.total.toFixed(2))}</td>
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

  // Convert a number to Indian English words (integer rupees)
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
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    let res = inWords(rupees) + ' Rupees';
    if (paise > 0) res += ' and ' + inWords(paise) + ' Paise';
    return res + ' Only';
  };

  const handlePrintBill = async (entry: OnlineServiceEntry) => {
    // Ask payment mode
    const modeInput = (window.prompt('Payment Mode (UPI / Cash):', 'Cash') || '').trim();
    const paymentMode = /upi/i.test(modeInput) ? 'UPI' : 'Cash';

    const serviceName = entry.service === 'Other' && entry.custom_service ? entry.custom_service : entry.service;
    const prefix = serviceName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'SVC';
    const year = format(entry.date, 'yyyy');

    // Sequential number = count of entries of same service in this year, ordered by created_at, plus index of this entry
    let seqNum = 1;
    try {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31T23:59:59.999`;
      const { data: yearEntries } = await supabase
        .from('online_services')
        .select('id, created_at, service, custom_service')
        .gte('date', yearStart)
        .lte('date', yearEnd)
        .order('created_at', { ascending: true });
      if (yearEntries) {
        const sameType = yearEntries.filter((e: any) => {
          const n = e.service === 'Other' && e.custom_service ? e.custom_service : e.service;
          return n === serviceName;
        });
        const idx = sameType.findIndex((e: any) => e.id === entry.id);
        seqNum = (idx >= 0 ? idx : sameType.length) + 1;
      }
    } catch (err) {
      console.error('Serial calc error:', err);
    }
    const serial = `KC/${year}/${prefix}/${String(seqNum).padStart(3, '0')}`;
    const billDate = format(new Date(), 'dd/MM/yyyy');
    const refNo = entry.reference_number?.trim() || 'Nil';
    const amountWords = numberToWords(entry.amount);

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `<!DOCTYPE html><html><head><title>Bill - ${escapeHtml(entry.customer_name || '')}</title>
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
        <div class="row"><span>Customer Name:</span><span>${escapeHtml(entry.customer_name || '')}</span></div>
        <div class="row"><span>Service Type:</span><span>${escapeHtml(serviceName)}</span></div>
        <div class="row"><span>Reference No:</span><span>${escapeHtml(refNo)}</span></div>
        <div class="row"><span>Payment Mode:</span><span>${escapeHtml(paymentMode)}</span></div>
        <div class="amt">Amount: ₹ ${entry.amount.toFixed(2)}</div>
        <div class="words">In Words: ${escapeHtml(amountWords)}</div>
        <div class="footer">
          <div class="sig">
            Signature
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

  const totalServices = filteredServices.length;
  const totalAmount = filteredServices.reduce((sum, service) => sum + service.total, 0);

  return (
    <PageWrapper
      title="Online Services"
      subtitle="Manage your online services"
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
              placeholder="Search by customer, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[180px] h-9 bg-sidebar-accent text-sidebar-accent-foreground placeholder:text-sidebar-accent-foreground/50 border-sidebar-border"
            />
            <Button onClick={handlePrint} variant="outline">
              <Printer size={16} className="mr-2" />
              Print
            </Button>
            <DownloadButton 
              data={onlineServices}
              filename="online-services"
              currentData={filteredServices}
            />
            <input
              type="file"
              accept=".pdf"
              ref={pdfInputRef}
              onChange={handlePdfUpload}
              className="hidden"
            />
            <Button variant="outline" onClick={() => pdfInputRef.current?.click()}>
              <Upload size={16} className="mr-2" />
              Browse
            </Button>
          </div>
        </div>
      }
    >
      {/* Add Service Form */}
      <div className="mb-6 p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold mb-4">Add Online Service</h3>
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
            <Label htmlFor="customer">Customer Name</Label>
            <Input
              id="customer"
              value={newEntry.customer_name}
              onChange={(e) => setNewEntry(prev => ({ ...prev, customer_name: e.target.value }))}
              placeholder="Customer name"
            />
          </div>
          <div>
            <Label htmlFor="service">Service Type</Label>
            <Select value={newEntry.service} onValueChange={(value) => {
              const pricing = defaultPricing[value];
              setNewEntry(prev => ({
                ...prev,
                service: value,
                ...(pricing ? { amount: pricing.amount, expense: pricing.expense } : {}),
              }));
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select service" />
              </SelectTrigger>
              <SelectContent>
                {serviceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {newEntry.service === 'Other' && (
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
            <Label htmlFor="ref_number">Reference No. (Optional)</Label>
            <Input
              id="ref_number"
              value={newEntry.reference_number}
              onChange={(e) => setNewEntry(prev => ({ ...prev, reference_number: e.target.value }))}
              placeholder="Reference number"
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
          id="summary-services"
          title="Total Services"
          date={selectedDate}
          data={{ 
            value: totalServices,
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
          <p>Loading online services data...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-border animate-fade-in">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No Online Services</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {onlineServices.length > 0 
              ? `No services found for the selected ${filterMode === 'day' ? 'day' : 'month'}.` 
              : 'Add a new online service to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((entry) => (
            <ServiceCard
              key={entry.id}
              id={entry.id}
              title={entry.service === 'Other' && entry.custom_service ? entry.custom_service : entry.service}
              date={entry.date}
              data={{
                customer: entry.customer_name || 'Not specified',
                ...(entry.reference_number && { reference: entry.reference_number }),
                amount: formatCurrency(entry.amount),
                expense: formatCurrency(entry.expense),
                margin: formatCurrency(entry.total),
              }}
              labels={{
                customer: 'Customer',
                ...(entry.reference_number && { reference: 'Ref No.' }),
                amount: 'Amount',
                expense: 'Expense',
                margin: 'Margin',
              }}
              onEdit={() => openEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
              onPrint={() => handlePrintBill(entry)}
              isHighlighted={isHighlighted(entry.id)}
            />
          ))}
        </div>
      )}

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Online Service</DialogTitle>
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
              <Label htmlFor="edit_service">Service Type</Label>
              <Select value={editForm.service} onValueChange={(value) => {
                const pricing = defaultPricing[value];
                setEditForm(prev => ({
                  ...prev,
                  service: value,
                  ...(pricing ? { amount: pricing.amount, expense: pricing.expense } : {}),
                }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  {serviceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editForm.service === 'Other' && (
              <div className="grid gap-2">
                <Label htmlFor="edit_custom_service">Custom Service</Label>
                <Input
                  id="edit_custom_service"
                  value={editForm.custom_service}
                  onChange={(e) => setEditForm(prev => ({ ...prev, custom_service: e.target.value }))}
                  placeholder="Enter service name"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="edit_ref_number">Reference No. (Optional)</Label>
              <Input
                id="edit_ref_number"
                value={editForm.reference_number}
                onChange={(e) => setEditForm(prev => ({ ...prev, reference_number: e.target.value }))}
                placeholder="Reference number"
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
            <Button onClick={handleEditEntry}>Update Service</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default OnlineServices;
