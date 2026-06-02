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
  fetchSettings: () => Promise<void>;
  setMonthlyBudget: (budget: number) => Promise<void>;
  setThemePreference: (pref: 'light' | 'dark' | 'auto') => Promise<void>;
  setLanguagePreference: (pref: 'auto' | 'zh' | 'en') => Promise<void>;
  setCurrencyPreference: (pref: CurrencyType) => Promise<void>;
  getCurrencySymbol: () => string;
}

/**
 * 全局设置状态管理 Store (Zustand)
 * 提供每月预算、主题偏好、语言设置和货币设置的内存状态与 SQLite 持久化同步能力
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  monthlyBudget: 5000,
  themePreference: 'auto',
  languagePreference: 'auto',
  currencyPreference: 'auto',
  
  fetchSettings: async () => {
    try {
      const db = await getDatabase();
      const budgetRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['monthly_budget']);
      const themeRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['theme_preference']);
      const langRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['language_preference']);
      const currencyRes = await db.getFirstAsync<{ value: string }>(QUERIES.GET_SETTING, ['currency_preference']);

      let monthlyBudget = 5000;
      let themePreference: 'light' | 'dark' | 'auto' = 'auto';
      let languagePreference: 'auto' | 'zh' | 'en' = 'auto';
      let currencyPreference: CurrencyType = 'auto';

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

      // 应用语言设置到全局 i18n
      if (languagePreference === 'auto') {
        i18n.locale = getDeviceLanguage();
      } else {
        i18n.locale = languagePreference;
      }

      set({ monthlyBudget, themePreference, languagePreference, currencyPreference });
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

  getCurrencySymbol: () => {
    const pref = get().currencyPreference;
    const active = pref === 'auto' ? getDeviceCurrency() : pref;
    return CURRENCIES[active]?.symbol || '$';
  }
}));
