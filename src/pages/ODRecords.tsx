
import { useState, useEffect } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Printer, Download, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageWrapper from '@/components/layout/PageWrapper';

interface ODRecord {
  id: string;
  amount_received: number;
  amount_given: number;
  cash_in_hand: number;
  date: string;
  created_at: string;
}

const ODRecords = () => {
  const [records, setRecords] = useState<ODRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<'day' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Form state
  const [formData, setFormData] = useState({
    amount_received: '',
    amount_given: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchRecords = async () => {
    try {
      setLoading(true);
      let query = supabase.from('od_records').select('*');

      if (filterMode === 'day') {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      } else {
        const startOfMonth = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1), 'yyyy-MM-dd');
        const endOfMonth = format(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0), 'yyyy-MM-dd');
        query = query.gte('date', startOfMonth).lte('date', endOfMonth);
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching OD records:', error);
      toast.error('Failed to fetch OD records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedDate, filterMode]);

  // Set up real-time subscription
  useEffect(() => {
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
          fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, filterMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount_received && !formData.amount_given) {
      toast.error('Please enter at least one amount');
      return;
    }

    const receivedAmount = parseFloat(formData.amount_received) || 0;
    const givenAmount = parseFloat(formData.amount_given) || 0;
    const calculatedCashInHand = receivedAmount - givenAmount;

    try {
      const { error } = await supabase.from('od_records').insert({
        amount_received: receivedAmount,
        amount_given: givenAmount,
        cash_in_hand: calculatedCashInHand,
        date: formData.date
      });

      if (error) throw error;

      toast.success('OD record added successfully');
      setFormData({
        amount_received: '',
        amount_given: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error adding OD record:', error);
      toast.error('Failed to add OD record');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const totalReceived = records.reduce((sum, record) => sum + record.amount_received, 0);
  const totalGiven = records.reduce((sum, record) => sum + record.amount_given, 0);
  const totalCashInHand = totalReceived - totalGiven;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const periodText = filterMode === 'day' 
      ? format(selectedDate, 'dd MMM yyyy')
      : format(selectedDate, 'MMMM yyyy');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OD Records Report - ${periodText}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: Arial, sans-serif; font-size: 12px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .summary { margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <h1>OD Records Report - ${periodText}</h1>
          <div class="summary">
            <p><strong>Total Amount Received:</strong> ₹${totalReceived.toFixed(2)}</p>
            <p><strong>Total Amount Given:</strong> ₹${totalGiven.toFixed(2)}</p>
            <p><strong>Net Cash in Hand:</strong> ₹${totalCashInHand.toFixed(2)}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount Received</th>
                <th>Amount Given</th>
                <th>Cash in Hand</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(record => `
                <tr>
                  <td>${format(new Date(record.date), 'dd MMM yyyy')}</td>
                  <td class="text-right">₹${record.amount_received.toFixed(2)}</td>
                  <td class="text-right">₹${record.amount_given.toFixed(2)}</td>
                  <td class="text-right">₹${record.cash_in_hand.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = () => {
    const csvContent = [
      'Date,Amount Received,Amount Given,Cash in Hand',
      ...records.map(record => 
        `${format(new Date(record.date), 'yyyy-MM-dd')},${record.amount_received},${record.amount_given},${record.cash_in_hand}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `od-records-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded successfully');
  };

  const receivedAmount = parseFloat(formData.amount_received) || 0;
  const givenAmount = parseFloat(formData.amount_given) || 0;
  const previewCashInHand = receivedAmount - givenAmount;

  return (
    <PageWrapper title="OD Records">
      <PageHeader title="OD Records" />

      {/* Add Record Form */}
      <Card className="mb-6 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus size={20} />
            Add New OD Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>

            <Button type="submit" className="hover-scale">Add Record</Button>
          </form>
          
          {(receivedAmount > 0 || givenAmount > 0) && (
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
            <CardTitle>OD Records</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterMode} onValueChange={(value: 'day' | 'month') => setFilterMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-64 justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, filterMode === 'day' ? 'PPP' : 'MMMM yyyy')}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              No OD records found for the selected period
            </div>
          ) : (
            <div className="overflow-x-auto animate-fade-in">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount Received</TableHead>
                    <TableHead className="text-right">Amount Given</TableHead>
                    <TableHead className="text-right">Cash in Hand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className="hover-scale">
                      <TableCell>{format(new Date(record.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right text-green-600">
                        ₹{record.amount_received.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        ₹{record.amount_given.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${record.cash_in_hand >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        ₹{record.cash_in_hand.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default ODRecords;
