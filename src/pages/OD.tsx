import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { exportToExcel } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';

interface ODRecord {
  id: string;
  date: string;
  od_from_bank: number;
  last_balance: number;
  amount_received: number;
  amount_distributed: number;
  cash_in_hand: number;
  created_at?: string;
  updated_at?: string;
}

const OD = () => {
  const [records, setRecords] = useState<ODRecord[]>([]);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    od_from_bank: 0,
    last_balance: 0,
    amount_received: 0,
    amount_distributed: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [printDateRange, setPrintDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });
  const { toast } = useToast();

  // Calculate cash in hand using the formula: Last Balance + OD from Bank + Amount Received - Amount Distributed
  const cashInHand = formData.last_balance + formData.od_from_bank + formData.amount_received - formData.amount_distributed;

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('od_records')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the database fields to our interface, ensuring all required fields exist
      const mappedRecords: ODRecord[] = (data || []).map(record => ({
        id: record.id,
        date: record.date,
        od_from_bank: record.od_from_bank || 0,
        last_balance: record.last_balance,
        amount_received: record.amount_received,
        amount_distributed: record.amount_given || 0,
        cash_in_hand: record.cash_in_hand,
        created_at: record.created_at,
        updated_at: record.updated_at,
      }));
      
      setRecords(mappedRecords);
      
      // Set last balance for new entries
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
      };

      if (editingId) {
        const { error } = await supabase
          .from('od_records')
          .update({ ...recordData, updated_at: new Date().toISOString() })
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "OD record updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('od_records')
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

  const handleEdit = (record: ODRecord) => {
    setFormData({
      date: record.date,
      od_from_bank: record.od_from_bank,
      last_balance: record.last_balance,
      amount_received: record.amount_received,
      amount_distributed: record.amount_distributed,
    });
    setEditingId(record.id);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('od_records')
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
    });
    setEditingId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter records for print based on date range
  const filteredRecordsForPrint = records.filter(record => {
    const recordDate = new Date(record.date);
    const startDate = new Date(printDateRange.startDate);
    const endDate = new Date(printDateRange.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the end date fully
    return recordDate >= startDate && recordDate <= endDate;
  });

  const handleDownload = () => {
    const exportData = records.map(record => ({
      Date: format(new Date(record.date), 'dd/MM/yyyy'),
      'OD from Bank': record.od_from_bank,
      'Last Balance': record.last_balance,
      'Amount Received': record.amount_received,
      'Amount Distributed': record.amount_distributed,
      'Cash in Hand': record.cash_in_hand,
    }));
    
    exportToExcel(exportData, 'od-records');
  };

  return (
    <>
      <style>
        {`
          @media print {
            /* Set up page margins and size */
            @page {
              size: A4;
              margin: 1cm;
            }
            
            /* Hide all non-essential elements */
            .no-print, 
            aside,
            nav,
            header:not(.print-header),
            .sidebar,
            [class*="sidebar"],
            [data-sidebar],
            button:not(.print-button),
            .toast,
            .dialog,
            .modal {
              display: none !important;
            }
            
            /* Show only print content */
            .print-only {
              display: block !important;
            }
            
            /* Reset page styles for print */
            body, html {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: Arial, sans-serif !important;
              line-height: 1.4 !important;
            }
            
            /* Ensure main content takes full width */
            main {
              width: 100% !important;
              margin: 0 !important;
              padding: 10px !important;
              max-width: none !important;
            }
            
            /* Print title styling */
            .print-title {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              color: black !important;
              page-break-after: avoid;
            }
            
            /* Print date styling */
            .print-date {
              text-align: center;
              font-size: 12px;
              margin-bottom: 20px;
              color: black !important;
              page-break-after: avoid;
            }
            
            /* Table container for better page breaks */
            .print-table-container {
              width: 100% !important;
            }
            
            /* Table styling for print */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 0 !important;
              font-size: 10px !important;
            }
            
            /* Ensure table headers repeat on each page */
            thead {
              display: table-header-group !important;
            }
            
            /* Force table to break across pages properly */
            table {
              page-break-inside: auto !important;
            }
            
            tbody {
              display: table-row-group !important;
              page-break-inside: auto !important;
            }
            
            /* Table header styling */
            th {
              border: 1px solid black !important;
              padding: 6px 4px !important;
              text-align: center !important;
              color: black !important;
              font-size: 10px !important;
              font-weight: bold !important;
              background-color: #f0f0f0 !important;
              page-break-inside: avoid !important;
            }
            
            /* Table cell styling */
            td {
              border: 1px solid black !important;
              padding: 6px 4px !important;
              text-align: right !important;
              color: black !important;
              font-size: 10px !important;
              page-break-inside: avoid !important;
            }
            
            /* First column (date) align left */
            td:first-child {
              text-align: left !important;
            }
            
            /* Avoid breaking rows across pages */
            tr {
              page-break-inside: avoid !important;
            }
            
            /* Table body styling */
            tbody {
              display: table-row-group !important;
            }
            
            /* Zebra striping for better readability */
            tbody tr:nth-child(even) {
              background-color: #f9f9f9 !important;
            }
            
            /* Force page break every 20 rows to ensure content fits */
            tbody tr:nth-child(20n) {
              page-break-after: always !important;
            }
            
            /* Print summary styling */
            .print-summary {
              margin-top: 15px;
              padding: 8px;
              border: 1px solid black;
              background-color: #f0f0f0;
              page-break-inside: avoid !important;
              font-size: 11px !important;
            }
            
            .print-summary h3 {
              margin: 0 0 8px 0 !important;
              font-size: 14px !important;
              font-weight: bold !important;
            }
            
            .print-summary p {
              margin: 3px 0 !important;
              font-size: 11px !important;
            }
            
            /* Ensure proper page breaks */
            .page-break-before {
              page-break-before: always !important;
            }
            
            .page-break-after {
              page-break-after: always !important;
            }
            
            /* Avoid orphaned headers */
            .print-header-section {
              page-break-after: avoid !important;
            }
          }
          
          .print-only {
            display: none;
          }
        `}
      </style>
      
      <PageWrapper title="Over Draft Management">
        <div className="space-y-6">
          {/* Print Header - Only visible when printing */}
          <div className="print-only print-header-section">
            <h1 className="print-title">Over Draft Records</h1>
            <p className="print-date">
              Period: {format(new Date(printDateRange.startDate), 'dd/MM/yyyy')} to {format(new Date(printDateRange.endDate), 'dd/MM/yyyy')} | Generated on: {format(new Date(), 'dd/MM/yyyy HH:mm')}
            </p>
          </div>

          {/* Print Date Range and Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 no-print">
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="print-start-date" className="text-sm">From Date</Label>
                  <Input
                    id="print-start-date"
                    type="date"
                    value={printDateRange.startDate}
                    onChange={(e) => setPrintDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-36"
                  />
                </div>
                <div>
                  <Label htmlFor="print-end-date" className="text-sm">To Date</Label>
                  <Input
                    id="print-end-date"
                    type="date"
                    value={printDateRange.endDate}
                    onChange={(e) => setPrintDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-36"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint} variant="outline">
                  <Printer size={16} className="mr-2" />
                  Print ({filteredRecordsForPrint.length} records)
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download size={16} className="mr-2" />
                  Download CSV
                </Button>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="no-print">
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
                      type="number"
                      step="0.01"
                      value={cashInHand.toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
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
            <CardHeader className="no-print">
              <CardTitle>OD Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto print-table-container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>OD from Bank</TableHead>
                      <TableHead>Last Balance</TableHead>
                      <TableHead>Amount Received</TableHead>
                      <TableHead>Amount Distributed</TableHead>
                      <TableHead>Cash in Hand</TableHead>
                      <TableHead className="no-print">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Show filtered records for print, all records for screen */}
                    {(typeof window !== 'undefined' && window.matchMedia && window.matchMedia('print').matches ? filteredRecordsForPrint : records).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>₹{record.od_from_bank.toFixed(2)}</TableCell>
                        <TableCell>₹{record.last_balance.toFixed(2)}</TableCell>
                        <TableCell>₹{record.amount_received.toFixed(2)}</TableCell>
                        <TableCell>₹{record.amount_distributed.toFixed(2)}</TableCell>
                        <TableCell>₹{record.cash_in_hand.toFixed(2)}</TableCell>
                        <TableCell className="no-print">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(record)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
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
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No OD records found. Add your first record above.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Print Summary */}
              <div className="print-only print-summary">
                <h3 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: 'bold' }}>Summary</h3>
                <p>Total Records: {filteredRecordsForPrint.length}</p>
                {filteredRecordsForPrint.length > 0 && (
                  <>
                    <p>Latest Cash in Hand: ₹{filteredRecordsForPrint[0]?.cash_in_hand.toFixed(2)}</p>
                    <p>Total Amount Received: ₹{filteredRecordsForPrint.reduce((sum, record) => sum + record.amount_received, 0).toFixed(2)}</p>
                    <p>Total Amount Distributed: ₹{filteredRecordsForPrint.reduce((sum, record) => sum + record.amount_distributed, 0).toFixed(2)}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

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
      </PageWrapper>
    </>
  );
};

export default OD;
