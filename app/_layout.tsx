import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '@/src/hooks/useTheme';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Manrope-Bold': require('../assets/fonts/Manrope-Bold.ttf'),
    'Manrope-SemiBold': require('../assets/fonts/Manrope-SemiBold.ttf'),
    'Manrope-Regular': require('../assets/fonts/Manrope-Regular.ttf'),
    'JetBrainsMono': require('../assets/fonts/JetBrainsMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const prepare = async () => {
      try {
        const { initializeDatabase } = await import('@/src/database/connection');
        await initializeDatabase();

        // 启动时预先载入 SQLite 设置到 Zustand 内存状态 (这会同步初始化 i18n)
        const { useSettingsStore } = await import('@/src/stores/useSettingsStore');
        await useSettingsStore.getState().fetchSettings();

        // 启动时预载类别
        const { useCategoryStore } = await import('@/src/stores/useCategoryStore');
        await useCategoryStore.getState().initCategories();
      } catch (e) {
        console.warn('数据库初始化失败:', e);
      } finally {
        if (loaded) {
          SplashScreen.hideAsync();
        }
      }
    };

    prepare();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { colorScheme } = useTheme();
  // 订阅 languagePreference 以便在用户手动切换语言时强制重新渲染整个导航树
  const { languagePreference } = useSettingsStore();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="add-entry" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              animation: 'none',
            }} 
          />
          <Stack.Screen 
            name="edit-entry/[id]" 
            options={{ 
              presentation: 'transparentModal',
              headerShown: false,
              animation: 'none',
            }} 
          />
          <Stack.Screen 
            name="category-management" 
            options={{ 
              presentation: 'fullScreenModal',
              headerShown: false,
              animation: 'slide_from_bottom',
            }} 
          />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
