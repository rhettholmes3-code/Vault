import { Tabs } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/GlassCard';
import { useRouter } from 'expo-router';
import { COLORS } from '@/src/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '@/src/constants/i18n';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () => (
          <GlassCard
            intensity={45}
            borderRadius={0}
            borderWidth={0}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.ledger'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialIcons 
                name="bar-chart" 
                size={28} 
                color={color} 
                style={{ opacity: focused ? 1 : 0.6 }} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="add-placeholder"
        options={{
          title: t('entry.add_transaction'),
          tabBarButton: (props) => {
            const { style, onPress, ...rest } = props as any;
            return (
              <TouchableOpacity
                style={[style, { justifyContent: 'center', alignItems: 'center', overflow: 'visible' }]}
                onPress={() => router.push('/add-entry' as any)}
                activeOpacity={0.85}
              >
                <View style={styles.fab}>
                  <MaterialIcons name="add" size={32} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabIconContainer}>
              <MaterialIcons 
                name="settings" 
                size={26} 
                color={color} 
                style={{ opacity: focused ? 1 : 0.6 }} 
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    position: 'absolute',
    top: -20,
  },
});
