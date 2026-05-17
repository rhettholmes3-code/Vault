export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string; // UUID (generated via expo-crypto)
  type: TransactionType;
  amount: number;
  category: string; // Category ID, e.g., 'food', 'salary'
  date: string; // ISO 8601 date string (YYYY-MM-DD)
  note: string;
  created_at: number; // Creation timestamp in milliseconds
  updated_at: number; // Last modification timestamp in milliseconds
}
