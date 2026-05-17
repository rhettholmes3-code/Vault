import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';

import { useTheme } from '@/src/hooks/useTheme';

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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="add-entry" 
          options={{ 
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="edit-entry/[id]" 
          options={{ 
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
