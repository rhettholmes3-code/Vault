import { create } from 'zustand';
import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';

interface SettingsState {
  monthlyBudget: number;
  themePreference: 'light' | 'dark' | 'auto';
  fetchSettings: () => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  setThemePreference: (pref: 'light' | 'dark' | 'auto') => Promise<void>;
}

/**
 * 全局设置状态管理 Store (Zustand)
 * 提供每月预算和主题偏好的内存状态与 SQLite 持久化同步能力
 */
export const useSettingsStore = create<SettingsState>((set) => ({
  monthlyBudget: 5000,
  themePreference: 'auto',
  
  fetchSettings: async () => {
    try {
      const db = await getDatabase();
      const budgetRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['monthly_budget']);
      const themeRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['theme_preference']);

      let monthlyBudget = 5000;
      let themePreference: 'light' | 'dark' | 'auto' = 'auto';

      if (budgetRes) {
        monthlyBudget = parseFloat(budgetRes.value) || 5000;
      } else {
        await db.runAsync(QUERIES.UPSERT_SETTING, ['monthly_budget', '5000']);
      }

      if (themeRes) {
        themePreference = themeRes.value as 'light' | 'dark' | 'auto';
      } else {
        await db.runAsync(QUERIES.UPSERT_SETTING, ['theme_preference', 'auto']);
      }

      set({ monthlyBudget, themePreference });
    } catch (e) {
      console.error('[SettingsStore] 获取配置失败:', e);
    }
  },

  setMonthlyBudget: async (budget: number) => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['monthly_budget', budget.toString()]);
      set({ monthlyBudget: budget });
    } catch (e) {
      console.error('[SettingsStore] 更新预算失败:', e);
    }
  },

  setThemePreference: async (pref: 'light' | 'dark' | 'auto') => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['theme_preference', pref]);
      set({ themePreference: pref });
    } catch (e) {
      console.error('[SettingsStore] 更新主题偏好失败:', e);
    }
  },
}));
