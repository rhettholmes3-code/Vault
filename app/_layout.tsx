import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '@/src/hooks/useTheme';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { NotificationService } from '@/src/services/NotificationService';
import { ReminderPromptModal } from '@/src/components/common/ReminderPromptModal';

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

        // 初始化通知通道并同步调度当前已开启的提醒
        await NotificationService.initNotificationChannel();
        const settings = useSettingsStore.getState();
        if (settings.dailyReminderEnabled || settings.periodicSummaryEnabled) {
          await NotificationService.syncReminders(
            settings.dailyReminderEnabled,
            settings.periodicSummaryEnabled
          );
        }
      } catch (e) {
        console.warn('数据库或通知初始化失败:', e);
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
  const router = useRouter();
  // 订阅 languagePreference 以便在用户手动切换语言时强制重新渲染整个导航树
  const { languagePreference, hasPromptedNotification } = useSettingsStore();
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    // 监听通知点击响应跳转
    const cleanup = NotificationService.setupNotificationListeners(router);

    // 监听切回前台事件，自动复核与防丢自愈提醒调度
    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const settings = useSettingsStore.getState();
        if (settings.dailyReminderEnabled || settings.periodicSummaryEnabled) {
          NotificationService.syncReminders(
            settings.dailyReminderEnabled,
            settings.periodicSummaryEnabled
          );
        }
      }
    });

    return () => {
      cleanup();
      appStateSub.remove();
    };
  }, [router]);

  useEffect(() => {
    // 若尚未引导过提醒开启，首次进入展示温和弹窗
    if (!hasPromptedNotification) {
      const timer = setTimeout(() => {
        setShowPromptModal(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasPromptedNotification]);

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
          <Stack.Screen 
            name="more-settings" 
            options={{ 
              headerShown: false,
              animation: 'slide_from_right',
            }} 
          />
        </Stack>

        <ReminderPromptModal
          visible={showPromptModal}
          onClose={() => setShowPromptModal(false)}
        />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
