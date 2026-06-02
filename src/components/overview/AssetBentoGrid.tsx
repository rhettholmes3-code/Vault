import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import SvgPath from 'react-native-svg';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/constants/Colors';
import { formatAmount } from '@/src/utils/numberUtils';
import { GlassCard } from '@/src/components/common/GlassCard';
import { Transaction } from '@/src/types/transaction';
import { t } from '@/src/constants/i18n';

interface AssetBentoGridProps {
  income: number;
  expense: number;
  transactions: Transaction[];
}

export function AssetBentoGrid({ income, expense, transactions }: AssetBentoGridProps) {
  const { colors, isDark } = useTheme();
  
  const netWorth = income - expense;

  // Calculate daily cumulative net assets for Sparkline
  const { pathD, fillD } = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Create daily net values array
    const dailyNets = Array(daysInMonth).fill(0);
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth) {
        const day = txDate.getDate() - 1;
        if (day >= 0 && day < daysInMonth) {
          if (tx.type === 'income') {
            dailyNets[day] += tx.amount;
          } else {
            dailyNets[day] -= tx.amount;
          }
        }
      }
    });

    // Compute cumulative balances
    const cumulativeBalances: number[] = [];
    let currentSum = 0;
    for (let i = 0; i < daysInMonth; i++) {
      currentSum += dailyNets[i];
      cumulativeBalances.push(currentSum);
    }

    // Map points to SVG coordinates (width = 180, height = 80)
    const w = 180;
    const h = 80;
    const minVal = Math.min(...cumulativeBalances);
    const maxVal = Math.max(...cumulativeBalances);
    const valRange = maxVal - minVal;

    const points = cumulativeBalances.map((val, i) => {
      const x = (i / (daysInMonth - 1)) * w;
      const y = valRange === 0
        ? h / 2
        : h - ((val - minVal) / valRange) * (h - 24) - 12; // 12px padding top/bottom
      return { x, y };
    });

    if (points.length === 0) {
      return { pathD: '', fillD: '' };
    }

    const pD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fD = `${pD} L ${w} ${h} L 0 ${h} Z`;

    return { pathD: pD, fillD: fD };
  }, [transactions]);

  return (
    <View style={styles.container}>
      <View style={styles.bentoRow}>
        {/* 左侧大卡片：净资产 */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(400)} 
          style={styles.leftContainer}
        >
          <GlassCard style={styles.mainCard} intensity={isDark ? 30 : 60}>
            {/* Sparkline (Full Bleed Background at bottom) */}
            <View style={styles.sparklineContainer}>
              {pathD ? (
                <Svg width="100%" height="100%" viewBox="0 0 180 80" preserveAspectRatio="none">
                  <Defs>
                    <LinearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.25} />
                      <Stop offset="100%" stopColor={COLORS.primary} stopOpacity={0.0} />
                    </LinearGradient>
                  </Defs>
                  <Path d={fillD} fill="url(#gradient-area)" />
                  <Path 
                    d={pathD} 
                    fill="none" 
                    stroke={COLORS.primary} 
                    strokeWidth={2} 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </Svg>
              ) : null}
            </View>

            {/* Content overlay */}
            <View style={styles.mainCardContent}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <MaterialIcons name="account-balance-wallet" size={16} color={COLORS.primary} />
                </View>
                <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{t('overview.monthly_balance')}</Text>
              </View>
              <Text style={[styles.mainAmount, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(netWorth)}
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 右侧列：收入 & 支出 */}
        <View style={styles.rightContainer}>
          {/* 收入卡片 */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ flex: 1 }}>
            <GlassCard style={styles.subCard} intensity={isDark ? 30 : 60}>
              <View style={styles.cardHeaderSmall}>
                <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <MaterialIcons name="trending-up" size={12} color={COLORS.success} />
                </View>
                <Text style={[styles.cardTitleSmall, { color: colors.textSecondary }]}>{t('overview.monthly_income')}</Text>
              </View>
              <Text style={[styles.subAmount, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(income)}
              </Text>
            </GlassCard>
          </Animated.View>

          {/* 支出卡片 */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ flex: 1 }}>
            <GlassCard style={styles.subCard} intensity={isDark ? 30 : 60}>
              <View style={styles.cardHeaderSmall}>
                <View style={[styles.iconBoxSmall, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                  <MaterialIcons name="trending-down" size={12} color={COLORS.danger} />
                </View>
                <Text style={[styles.cardTitleSmall, { color: colors.textSecondary }]}>{t('overview.monthly_expense')}</Text>
              </View>
              <Text style={[styles.subAmount, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(expense)}
              </Text>
            </GlassCard>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  bentoRow: {
    flexDirection: 'row',
    height: 180,
    gap: 12,
  },
  leftContainer: {
    flex: 1.4,
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'column',
    gap: 12,
  },
  mainCard: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  mainCardContent: {
    padding: 16,
    zIndex: 10,
    flex: 1,
  },
  sparklineContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  subCard: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeaderSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  iconBoxSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: 'Manrope-SemiBold',
  },
  cardTitleSmall: {
    fontSize: 11,
    fontFamily: 'Manrope-SemiBold',
  },
  mainAmount: {
    fontSize: 28,
    fontFamily: 'JetBrainsMono',
    marginTop: 2,
  },
  subAmount: {
    fontSize: 16,
    fontFamily: 'JetBrainsMono',
    marginTop: 2,
  },
});
