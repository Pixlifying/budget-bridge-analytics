
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  description?: string;
  created_at: string;
  transactions?: CustomerTransaction[];
}

export interface CustomerTransaction {
  id: string;
  customer_id: string;
  amount: number;
  type: 'debit' | 'credit';
  description?: string;
  date: string;
  created_at: string;
}
