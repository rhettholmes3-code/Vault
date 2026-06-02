import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { StructureData, PeriodType } from '@/src/types/statistics';
import { useTheme } from '@/src/hooks/useTheme';
import { getDatabase } from '@/src/database/connection';
import { Transaction } from '@/src/types/transaction';
import { getMonthRange, getYearRange } from '@/src/utils/dateUtils';
import { TransactionItem } from '../overview/TransactionItem';
import { t } from '@/src/constants/i18n';

interface CategoryRankingProps {
  data: StructureData | null;
  periodType: PeriodType;
  currentDate: Date;
  type: 'expense' | 'income';
}

export function CategoryRanking({ data, periodType, currentDate, type }: CategoryRankingProps) {
  const { colors, isDark } = useTheme();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleExpand = async (categoryId: string) => {
    if (expandedCategory === categoryId) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setExpandedCategory(null);
      return;
    }

    const db = await getDatabase();
    const { start, end } = periodType === 'month' ? getMonthRange(currentDate) : getYearRange(currentDate);
    
    const query = `
      SELECT * FROM transactions 
      WHERE type = ? AND category = ? AND date >= ? AND date <= ? 
      ORDER BY date DESC
    `;
    const rows = await db.getAllAsync<Transaction>(
      query, 
      [type || 'expense', categoryId || '', start || '', end || '']
    );
    
    setTransactions(rows);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCategory(categoryId);
  };

  // 假设在此页面不进行删除，或者 onDelete 作为一个无操作回调
  const noop = () => {};

  if (!data || data.points.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {data.points.map((point, index) => {
          const isExpanded = expandedCategory === point.category;
          return (
            <View key={point.category}>
              <TouchableOpacity 
                style={[
                  styles.row, 
                  index < data.points.length - 1 && !isExpanded && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
                ]}
                onPress={() => handleExpand(point.category)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.iconBg : point.color + '20' }]}>
                  <MaterialIcons name={point.icon as any} size={20} color={point.color} />
                </View>
                
                <View style={styles.contentContainer}>
                  <View style={styles.headerRow}>
                    <Text style={[styles.name, { color: colors.text }]}>{t('category.' + point.category)}</Text>
                    <Text style={[styles.amount, { color: colors.text }]}>¥{point.amount.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.progressRow}>
                    <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSubtle }]}>
                      <View style={[styles.progressBarFill, { width: `${point.percentage}%`, backgroundColor: point.color }]} />
                    </View>
                    <Text style={[styles.percentage, { color: colors.textSecondary }]}>{point.percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.transactionsContainer}>
                  {transactions.map(tData => (
                    <TransactionItem 
                      key={tData.id} 
                      transaction={tData} 
                      onDelete={noop} 
                    />
                  ))}
                  {index < data.points.length - 1 && (
                    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Manrope-Regular',
  },
  amount: {
    fontSize: 15,
    fontFamily: 'JetBrainsMono',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
    width: 44,
    textAlign: 'right',
  },
  transactionsContainer: {
    backgroundColor: 'transparent',
  }
});
