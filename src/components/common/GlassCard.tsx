import React from 'react';
import { StyleSheet, View, ViewProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';

interface GlassCardProps extends ViewProps {
  intensity?: number;
  borderRadius?: number;
  borderWidth?: number;
}

/**
 * 毛玻璃效果卡片组件
 */
export function GlassCard({
  children,
  style,
  intensity = 40,
  borderRadius = 24,
  borderWidth = 1,
  ...props
}: GlassCardProps) {
  const { isDark, colorScheme } = useTheme();

  const cardStyle = [
    styles.container,
    {
      borderRadius,
      borderColor: isDark ? COLORS.glass.border.dark : COLORS.glass.border.light,
      borderWidth,
    },
    style,
  ];

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={colorScheme}
        style={cardStyle}
        {...props}
      >
        {children}
      </BlurView>
    );
  }

  // Android 的 BlurView 支持有限，使用半透明背景模拟
  return (
    <View
      style={[
        cardStyle,
        {
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
        },
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
