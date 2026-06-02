import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { TrendData } from '@/src/types/statistics';
import { useTheme } from '@/src/hooks/useTheme';
import { formatAmount } from '@/src/utils/numberUtils';
import { t } from '@/src/constants/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';

interface TrendChartProps {
  data: TrendData | null;
  activeType?: 'expense' | 'income';
}

export function TrendChart({ data }: TrendChartProps) {
  const { colors, isDark } = useTheme();
  const currencySymbol = useSettingsStore(state => state.getCurrencySymbol());
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [showExpense, setShowExpense] = useState(true);
  const [showIncome, setShowIncome] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<{
    index: number;
    label: string;
    expense: number;
    income: number;
    budget: number;
    balance: number;
  } | null>(null);

  if (!data || data.labels.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>{t('stats.no_chart_data')}</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  const isDaily = data.labels.length > 12;
  const isYearly = data.labels.length <= 5;

  // Calculate dynamic width and scrollable behavior
  let chartWidth = screenWidth - 32;
  if (isDaily) {
    chartWidth = screenWidth * 2.2;
  } else if (!isYearly) {
    chartWidth = screenWidth * 1.45;
  }

  const labels = data.labels.map((label, index) => {
    if (isDaily) {
      if (index === 0 || index === data.labels.length - 1 || index % 5 === 0) {
        return label;
      }
      return '';
    }
    return label;
  });

  const datasets = [];
  if (showExpense && data.expenseData && data.expenseData.length > 0) {
    datasets.push({
      data: data.expenseData,
      color: (opacity = 1) => '#f43f5e', // rose-500
      strokeWidth: 3
    });
  }
  if (showIncome && data.incomeData && data.incomeData.length > 0) {
    datasets.push({
      data: data.incomeData,
      color: (opacity = 1) => '#10b981', // emerald-500
      strokeWidth: 3
    });
  }
  // Add budget line only if showExpense is true and there is a budget
  const hasBudget = data.budgetData && data.budgetData.some(v => v > 0);
  if (showExpense && hasBudget) {
    datasets.push({
      data: data.budgetData,
      color: (opacity = 1) => isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)',
      strokeWidth: 1.5,
    });
  }

  // Safe fallback if datasets is empty
  if (datasets.length === 0) {
    datasets.push({
      data: Array(data.labels.length).fill(0),
      color: () => 'transparent',
      strokeWidth: 0
    });
  }

  const handleToggleExpense = () => {
    if (showExpense && !showIncome) {
      setShowIncome(true);
    }
    setShowExpense(!showExpense);
    setSelectedPoint(null);
  };

  const handleToggleIncome = () => {
    if (showIncome && !showExpense) {
      setShowExpense(true);
    }
    setShowIncome(!showIncome);
    setSelectedPoint(null);
  };

  const handleDataPointClick = (dataPoint: { index: number; x: number; y: number; value: number }) => {
    const idx = dataPoint.index;
    const label = data.labels[idx];
    const expense = data.expenseData[idx] || 0;
    const income = data.incomeData[idx] || 0;
    const budget = (data.budgetData && data.budgetData[idx]) || 0;
    const balance = income - expense;
    
    setSelectedPoint({
      index: idx,
      label,
      expense,
      income,
      budget,
      balance,
    });
  };

  // Helper to format Y-axis label into thousands (k format) to save 65%+ spacing
  const formatYLabel = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(0) + 'k';
    }
    return value;
  };

  // Pre-calculate 4-level scale floating labels
  const maxExpense = Math.max(...(data.expenseData && data.expenseData.length > 0 ? data.expenseData : [0]));
  const maxIncome = Math.max(...(data.incomeData && data.incomeData.length > 0 ? data.incomeData : [0]));
  const maxVal = Math.max(maxExpense, maxIncome, 100);

  const floatLabels = [
    formatYLabel(maxVal.toString()),
    formatYLabel((maxVal * 0.66).toString()),
    formatYLabel((maxVal * 0.33).toString()),
    '0'
  ];

  return (
    <View style={styles.container}>
      <View style={styles.chartHeader}>
        <Text style={[styles.unitText, { color: colors.textSecondary }]}>{t('stats.unit_yuan')}</Text>
      </View>

      <View style={styles.chartWrapper}>
        {/* Floating Glassmorphic Y-axis labels directly on curves */}
        {!isYearly && (
          <View style={styles.floatingYAxis} pointerEvents="none">
            {floatLabels.map((lbl, idx) => (
              <Text 
                key={`float-lbl-${idx}`} 
                style={[
                  styles.floatingYText, 
                  { 
                    color: isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.4)',
                    textShadowColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2
                  }
                ]}
              >
                {lbl}
              </Text>
            ))}
          </View>
        )}

        <ScrollView 
          ref={scrollViewRef}
          horizontal={true} 
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => {
            if (!isYearly) {
              scrollViewRef.current?.scrollToEnd({ animated: false });
            }
          }}
        >
          <LineChart
            data={{
              labels: labels,
              datasets: datasets
            }}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            yAxisInterval={1} 
            withHorizontalLabels={isYearly} // Show normally only on single page yearly chart
            formatYLabel={formatYLabel}
            withVerticalLines={false}
            withHorizontalLines={true}
            onDataPointClick={handleDataPointClick}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: colors.background,
              backgroundGradientTo: colors.background,
              backgroundGradientFromOpacity: 0,
              backgroundGradientToOpacity: 0,
              decimalPlaces: 0,
              color: (opacity = 1) => colors.textSecondary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4', 
                strokeWidth: '2',
                stroke: colors.card
              },
              propsForBackgroundLines: {
                strokeDasharray: '0',
                stroke: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                strokeWidth: 1,
              }
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </ScrollView>
      </View>
      
      <View style={styles.legend}>
        <TouchableOpacity 
          style={[styles.legendItem, { opacity: showExpense ? 1 : 0.4 }]}
          onPress={handleToggleExpense}
          activeOpacity={0.7}
        >
          <View style={[styles.legendColor, { backgroundColor: '#f43f5e' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontWeight: showExpense ? '600' : '400' }]}>
            {t('overview.expense')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.legendItem, { opacity: showIncome ? 1 : 0.4 }]}
          onPress={handleToggleIncome}
          activeOpacity={0.7}
        >
          <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary, fontWeight: showIncome ? '600' : '400' }]}>
            {t('overview.income')}
          </Text>
        </TouchableOpacity>

        {showExpense && hasBudget && (
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('overview.monthly_budget')}</Text>
          </View>
        )}
      </View>

      {/* High-Fidelity Data Details Tooltip Card */}
      {selectedPoint && (
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.detailHeader, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }]}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>📅 {selectedPoint.label} {t('stats.summary')}</Text>
            <TouchableOpacity onPress={() => setSelectedPoint(null)} style={styles.closeBtn}>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontFamily: 'Manrope-SemiBold' }}>{t('overview.cancel')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.detailGrid}>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('overview.expense')}</Text>
              <Text style={[styles.detailVal, { color: '#f43f5e' }]}>{currencySymbol}{formatAmount(selectedPoint.expense)}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('overview.income')}</Text>
              <Text style={[styles.detailVal, { color: '#10b981' }]}>{currencySymbol}{formatAmount(selectedPoint.income)}</Text>
            </View>
            {selectedPoint.budget > 0 && (
              <View style={styles.detailCol}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('overview.monthly_budget')}</Text>
                <Text style={[styles.detailVal, { color: colors.text }]}>{currencySymbol}{formatAmount(selectedPoint.budget)}</Text>
              </View>
            )}
            <View style={styles.detailCol}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('overview.balance')}</Text>
              <Text style={[styles.detailVal, { color: selectedPoint.balance >= 0 ? '#10b981' : '#f43f5e' }]}>
                {selectedPoint.balance >= 0 ? '+' : ''}{currencySymbol}{formatAmount(selectedPoint.balance)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    borderRadius: 20,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    marginBottom: -4,
  },
  unitText: {
    fontSize: 10,
    fontFamily: 'Manrope-Regular',
  },
  chartWrapper: {
    position: 'relative',
  },
  floatingYAxis: {
    position: 'absolute',
    left: 8,
    top: 22,
    height: 142,
    justifyContent: 'space-between',
    zIndex: 20,
  },
  floatingYText: {
    fontSize: 9,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Manrope-Regular',
  },
  detailCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 4,
  },
  detailTitle: {
    fontSize: 12,
    fontFamily: 'Manrope-SemiBold',
  },
  closeBtn: {
    padding: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontFamily: 'Manrope-Regular',
    marginBottom: 2,
  },
  detailVal: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
  },
});
