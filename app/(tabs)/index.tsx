import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { SegmentedControl } from '@/src/components/common/SegmentedControl';
import { AssetBentoGrid } from '@/src/components/overview/AssetBentoGrid';
import { TransactionList } from '@/src/components/overview/TransactionList';
import { useTransactionStore } from '@/src/stores/useTransactionStore';
import { getMonthRange, toDate } from '@/src/utils/dateUtils';
import { StatisticsView } from '@/src/components/statistics/StatisticsView';
import { useStatsStore } from '@/src/stores/useStatsStore';
import { Skeleton } from '@/src/components/common/Skeleton';
import { t } from '@/src/constants/i18n';

const FILTER_VALUES = ['all', 'expense', 'income'] as const;

export default function OverviewScreen() {
  const { colors, isDark } = useTheme();
  
  const [mainTabIndex, setMainTabIndex] = useState(0);
  const [filterIndex, setFilterIndex] = useState(0);

  const { transactions, fetchTransactions, deleteTransaction, isLoading } = useTransactionStore();
  const setPeriodType = useStatsStore(s => s.setPeriodType);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (mainTabIndex === 1) setPeriodType('month');
    if (mainTabIndex === 2) setPeriodType('year');
  }, [mainTabIndex]);

  // Calculate current month's income and expense for the AssetBentoGrid
  const { income, expense } = useMemo(() => {
    const today = new Date();
    const { start, end } = getMonthRange(today);
    
    let inc = 0;
    let exp = 0;
    
    transactions.forEach(tx => {
      if (tx.date >= start && tx.date <= end) {
        if (tx.type === 'income') inc += tx.amount;
        if (tx.type === 'expense') exp += tx.amount;
      }
    });
    
    return { income: inc, expense: exp };
  }, [transactions]);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
  };

  const handleRefresh = async () => {
    await fetchTransactions();
  };

  const mainTabs = [t('tabs.ledger'), t('stats.monthly'), t('stats.annual')];
  const filterOptions = [t('stats.all_categories'), t('overview.expense'), t('overview.income')];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <SegmentedControl
          values={mainTabs}
          selectedIndex={mainTabIndex}
          onChange={setMainTabIndex}
          style={styles.mainSegmented}
        />
      </View>

      {mainTabIndex === 0 ? (
        <View style={styles.content}>
          <AssetBentoGrid income={income} expense={expense} transactions={transactions} />
          
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: colors.text }]}>{t('overview.recent_records')}</Text>
            <SegmentedControl
              values={filterOptions}
              selectedIndex={filterIndex}
              onChange={setFilterIndex}
              style={styles.filterSegmented}
            />
          </View>
          
          {isLoading && transactions.length === 0 ? (
            <View style={{ paddingHorizontal: 16 }}>
              <Skeleton height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
              <Skeleton height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
              <Skeleton height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
            </View>
          ) : (
            <TransactionList 
              transactions={transactions} 
              onDelete={handleDelete}
              onRefresh={handleRefresh}
              filterType={FILTER_VALUES[filterIndex]}
            />
          )}
        </View>
      ) : (
        <StatisticsView />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  mainSegmented: {
    width: '100%',
  },
  content: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
  },
  filterSegmented: {
    width: 160,
    height: 36,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
    textAlign: 'center',
  },
});
