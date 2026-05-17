import { useColorScheme } from 'react-native';
import Colors from '../constants/Colors';
import { useSettingsStore } from '../stores/useSettingsStore';

/**
 * 自定义 Hook，用于获取当前主题色彩和模式
 * 支持系统跟随和用户手动切换
 */
export function useTheme() {
  const systemColorScheme = useColorScheme() ?? 'light';
  const { themePreference, setThemePreference } = useSettingsStore();

  const activeColorScheme = themePreference === 'auto' ? systemColorScheme : themePreference;
  const colors = Colors[activeColorScheme];

  const toggleTheme = () => {
    const nextPref = activeColorScheme === 'light' ? 'dark' : 'light';
    setThemePreference(nextPref);
  };

  return {
    colors,
    colorScheme: activeColorScheme,
    isDark: activeColorScheme === 'dark',
    toggleTheme,
    themePreference,
    setThemePreference,
  };
}
