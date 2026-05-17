import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';
import { PeriodType, PeriodStats, TrendData, StructureData, TrendPoint, StructurePoint } from '../types/statistics';
import { getCategoryConfig } from '../constants/categories';
import { getMonthRange, getYearRange, formatToSqlDate } from '../utils/dateUtils';
import { BudgetService } from './BudgetService';

export class StatisticsService {
  /**
   * Retrieves summary statistics for a given period (month or year).
   */
  static async getPeriodStats(date: Date, periodType: PeriodType): Promise<PeriodStats> {
    const db = await getDatabase();
    const { start, end } = periodType === 'month' ? getMonthRange(date) : getYearRange(date);
    
    const rows = await db.getAllAsync<{ type: string; total: number }>(QUERIES.GET_PERIOD_SUMS, [start, end]);
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    for (const row of rows) {
      if (row.type === 'income') totalIncome += row.total;
      if (row.type === 'expense') totalExpense += row.total;
    }
    
    const balance = totalIncome - totalExpense;
    
    const startObj = new Date(start);
    const endObj = new Date(end);
    const today = new Date();
    
    let days = Math.round((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (today >= startObj && today <= endObj) {
      // If current period, divide by current day for average
      days = periodType === 'month' ? today.getDate() : Math.round((today.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    const avgDailyExpense = days > 0 ? totalExpense / days : 0;
    
    let budgetProgress = undefined;
    let budgetRemaining = undefined;
    let budgetLimit = undefined;
    
    if (periodType === 'month') {
      const budget = await BudgetService.getBudget();
      if (budget > 0) {
        budgetLimit = budget;
        budgetRemaining = budget - totalExpense;
        budgetProgress = Math.min((totalExpense / budget) * 100, 100);
      }
    }
    
    return {
      totalIncome,
      totalExpense,
      balance,
      avgDailyExpense,
      budgetProgress,
      budgetRemaining,
      budgetLimit
    };
  }

  /**
   * Generates trend chart data for a given period.
   */
  static async getTrendData(date: Date, periodType: PeriodType): Promise<TrendData> {
    const db = await getDatabase();
    const { start, end } = periodType === 'month' ? getMonthRange(date) : getYearRange(date);
    
    // Group by date for month, by month for year
    const isMonth = periodType === 'month';
    const groupFormat = isMonth ? '%Y-%m-%d' : '%Y-%m';
    
    const query = `
      SELECT 
        strftime('${groupFormat}', date) as dateKey,
        type, 
        SUM(amount) as total 
      FROM transactions 
      WHERE date >= ? AND date <= ? 
      GROUP BY dateKey, type
      ORDER BY dateKey ASC;
    `;
    
    const rows = await db.getAllAsync<{ dateKey: string; type: string; total: number }>(query, [start, end]);
    
    const pointsMap = new Map<string, { income: number; expense: number }>();
    
    // Initialize map
    if (isMonth) {
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        const key = formatToSqlDate(d);
        pointsMap.set(key, { income: 0, expense: 0 });
      }
    } else {
      const year = date.getFullYear();
      for (let i = 0; i < 12; i++) {
        const monthStr = String(i + 1).padStart(2, '0');
        const key = `${year}-${monthStr}`;
        pointsMap.set(key, { income: 0, expense: 0 });
      }
    }
    
    for (const row of rows) {
      const existing = pointsMap.get(row.dateKey);
      if (existing) {
        if (row.type === 'income') existing.income += row.total;
        if (row.type === 'expense') existing.expense += row.total;
      }
    }
    
    const budget = isMonth ? await BudgetService.getBudget() : 0;
    const dailyBudget = isMonth && budget > 0 ? budget / pointsMap.size : 0;
    const monthlyBudget = !isMonth ? await BudgetService.getBudget() : 0; // rough proxy
    
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];
    const budgetData: number[] = [];
    const points: TrendPoint[] = [];
    
    Array.from(pointsMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([key, val]) => {
      const label = isMonth ? parseInt(key.split('-')[2], 10).toString() : parseInt(key.split('-')[1], 10) + '月';
      const bLimit = isMonth ? dailyBudget : monthlyBudget;
      
      // For month view, maybe we don't need all 30 labels, chart kit will just take what we give
      // But we will give it all
      labels.push(label);
      incomeData.push(val.income);
      expenseData.push(val.expense);
      budgetData.push(bLimit);
      
      points.push({
        label,
        dateKey: key,
        income: val.income,
        expense: val.expense,
        budget: bLimit
      });
    });
    
    return {
      labels,
      incomeData,
      expenseData,
      budgetData,
      points
    };
  }

  /**
   * Generates structure (category breakdown) chart data.
   */
  static async getStructureData(date: Date, periodType: PeriodType, type: 'expense' | 'income' = 'expense'): Promise<StructureData> {
    const db = await getDatabase();
    const { start, end } = periodType === 'month' ? getMonthRange(date) : getYearRange(date);
    
    const rows = await db.getAllAsync<{ category: string; total: number; count: number }>(
      QUERIES.GET_CATEGORY_RANKING, 
      [type, start, end]
    );
    
    const totalAmount = rows.reduce((sum, row) => sum + row.total, 0);
    
    const points: StructurePoint[] = rows.map(row => {
      const config = getCategoryConfig(type, row.category);
      return {
        category: row.category,
        amount: row.total,
        percentage: totalAmount > 0 ? (row.total / totalAmount) * 100 : 0,
        color: config.color,
        icon: config.icon,
        name: config.name
      };
    });
    
    return {
      labels: points.map(p => p.name),
      datasets: [{
        data: points.map(p => p.amount),
        colors: points.map(p => p.color)
      }],
      points
    };
  }
}
