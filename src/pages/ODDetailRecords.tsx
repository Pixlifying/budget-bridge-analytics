import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { exportToExcel } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';

interface ODDetailRecord {
  id: string;
  date: string;
  od_from_bank: number;
  last_balance: number;
  amount_received: number;
  amount_distributed: number;
  cash_in_hand: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

const RECORDS_PER_PAGE = 15;

const ODDetailRecords = () => {
  const [records, setRecords] = useState<ODDetailRecord[]>([]);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    od_from_bank: 0,
    last_balance: 0,
    amount_received: 0,
    amount_distributed: 0,
    remarks: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [printMode, setPrintMode] = useState<'range' | 'month'>('range');
  const [printDateRange, setPrintDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const [printMonth, setPrintMonth] = useState(format(new Date(), 'yyyy-MM'));
  const { toast } = useToast();

  const cashInHand = formData.last_balance + formData.od_from_bank + formData.amount_received - formData.amount_distributed;

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('od_detail_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedRecords: ODDetailRecord[] = (data || []).map(record => ({
        id: record.id,
        date: record.date,
        od_from_bank: record.od_from_bank || 0,
        last_balance: record.last_balance,
        amount_received: record.amount_received,
        amount_distributed: record.amount_given || 0,
        cash_in_hand: record.cash_in_hand,
        remarks: record.remarks || '',
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));
      
      setRecords(mappedRecords);
      
      if (mappedRecords.length > 0) {
        setFormData(prev => ({ ...prev, last_balance: mappedRecords[0].cash_in_hand }));
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch OD records",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const recordData = {
        date: formData.date,
        od_from_bank: formData.od_from_bank,
        last_balance: formData.last_balance,
        amount_received: formData.amount_received,
        amount_given: formData.amount_distributed,
        cash_in_hand: cashInHand,
        remarks: formData.remarks || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('od_detail_records')
          .update({ ...recordData, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "OD record updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('od_detail_records')
          .insert([recordData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "OD record added successfully",
        });
      }

      await fetchRecords();
      resetForm();
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: "Error",
        description: "Failed to save OD record",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (record: ODDetailRecord) => {
    setFormData({
      date: record.date,
      od_from_bank: record.od_from_bank,
      last_balance: record.last_balance,
      amount_received: record.amount_received,
      amount_distributed: record.amount_distributed,
      remarks: record.remarks || '',
    });
    setEditingId(record.id);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('od_detail_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "OD record deleted successfully",
      });
      
      await fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete OD record",
        variant: "destructive",
      });
    }
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const resetForm = () => {
    const latestCashInHand = records.length > 0 ? records[0].cash_in_hand : 0;
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      od_from_bank: 0,
      last_balance: latestCashInHand,
      amount_received: 0,
      amount_distributed: 0,
      remarks: '',
    });
    setEditingId(null);
  };

  const getFilteredRecordsForPrint = () => {
    let startDate: Date, endDate: Date;
    
    if (printMode === 'month') {
      const [year, month] = printMonth.split('-').map(Number);
      const selectedDate = new Date(year, month - 1, 1);
      startDate = startOfMonth(selectedDate);
      endDate = endOfMonth(selectedDate);
    } else {
      startDate = new Date(printDateRange.startDate);
      endDate = new Date(printDateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
    }
    
    // Filter records by date range and sort by date ascending, then by created_at ascending
    // This ensures records are printed in the exact order they were entered date-wise
    return records
      .filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      })
      .sort((a, b) => {
        // First sort by date (ascending - oldest first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        dateA.setHours(0, 0, 0, 0);
        dateB.setHours(0, 0, 0, 0);
        const dateCompare = dateA.getTime() - dateB.getTime();
        if (dateCompare !== 0) return dateCompare;
        // If same date, sort by created_at to maintain exact insertion order
        const createdA = new Date(a.created_at || 0).getTime();
        const createdB = new Date(b.created_at || 0).getTime();
        return createdA - createdB;
      });
  };

  const handlePrint = () => {
    const filteredRecords = getFilteredRecordsForPrint();
    const recordsPerPage = 20; // More records per full A4 page
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    
    let dateRangeText = '';
    if (printMode === 'month') {
      const [year, month] = printMonth.split('-').map(Number);
      dateRangeText = format(new Date(year, month - 1, 1), 'MMMM yyyy');
    } else {
      dateRangeText = `${format(new Date(printDateRange.startDate), 'dd/MM/yyyy')} to ${format(new Date(printDateRange.endDate), 'dd/MM/yyyy')}`;
    }
    
    const totalODFromBank = filteredRecords.reduce((sum, r) => sum + r.od_from_bank, 0);
    const totalReceived = filteredRecords.reduce((sum, r) => sum + r.amount_received, 0);
    const totalDistributed = filteredRecords.reduce((sum, r) => sum + r.amount_distributed, 0);
    
    let pagesHtml = '';
    for (let page = 0; page < totalPages; page++) {
      const pageRecords = filteredRecords.slice(page * recordsPerPage, (page + 1) * recordsPerPage);
      
      pagesHtml += `
        <div class="print-page" ${page > 0 ? 'style="page-break-before: always;"' : ''}>
          <div class="header">
            <h1>OD Records</h1>
            <p class="subtitle">Period: ${dateRangeText}</p>
            <p class="page-info">Page ${page + 1} of ${totalPages} | Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">S.No</th>
                <th style="width: 12%;">Date</th>
                <th style="width: 13%;">OD from Bank</th>
                <th style="width: 13%;">Last Balance</th>
                <th style="width: 14%;">Amount Received</th>
                <th style="width: 14%;">Amount Distributed</th>
                <th style="width: 13%;">Cash in Hand</th>
                <th style="width: 16%;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${pageRecords.map((record, idx) => `
                <tr>
                  <td style="text-align: center;">${page * recordsPerPage + idx + 1}</td>
                  <td style="text-align: center;">${format(new Date(record.date), 'dd/MM/yyyy')}</td>
                  <td style="text-align: right;">₹${record.od_from_bank.toLocaleString('en-IN')}</td>
                  <td style="text-align: right;">₹${record.last_balance.toLocaleString('en-IN')}</td>
                  <td style="text-align: right;">₹${record.amount_received.toLocaleString('en-IN')}</td>
                  <td style="text-align: right;">₹${record.amount_distributed.toLocaleString('en-IN')}</td>
                  <td style="text-align: right; font-weight: 600;">₹${record.cash_in_hand.toLocaleString('en-IN')}</td>
                  <td style="text-align: left;">${record.remarks || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${page === totalPages - 1 ? `
            <div class="summary">
              <h3>Summary</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="label">Total Records:</span>
                  <span class="value">${filteredRecords.length}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Total OD from Bank:</span>
                  <span class="value">₹${totalODFromBank.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Total Amount Received:</span>
                  <span class="value">₹${totalReceived.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Total Amount Distributed:</span>
                  <span class="value">₹${totalDistributed.toLocaleString('en-IN')}</span>
                </div>
                <div class="summary-item highlight">
                  <span class="label">Final Cash in Hand:</span>
                  <span class="value">₹${filteredRecords.length > 0 ? filteredRecords[filteredRecords.length - 1].cash_in_hand.toLocaleString('en-IN') : '0'}</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OD Records - ${dateRangeText}</title>
        <style>
          @page { 
            size: A4 portrait; 
            margin: 15mm 10mm 15mm 10mm;
          }
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 12px; 
            line-height: 1.5; 
            color: #333;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-page { 
            width: 100%;
            min-height: 100%;
            padding: 0;
          }
          .header { 
            text-align: center; 
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #333;
          }
          .header h1 { 
            font-size: 28px; 
            font-weight: 700;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .header .subtitle { 
            font-size: 16px; 
            color: #444;
            font-weight: 500;
          }
          .page-info { 
            font-size: 11px; 
            color: #666; 
            margin-top: 8px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #444; 
            padding: 10px 8px; 
          }
          th { 
            background-color: #2c3e50 !important; 
            color: white !important;
            font-weight: 600; 
            text-align: center;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          tbody tr:nth-child(even) { 
            background-color: #f8f9fa !important; 
          }
          tbody tr:hover { 
            background-color: #e9ecef !important; 
          }
          .summary { 
            margin-top: 25px; 
            padding: 20px; 
            border: 2px solid #2c3e50; 
            background-color: #f8f9fa !important;
            border-radius: 8px;
          }
          .summary h3 { 
            font-size: 18px; 
            margin-bottom: 15px;
            color: #2c3e50;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #2c3e50;
            padding-bottom: 8px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            background: white;
            border-radius: 4px;
            border: 1px solid #ddd;
          }
          .summary-item .label {
            font-weight: 500;
            color: #555;
          }
          .summary-item .value {
            font-weight: 700;
            color: #2c3e50;
          }
          .summary-item.highlight {
            background: #2c3e50 !important;
            grid-column: span 2;
          }
          .summary-item.highlight .label,
          .summary-item.highlight .value {
            color: white !important;
            font-size: 14px;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-page {
              page-break-inside: avoid;
            }
            th { 
              background-color: #2c3e50 !important; 
              color: white !important;
            }
            tbody tr:nth-child(even) { 
              background-color: #f8f9fa !important; 
            }
            .summary {
              background-color: #f8f9fa !important;
            }
            .summary-item.highlight {
              background: #2c3e50 !important;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    const exportData = records.map(record => ({
      Date: format(new Date(record.date), 'dd/MM/yyyy'),
      'OD from Bank': record.od_from_bank,
      'Last Balance': record.last_balance,
      'Amount Received': record.amount_received,
      'Amount Distributed': record.amount_distributed,
      'Cash in Hand': record.cash_in_hand,
      'Remarks': record.remarks || '',
    }));
    
    exportToExcel(exportData, 'od-detail-records');
  };

  const filteredRecordsForPrint = getFilteredRecordsForPrint();

  return (
    <PageWrapper title="OD Records">
      <div className="space-y-6">
        {/* Print Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Print & Download Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <Label htmlFor="print-mode">Print Mode</Label>
                  <Select value={printMode} onValueChange={(value: 'range' | 'month') => setPrintMode(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="range">Date Range</SelectItem>
                      <SelectItem value="month">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {printMode === 'range' ? (
                  <>
                    <div>
                      <Label htmlFor="print-start-date">From Date</Label>
                      <Input
                        id="print-start-date"
                        type="date"
                        value={printDateRange.startDate}
                        onChange={(e) => setPrintDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-40"
                      />
                    </div>
                    <div>
                      <Label htmlFor="print-end-date">To Date</Label>
                      <Input
                        id="print-end-date"
                        type="date"
                        value={printDateRange.endDate}
                        onChange={(e) => setPrintDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-40"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <Label htmlFor="print-month">Select Month</Label>
                    <Input
                      id="print-month"
                      type="month"
                      value={printMonth}
                      onChange={(e) => setPrintMonth(e.target.value)}
                      className="w-44"
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={handlePrint} variant="outline">
                    <Printer size={16} className="mr-2" />
                    Print ({filteredRecordsForPrint.length} records)
                  </Button>
                  <Button onClick={handleDownload} variant="outline">
                    <Download size={16} className="mr-2" />
                    Download All
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit OD Record' : 'Add New OD Record'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="od_from_bank">OD from Bank</Label>
                  <Input
                    id="od_from_bank"
                    type="number"
                    step="0.01"
                    value={formData.od_from_bank}
                    onChange={(e) => setFormData({ ...formData, od_from_bank: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="last_balance">Last Balance</Label>
                  <Input
                    id="last_balance"
                    type="number"
                    step="0.01"
                    value={formData.last_balance}
                    onChange={(e) => setFormData({ ...formData, last_balance: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount_received">Amount Received</Label>
                  <Input
                    id="amount_received"
                    type="number"
                    step="0.01"
                    value={formData.amount_received}
                    onChange={(e) => setFormData({ ...formData, amount_received: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount_distributed">Amount Distributed</Label>
                  <Input
                    id="amount_distributed"
                    type="number"
                    step="0.01"
                    value={formData.amount_distributed}
                    onChange={(e) => setFormData({ ...formData, amount_distributed: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                
                <div>
                  <Label>Cash in Hand (Auto-calculated)</Label>
                  <Input
                    type="text"
                    value={`₹${cashInHand.toLocaleString('en-IN')}`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="remarks">Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Enter any remarks..."
                  className="resize-none"
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  <Plus size={16} className="mr-2" />
                  {editingId ? 'Update Record' : 'Add Record'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>OD Records ({records.length} total)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">OD from Bank</TableHead>
                    <TableHead className="text-right">Last Balance</TableHead>
                    <TableHead className="text-right">Amount Received</TableHead>
                    <TableHead className="text-right">Amount Distributed</TableHead>
                    <TableHead className="text-right">Cash in Hand</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">₹{record.od_from_bank.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{record.last_balance.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{record.amount_received.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right">₹{record.amount_distributed.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-right font-semibold">₹{record.cash_in_hand.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="max-w-32 truncate">{record.remarks || '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(record)}>
                            <Edit size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive"
                            onClick={() => setDeleteConfirm({ isOpen: true, id: record.id })}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {records.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No records found. Add your first OD record above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirm.isOpen} onOpenChange={(open) => setDeleteConfirm({ isOpen: open, id: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete OD Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this OD record? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageWrapper>
  );
};

export default ODDetailRecords;
