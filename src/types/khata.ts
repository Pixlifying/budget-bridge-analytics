
export interface KhataCustomer {
  id: string;
  name: string;
  phone: string;
  opening_balance: number;
  opening_date: string;
  created_at: string;
  updated_at: string;
}

export interface KhataTransaction {
  id: string;
  customer_id: string;
  type: 'debit' | 'credit';
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
}
