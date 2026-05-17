import { Tabs } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/GlassCard';
import { useRouter } from 'expo-router';
import { COLORS } from '@/src/constants/Colors';

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 24,
          left: 20,
          right: 20,
          height: 68,
          borderRadius: 24,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarBackground: () => (
          <GlassCard
            intensity={45}
            borderRadius={24}
            borderWidth={1}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '概览',
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
          title: '记账',
          tabBarButton: () => (
            <TouchableOpacity
              onPress={() => router.push('/add-entry' as any)}
              style={styles.fabContainer}
              activeOpacity={0.85}
            >
              <View style={styles.fab}>
                <MaterialIcons name="add" size={32} color="#fff" />
              </View>
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '更多',
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
  fabContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 68,
    height: 68,
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
  },
});
