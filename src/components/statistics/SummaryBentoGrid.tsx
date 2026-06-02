import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PeriodStats } from '@/src/types/statistics';
import { formatAmount } from '@/src/utils/numberUtils';
import { useTheme } from '@/src/hooks/useTheme';
import { GlassCard } from '../common/GlassCard';
import { BudgetRing } from './BudgetRing';
import { t } from '@/src/constants/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

interface SummaryBentoGridProps {
  stats: PeriodStats | null;
}

export function SummaryBentoGrid({ stats }: SummaryBentoGridProps) {
  const { colors, isDark } = useTheme();
  const currencySymbol = useSettingsStore(state => state.getCurrencySymbol());

  if (!stats) return null;

  const hasBudget = stats.budgetLimit !== undefined && stats.budgetLimit > 0;

  return (
    <View style={styles.grid}>
      {hasBudget ? (
        <>
          {/* Monthly View Layout (With Budget) */}
          {/* Row 1: Balance (flex 2) & Budget Progress (flex 1) */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.row}>
            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 2, marginRight: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('overview.balance')}</Text>
              <Text style={[styles.value, { color: '#3b82f6' }]}>
                {currencySymbol} {formatAmount(stats.balance)}
              </Text>
            </GlassCard>
            
            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 4 }]}>{t('overview.monthly_budget')}</Text>
              <BudgetRing progress={stats.budgetProgress || 0} size={40} strokeWidth={4} />
            </GlassCard>
          </Animated.View>

          {/* Row 2: Income, Expense, Daily Avg (3-column, flex 1 each) */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.row}>
            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>{t('overview.income')}</Text>
              <Text style={[styles.valueSmall, { color: '#10b981' }]} numberOfLines={1}>
                {currencySymbol}{formatAmount(stats.totalIncome)}
              </Text>
            </GlassCard>

            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>{t('overview.expense')}</Text>
              <Text style={[styles.valueSmall, { color: '#f43f5e' }]} numberOfLines={1}>
                {currencySymbol}{formatAmount(stats.totalExpense)}
              </Text>
            </GlassCard>

            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1 }]}>
              <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>{t('stats.avg_daily')}</Text>
              <Text style={[styles.valueSmall, { color: '#f59e0b' }]} numberOfLines={1}>
                {currencySymbol}{formatAmount(stats.avgDailyExpense)}
              </Text>
            </GlassCard>
          </Animated.View>
        </>
      ) : (
        <>
          {/* Annual View Layout (Without Budget - 2x2 Grid) */}
          {/* Row 1: Balance & Daily Avg */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.row}>
            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1, marginRight: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('overview.balance')}</Text>
              <Text style={[styles.value, { color: '#3b82f6' }]}>
                {currencySymbol} {formatAmount(stats.balance)}
              </Text>
            </GlassCard>

            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('stats.avg_daily_expense')}</Text>
              <Text style={[styles.value, { color: '#f59e0b' }]}>
                {currencySymbol} {formatAmount(stats.avgDailyExpense)}
              </Text>
            </GlassCard>
          </Animated.View>

          {/* Row 2: Total Income & Total Expense */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.row}>
            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1, marginRight: 12 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('stats.total_income')}</Text>
              <Text style={[styles.value, { color: '#10b981' }]}>
                {currencySymbol} {formatAmount(stats.totalIncome)}
              </Text>
            </GlassCard>

            <GlassCard intensity={isDark ? 30 : 60} style={[styles.card, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>{t('stats.total_expense')}</Text>
              <Text style={[styles.value, { color: '#f43f5e' }]}>
                {currencySymbol} {formatAmount(stats.totalExpense)}
              </Text>
            </GlassCard>
          </Animated.View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
  },
  card: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    minHeight: 70,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: 'Manrope-SemiBold',
    marginBottom: 2,
  },
  labelSmall: {
    fontSize: 9,
    fontFamily: 'Manrope-SemiBold',
    marginBottom: 2,
  },
  value: {
    fontSize: 20,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
  },
  valueSmall: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
  },
});
