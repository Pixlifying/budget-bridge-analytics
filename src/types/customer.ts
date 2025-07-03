
export interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  date: string;
  description?: string;
  customer_id: string;  
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  description?: string;
  phone: string;
  address: string;
  transactions: Transaction[];
  created_at: string;
}
