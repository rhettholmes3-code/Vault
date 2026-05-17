import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { StructureData } from '@/src/types/statistics';
import { useTheme } from '@/src/hooks/useTheme';

interface StructureChartProps {
  data: StructureData | null;
}

export function StructureChart({ data }: StructureChartProps) {
  const { colors } = useTheme();

  if (!data || data.points.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>支出构成</Text>
        <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
          <Text style={{ color: colors.textSecondary }}>暂无构成数据</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>支出构成</Text>
      
      {/* Custom Horizontal Stacked Bar */}
      <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
        {data.points.map((point, index) => (
          <View
            key={`bar-${point.category}`}
            style={[
              styles.barSegment,
              { 
                backgroundColor: point.color, 
                flex: point.percentage,
                borderTopLeftRadius: index === 0 ? 8 : 0,
                borderBottomLeftRadius: index === 0 ? 8 : 0,
                borderTopRightRadius: index === data.points.length - 1 ? 8 : 0,
                borderBottomRightRadius: index === data.points.length - 1 ? 8 : 0,
              }
            ]}
          />
        ))}
      </View>

      {/* Legend / Breakdown List */}
      <View style={styles.legendContainer}>
        {data.points.slice(0, 5).map((point) => (
          <View key={`legend-${point.category}`} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: point.color }]} />
            <Text style={[styles.legendName, { color: colors.textSecondary }]} numberOfLines={1}>
              {point.name}
            </Text>
            <Text style={[styles.legendValue, { color: colors.text }]}>
              {point.percentage.toFixed(1)}%
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
  title: {
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
    marginBottom: 16,
  },
  emptyContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  barContainer: {
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  barSegment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%', // Two columns
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendName: {
    fontSize: 12,
    fontFamily: 'Manrope-Regular',
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
    fontFamily: 'JetBrainsMono',
    fontWeight: '600',
  }
});
