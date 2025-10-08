import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { Calendar, Plus, Printer, Download, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface SocialSecurityForm {
  date: Date;
  name: string;
  account_number: string;
  address?: string;
  scheme_type: string;
  remarks?: string;
}

interface SocialSecurityRecord {
  id: string;
  date: string;
  name: string;
  account_number: string;
  address: string;
  scheme_type: string;
  remarks: string;
  created_at: string;
}

const SocialSecurity = () => {
  const [records, setRecords] = useState<SocialSecurityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<SocialSecurityForm>({
    defaultValues: {
      date: new Date(),
      scheme_type: 'PMSBY'
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

      reset({ date: new Date(), scheme_type: 'PMSBY' });
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

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Social Security Records</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f4f4f4; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Social Security Records</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Account No.</th>
                <th>Address</th>
                <th>Scheme</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(record => `
                <tr>
                  <td>${format(new Date(record.date), 'dd/MM/yyyy')}</td>
                  <td>${record.name}</td>
                  <td>${record.account_number}</td>
                  <td>${record.address || '-'}</td>
                  <td>${record.scheme_type}</td>
                  <td>${record.remarks || '-'}</td>
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

  return (
    <PageWrapper
      title="Social Security"
      subtitle="Manage PMSBY & PMJJY records"
      icon={<Calendar className="h-6 w-6" />}
    >
      <div className="space-y-6">
        {/* Form */}
        <div className="bg-card rounded-lg border p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
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
                <Label htmlFor="account_number">Account No. (max 16 digits) *</Label>
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

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="Enter address (optional)"
                />
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
                    <SelectItem value="PMSBY">PMSBY</SelectItem>
                    <SelectItem value="PMJJY">PMJJY</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Remarks */}
              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  {...register('remarks')}
                  placeholder="Enter remarks (optional)"
                  rows={1}
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
                    reset({ date: new Date(), scheme_type: 'PMSBY' });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <DownloadButton
            data={records}
            currentData={records}
            filename="social-security"
            label="Download"
          />
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
                  <TableHead>Address</TableHead>
                  <TableHead>Scheme</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">No records found</TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell>{record.account_number}</TableCell>
                      <TableCell>{record.address || '-'}</TableCell>
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
