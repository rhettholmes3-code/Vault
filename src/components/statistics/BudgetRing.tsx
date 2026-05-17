import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/src/hooks/useTheme';

interface BudgetRingProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export function BudgetRing({ progress, size = 64, strokeWidth = 6 }: BudgetRingProps) {
  const { colors } = useTheme();
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference;
  
  const isOverBudget = progress > 100;
  const progressColor = isOverBudget ? colors.danger : colors.primary;

  return (
    <View style={[{ width: size, height: size }, styles.container]}>
      <Svg width={size} height={size}>
        <Circle
          stroke={colors.border}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={progressColor}
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
        <Text style={[styles.text, { color: progressColor }]}>
          {Math.round(progress)}%
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
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'JetBrainsMono',
  }
});
