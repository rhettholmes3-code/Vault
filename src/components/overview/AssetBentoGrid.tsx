import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/constants/Colors';
import { formatAmount } from '@/src/utils/numberUtils';
import { GlassCard } from '@/src/components/common/GlassCard';

interface AssetBentoGridProps {
  income: number;
  expense: number;
}

export function AssetBentoGrid({ income, expense }: AssetBentoGridProps) {
  const { colors, isDark } = useTheme();
  
  const netWorth = income - expense;

  return (
    <View style={styles.container}>
      {/* 净资产大卡片 */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <GlassCard style={styles.mainCard} intensity={isDark ? 30 : 60}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <MaterialIcons name="account-balance-wallet" size={20} color={COLORS.primary} />
          </View>
          <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>当月结余</Text>
        </View>
        <Text style={[styles.mainAmount, { color: colors.text }]}>
          {formatAmount(netWorth)}
        </Text>
      </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.subCardsRow}>
        {/* 收入卡片 */}
        <GlassCard style={[styles.subCard, { marginRight: 8 }]} intensity={isDark ? 30 : 60}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <MaterialIcons name="trending-up" size={16} color={COLORS.success} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>本月收入</Text>
          </View>
          <Text style={[styles.subAmount, { color: colors.text }]}>
            {formatAmount(income)}
          </Text>
        </GlassCard>

        {/* 支出卡片 */}
        <GlassCard style={[styles.subCard, { marginLeft: 8 }]} intensity={isDark ? 30 : 60}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
              <MaterialIcons name="trending-down" size={16} color={COLORS.danger} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>本月支出</Text>
          </View>
          <Text style={[styles.subAmount, { color: colors.text }]}>
            {formatAmount(expense)}
          </Text>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  mainCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 24,
  },
  subCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'Manrope-SemiBold',
  },
  mainAmount: {
    fontSize: 32,
    fontFamily: 'JetBrainsMono',
    marginTop: 4,
  },
  subAmount: {
    fontSize: 18,
    fontFamily: 'JetBrainsMono',
  },
});
