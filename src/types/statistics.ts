export type PeriodType = 'month' | 'year';

export interface PeriodStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  avgDailyExpense: number;
  budgetProgress?: number; // 0 to 100 percentage
  budgetRemaining?: number; // Remaining amount
  budgetLimit?: number; // Total budget limit
}

export interface TrendPoint {
  label: string; // e.g. "1月" or "2026"
  dateKey: string; // YYYY-MM or YYYY format
  income: number;
  expense: number;
  budget: number;
}

export interface TrendData {
  labels: string[];
  incomeData: number[];
  expenseData: number[];
  budgetData: number[];
  points: TrendPoint[];
}

export interface StructurePoint {
  category: string; // Category ID
  amount: number;
  percentage: number; // 0 to 100
  color: string;
  icon: string;
  name: string; // Display name
}

export interface StructureData {
  labels: string[];
  datasets: {
    data: number[];
    colors: string[];
  }[];
  points: StructurePoint[];
}
