import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar, Plus, Printer, Trash2, Edit2, Search, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import DownloadButton from '@/components/ui/DownloadButton';
import { escapeHtml } from '@/lib/sanitize';

interface SocialSecurityForm {
  date: Date;
  name: string;
  account_number: string;
  address?: string;
  mobile_number?: string;
  scheme_type: string;
  remarks?: string;
}

interface SocialSecurityRecord {
  id: string;
  date: string;
  name: string;
  account_number: string;
  address: string;
  mobile_number: string | null;
  scheme_type: string;
  remarks: string;
  created_at: string;
}

const SocialSecurity = () => {
  const [records, setRecords] = useState<SocialSecurityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [schemeFilter, setSchemeFilter] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<SocialSecurityForm>({
    defaultValues: {
      date: new Date(),
      scheme_type: 'APY'
    }
  });

  const selectedDate = watch('date');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('social_security')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: SocialSecurityForm) => {
    try {
      const payload = {
        date: data.date.toISOString(),
        name: data.name,
        account_number: data.account_number,
        address: data.address || null,
        mobile_number: data.mobile_number || null,
        scheme_type: data.scheme_type,
        remarks: data.remarks || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('social_security')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        toast({ title: 'Success', description: 'Record updated successfully' });
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from('social_security')
          .insert([payload]);

        if (error) throw error;
        toast({ title: 'Success', description: 'Record added successfully' });
      }

      reset({ date: new Date(), scheme_type: 'APY' });
      fetchRecords();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (record: SocialSecurityRecord) => {
    setEditingId(record.id);
    setValue('date', new Date(record.date));
    setValue('name', record.name);
    setValue('account_number', record.account_number);
    setValue('address', record.address || '');
    setValue('mobile_number', record.mobile_number || '');
    setValue('scheme_type', record.scheme_type);
    setValue('remarks', record.remarks || '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      const { error } = await supabase
        .from('social_security')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Record deleted successfully' });
      fetchRecords();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith('.csv');
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    if (!isCSV && !isExcel) {
      toast({ title: 'Error', description: 'Please upload a CSV or Excel file', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      let data: Record<string, any>[];
      if (isExcel) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(sheet);
      } else {
        const content = await file.text();
        const result = Papa.parse(content, { header: true, skipEmptyLines: true, transformHeader: (h: string) => h.trim() });
        data = result.data as Record<string, any>[];
      }

      if (data.length === 0) {
        toast({ title: 'Error', description: 'No data found in the file', variant: 'destructive' });
        return;
      }

      // Map CSV/Excel columns to social_security fields
      const mappedRecords = data.map((row) => {
        const getValue = (keys: string[]) => {
          for (const key of keys) {
            const found = Object.keys(row).find(k => k.toLowerCase().includes(key.toLowerCase()));
            if (found && row[found]) return String(row[found]).trim();
          }
          return '';
        };

        return {
          name: getValue(['name']),
          account_number: getValue(['account', 'acc']),
          address: getValue(['address', 'ppo']) || null,
          mobile_number: getValue(['mobile', 'phone', 'contact']) || null,
          scheme_type: schemeFilter !== 'all' ? schemeFilter : (getValue(['scheme', 'type']) || 'APY'),
          remarks: getValue(['remark', 'note']) || null,
          date: new Date().toISOString(),
        };
      }).filter(r => r.name && r.account_number);

      if (mappedRecords.length === 0) {
        toast({ title: 'Error', description: 'No valid records found. Ensure columns include Name and Account Number.', variant: 'destructive' });
        return;
      }

      // Insert in batches of 500
      const BATCH_SIZE = 500;
      let insertedCount = 0;
      for (let i = 0; i < mappedRecords.length; i += BATCH_SIZE) {
        const batch = mappedRecords.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('social_security').insert(batch);
        if (error) throw error;
        insertedCount += batch.length;
      }

      toast({ title: 'Success', description: `${insertedCount} record(s) uploaded successfully` });
      fetchRecords();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const schemeLabel = schemeFilter === 'all' ? 'All Schemes (APY/PMSBY/PMJJY/DLC)' : schemeFilter === 'DLC' ? 'DLC (Life Certificate)' : schemeFilter;
    const addressHeader = schemeFilter === 'DLC' ? 'PPO Number' : 'Address';

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Social Security Records - ${escapeHtml(schemeLabel)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #f4f4f4; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Social Security Records - ${escapeHtml(schemeLabel)}</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Account No.</th>
                <th>${escapeHtml(addressHeader)}</th>
                <th>Mobile</th>
                <th>Scheme</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRecords.map(record => `
                <tr>
                  <td>${escapeHtml(format(new Date(record.date), 'dd/MM/yyyy'))}</td>
                  <td>${escapeHtml(record.name)}</td>
                  <td>${escapeHtml(record.account_number)}</td>
                  <td>${escapeHtml(record.address || '-')}</td>
                  <td>${escapeHtml(record.mobile_number || '-')}</td>
                  <td>${escapeHtml(record.scheme_type)}</td>
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
      record.name.toLowerCase().includes(query) ||
      record.account_number.toLowerCase().includes(query) ||
      (record.address && record.address.toLowerCase().includes(query)) ||
      (record.mobile_number && record.mobile_number.toLowerCase().includes(query)) ||
      record.scheme_type.toLowerCase().includes(query)
    );
    const matchesScheme = schemeFilter === 'all' || record.scheme_type === schemeFilter;
    return matchesSearch && matchesScheme;
  });

  return (
    <PageWrapper
      title="Social Security"
      subtitle="Manage APY, PMSBY & PMJJY records"
      icon={<Calendar className="h-6 w-6" />}
    >
      <div className="space-y-6">
        {/* Top Actions Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-sidebar p-4 rounded-lg border">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sidebar-foreground/60" />
            <Input
              placeholder="Search by name, account, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
            />
          </div>
          <Select value={schemeFilter} onValueChange={setSchemeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by scheme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Schemes</SelectItem>
              <SelectItem value="APY">APY</SelectItem>
              <SelectItem value="PMSBY">PMSBY</SelectItem>
              <SelectItem value="PMJJY">PMJJY</SelectItem>
              <SelectItem value="DLC">DLC (Life Certificate)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <DownloadButton
            data={filteredRecords}
            currentData={filteredRecords}
            filename="social-security"
            label="Download"
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? 'Uploading...' : 'Browse'}
          </Button>
        </div>

        {/* Inline Form */}
        <div className="bg-card rounded-lg border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name (in words) *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Name is required' })}
                  placeholder="Enter name"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Account Number */}
              <div className="space-y-2">
                <Label htmlFor="account_number">Account No. (16 digits) *</Label>
                <Input
                  id="account_number"
                  {...register('account_number', {
                    required: 'Account number is required',
                    maxLength: { value: 16, message: 'Max 16 digits allowed' },
                    pattern: { value: /^\d+$/, message: 'Only numbers allowed' }
                  })}
                  placeholder="Enter account number"
                  maxLength={16}
                />
                {errors.account_number && (
                  <p className="text-sm text-destructive">{errors.account_number.message}</p>
                )}
              </div>

              {/* Address / PPO */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  {watch('scheme_type') === 'DLC' ? 'PPO Number' : 'Address'}
                </Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder={watch('scheme_type') === 'DLC' ? 'Enter PPO number' : 'Enter address'}
                />
              </div>

              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobile_number">Mobile No. (10 digits)</Label>
                <Input
                  id="mobile_number"
                  {...register('mobile_number', {
                    maxLength: { value: 10, message: 'Max 10 digits allowed' },
                    pattern: { value: /^\d*$/, message: 'Only numbers allowed' }
                  })}
                  placeholder="Enter mobile"
                  maxLength={10}
                />
                {errors.mobile_number && (
                  <p className="text-sm text-destructive">{errors.mobile_number.message}</p>
                )}
              </div>

              {/* Scheme Type */}
              <div className="space-y-2">
                <Label htmlFor="scheme_type">Scheme *</Label>
                <Select
                  value={watch('scheme_type')}
                  onValueChange={(value) => setValue('scheme_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APY">APY</SelectItem>
                    <SelectItem value="PMSBY">PMSBY</SelectItem>
                    <SelectItem value="PMJJY">PMJJY</SelectItem>
                    <SelectItem value="DLC">DLC (Life Certificate)</SelectItem>
                  </SelectContent>
                </Select>
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
                    reset({ date: new Date(), scheme_type: 'APY' });
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
                  <TableHead>Name</TableHead>
                  <TableHead>Account No.</TableHead>
                  <TableHead>{schemeFilter === 'DLC' ? 'PPO Number' : 'Address'}</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Scheme</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">No records found</TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell>{record.account_number}</TableCell>
                      <TableCell>{record.address || '-'}</TableCell>
                      <TableCell>{record.mobile_number || '-'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {record.scheme_type}
                        </span>
                      </TableCell>
                      <TableCell>{record.remarks || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                          >
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
    </PageWrapper>
  );
};

export default SocialSecurity;
