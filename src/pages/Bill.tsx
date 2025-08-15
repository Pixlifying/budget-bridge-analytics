import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, User, Phone, MapPin, FileText, Download, Plus, Edit, Trash2 } from 'lucide-react';
import PageWrapper from '@/components/layout/PageWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DeleteConfirmation from '@/components/ui/DeleteConfirmation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface BillEntry {
  id: string;
  bill_number: string;
  customer_name: string;
  customer_address: string;
  customer_mobile: string;
  items: BillItem[];
  total_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_method: string;
  notes?: string;
  date: string;
  created_at: string;
}

interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const Bill = () => {
  const [bills, setBills] = useState<BillEntry[]>([]);
  const [filteredBills, setFilteredBills] = useState<BillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillEntry | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'month'>('day');

  // Form state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_address: '',
    customer_mobile: '',
    payment_method: 'cash',
    notes: ''
  });

  const [billItems, setBillItems] = useState<BillItem[]>([
    { id: '1', name: '', quantity: 1, unit_price: 0, total_price: 0 }
  ]);

  const fetchBills = async () => {
    try {
      // Temporarily disabled until bills table is available in types
      // const { data, error } = await supabase
      //   .from('bills')
      //   .select('*')
      //   .order('created_at', { ascending: false });

      // if (error) throw error;

      setBills([]);
      console.log('Bills table not yet available in types - waiting for migration to complete');
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    const filtered = bills.filter(bill => {
      const billDate = new Date(bill.date);
      if (viewMode === 'day') {
        return format(billDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      } else {
        return format(billDate, 'yyyy-MM') === format(date, 'yyyy-MM');
      }
    });
    setFilteredBills(filtered);
  }, [bills, date, viewMode]);

  const generateBillNumber = () => {
    const today = new Date();
    const dateStr = format(today, 'yyyyMMdd');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BILL-${dateStr}-${randomNum}`;
  };

  const addBillItem = () => {
    const newItem: BillItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0
    };
    setBillItems([...billItems, newItem]);
  };

  const removeBillItem = (id: string) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const updateBillItem = (id: string, field: keyof BillItem, value: any) => {
    setBillItems(billItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updatedItem.total_price = updatedItem.quantity * updatedItem.unit_price;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const total = billItems.reduce((sum, item) => sum + item.total_price, 0);
    const tax = total * 0.1; // 10% tax
    const final = total + tax;
    return { total, tax, final };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = billItems.filter(item => item.name.trim() && item.quantity > 0 && item.unit_price > 0);
    
    if (!formData.customer_name.trim() || validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please fill customer name and add at least one item",
        variant: "destructive",
      });
      return;
    }

    const { total, tax, final } = calculateTotals();

    try {
      const billData = {
        bill_number: generateBillNumber(),
        customer_name: formData.customer_name,
        customer_address: formData.customer_address,
        customer_mobile: formData.customer_mobile,
        items: validItems,
        total_amount: total,
        tax_amount: tax,
        final_amount: final,
        payment_method: formData.payment_method,
        notes: formData.notes,
        date: new Date().toISOString(),
      };

      // Temporarily disabled until bills table is available in types
      // const { data, error } = await supabase
      //   .from('bills')
      //   .insert(billData)
      //   .select()
      //   .single();

      // if (error) throw error;

      // setBills([data, ...bills]);
      setIsFormOpen(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Bill functionality ready - waiting for database migration to complete",
      });
    } catch (error) {
      console.error('Error creating bill:', error);
      toast({
        title: "Error",
        description: "Failed to create bill",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    const validItems = billItems.filter(item => item.name.trim() && item.quantity > 0 && item.unit_price > 0);
    const { total, tax, final } = calculateTotals();

    try {
      const billData = {
        customer_name: formData.customer_name,
        customer_address: formData.customer_address,
        customer_mobile: formData.customer_mobile,
        items: validItems,
        total_amount: total,
        tax_amount: tax,
        final_amount: final,
        payment_method: formData.payment_method,
        notes: formData.notes,
      };

      // Temporarily disabled until bills table is available in types
      // const { data, error } = await supabase
      //   .from('bills')
      //   .update(billData)
      //   .eq('id', editingBill.id)
      //   .select()
      //   .single();

      // if (error) throw error;

      // setBills(bills.map(bill => bill.id === editingBill.id ? data : bill));
      setIsEditFormOpen(false);
      setEditingBill(null);
      resetForm();
      
      toast({
        title: "Success",
        description: "Bill functionality ready - waiting for database migration to complete",
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      toast({
        title: "Error",
        description: "Failed to update bill",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!billToDelete) return;

    try {
      // Temporarily disabled until bills table is available in types
      // const { error } = await supabase
      //   .from('bills')
      //   .delete()
      //   .eq('id', billToDelete);

      // if (error) throw error;

      setBills(bills.filter(bill => bill.id !== billToDelete));
      setDeleteConfirmOpen(false);
      setBillToDelete(null);
      
      toast({
        title: "Success",
        description: "Bill functionality ready - waiting for database migration to complete",
      });
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast({
        title: "Error",
        description: "Failed to delete bill",
        variant: "destructive",
      });
    }
  };

  const openEditBill = (bill: BillEntry) => {
    setEditingBill(bill);
    setFormData({
      customer_name: bill.customer_name,
      customer_address: bill.customer_address,
      customer_mobile: bill.customer_mobile,
      payment_method: bill.payment_method,
      notes: bill.notes || ''
    });
    setBillItems(bill.items);
    setIsEditFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      customer_address: '',
      customer_mobile: '',
      payment_method: 'cash',
      notes: ''
    });
    setBillItems([{ id: '1', name: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const { total: subtotal, tax, final } = calculateTotals();

  return (
    <PageWrapper 
      title="Bills Management" 
      subtitle="Manage retail bills and invoices"
    >
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <DateRangePicker 
            date={date}
            onDateChange={setDate}
            mode={viewMode}
            onModeChange={setViewMode}
          />
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Bill</DialogTitle>
                <DialogDescription>Create a new retail bill/invoice</DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Customer Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_mobile">Mobile Number</Label>
                    <Input
                      id="customer_mobile"
                      value={formData.customer_mobile}
                      onChange={(e) => setFormData({...formData, customer_mobile: e.target.value})}
                      placeholder="Enter mobile number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customer_address">Address</Label>
                  <Textarea
                    id="customer_address"
                    value={formData.customer_address}
                    onChange={(e) => setFormData({...formData, customer_address: e.target.value})}
                    placeholder="Enter customer address"
                    rows={2}
                  />
                </div>

                {/* Bill Items */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Bill Items</h3>
                    <Button type="button" variant="outline" onClick={addBillItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {billItems.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-4">
                          <Label>Item Name</Label>
                          <Input
                            value={item.name}
                            onChange={(e) => updateBillItem(item.id, 'name', e.target.value)}
                            placeholder="Item name"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateBillItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Unit Price</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateBillItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Total</Label>
                          <Input
                            value={item.total_price.toFixed(2)}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                        <div className="col-span-2">
                          {billItems.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeBillItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-muted p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (10%):</span>
                      <span>₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>₹{final.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment and Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Bill</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="text-center">Loading bills...</div>
        ) : filteredBills.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No bills found for the selected date</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredBills.map((bill) => (
              <Card key={bill.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Bill #{bill.bill_number}</CardTitle>
                      <CardDescription>
                        {format(new Date(bill.date), 'PPP')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditBill(bill)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBillToDelete(bill.id);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{bill.customer_name}</span>
                      </div>
                      {bill.customer_mobile && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{bill.customer_mobile}</span>
                        </div>
                      )}
                      {bill.customer_address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{bill.customer_address}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold">₹{bill.final_amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          Payment: {bill.payment_method.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {bill.items.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="space-y-1">
                        {bill.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.name} (x{item.quantity})</span>
                            <span>₹{item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {bill.notes && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      <strong>Notes:</strong> {bill.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
            <DialogDescription>Update bill information</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEdit} className="space-y-6">
            {/* Same form content as create but with handleEdit */}
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_customer_name">Customer Name *</Label>
                <Input
                  id="edit_customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_customer_mobile">Mobile Number</Label>
                <Input
                  id="edit_customer_mobile"
                  value={formData.customer_mobile}
                  onChange={(e) => setFormData({...formData, customer_mobile: e.target.value})}
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_customer_address">Address</Label>
              <Textarea
                id="edit_customer_address"
                value={formData.customer_address}
                onChange={(e) => setFormData({...formData, customer_address: e.target.value})}
                placeholder="Enter customer address"
                rows={2}
              />
            </div>

            {/* Bill Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Bill Items</h3>
                <Button type="button" variant="outline" onClick={addBillItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {billItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Item Name</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => updateBillItem(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateBillItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateBillItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input
                        value={item.total_price.toFixed(2)}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-2">
                      {billItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBillItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (10%):</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{final.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_payment_method">Payment Method</Label>
                <Select value={formData.payment_method} onValueChange={(value) => setFormData({...formData, payment_method: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit_notes">Notes</Label>
                <Input
                  id="edit_notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsEditFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Bill</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setBillToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Bill"
        description="Are you sure you want to delete this bill? This action cannot be undone."
      />
    </PageWrapper>
  );
};

export default Bill;