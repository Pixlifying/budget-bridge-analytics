
export interface Transaction {
  id: string;
  type: 'debit' | 'credit';
  amount: number;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  description?: string;
  phone: string;
  address: string;
  transactions: Transaction[];
}
