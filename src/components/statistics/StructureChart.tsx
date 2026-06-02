import React, { useRef } from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView } from 'react-native';
import { StackedBarChart } from 'react-native-chart-kit';
import { useTheme } from '@/src/hooks/useTheme';
import { t } from '@/src/constants/i18n';

interface StructureChartProps {
  stackedData: {
    labels: string[];
    legend: string[];
    data: number[][];
    barColors: string[];
  } | null;
  type?: 'expense' | 'income';
}

export function StructureChart({ stackedData, type = 'expense' }: StructureChartProps) {
  const { colors, isDark } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);

  const emptyText = type === 'income' ? t('stats.no_income_structure') : t('stats.no_expense_structure');

  // Safeguard check for empty or fallback data
  const hasNoData = !stackedData || 
    stackedData.data.length === 0 || 
    stackedData.data[0].length === 0 || 
    (stackedData.data.length > 0 && stackedData.legend.includes('无交易'));

  if (hasNoData) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.textSecondary }}>{emptyText}</Text>
        </View>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const isYearly = stackedData!.labels.length <= 5;

  // Calculate dynamic width and scrollable behavior
  let chartWidth = screenWidth - 32;
  if (!isYearly) {
    chartWidth = screenWidth * 1.45;
  }

  const formatYLabel = (valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return valStr;
    if (val >= 10000) {
      return `${(val / 1000).toFixed(0)}k`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return val.toFixed(0);
  };

  // Calculate exact max value and 4 core labels for floating Y-axis overlay
  const maxStackedVal = stackedData ? Math.max(...stackedData.data.map(row => row.reduce((a, b) => a + b, 0))) : 0;
  const maxValue = maxStackedVal > 0 ? maxStackedVal : 1000;

  const floatLabels = [
    formatYLabel(maxValue.toString()),
    formatYLabel((maxValue * 0.75).toString()),
    formatYLabel((maxValue * 0.5).toString()),
    formatYLabel((maxValue * 0.25).toString())
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
          <StackedBarChart
            data={{
              labels: stackedData!.labels,
              legend: stackedData!.legend,
              data: stackedData!.data,
              barColors: stackedData!.barColors
            }}
            width={chartWidth}
            height={220}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: colors.background,
              backgroundGradientTo: colors.background,
              backgroundGradientFromOpacity: 0,
              backgroundGradientToOpacity: 0,
              decimalPlaces: 0,
              barPercentage: 0.85,
              color: (opacity = 1) => colors.textSecondary,
              labelColor: (opacity = 1) => colors.textSecondary,
              style: {
                borderRadius: 16
              },
              propsForBackgroundLines: {
                strokeDasharray: '0',
                stroke: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                strokeWidth: 1,
              }
            }}
            hideLegend={true}
            withHorizontalLabels={isYearly} // Show normally only on single page yearly chart
            formatYLabel={formatYLabel}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </ScrollView>
      </View>

      {/* Premium Legend Grid */}
      <View style={styles.legendContainer}>
        {stackedData!.legend.map((name, index) => (
          <View key={`legend-${name}`} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: stackedData!.barColors[index] }]} />
            <Text style={[styles.legendName, { color: colors.textSecondary }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
        ))}
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
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendName: {
    fontSize: 11,
    fontFamily: 'Manrope-Regular',
  },
});
