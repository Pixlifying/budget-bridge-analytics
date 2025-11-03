import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Download, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';
import PageHeader from '@/components/layout/PageHeader';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import StatCard from '@/components/ui/StatCard';

interface UdharRecord {
  id: string;
  date: string;
  name: string;
  amount: number;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

const Udhar = () => {
  const [records, setRecords] = useState<UdharRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    name: '',
    amount: '',
    remarks: '',
  });

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('udhar_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast({
        title: "Error",
        description: "Failed to fetch records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.amount) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const recordData = {
        date: formData.date,
        name: formData.name.trim(),
        amount: parseFloat(formData.amount),
        remarks: formData.remarks.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('udhar_records')
          .update(recordData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Record updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('udhar_records')
          .insert([recordData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Record added successfully",
        });
      }

      resetForm();
      fetchRecords();
    } catch (error) {
      console.error('Error saving record:', error);
      toast({
        title: "Error",
        description: "Failed to save record",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: UdharRecord) => {
    setEditingId(record.id);
    setFormData({
      date: format(new Date(record.date), 'yyyy-MM-dd'),
      name: record.name,
      amount: record.amount.toString(),
      remarks: record.remarks || '',
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('udhar_records')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully",
      });

      fetchRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      toast({
        title: "Error",
        description: "Failed to delete record",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      name: '',
      amount: '',
      remarks: '',
    });
    setEditingId(null);
  };

  const handleDownload = () => {
    const dataToExport = records.map(record => ({
      Date: format(new Date(record.date), 'dd/MM/yyyy'),
      Name: record.name,
      Amount: record.amount,
      Remarks: record.remarks || '-',
    }));

    exportToExcel(dataToExport, 'udhar-records');
  };

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = records.reduce((sum, record) => sum + Number(record.amount), 0);

  return (
    <PageWrapper title="Money (Udhar)" subtitle="Manage money lending records">
      <div className="print:hidden">
        <PageHeader title="Money (Udhar)" />
      </div>

      <div className="space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          <StatCard
            title="Total Records"
            value={records.length.toString()}
          />
          <StatCard
            title="Total Amount"
            value={`₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <StatCard
            title="Average Amount"
            value={records.length > 0 ? `₹${(totalAmount / records.length).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 print:hidden">
          <Button onClick={handleDownload} variant="outline" className="gap-2">
            <Download size={16} />
            Download
          </Button>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer size={16} />
            Print
          </Button>
        </div>

        {/* Form Section */}
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Record' : 'Add New Record'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Enter remarks (optional)"
                    rows={1}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Save'}
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
          <CardHeader className="print:border-b">
            <CardTitle>Udhar Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No records found. Add your first record above.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="print:hidden text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{format(new Date(record.date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{record.name}</TableCell>
                      <TableCell className="text-right">
                        ₹{Number(record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{record.remarks || '-'}</TableCell>
                      <TableCell className="print:hidden text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(record)}
                          >
                            <Pencil size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(record.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmation
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Record"
        description="Are you sure you want to delete this record? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default Udhar;
