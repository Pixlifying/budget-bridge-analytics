
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
  amount_received: number;
  amount_given: number;
  last_balance: number;
  cash_in_hand: number;
  created_at?: string;
  updated_at?: string;
}

const OD = () => {
  const [records, setRecords] = useState<ODRecord[]>([]);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount_received: 0,
    amount_given: 0,
    last_balance: 0,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Calculate cash in hand automatically
  const cashInHand = formData.last_balance + formData.amount_received - formData.amount_given;

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
      setRecords(data || []);
      
      // Set last balance for new entries
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, last_balance: data[0].cash_in_hand }));
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
        amount_received: formData.amount_received,
        amount_given: formData.amount_given,
        last_balance: formData.last_balance,
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
      amount_received: record.amount_received,
      amount_given: record.amount_given,
      last_balance: record.last_balance,
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
      amount_received: 0,
      amount_given: 0,
      last_balance: latestCashInHand,
    });
    setEditingId(null);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const exportData = records.map(record => ({
      Date: format(new Date(record.date), 'dd/MM/yyyy'),
      'Amount Received': record.amount_received,
      'Amount Given': record.amount_given,
      'Last Balance': record.last_balance,
      'Cash in Hand': record.cash_in_hand,
    }));
    
    exportToExcel(exportData, 'od-records');
  };

  return (
    <PageWrapper title="Over Draft Management" description="Manage your overdraft transactions">
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-2 no-print">
          <Button onClick={handlePrint} variant="outline">
            <Printer size={16} className="mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline">
            <Download size={16} className="mr-2" />
            Download CSV
          </Button>
        </div>

        {/* Form */}
        <Card className="no-print">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit OD Record' : 'Add New OD Record'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Label htmlFor="amount_given">Amount Given</Label>
                  <Input
                    id="amount_given"
                    type="number"
                    step="0.01"
                    value={formData.amount_given}
                    onChange={(e) => setFormData({ ...formData, amount_given: parseFloat(e.target.value) || 0 })}
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
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cash in Hand (Auto-calculated)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={cashInHand}
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
          <CardHeader>
            <CardTitle>OD Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount Received</TableHead>
                    <TableHead>Amount Given</TableHead>
                    <TableHead>Last Balance</TableHead>
                    <TableHead>Cash in Hand</TableHead>
                    <TableHead className="no-print">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>₹{record.amount_received.toFixed(2)}</TableCell>
                      <TableCell>₹{record.amount_given.toFixed(2)}</TableCell>
                      <TableCell>₹{record.last_balance.toFixed(2)}</TableCell>
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
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No OD records found. Add your first record above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
  );
};

export default OD;
