import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useStatsStore } from '@/src/stores/useStatsStore';
import { useTransactionStore } from '@/src/stores/useTransactionStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { StatisticsService } from '@/src/services/StatisticsService';
import { PeriodStats, TrendData, StructureData } from '@/src/types/statistics';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import { SummaryBentoGrid } from './SummaryBentoGrid';
import { TrendChart } from './TrendChart';
import { StructureChart } from './StructureChart';
import { CategoryRanking } from './CategoryRanking';
import { Skeleton } from '@/src/components/common/Skeleton';
import { t, i18n } from '@/src/constants/i18n';

export function StatisticsView() {
  const { colors, isDark } = useTheme();
  
  const periodType = useStatsStore(s => s.periodType);
  const currentDate = useStatsStore(s => s.currentDate);
  const chartMode = useStatsStore(s => s.chartMode);
  const setChartMode = useStatsStore(s => s.setChartMode);
  
  const goToNextPeriod = useStatsStore(s => s.goToNextPeriod);
  const goToPrevPeriod = useStatsStore(s => s.goToPrevPeriod);
  
  const transactions = useTransactionStore(s => s.transactions);
  const monthlyBudget = useSettingsStore(s => s.monthlyBudget);

  // Custom states for Expense/Income Toggle
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [expenseStructure, setExpenseStructure] = useState<StructureData | null>(null);
  const [incomeStructure, setIncomeStructure] = useState<StructureData | null>(null);
  const [expenseStacked, setExpenseStacked] = useState<any | null>(null);
  const [incomeStacked, setIncomeStacked] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      setLoading(true);
      try {
        const [pStats, tData, expSData, incSData, expStackedData, incStackedData] = await Promise.all([
          StatisticsService.getPeriodStats(currentDate, periodType),
          StatisticsService.getTrendData(currentDate, periodType),
          StatisticsService.getStructureData(currentDate, periodType, 'expense'),
          StatisticsService.getStructureData(currentDate, periodType, 'income'),
          StatisticsService.getStackedTrendData(currentDate, periodType, 'expense'),
          StatisticsService.getStackedTrendData(currentDate, periodType, 'income')
        ]);
        
        if (mounted) {
          setStats(pStats);
          setTrendData(tData);
          setExpenseStructure(expSData);
          setIncomeStructure(incSData);
          setExpenseStacked(expStackedData);
          setIncomeStacked(incStackedData);
        }
      } catch (error) {
        console.error('Failed to load statistics:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    fetchData();
    
    return () => { mounted = false; };
  }, [currentDate, periodType, transactions, monthlyBudget]);

  const getDisplayDate = () => {
    if (periodType === 'month') {
      if (i18n.locale === 'zh') {
        return `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
    return i18n.locale === 'zh' ? `${currentDate.getFullYear()}年` : `${currentDate.getFullYear()}`;
  };

  const displayDate = getDisplayDate();
  const chartModeValues = [t('stats.trend_btn'), t('stats.structure_btn')];
  const listTypeValues = [t('stats.expense_analysis'), t('stats.income_analysis')];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Time Navigation */}
      <View style={styles.navHeader}>
        <TouchableOpacity onPress={goToPrevPeriod} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]}>{displayDate}</Text>
        <TouchableOpacity onPress={goToNextPeriod} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <Skeleton height={88} style={{ flex: 2, borderRadius: 20 }} />
              <Skeleton height={88} style={{ flex: 1, borderRadius: 20 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <Skeleton height={88} style={{ flex: 1, borderRadius: 20 }} />
              <Skeleton height={88} style={{ flex: 1, borderRadius: 20 }} />
              <Skeleton height={88} style={{ flex: 1, borderRadius: 20 }} />
            </View>
            <Skeleton height={200} style={{ marginBottom: 24, borderRadius: 16 }} />
            <Skeleton height={200} style={{ marginBottom: 24, borderRadius: 16 }} />
          </View>
        ) : (
          <>
            {/* 1. Bento Grid Cards */}
            <SummaryBentoGrid stats={stats} />
            
            {/* 2. Chart Section with Mode Toggle */}
            <View style={styles.chartHeaderSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {chartMode === 'trend' ? t('stats.trend') : t('stats.structure')}
              </Text>
              <SegmentedControl
                values={chartModeValues}
                selectedIndex={chartMode === 'trend' ? 0 : 1}
                onChange={(idx) => setChartMode(idx === 0 ? 'trend' : 'structure')}
                style={styles.chartModeControl}
              />
            </View>

            {chartMode === 'trend' ? (
              <TrendChart data={trendData} activeType={activeType} />
            ) : (
              <StructureChart stackedData={activeType === 'expense' ? expenseStacked : incomeStacked} type={activeType} />
            )}

            {/* 3. Category Ranking List with Expense/Income Toggle */}
            <View style={styles.listHeaderSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('stats.ranking')}</Text>
              <SegmentedControl
                values={listTypeValues}
                selectedIndex={activeType === 'expense' ? 0 : 1}
                onChange={(idx) => setActiveType(idx === 0 ? 'expense' : 'income')}
                style={styles.listTypeControl}
              />
            </View>

            <CategoryRanking data={activeType === 'expense' ? expenseStructure : incomeStructure} periodType={periodType} currentDate={currentDate} type={activeType} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navButton: {
    padding: 8,
  },
  navTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-SemiBold',
  },
  chartHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
  },
  chartModeControl: {
    width: 110,
    height: 32,
    borderRadius: 8,
  },
  listHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 12,
  },
  listTypeControl: {
    width: 170,
    height: 32,
    borderRadius: 8,
  },
  scrollContent: {
    paddingBottom: 100, // accommodate bottom tab bar
  }
});
