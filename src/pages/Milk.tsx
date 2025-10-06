import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { exportToExcel, exportToPDF } from '@/utils/calculateUtils';
import PageWrapper from '@/components/layout/PageWrapper';
import { Checkbox } from '@/components/ui/checkbox';

interface MilkRecord {
  id: string;
  date: string;
  milk_amount: number;
  received: boolean;
  amount_per_litre: number;
  total: number;
  created_at?: string;
}

const Milk = () => {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form state for new record
  const [newRecord, setNewRecord] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    milk_amount: '',
    received: false,
    amount_per_litre: '',
  });

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('milk_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching milk records:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch milk records',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSave = async () => {
    if (!newRecord.milk_amount || !newRecord.amount_per_litre) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('milk_records').insert({
        date: newRecord.date,
        milk_amount: parseFloat(newRecord.milk_amount),
        received: newRecord.received,
        amount_per_litre: parseFloat(newRecord.amount_per_litre),
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Milk record saved successfully',
      });

      // Reset form
      setNewRecord({
        date: format(new Date(), 'yyyy-MM-dd'),
        milk_amount: '',
        received: false,
        amount_per_litre: '',
      });

      fetchRecords();
    } catch (error) {
      console.error('Error saving milk record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save milk record',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('milk_records').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Milk record deleted successfully',
      });

      fetchRecords();
    } catch (error) {
      console.error('Error deleting milk record:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete milk record',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = () => {
    if (records.length === 0) {
      toast({
        title: 'No Data',
        description: 'No records to download',
        variant: 'destructive',
      });
      return;
    }

    const formattedData = records.map((record) => ({
      Date: format(new Date(record.date), 'dd/MM/yyyy'),
      'Milk Amount (Litres)': record.milk_amount,
      Received: record.received ? 'Yes' : 'No',
      'Amount per Litre (₹)': record.amount_per_litre,
      'Total (₹)': record.total,
    }));

    exportToExcel(formattedData, `milk_records_${format(new Date(), 'yyyy-MM-dd')}`);

    toast({
      title: 'Success',
      description: 'Data downloaded successfully',
    });
  };

  const handlePrint = () => {
    if (records.length === 0) {
      toast({
        title: 'No Data',
        description: 'No records to print',
        variant: 'destructive',
      });
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Milk Records</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; }
          </style>
        </head>
        <body>
          <h1>Milk Records</h1>
          <p>Generated on: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</p>
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Milk Amount (Litres)</th>
                <th>Received</th>
                <th>Amount per Litre (₹)</th>
                <th>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${records
                .map(
                  (record, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${format(new Date(record.date), 'dd/MM/yyyy')}</td>
                  <td>${record.milk_amount}</td>
                  <td>${record.received ? 'Yes' : 'No'}</td>
                  <td>${record.amount_per_litre}</td>
                  <td>${record.total}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
          <div class="total">Total Records: ${records.length}</div>
          <div class="total">Grand Total: ₹${records.reduce((sum, r) => sum + r.total, 0).toFixed(2)}</div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const calculateTotal = () => {
    const milk = parseFloat(newRecord.milk_amount) || 0;
    const amount = parseFloat(newRecord.amount_per_litre) || 0;
    return (milk * amount).toFixed(2);
  };

  return (
    <PageWrapper title="Milk Records">
      <div className="space-y-6">
        {/* Add New Record Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={20} />
              Add New Milk Record
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newRecord.date}
                  onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="milk_amount">Milk Amount (Litres)</Label>
                <Input
                  id="milk_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newRecord.milk_amount}
                  onChange={(e) => setNewRecord({ ...newRecord, milk_amount: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="received"
                  checked={newRecord.received}
                  onCheckedChange={(checked) =>
                    setNewRecord({ ...newRecord, received: checked as boolean })
                  }
                />
                <Label htmlFor="received" className="cursor-pointer">
                  Received
                </Label>
              </div>
              <div>
                <Label htmlFor="amount_per_litre">Amount per Litre (₹)</Label>
                <Input
                  id="amount_per_litre"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newRecord.amount_per_litre}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, amount_per_litre: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Total (₹)</Label>
                <Input value={calculateTotal()} disabled className="bg-muted" />
              </div>
              <Button onClick={handleSave} disabled={isLoading} className="w-full">
                <Plus size={16} className="mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button onClick={handleDownload} variant="outline">
            <Download size={16} className="mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer size={16} className="mr-2" />
            Print
          </Button>
        </div>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Milk Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">S.No</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Milk Amount (L)</th>
                    <th className="text-left p-2">Received</th>
                    <th className="text-left p-2">Amount/Litre (₹)</th>
                    <th className="text-left p-2">Total (₹)</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-4 text-muted-foreground">
                        No records found. Add your first milk record above.
                      </td>
                    </tr>
                  ) : (
                    records.map((record, index) => (
                      <tr key={record.id} className="border-b hover:bg-muted/50">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">{format(new Date(record.date), 'dd/MM/yyyy')}</td>
                        <td className="p-2">{record.milk_amount}</td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              record.received
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }`}
                          >
                            {record.received ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="p-2">₹{record.amount_per_litre}</td>
                        <td className="p-2 font-semibold">₹{record.total}</td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(record.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {records.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 font-bold">
                      <td colSpan={5} className="text-right p-2">
                        Grand Total:
                      </td>
                      <td className="p-2">
                        ₹{records.reduce((sum, r) => sum + r.total, 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Milk;
