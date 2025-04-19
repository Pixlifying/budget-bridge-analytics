
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Customer } from '@/types/customer';

interface TransactionDialogProps {
  customer: Customer;
  type: 'debit' | 'credit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (amount: number) => void;
}

const TransactionDialog = ({
  customer,
  type,
  open,
  onOpenChange,
  onComplete,
}: TransactionDialogProps) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    // Calculate maximum available amount for transfer if moving from debit to credit
    // or from credit to debit
    const oppositeType = type === 'debit' ? 'credit' : 'debit';
    const currentBalance = customer.transactions
      .filter(t => t.type === oppositeType)
      .reduce((sum, t) => sum + t.amount, 0);
      
    if (numAmount > currentBalance) {
      setError(`Amount cannot exceed current ${oppositeType} balance of ₹${currentBalance}`);
      return;
    }
    
    onComplete(numAmount);
    setAmount('');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add {type === 'debit' ? 'Debit' : 'Credit'} Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor="name">Customer Name</Label>
              <Input id="name" value={customer.name} readOnly className="bg-muted" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="current-type">
                Current {type === 'debit' ? 'Credit' : 'Debit'} Balance
              </Label>
              <Input 
                id="current-type" 
                value={`₹${customer.transactions
                  .filter(t => t.type === (type === 'debit' ? 'credit' : 'debit'))
                  .reduce((sum, t) => sum + t.amount, 0)}`} 
                readOnly 
                className="bg-muted" 
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="amount">
                Amount to {type === 'debit' ? 'Debit' : 'Credit'}
              </Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Enter amount"
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Transaction</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDialog;
