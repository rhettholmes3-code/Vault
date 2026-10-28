import { create } from 'zustand';
import * as Localization from 'expo-localization';
import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';
import { i18n, getDeviceLanguage } from '../constants/i18n';

export type CurrencyType = 'auto' | 'CNY' | 'USD' | 'GBP' | 'CAD' | 'AUD' | 'NZD';

export const CURRENCIES: Record<Exclude<CurrencyType, 'auto'>, { symbol: string; name: string }> = {
  CNY: { symbol: '¥', name: '人民币 (CNY)' },
  USD: { symbol: '$', name: '美元 (USD)' },
  GBP: { symbol: '£', name: '英镑 (GBP)' },
  CAD: { symbol: 'C$', name: '加元 (CAD)' },
  AUD: { symbol: 'A$', name: '澳元 (AUD)' },
  NZD: { symbol: 'NZ$', name: '纽币 (NZD)' },
};

export const getDeviceCurrency = (): Exclude<CurrencyType, 'auto'> => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const region = locales[0].regionCode?.toUpperCase();
    if (region === 'CN') return 'CNY';
    if (region === 'US') return 'USD';
    if (region === 'GB') return 'GBP';
    if (region === 'CA') return 'CAD';
    if (region === 'AU') return 'AUD';
    if (region === 'NZ') return 'NZD';
  }
  const lang = getDeviceLanguage();
  return lang === 'zh' ? 'CNY' : 'USD';
};

interface SettingsState {
  monthlyBudget: number;
  themePreference: 'light' | 'dark' | 'auto';
  languagePreference: 'auto' | 'zh' | 'en';
  currencyPreference: CurrencyType;
  dailyReminderEnabled: boolean;
  periodicSummaryEnabled: boolean;
  dailyReminderLunchTime: string;
  dailyReminderEveningTime: string;
  hasPromptedNotification: boolean;
  fetchSettings: () => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  setThemePreference: (pref: 'light' | 'dark' | 'auto') => Promise<void>;
  setLanguagePreference: (pref: 'auto' | 'zh' | 'en') => Promise<void>;
  setCurrencyPreference: (pref: CurrencyType) => Promise<void>;
  setDailyReminderEnabled: (enabled: boolean) => Promise<void>;
  setPeriodicSummaryEnabled: (enabled: boolean) => Promise<void>;
  setDailyReminderTimes: (lunchTime: string, eveningTime: string) => Promise<void>;
  setHasPromptedNotification: (prompted: boolean) => Promise<void>;
  getCurrencySymbol: () => string;
}

/**
 * 全局设置状态管理 Store (Zustand)
 * 提供每月预算、主题偏好、语言设置、货币设置以及通知提醒配置的内存状态与 SQLite 持久化同步能力
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  monthlyBudget: 5000,
  themePreference: 'auto',
  languagePreference: 'auto',
  currencyPreference: 'auto',
  dailyReminderEnabled: false,
  periodicSummaryEnabled: false,
  dailyReminderLunchTime: '12:30',
  dailyReminderEveningTime: '21:30',
  hasPromptedNotification: false,
  
  fetchSettings: async () => {
    try {
      const db = await getDatabase();
      const budgetRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['monthly_budget']);
      const themeRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['theme_preference']);
      const langRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['language_preference']);
      const currencyRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['currency_preference']);
      const dailyRemRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['daily_reminder_enabled']);
      const periodicRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['periodic_summary_enabled']);
      const lunchTimeRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['daily_reminder_lunch_time']);
      const eveningTimeRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['daily_reminder_evening_time']);
      const promptedRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['has_prompted_notification']);

      let monthlyBudget = 5000;
      let themePreference: 'light' | 'dark' | 'auto' = 'auto';
      let languagePreference: 'auto' | 'zh' | 'en' = 'auto';
      let currencyPreference: CurrencyType = 'auto';
      let dailyReminderEnabled = false;
      let periodicSummaryEnabled = false;
      let dailyReminderLunchTime = '12:30';
      let dailyReminderEveningTime = '21:30';
      let hasPromptedNotification = false;

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

      if (langRes) {
        languagePreference = langRes.value as 'auto' | 'zh' | 'en';
      } else {
        await db.runAsync(QUERIES.UPSERT_SETTING, ['language_preference', 'auto']);
      }

      if (currencyRes) {
        currencyPreference = currencyRes.value as CurrencyType;
      } else {
        await db.runAsync(QUERIES.UPSERT_SETTING, ['currency_preference', 'auto']);
      }

      if (dailyRemRes) {
        dailyReminderEnabled = dailyRemRes.value === '1';
      }

      if (periodicRes) {
        periodicSummaryEnabled = periodicRes.value === '1';
      }

      if (lunchTimeRes && lunchTimeRes.value) {
        dailyReminderLunchTime = lunchTimeRes.value;
      }

      if (eveningTimeRes && eveningTimeRes.value) {
        dailyReminderEveningTime = eveningTimeRes.value;
      }

      if (promptedRes) {
        hasPromptedNotification = promptedRes.value === '1';
      }

      // 应用语言设置到全局 i18n
      if (languagePreference === 'auto') {
        i18n.locale = getDeviceLanguage();
      } else {
        i18n.locale = languagePreference;
      }

      set({
        monthlyBudget,
        themePreference,
        languagePreference,
        currencyPreference,
        dailyReminderEnabled,
        periodicSummaryEnabled,
        dailyReminderLunchTime,
        dailyReminderEveningTime,
        hasPromptedNotification,
      });
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

  setLanguagePreference: async (pref: 'auto' | 'zh' | 'en') => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['language_preference', pref]);
      
      // 实时应用到全局 i18n
      if (pref === 'auto') {
        i18n.locale = getDeviceLanguage();
      } else {
        i18n.locale = pref;
      }
      
      set({ languagePreference: pref });
    } catch (e) {
      console.error('[SettingsStore] 更新语言偏好失败:', e);
    }
  },

  setCurrencyPreference: async (pref: CurrencyType) => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['currency_preference', pref]);
      set({ currencyPreference: pref });
    } catch (e) {
      console.error('[SettingsStore] 更新货币偏好失败:', e);
    }
  },

  setDailyReminderEnabled: async (enabled: boolean) => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['daily_reminder_enabled', enabled ? '1' : '0']);
      set({ dailyReminderEnabled: enabled });
    } catch (e) {
      console.error('[SettingsStore] 更新每日提醒配置失败:', e);
    }
  },

  setPeriodicSummaryEnabled: async (enabled: boolean) => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['periodic_summary_enabled', enabled ? '1' : '0']);
      set({ periodicSummaryEnabled: enabled });
    } catch (e) {
      console.error('[SettingsStore] 更新周期总结配置失败:', e);
    }
  },

  setDailyReminderTimes: async (lunchTime: string, eveningTime: string) => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['daily_reminder_lunch_time', lunchTime]);
      await db.runAsync(QUERIES.UPSERT_SETTING, ['daily_reminder_evening_time', eveningTime]);
      set({ dailyReminderLunchTime: lunchTime, dailyReminderEveningTime: eveningTime });
    } catch (e) {
      console.error('[SettingsStore] 更新提醒时间失败:', e);
    }
  },

  setHasPromptedNotification: async (prompted: boolean) => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.UPSERT_SETTING, ['has_prompted_notification', prompted ? '1' : '0']);
      set({ hasPromptedNotification: prompted });
    } catch (e) {
      console.error('[SettingsStore] 更新提醒弹窗提示状态失败:', e);
    }
  },

  getCurrencySymbol: () => {
    const pref = get().currencyPreference;
    const active = pref === 'auto' ? getDeviceCurrency() : pref;
    return CURRENCIES[active]?.symbol || '$';
  }
}));
