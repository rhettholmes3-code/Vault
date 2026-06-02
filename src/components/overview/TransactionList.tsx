import React, { useMemo, useState } from 'react';
import { StyleSheet, View, Text, SectionList, RefreshControl } from 'react-native';
import { Transaction } from '@/src/types/transaction';
import { TransactionItem } from './TransactionItem';
import { useTheme } from '@/src/hooks/useTheme';
import { isToday, isYesterday, formatDate } from '@/src/utils/dateUtils';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '@/src/constants/Colors';
import { formatAmount } from '@/src/utils/numberUtils';
import { t } from '@/src/constants/i18n';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onRefresh: () => Promise<void>;
  filterType?: 'all' | 'expense' | 'income';
}

interface Section {
  title: string;
  data: Transaction[];
  dailyExpense: number;
  dailyIncome: number;
}

export function TransactionList({ transactions, onDelete, onRefresh, filterType = 'all' }: TransactionListProps) {
  const { colors, isDark } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const sections = useMemo(() => {
    let filtered = transactions;
    if (filterType !== 'all') {
      filtered = transactions.filter(tData => tData.type === filterType);
    }

    const groups: Record<string, Transaction[]> = {};
    
    // Group by date (descending, assuming they are already sorted or sort them here)
    const sorted = [...filtered].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.created_at - a.created_at;
    });

    sorted.forEach(tx => {
      if (!groups[tx.date]) {
        groups[tx.date] = [];
      }
      groups[tx.date].push(tx);
    });

    const result: Section[] = Object.keys(groups).map(date => {
      const txs = groups[date];
      let dailyExpense = 0;
      let dailyIncome = 0;
      txs.forEach(tx => {
        if (tx.type === 'expense') dailyExpense += tx.amount;
        else dailyIncome += tx.amount;
      });

      // Format title
      let title = '';
      if (isToday(date)) title = t('overview.today');
      else if (isYesterday(date)) title = t('overview.yesterday');
      else title = formatDate(date);

      return {
        title: `${title} - ${date}`, // We store date inside title to keep it unique, we can parse it in render
        data: txs,
        dailyExpense,
        dailyIncome,
      };
    });

    return result;
  }, [transactions, filterType]);

  const renderSectionHeader = ({ section }: { section: Section }) => {
    const titleParts = section.title.split(' - ');
    const displayTitle = titleParts[0];

    return (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{displayTitle}</Text>
        <View style={styles.sectionSummary}>
          {section.dailyIncome > 0 && (
            <Text style={[styles.summaryText, { color: COLORS.success, marginRight: 8 }]}>
              +{formatAmount(section.dailyIncome)}
            </Text>
          )}
          {section.dailyExpense > 0 && (
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
              -{formatAmount(section.dailyExpense)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="receipt-long" size={64} color={colors.border} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('overview.no_transactions')}</Text>
        <Text style={[styles.emptySubText, { color: colors.border }]}>{t('overview.click_plus_to_add')}</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <TransactionItem transaction={item} onDelete={onDelete} />}
      renderSectionHeader={renderSectionHeader}
      stickySectionHeadersEnabled={true}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh} 
          tintColor={colors.tint}
          colors={[COLORS.primary]} // Android
        />
      }
      showsVerticalScrollIndicator={false}
      initialNumToRender={15}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    paddingBottom: 100, // Make room for FAB
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope-SemiBold',
  },
  sectionSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    marginTop: 8,
  },
});
