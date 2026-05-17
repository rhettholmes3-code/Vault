import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PeriodStats } from '@/src/types/statistics';
import { formatAmount } from '@/src/utils/numberUtils';
import { useTheme } from '@/src/hooks/useTheme';
import { GlassCard } from '../common/GlassCard';
import { BudgetRing } from './BudgetRing';

interface SummaryBentoGridProps {
  stats: PeriodStats | null;
}

export function SummaryBentoGrid({ stats }: SummaryBentoGridProps) {
  const { colors, isDark } = useTheme();

  if (!stats) return null;

  return (
    <View style={styles.grid}>
      {/* Top Row: Total Expense & Budget */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.row}>
        <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 2, marginRight: 12 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>总支出</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            ¥ {formatAmount(stats.totalExpense)}
          </Text>
          {stats.budgetLimit ? (
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              结余 ¥ {formatAmount(stats.budgetRemaining || 0)}
            </Text>
          ) : (
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              日均 ¥ {formatAmount(stats.avgDailyExpense)}
            </Text>
          )}
        </GlassCard>
        
        {stats.budgetProgress !== undefined && (
          <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 8 }]}>预算</Text>
            <BudgetRing progress={stats.budgetProgress} size={50} strokeWidth={5} />
          </GlassCard>
        )}
      </Animated.View>

      {/* Bottom Row: Income & Balance */}
      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.row}>
        <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1, marginRight: 12 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>总收入</Text>
          <Text style={[styles.valueSmall, { color: colors.success }]}>
            + ¥ {formatAmount(stats.totalIncome)}
          </Text>
        </GlassCard>

        <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1 }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>结余</Text>
          <Text style={[styles.valueSmall, { color: colors.text }]}>
            ¥ {formatAmount(stats.balance)}
          </Text>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'JetBrainsMono',
    marginBottom: 4,
  },
  valueSmall: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'JetBrainsMono',
  },
  subText: {
    fontSize: 12,
    fontFamily: 'Manrope-Regular',
  }
});
