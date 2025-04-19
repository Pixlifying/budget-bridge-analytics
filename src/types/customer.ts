
export interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  date: string;
  customer_id?: string;  // Added to match Supabase schema
}

export interface Customer {
  id: string;
  name: string;
  description?: string;
  phone: string;
  address: string;
  transactions: Transaction[];
  created_at?: string;
}
