import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';
import { PeriodType, PeriodStats, TrendData, StructureData, TrendPoint, StructurePoint } from '../types/statistics';
import { getCategoryConfig } from '../constants/categories';
import { getMonthRange, getYearRange, formatToSqlDate } from '../utils/dateUtils';
import { BudgetService } from './BudgetService';
import { t, i18n } from '../constants/i18n';

export class StatisticsService {
  /**
   * Retrieves summary statistics for a given period (month or year).
   */
  static async getPeriodStats(date: Date, periodType: PeriodType): Promise<PeriodStats> {
    const db = await getDatabase();
    const { start, end } = periodType === 'month' ? getMonthRange(date) : getYearRange(date);
    
    const rows = await db.getAllAsync<{ type: string; total: number }>(
      QUERIES.GET_PERIOD_SUMS, 
      [start || '', end || '']
    );
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    for (const row of rows) {
      if (row.type === 'income') totalIncome += Number(row.total) || 0;
      if (row.type === 'expense') totalExpense += Number(row.total) || 0;
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
      const budget = await BudgetService.getMonthlyBudget();
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
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];
    const budgetData: number[] = [];
    const points: TrendPoint[] = [];

    const budget = await BudgetService.getMonthlyBudget();

    if (periodType === 'month') {
      // Rolling 12 Months (Ending at the current select month)
      const promises: Promise<PeriodStats>[] = [];
      const dates: Date[] = [];
      
      for (let i = 11; i >= 0; i--) {
        const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
        dates.push(d);
        promises.push(this.getPeriodStats(d, 'month'));
      }
      
      const statsList = await Promise.all(promises);
      
      statsList.forEach((stats, idx) => {
        const d = dates[idx];
        const label = i18n.locale === 'zh'
          ? `${d.getMonth() + 1}月`
          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
        labels.push(label);
        incomeData.push(stats.totalIncome);
        expenseData.push(stats.totalExpense);
        budgetData.push(budget);
        
        points.push({
          label,
          dateKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          income: stats.totalIncome,
          expense: stats.totalExpense,
          budget: budget
        });
      });
    } else {
      // Rolling 5 Years (Ending at the current select year)
      const promises: Promise<PeriodStats>[] = [];
      const dates: Date[] = [];
      
      for (let i = 4; i >= 0; i--) {
        const d = new Date(date.getFullYear() - i, 0, 1);
        dates.push(d);
        promises.push(this.getPeriodStats(d, 'year'));
      }
      
      const statsList = await Promise.all(promises);
      
      statsList.forEach((stats, idx) => {
        const d = dates[idx];
        const label = i18n.locale === 'zh' ? `${d.getFullYear()}年` : `${d.getFullYear()}`;
        labels.push(label);
        incomeData.push(stats.totalIncome);
        expenseData.push(stats.totalExpense);
        
        const yearlyBudget = budget > 0 ? budget * 12 : 0;
        budgetData.push(yearlyBudget);
        
        points.push({
          label,
          dateKey: `${d.getFullYear()}`,
          income: stats.totalIncome,
          expense: stats.totalExpense,
          budget: yearlyBudget
        });
      });
    }

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
      [type || 'expense', start || '', end || '']
    );
    
    const totalAmount = rows.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
    
    const points: StructurePoint[] = rows.map(row => {
      const config = getCategoryConfig(type || 'expense', row.category);
      return {
        category: row.category,
        amount: Number(row.total) || 0,
        percentage: totalAmount > 0 ? ((Number(row.total) || 0) / totalAmount) * 100 : 0,
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

  /**
   * Generates rolling stacked category breakdown trend data over time.
   */
  static async getStackedTrendData(
    date: Date, 
    periodType: PeriodType, 
    type: 'expense' | 'income'
  ): Promise<{
    labels: string[];
    legend: string[];
    data: number[][];
    barColors: string[];
  }> {
    const db = await getDatabase();
    const labels: string[] = [];
    const dates: Date[] = [];
    const limit = periodType === 'month' ? 12 : 5;

    for (let i = limit - 1; i >= 0; i--) {
      const d = periodType === 'month'
        ? new Date(date.getFullYear(), date.getMonth() - i, 1)
        : new Date(date.getFullYear() - i, 0, 1);
      dates.push(d);
      
      const label = periodType === 'month'
        ? (i18n.locale === 'zh'
          ? `${d.getMonth() + 1}月`
          : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()])
        : (i18n.locale === 'zh' ? `${d.getFullYear()}年` : `${d.getFullYear()}`);
      labels.push(label);
    }

    const promises = dates.map(d => {
      const { start, end } = periodType === 'month' ? getMonthRange(d) : getYearRange(d);
      return db.getAllAsync<{ category: string; total: number }>(
        QUERIES.GET_CATEGORY_RANKING,
        [type, start || '', end || '']
      );
    });

    const results = await Promise.all(promises);

    // Sum overall totals to find Top 4 categories
    const categoryTotals: Record<string, number> = {};
    results.forEach(list => {
      list.forEach(row => {
        categoryTotals[row.category] = (categoryTotals[row.category] || 0) + Number(row.total);
      });
    });

    const sortedCategories = Object.keys(categoryTotals).sort(
      (a, b) => categoryTotals[b] - categoryTotals[a]
    );

    if (sortedCategories.length === 0) {
      // Safe fallback if there are no transactions
      return {
        labels,
        legend: [t('stats.no_chart_data')],
        data: Array(labels.length).fill([0]),
        barColors: ['#94a3b8']
      };
    }

    const top4 = sortedCategories.slice(0, 4);
    const hasOthers = sortedCategories.length > 4;
    const stackKeys = [...top4];
    if (hasOthers) {
      stackKeys.push('other');
    }

    const data: number[][] = [];
    dates.forEach((_, idx) => {
      const periodMap: Record<string, number> = {};
      let otherSum = 0;

      results[idx].forEach(row => {
        if (top4.includes(row.category)) {
          periodMap[row.category] = Number(row.total) || 0;
        } else {
          otherSum += Number(row.total) || 0;
        }
      });

      if (hasOthers) {
        periodMap['other'] = otherSum;
      }

      data.push(stackKeys.map(key => periodMap[key] || 0));
    });

    const legend: string[] = [];
    const barColors: string[] = [];

    stackKeys.forEach(key => {
      const config = getCategoryConfig(type, key);
      legend.push(config.name);
      barColors.push(config.color);
    });

    return {
      labels,
      legend,
      data,
      barColors
    };
  }
}
