import { useState, useEffect, useRef } from 'react';
import { useHighlight } from '@/hooks/useHighlight';
import { useForm } from 'react-hook-form';
import { format, isSameDay, isSameMonth, isSameYear, startOfQuarter, endOfQuarter } from 'date-fns';
import { Calendar, Plus, Printer, Trash2, Edit2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import PageHeader from '@/components/layout/PageHeader';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import DownloadButton from '@/components/ui/DownloadButton';
import { escapeHtml } from '@/lib/sanitize';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

interface ImpsElectricityForm {
  date: Date;
  record_type: string;
  customer_name: string;
  account_number: string;
  amount: number;
  remarks?: string;
}

interface ImpsElectricityRecord {
  id: string;
  date: string;
  record_type: string;
  customer_name: string;
  account_number: string;
  amount: number;
  remarks: string | null;
  created_at: string;
}

const ImpsElectricity = () => {
  const [records, setRecords] = useState<ImpsElectricityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { highlightId } = useHighlight();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month' | 'quarter' | 'year'>('month');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ImpsElectricityForm>({
    defaultValues: {
      date: new Date(),
      record_type: 'IMPS',
      amount: 0,
    }
  });

  const selectedDate = watch('date');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('imps_electricity')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ImpsElectricityForm) => {
    try {
      const payload = {
        date: data.date.toISOString(),
        record_type: data.record_type,
        customer_name: data.customer_name,
        account_number: data.account_number,
        amount: Number(data.amount),
        remarks: data.remarks || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('imps_electricity')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast({ title: 'Success', description: 'Record updated successfully' });
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('imps_electricity')
          .insert([payload]);
        if (error) throw error;
        toast({ title: 'Success', description: 'Record added successfully' });
      }

      reset({ date: new Date(), record_type: 'IMPS', amount: 0 });
      fetchRecords();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (record: ImpsElectricityRecord) => {
    setEditingId(record.id);
    setValue('date', new Date(record.date));
    setValue('record_type', record.record_type);
    setValue('customer_name', record.customer_name);
    setValue('account_number', record.account_number);
    setValue('amount', record.amount);
    setValue('remarks', record.remarks || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const { error } = await supabase
        .from('imps_electricity')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Record deleted successfully' });
      fetchRecords();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({ title: 'Error', description: 'Please upload a PDF file', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

      let allTextItems: { str: string; y: number }[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        for (const item of textContent.items) {
          if ('str' in item && item.str.trim()) {
            const y = Math.round((item as any).transform?.[5] || 0);
            allTextItems.push({ str: item.str.trim(), y });
          }
        }
      }

      // Group text items by y-coordinate (same line)
      const lineMap = new Map<number, string[]>();
      for (const item of allTextItems) {
        const key = Math.round(item.y / 3) * 3;
        if (!lineMap.has(key)) lineMap.set(key, []);
        lineMap.get(key)!.push(item.str);
      }

      const lines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([_, parts]) => parts.join(' '));

      const fullText = lines.join('\n');

      let customerName = '';
      let accountNumber = '';
      let amount = 0;
      let detectedType = '';

      // Try Electricity Bill extraction
      const customerNameMatch = fullText.match(/Customer\s*Name\s*[:\-]?\s*(.+)/i);
      const consumerCodeMatch = fullText.match(/(?:Account\s*ID|Consumer\s*Code)\s*[:\-]?\s*(\S+)/i);
      const billAmountMatch = fullText.match(/Bill\s*Amount\s*[:\-]?\s*([\d,.]+)/i);

      if (customerNameMatch && consumerCodeMatch) {
        detectedType = 'Electricity Bill';
        customerName = customerNameMatch[1].trim();
        accountNumber = consumerCodeMatch[1].trim();
        amount = billAmountMatch ? parseFloat(billAmountMatch[1].replace(/,/g, '')) : 0;
      }

      // Try IMPS extraction
      if (!detectedType) {
        const beneficiaryNameMatch = fullText.match(/Beneficiary\s*Name\s*[:\-]?\s*(.+)/i);
        const beneficiaryAccountMatch = fullText.match(/Beneficiary\s*Account\s*[:\-]?\s*(\S+)/i);
        const txnAmountMatch = fullText.match(/TXN\s*Amount\s*[:\-]?\s*([\d,.]+)/i);

        if (beneficiaryNameMatch && beneficiaryAccountMatch) {
          detectedType = 'IMPS';
          customerName = beneficiaryNameMatch[1].trim();
          accountNumber = beneficiaryAccountMatch[1].trim();
          amount = txnAmountMatch ? parseFloat(txnAmountMatch[1].replace(/,/g, '')) : 0;
        }
      }

      if (!detectedType) {
        toast({ title: 'Error', description: 'Could not detect IMPS or Electricity Bill data from the PDF', variant: 'destructive' });
        return;
      }

      setValue('record_type', detectedType);
      setValue('customer_name', customerName);
      setValue('account_number', accountNumber);
      setValue('amount', amount);

      toast({ title: 'PDF Parsed', description: `Detected ${detectedType} - ${customerName}` });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to parse PDF: ' + error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const typeLabel = typeFilter === 'all' ? 'All Types' : typeFilter;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>IMPS/Electricity Bill Records - ${escapeHtml(typeLabel)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f4f4f4; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <h1>IMPS/Electricity Bill Records - ${escapeHtml(typeLabel)}</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Customer Name</th>
                <th>Account/Consumer No.</th>
                <th>Amount</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map(record => `
                <tr>
                  <td>${escapeHtml(format(new Date(record.date), 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(record.record_type)}</td>
                  <td>${escapeHtml(record.customer_name)}</td>
                  <td>${escapeHtml(record.account_number)}</td>
                  <td>₹${Number(record.amount).toLocaleString('en-IN')}</td>
                  <td>${escapeHtml(record.remarks || '-')}</td>
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

  const filteredRecords = records.filter(record => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      record.customer_name.toLowerCase().includes(query) ||
      record.account_number.toLowerCase().includes(query) ||
      record.record_type.toLowerCase().includes(query) ||
      (record.remarks && record.remarks.toLowerCase().includes(query))
    );
    const matchesType = typeFilter === 'all' || record.record_type === typeFilter;

    const recordDate = new Date(record.date);
    let matchesDate = true;
    if (viewMode === 'day') {
      matchesDate = isSameDay(recordDate, filterDate);
    } else if (viewMode === 'month') {
      matchesDate = isSameMonth(recordDate, filterDate);
    } else if (viewMode === 'quarter') {
      const qStart = startOfQuarter(filterDate);
      const qEnd = endOfQuarter(filterDate);
      matchesDate = recordDate >= qStart && recordDate <= qEnd;
    } else if (viewMode === 'year') {
      matchesDate = isSameYear(recordDate, filterDate);
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const totalAmount = filteredRecords.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="IMPS / Electricity Bill"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, account, type..."
      >
        <DateRangePicker
          date={filterDate}
          onDateChange={setFilterDate}
          mode={viewMode}
          onModeChange={setViewMode}
          showYearMode={true}
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="IMPS">IMPS</SelectItem>
            <SelectItem value="Electricity Bill">Electricity Bill</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
        <DownloadButton
          data={filteredRecords}
          currentData={filteredRecords}
          filename="imps-electricity"
          label="Download"
        />
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf"
          onChange={handlePdfUpload}
          className="hidden"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {isUploading ? 'Parsing...' : 'Browse'}
        </Button>
      </PageHeader>

      <div className="flex-1 p-6 space-y-6">

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Records</p>
            <p className="text-2xl font-bold text-foreground">{filteredRecords.length}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold text-foreground">₹{totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Filter</p>
            <p className="text-2xl font-bold text-foreground">{typeFilter === 'all' ? 'All' : typeFilter}</p>
          </div>
        </div>

        {/* Inline Form */}
        <div className="bg-card rounded-lg border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => setValue('date', date || new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="record_type">Type *</Label>
                <Select
                  value={watch('record_type')}
                  onValueChange={(value) => setValue('record_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMPS">IMPS</SelectItem>
                    <SelectItem value="Electricity Bill">Electricity Bill</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Customer Name */}
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  {...register('customer_name', { required: 'Name is required' })}
                  placeholder="Enter name"
                />
                {errors.customer_name && (
                  <p className="text-sm text-destructive">{errors.customer_name.message}</p>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="account_number">
                  {watch('record_type') === 'Electricity Bill' ? 'Consumer Code *' : 'Account No. *'}
                </Label>
                <Input
                  id="account_number"
                  {...register('account_number', { required: 'Account/Consumer code is required' })}
                  placeholder={watch('record_type') === 'Electricity Bill' ? 'Enter consumer code' : 'Enter account number'}
                />
                {errors.account_number && (
                  <p className="text-sm text-destructive">{errors.account_number.message}</p>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register('amount', { required: 'Amount is required', valueAsNumber: true })}
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input
                  id="remarks"
                  {...register('remarks')}
                  placeholder="Enter remarks"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" />
                {editingId ? 'Update' : 'Add'} Record
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    reset({ date: new Date(), record_type: 'IMPS', amount: 0 });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>{typeFilter === 'Electricity Bill' ? 'Consumer Code' : 'Account No.'}</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No records found</TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} data-record-id={record.id} className={highlightId === record.id ? 'search-highlight' : ''}>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                          record.record_type === 'IMPS'
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        )}>
                          {record.record_type}
                        </span>
                      </TableCell>
                      <TableCell>{record.customer_name}</TableCell>
                      <TableCell>{record.account_number}</TableCell>
                      <TableCell>₹{Number(record.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(record)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                            <Trash2 className="h-4 w-4" />
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
      </div>
    </div>
  );
};

export default ImpsElectricity;
