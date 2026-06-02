import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import zh from './locales/zh.json';
import en from './locales/en.json';

export const i18n = new I18n({ zh, en });

i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export const getDeviceLanguage = (): 'zh' | 'en' => {
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    const langCode = locales[0].languageCode;
    if (langCode === 'zh') return 'zh';
  }
  return 'en';
};

export const t = (key: string, options?: any) => {
  return i18n.t(key, options);
};
