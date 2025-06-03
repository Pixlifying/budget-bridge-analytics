
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface CustomerDetailsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  title: string;
  initialValues?: {
    name: string;
    account_number: string;
    adhar_number: string;
    mobile_number: string;
  };
}

const CustomerDetailsForm = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  initialValues
}: CustomerDetailsFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    account_number: '',
    adhar_number: '',
    mobile_number: ''
  });

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    } else {
      setFormData({
        name: '',
        account_number: '',
        adhar_number: '',
        mobile_number: ''
      });
    }
  }, [initialValues, isOpen]);

  const formatAccountNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : '';
  };

  const formatAdharNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '');
    const match = cleaned.match(/.{1,4}/g);
    return match ? match.join(' ') : '';
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '');
    if (value.length <= 16) {
      setFormData(prev => ({
        ...prev,
        account_number: formatAccountNumber(value)
      }));
    }
  };

  const handleAdharNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, '');
    if (value.length <= 12) {
      setFormData(prev => ({
        ...prev,
        adhar_number: formatAdharNumber(value)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.account_number.trim() || !formData.adhar_number.trim()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter customer name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="account_number">Account Number *</Label>
            <Input
              id="account_number"
              value={formData.account_number}
              onChange={handleAccountNumberChange}
              placeholder="1234 5678 9012 3456"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="adhar_number">Adhar Number *</Label>
            <Input
              id="adhar_number"
              value={formData.adhar_number}
              onChange={handleAdharNumberChange}
              placeholder="1234 5678 9012"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="mobile_number">Mobile Number</Label>
            <Input
              id="mobile_number"
              value={formData.mobile_number}
              onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
              placeholder="Enter mobile number (optional)"
              maxLength={10}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetailsForm;
