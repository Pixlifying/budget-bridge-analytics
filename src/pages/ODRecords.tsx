import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Printer, Download, Plus, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageWrapper from '@/components/layout/PageWrapper';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';

interface ODRecord {
  id: string;
  amount_received: number;
  amount_given: number;
  cash_in_hand: number;
  last_balance: number;
  od_from_bank: number;
  date: string;
  created_at: string;
}

const ODRecords = () => {
  const [records, setRecords] = useState<ODRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'day' | 'month' | 'year'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Form state - use selected date from filter
  const [formData, setFormData] = useState({
    last_balance: 0,
    amount_received: '',
    amount_given: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  // Edit state
  const [editingRecord, setEditingRecord] = useState<ODRecord | null>(null);
  const [editFormData, setEditFormData] = useState({
    last_balance: 0,
    amount_received: '',
    amount_given: '',
    date: ''
  });

  // Delete state
  const [deletingRecord, setDeletingRecord] = useState<ODRecord | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase.from('od_records').select('*');

      if (filterMode === 'day') {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      } else if (filterMode === 'month') {
        const startOfMonth = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), 'yyyy-MM-dd');
        const endOfMonth = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd');
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      } else if (filterMode === 'year') {
        const startOfYear = format(new Date(selectedDate.getFullYear(), 0, 1), 'yyyy-MM-dd');
        const endOfYear = format(new Date(selectedDate.getFullYear(), 11, 31), 'yyyy-MM-dd');
        query = query.gte('date', startOfYear).lte('date', endOfYear);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching OD records:', error);
      toast.error('Failed to fetch over draft records');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, filterMode]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Update form date when selectedDate changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      date: format(selectedDate, 'yyyy-MM-dd')
    }));
  }, [selectedDate]);

  // Optimized real-time subscription with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const channel = supabase
      .channel('od_records_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'od_records'
        },
        () => {
          // Debounce the fetch to avoid multiple rapid calls
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            fetchRecords();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [fetchRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount_received && !formData.amount_given) {
      toast.error('Please enter at least one amount');
      return;
    }

    const lastBalance = parseFloat(formData.last_balance.toString()) || 0;
    const receivedAmount = parseFloat(formData.amount_received) || 0;
    const givenAmount = parseFloat(formData.amount_given) || 0;
    const calculatedCashInHand = lastBalance + receivedAmount - givenAmount;

    try {
      const { data, error } = await supabase.from('od_records').insert({
        last_balance: lastBalance,
        amount_received: receivedAmount,
        amount_given: givenAmount,
        cash_in_hand: calculatedCashInHand,
        date: formData.date
      }).select();

      if (error) throw error;

      toast.success('Over draft record added successfully');
      
      // Add the new record to the current view immediately if it matches the filter
      if (data && data.length > 0) {
        const newRecord = data[0];
        const recordDate = new Date(newRecord.date);
        const shouldShowInCurrentView = 
          (filterMode === 'day' && format(recordDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')) ||
          (filterMode === 'month' && recordDate.getMonth() === selectedDate.getMonth() && recordDate.getFullYear() === selectedDate.getFullYear()) ||
          (filterMode === 'year' && recordDate.getFullYear() === selectedDate.getFullYear());

        if (shouldShowInCurrentView) {
          setRecords(prev => [newRecord, ...prev]);
        }

        // Update the filter date to match the new record's date
        if (formData.date !== format(selectedDate, 'yyyy-MM-dd')) {
          setSelectedDate(new Date(formData.date));
        }
      }

      setFormData({
        last_balance: 0,
        amount_received: '',
        amount_given: '',
        date: format(selectedDate, 'yyyy-MM-dd') // Reset to selected date
      });
    } catch (error) {
      console.error('Error adding OD record:', error);
      toast.error('Failed to add over draft record');
    }
  };

  const handleEdit = (record: ODRecord) => {
    setEditingRecord(record);
    setEditFormData({
      last_balance: record.last_balance || 0,
      amount_received: record.amount_received.toString(),
      amount_given: record.amount_given.toString(),
      date: record.date
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRecord) return;

    if (!editFormData.amount_received && !editFormData.amount_given) {
      toast.error('Please enter at least one amount');
      return;
    }

    const lastBalance = parseFloat(editFormData.last_balance.toString()) || 0;
    const receivedAmount = parseFloat(editFormData.amount_received) || 0;
    const givenAmount = parseFloat(editFormData.amount_given) || 0;
    const calculatedCashInHand = lastBalance + receivedAmount - givenAmount;

    try {
      const { error } = await supabase
        .from('od_records')
        .update({
          last_balance: lastBalance,
          amount_received: receivedAmount,
          amount_given: givenAmount,
          cash_in_hand: calculatedCashInHand,
          date: editFormData.date
        })
        .eq('id', editingRecord.id);

      if (error) throw error;

      toast.success('Over draft record updated successfully');
      setEditingRecord(null);
      setEditFormData({
        last_balance: 0,
        amount_received: '',
        amount_given: '',
        date: ''
      });
    } catch (error) {
      console.error('Error updating OD record:', error);
      toast.error('Failed to update over draft record');
    }
  };

  const handleDelete = (record: ODRecord) => {
    setDeletingRecord(record);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deletingRecord) return;

    try {
      const { error } = await supabase
        .from('od_records')
        .delete()
        .eq('id', deletingRecord.id);

      if (error) throw error;

      toast.success('Over draft record deleted successfully');
      setShowDeleteDialog(false);
      setDeletingRecord(null);
    } catch (error) {
      console.error('Error deleting OD record:', error);
      toast.error('Failed to delete over draft record');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInputChange = (field: string, value: string | number) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalReceived = records.reduce((sum, record) => sum + record.amount_received, 0);
  const totalGiven = records.reduce((sum, record) => sum + record.amount_given, 0);
  const totalCashInHand = records.reduce((sum, record) => sum + record.cash_in_hand, 0);
  const totalLastBalance = records.reduce((sum, record) => sum + (record.last_balance || 0), 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const periodText = filterMode === 'day' 
      ? format(selectedDate, 'dd MMM yyyy')
      : filterMode === 'month'
      ? format(selectedDate, 'MMMM yyyy')
      : format(selectedDate, 'yyyy');

    // Sort records in chronological order (oldest first) for printing
    const sortedRecords = [...records].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      // If dates are same, sort by creation time
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Over Draft Records Report - ${periodText}</title>
          <style>
            @page { 
              size: A4; 
              margin: 15mm; 
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 11px; 
              line-height: 1.4;
              margin: 0;
              padding: 0;
            }
            h1 { 
              text-align: center; 
              margin-bottom: 15px; 
              font-size: 18px;
              page-break-after: avoid;
            }
            .summary { 
              margin-bottom: 15px; 
              padding: 8px; 
              border: 1px solid #ddd; 
              background: #f9f9f9;
              page-break-after: avoid;
            }
            .summary p {
              margin: 4px 0;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              page-break-inside: auto;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 6px 4px; 
              text-align: left; 
              font-size: 10px;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
              page-break-after: avoid;
            }
            tr {
              page-break-inside: avoid;
            }
            tbody tr:nth-child(20n) {
              page-break-after: auto;
            }
            .text-right { 
              text-align: right; 
            }
            .print-date { 
              text-align: right; 
              margin-bottom: 8px; 
              font-size: 9px; 
              color: #666;
            }
            .page-header {
              display: table-header-group;
            }
            .page-footer {
              display: table-footer-group;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; }
              .no-print { display: none !important; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
              tbody tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="print-date">Printed on: ${format(new Date(), 'dd MMM yyyy, HH:mm')} | Total Records: ${sortedRecords.length}</div>
          <h1>Over Draft Records Report - ${periodText}</h1>
          <div class="summary">
            <p><strong>Total OD from Bank:</strong> ₹${totalLastBalance.toFixed(2)}</p>
            <p><strong>Total Amount Received:</strong> ₹${totalReceived.toFixed(2)}</p>
            <p><strong>Total Amount Given:</strong> ₹${totalGiven.toFixed(2)}</p>
            <p><strong>Net Cash in Hand:</strong> ₹${totalCashInHand.toFixed(2)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 6%;">S.No</th>
                <th style="width: 15%;">Date</th>
                <th style="width: 15%;">Last Balance</th>
                <th style="width: 15%;">OD Received</th>
                <th style="width: 15%;">Amount Received</th>
                <th style="width: 15%;">Amount Given</th>
                <th style="width: 19%;">Cash in Hand</th>
              </tr>
            </thead>
            <tbody>
              ${sortedRecords.map((record, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(new Date(record.date), 'dd MMM yyyy')}</td>
                  <td class="text-right">₹${(record.last_balance || 0).toFixed(2)}</td>
                  <td class="text-right">₹${(record.od_from_bank || 0).toFixed(2)}</td>
                  <td class="text-right">₹${record.amount_received.toFixed(2)}</td>
                  <td class="text-right">₹${record.amount_given.toFixed(2)}</td>
                  <td class="text-right">₹${record.cash_in_hand.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  const handleDownload = () => {
    // Sort records in chronological order for download as well
    const sortedRecords = [...records].sort((a, b) => {
      const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const csvContent = [
      'S.No,Date,Last Balance,OD Received,Amount Received,Amount Given,Cash in Hand',
      ...sortedRecords.map((record, index) => 
        `${index + 1},${format(new Date(record.date), 'yyyy-MM-dd')},${record.last_balance || 0},${record.od_from_bank || 0},${record.amount_received},${record.amount_given},${record.cash_in_hand}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `over-draft-records-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully');
  };

  const lastBalance = parseFloat(formData.last_balance.toString()) || 0;
  const receivedAmount = parseFloat(formData.amount_received) || 0;
  const givenAmount = parseFloat(formData.amount_given) || 0;
  const previewCashInHand = lastBalance + receivedAmount - givenAmount;

  const editLastBalance = parseFloat(editFormData.last_balance.toString()) || 0;
  const editReceivedAmount = parseFloat(editFormData.amount_received) || 0;
  const editGivenAmount = parseFloat(editFormData.amount_given) || 0;
  const editPreviewCashInHand = editLastBalance + editReceivedAmount - editGivenAmount;

  return (
    <PageWrapper title="Over Drafts">
      <PageHeader title="Over Drafts" />

      {/* Add Record Form */}
      <Card className="mb-6 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={20} />
            Add New Over Draft Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="last_balance">OD from Bank (₹)</Label>
              <Input
                id="last_balance"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.last_balance}
                onChange={(e) => handleInputChange('last_balance', Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="amount_received">Amount Received (₹)</Label>
              <Input
                id="amount_received"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount_received}
                onChange={(e) => handleInputChange('amount_received', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="amount_given">Amount Given (₹)</Label>
              <Input
                id="amount_given"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount_given}
                onChange={(e) => handleInputChange('amount_given', e.target.value)}
              />
            </div>

            <Button type="submit" className="hover-scale">Add Record</Button>
          </form>
          
          {(lastBalance > 0 || receivedAmount > 0 || givenAmount > 0) && (
            <div className="mt-4 p-3 bg-muted rounded-md animate-fade-in">
              <p className="text-sm text-muted-foreground">
                Preview Cash in Hand: <span className={`font-semibold ${previewCashInHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{previewCashInHand.toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Actions */}
      <Card className="mb-6 animate-fade-in">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Over Draft Records</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterMode} onValueChange={(value: 'day' | 'month' | 'year') => setFilterMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-64 justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 
                      filterMode === 'day' ? 'PPP' : 
                      filterMode === 'month' ? 'MMMM yyyy' : 
                      'yyyy'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button onClick={handlePrint} variant="outline" size="sm" className="hover-scale">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>

              <Button onClick={handleDownload} variant="outline" size="sm" className="hover-scale">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="animate-scale-in">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total OD from Bank</div>
                <div className="text-2xl font-bold text-blue-600">₹{totalLastBalance.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Received</div>
                <div className="text-2xl font-bold text-green-600">₹{totalReceived.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Total Given</div>
                <div className="text-2xl font-bold text-red-600">₹{totalGiven.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="animate-scale-in">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Net Cash in Hand</div>
                <div className={`text-2xl font-bold ${totalCashInHand >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ₹{totalCashInHand.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Records Table */}
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No over draft records found for the selected period
            </div>
          ) : (
            <div className="overflow-x-auto animate-fade-in">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">OD from Bank</TableHead>
                    <TableHead className="text-right">Amount Received</TableHead>
                    <TableHead className="text-right">Amount Given</TableHead>
                    <TableHead className="text-right">Cash in Hand</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className="hover-scale">
                      <TableCell>{format(new Date(record.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right text-blue-600">
                        ₹{(record.last_balance || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ₹{record.amount_received.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ₹{record.amount_given.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${record.cash_in_hand >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₹{record.cash_in_hand.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Over Draft Record</DialogTitle>
            <DialogDescription>
              Make changes to the over draft record. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_date" className="text-right">
                  Date
                </Label>
                <Input
                  id="edit_date"
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => handleEditInputChange('date', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_last_balance" className="text-right">
                  OD from Bank
                </Label>
                <Input
                  id="edit_last_balance"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editFormData.last_balance}
                  onChange={(e) => handleEditInputChange('last_balance', Number(e.target.value))}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_amount_received" className="text-right">
                  Amount Received
                </Label>
                <Input
                  id="edit_amount_received"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editFormData.amount_received}
                  onChange={(e) => handleEditInputChange('amount_received', e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit_amount_given" className="text-right">
                  Amount Given
                </Label>
                <Input
                  id="edit_amount_given"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={editFormData.amount_given}
                  onChange={(e) => handleEditInputChange('amount_given', e.target.value)}
                  className="col-span-3"
                />
              </div>
              {(editLastBalance > 0 || editReceivedAmount > 0 || editGivenAmount > 0) && (
                <div className="col-span-4 p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Preview Cash in Hand: <span className={`font-semibold ${editPreviewCashInHand >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{editPreviewCashInHand.toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingRecord(null)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingRecord(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Over Draft Record"
        description={`Are you sure you want to delete this over draft record from ${deletingRecord ? format(new Date(deletingRecord.date), 'dd MMM yyyy') : ''}? This action cannot be undone.`}
      />
    </PageWrapper>
  );
};

export default ODRecords;
