import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/src/hooks/useTheme';

interface BudgetRingProps {
  progress: number; // Spent percentage (0 to 100+)
  size?: number;
  strokeWidth?: number;
}

export function BudgetRing({ progress, size = 64, strokeWidth = 6 }: BudgetRingProps) {
  const { colors, isDark } = useTheme();
  
  // Calculate remaining percentage (100 - spent)
  const remainingPercent = Math.max(0, 100 - progress);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Stroke is based on remaining percentage
  const strokeDashoffset = circumference - (remainingPercent / 100) * circumference;
  
  // Health color mapping:
  // > 50% remaining: emerald-500
  // 20% - 50% remaining: amber-500
  // < 20% remaining: rose-500
  let healthColor = '#10b981'; // Default green
  if (remainingPercent < 20) {
    healthColor = '#f43f5e'; // Red
  } else if (remainingPercent < 50) {
    healthColor = '#f59e0b'; // Yellow
  }

  return (
    <View style={[{ width: size, height: size }, styles.container]}>
      <Svg width={size} height={size}>
        <Circle
          stroke={isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={healthColor}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          originX={size / 2}
          originY={size / 2}
          rotation="-90"
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.text, { color: healthColor }]}>
          {Math.round(remainingPercent)}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'JetBrainsMono',
  }
});
