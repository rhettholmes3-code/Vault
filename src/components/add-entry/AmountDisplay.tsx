import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/constants/Colors';
import { TransactionType } from '@/src/types/transaction';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

interface AmountDisplayProps {
  expression: string;
  displayAmount: string;
  type: TransactionType;
}

export function AmountDisplay({ expression, displayAmount, type }: AmountDisplayProps) {
  const { colors } = useTheme();
  const currencySymbol = useSettingsStore(state => state.getCurrencySymbol());
  
  // Shared value for the micro-interaction pop effect
  const scale = useSharedValue(1);

  // Trigger scale bounce whenever the display amount changes
  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.08, { duration: 70 }),
      withTiming(1.0, { duration: 90 })
    );
  }, [displayAmount]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Pick color based on active transaction type
  const themeColor = type === 'expense' ? COLORS.danger : COLORS.success;

  return (
    <View style={styles.container}>
      {/* Top row: Calculator Expression Chain */}
      <View style={styles.expressionContainer}>
        <Text style={[styles.expressionText, { color: colors.textSecondary }]}>
          {expression ? expression.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ').replace(/\+/g, ' + ').replace(/-/g, ' − ') : ''}
        </Text>
      </View>

      {/* Bottom row: Large formatted input value */}
      <Animated.View style={[styles.amountRow, animatedStyle]}>
        <Text style={[styles.currencySymbol, { color: colors.text, opacity: 0.6 }]}>
          {currencySymbol}
        </Text>
        <Text 
          numberOfLines={1} 
          adjustsFontSizeToFit 
          {...{ minimumScaleFactor: 0.5 } as any} 
          style={[styles.amountText, { color: colors.text }]}
        >
          {displayAmount}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 110,
    width: '100%',
  },
  expressionContainer: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 4,
  },
  expressionText: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    maxWidth: '100%',
  },
  currencySymbol: {
    fontSize: 28,
    fontFamily: 'Manrope-Regular',
    marginRight: 6,
    bottom: 2, // Fine-tune alignment with typography baseline
  },
  amountText: {
    fontSize: 52,
    fontFamily: 'JetBrainsMono',
    fontWeight: 'bold',
    letterSpacing: -1,
  },
});
