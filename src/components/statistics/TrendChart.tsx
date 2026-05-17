import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { TrendData } from '@/src/types/statistics';
import { useTheme } from '@/src/hooks/useTheme';

interface TrendChartProps {
  data: TrendData | null;
}

export function TrendChart({ data }: TrendChartProps) {
  const { colors } = useTheme();
  
  if (!data || data.labels.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>暂无趋势数据</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  // We should extract labels at intervals if there are too many (e.g. daily view)
  const isDaily = data.labels.length > 12;
  const labels = data.labels.map((label, index) => {
    if (isDaily) {
      // Show label every 5 days, or first/last
      if (index === 0 || index === data.labels.length - 1 || index % 5 === 0) {
        return label;
      }
      return '';
    }
    return label;
  });

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>收支趋势</Text>
      <LineChart
        data={{
          labels: labels,
          datasets: [
            {
              data: data.expenseData,
              color: (opacity = 1) => colors.danger, // Expense is usually red/danger
              strokeWidth: 3
            },
            {
              data: data.incomeData,
              color: (opacity = 1) => colors.success, // Income is usually green
              strokeWidth: 3
            }
          ]
        }}
        width={screenWidth - 32} // from react-native
        height={220}
        yAxisLabel="¥"
        yAxisSuffix=""
        yAxisInterval={1} 
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
            r: '0', // Hide dots by default, or make them small
            strokeWidth: '2',
            stroke: colors.card
          }
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.danger }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>支出</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textSecondary }]}>收入</Text>
        </View>
      </View>
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
  title: {
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
    marginBottom: 8,
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
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Manrope-Regular',
  }
});
