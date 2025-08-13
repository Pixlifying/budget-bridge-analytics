import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/layout/PageHeader';
import PageWrapper from '@/components/layout/PageWrapper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DownloadButton from '@/components/ui/DownloadButton';
import StatCard from '@/components/ui/StatCard';
import { Calendar, Plus, Trash2, Calculator, TrendingUp } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '@/utils/calculateUtils';
import { useToast } from '@/hooks/use-toast';

interface DailyNeedItem {
  id: string;
  item_name: string;
  quantity: number;
  unit: 'kg' | 'pieces' | 'litres';
  price_per_unit: number;
  total_price: number;
  date: string;
  created_at: string;
}

interface NewItem {
  item_name: string;
  quantity: number;
  unit: 'kg' | 'pieces' | 'litres';
  price_per_unit: number;
  date: Date;
}

const DailyNeeds = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
  const [newItem, setNewItem] = useState<NewItem>({
    item_name: '',
    quantity: 0,
    unit: 'kg',
    price_per_unit: 0,
    date: new Date(),
  });

  // Fetch daily needs data
  const { data: dailyNeeds = [], refetch } = useQuery({
    queryKey: ['daily_needs', date, viewMode],
    queryFn: async () => {
      let query = supabase.from('daily_needs').select('*');
      
      if (viewMode === 'day') {
        const dateStr = format(date, 'yyyy-MM-dd');
        query = query.eq('date', dateStr);
      } else {
        const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
        query = query.gte('date', startDate).lte('date', endDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DailyNeedItem[];
    },
  });

  // Add new item mutation
  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<NewItem, 'date'> & { date: string }) => {
      const { data, error } = await supabase
        .from('daily_needs')
        .insert([item])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_needs'] });
      setNewItem({
        item_name: '',
        quantity: 0,
        unit: 'kg',
        price_per_unit: 0,
        date: new Date(),
      });
      toast({
        title: "Success",
        description: "Item added successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('daily_needs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily_needs'] });
      toast({
        title: "Success",
        description: "Item deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete item. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalPrice = dailyNeeds.reduce((sum, item) => sum + item.total_price, 0);
    const itemCount = dailyNeeds.length;
    const averagePrice = itemCount > 0 ? totalPrice / itemCount : 0;
    
    // Get unique item names for "average item name" (most frequent item)
    const itemCounts = dailyNeeds.reduce((acc, item) => {
      acc[item.item_name] = (acc[item.item_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostFrequentItem = Object.entries(itemCounts).sort(([,a], [,b]) => b - a)[0];
    const averageItemName = mostFrequentItem ? mostFrequentItem[0] : 'No items';

    return {
      totalPrice,
      itemCount,
      averagePrice,
      averageItemName,
    };
  }, [dailyNeeds]);

  const handleAddItem = () => {
    if (!newItem.item_name || newItem.quantity <= 0 || newItem.price_per_unit <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    addItemMutation.mutate({
      ...newItem,
      date: format(newItem.date, 'yyyy-MM-dd'),
    });
  };

  const handleExport = () => {
    const exportData = dailyNeeds.map((item, index) => ({
      'S.No': index + 1,
      'Item Name': item.item_name,
      'Quantity': item.quantity,
      'Unit': item.unit,
      'Price per Unit': item.price_per_unit,
      'Total Price': item.total_price,
      'Date': format(new Date(item.date), 'dd MMM yyyy'),
    }));

    const filename = `daily-needs-${viewMode}-${format(date, 'yyyy-MM-dd')}`;
    
    // For print functionality, we'll create a simple HTML content
    const printContent = `
      <html>
        <head>
          <title>Daily Needs Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { text-align: center; margin-bottom: 20px; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Needs Report</h1>
            <p>Period: ${viewMode === 'day' ? format(date, 'dd MMM yyyy') : format(startOfMonth(date), 'MMM yyyy')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Price per Unit</th>
                <th>Total Price</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map(item => `
                <tr>
                  <td>${item['S.No']}</td>
                  <td>${item['Item Name']}</td>
                  <td>${item.Quantity}</td>
                  <td>${item.Unit}</td>
                  <td>₹${item['Price per Unit']}</td>
                  <td>₹${item['Total Price']}</td>
                  <td>${item.Date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Items:</strong> ${summary.itemCount}</p>
            <p><strong>Grand Total:</strong> ₹${summary.totalPrice.toFixed(2)}</p>
            <p><strong>Average Price per Item:</strong> ₹${summary.averagePrice.toFixed(2)}</p>
            <p><strong>Most Frequent Item:</strong> ${summary.averageItemName}</p>
          </div>
        </body>
      </html>
    `;

    // Create and trigger download/print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <PageWrapper 
      title="Daily Needs Management"
      subtitle="Track and manage your daily requirements and expenses"
    >
      {/* Date and View Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <DateRangePicker
          date={date}
          onDateChange={setDate}
          mode={viewMode}
          onModeChange={setViewMode}
        />
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Print Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Items"
          value={summary.itemCount.toString()}
          icon={<Calculator className="h-4 w-4" />}
        />
        <StatCard
          title="Grand Total"
          value={formatCurrency(summary.totalPrice)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          title="Average Price"
          value={formatCurrency(summary.averagePrice)}
          icon={<Calculator className="h-4 w-4" />}
        />
        <StatCard
          title="Most Frequent Item"
          value={summary.averageItemName}
          icon={<Plus className="h-4 w-4" />}
        />
      </div>

      {/* Add New Item Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="item_name">Item Name</Label>
              <Input
                id="item_name"
                value={newItem.item_name}
                onChange={(e) => setNewItem(prev => ({ ...prev, item_name: e.target.value }))}
                placeholder="Enter item name"
              />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={newItem.quantity || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={newItem.unit}
                onValueChange={(value: 'kg' | 'pieces' | 'litres') => 
                  setNewItem(prev => ({ ...prev, unit: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="litres">Litres</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price_per_unit">Price per Unit (₹)</Label>
              <Input
                id="price_per_unit"
                type="number"
                min="0"
                step="0.01"
                value={newItem.price_per_unit || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, price_per_unit: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="total">Total (₹)</Label>
              <Input
                id="total"
                value={formatCurrency(newItem.quantity * newItem.price_per_unit)}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddItem}
                disabled={addItemMutation.isPending}
                className="w-full"
              >
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Needs Items</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyNeeds.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items found for the selected period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">S.No</th>
                    <th className="text-left p-3">Item Name</th>
                    <th className="text-left p-3">Quantity</th>
                    <th className="text-left p-3">Unit</th>
                    <th className="text-left p-3">Price per Unit</th>
                    <th className="text-left p-3">Total Price</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyNeeds.map((item, index) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 font-medium">{item.item_name}</td>
                      <td className="p-3">{item.quantity}</td>
                      <td className="p-3 capitalize">{item.unit}</td>
                      <td className="p-3">{formatCurrency(item.price_per_unit)}</td>
                      <td className="p-3 font-medium">{formatCurrency(item.total_price)}</td>
                      <td className="p-3">{format(new Date(item.date), 'dd MMM yyyy')}</td>
                      <td className="p-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteItemMutation.mutate(item.id)}
                          disabled={deleteItemMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageWrapper>
  );
};

export default DailyNeeds;