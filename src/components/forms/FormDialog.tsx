
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';

interface FormEntry {
  id: string;
  date: string;
  s_no: number;
  name: string;
  parentage: string;
  address: string;
  mobile: string;
  remarks?: string;
  department: string;
  created_at: string;
  updated_at: string;
}

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: any) => Promise<void>;
  editingForm: FormEntry | null;
  departments: string[];
}

const FormDialog = ({ isOpen, onClose, onSave, editingForm, departments }: FormDialogProps) => {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    name: '',
    parentage: '',
    address: '',
    mobile: '',
    remarks: '',
    department: 'General'
  });

  const handleSubmit = async () => {
    // Validate mobile number (max 10 digits)
    if (!/^\d{1,10}$/.test(formData.mobile)) {
      return;
    }

    await onSave(formData);
  };

  const resetForm = () => {
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      name: '',
      parentage: '',
      address: '',
      mobile: '',
      remarks: '',
      department: 'General'
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Set form data when editing
  if (editingForm && formData.name === '') {
    setFormData({
      date: format(new Date(editingForm.date), 'yyyy-MM-dd'),
      name: editingForm.name,
      parentage: editingForm.parentage,
      address: editingForm.address,
      mobile: editingForm.mobile,
      remarks: editingForm.remarks || '',
      department: editingForm.department
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingForm ? 'Edit Form Entry' : 'Add New Form Entry'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="parentage">Parentage *</Label>
            <Input
              id="parentage"
              value={formData.parentage}
              onChange={(e) => setFormData(prev => ({ ...prev, parentage: e.target.value }))}
              placeholder="Father's/Mother's name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Complete address"
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="mobile">Mobile *</Label>
            <Input
              id="mobile"
              value={formData.mobile}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                setFormData(prev => ({ ...prev, mobile: value }));
              }}
              placeholder="Mobile number (max 10 digits)"
              maxLength={10}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="department">Department *</Label>
            <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Additional remarks (optional)"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || !formData.parentage || !formData.address || !formData.mobile || !formData.department}
            >
              {editingForm ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
