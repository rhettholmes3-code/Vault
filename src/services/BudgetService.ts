import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';

export interface BudgetStatus {
  remaining: number; // 剩余预算金额
  progress: number;  // 预算使用百分比 (0 - 100+)
  status: 'normal' | 'warning' | 'danger'; // 预算健康状况：正常、预警 (>=80%)、超支 (>=100%)
}

export class BudgetService {
  private static DEFAULT_BUDGET = 5000;

  /**
   * 从 SQLite 数据库中获取每月预算限制额度
   */
  static async getMonthlyBudget(): Promise<number> {
    try {
      const db = await getDatabase();
      const res = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['monthly_budget']);
      if (res) {
        return parseFloat(res.value) || this.DEFAULT_BUDGET;
      }
      // 如果未设置，则写入并返回默认预算
      await db.runAsync(QUERIES.UPSERT_SETTING, ['monthly_budget', this.DEFAULT_BUDGET.toString()]);
      return this.DEFAULT_BUDGET;
    } catch (e) {
      console.error('[BudgetService] 从 SQLite 读取预算失败:', e);
      return this.DEFAULT_BUDGET;
    }
  }

  /**
   * 保存每月预算限制额度到 SQLite 数据库中
   */
  static async updateMonthlyBudget(budget: number): Promise<void> {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['monthly_budget', budget.toString()]);
    } catch (e) {
      console.error('[BudgetService] 保存预算到 SQLite 失败:', e);
      throw e;
    }
  }

  /**
   * 根据已消费金额与预算限额，计算预算的实时进度和健康状态
   * 
   * @param spent 已消耗金额 (总支出)
   * @param budget 预算上限
   */
  static calculateBudgetStatus(spent: number, budget: number): BudgetStatus {
    const remaining = budget - spent;
    const progress = budget > 0 ? (spent / budget) * 100 : 0;
    
    let status: 'normal' | 'warning' | 'danger' = 'normal';
    if (progress >= 100) {
      status = 'danger';
    } else if (progress >= 80) {
      status = 'warning';
    }

    return {
      remaining,
      progress: Math.min(progress, 999.9), // 限制进度上限以防 UI 溢出
      status,
    };
  }
}
