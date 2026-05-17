import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStatsStore } from '@/src/stores/useStatsStore';
import { StatisticsService } from '@/src/services/StatisticsService';
import { PeriodStats, TrendData, StructureData } from '@/src/types/statistics';
import { SummaryBentoGrid } from './SummaryBentoGrid';
import { TrendChart } from './TrendChart';
import { StructureChart } from './StructureChart';
import { CategoryRanking } from './CategoryRanking';
import { useTheme } from '@/src/hooks/useTheme';
import { Skeleton } from '@/src/components/common/Skeleton';

export function StatisticsView() {
  const { colors } = useTheme();
  
  const periodType = useStatsStore(s => s.periodType);
  const currentDate = useStatsStore(s => s.currentDate);
  const chartMode = useStatsStore(s => s.chartMode);
  const setChartMode = useStatsStore(s => s.setChartMode);
  
  const goToNextPeriod = useStatsStore(s => s.goToNextPeriod);
  const goToPrevPeriod = useStatsStore(s => s.goToPrevPeriod);
  
  const [stats, setStats] = useState<PeriodStats | null>(null);
  const [trendData, setTrendData] = useState<TrendData | null>(null);
  const [structureData, setStructureData] = useState<StructureData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    async function fetchData() {
      setLoading(true);
      try {
        const [pStats, tData, sData] = await Promise.all([
          StatisticsService.getPeriodStats(currentDate, periodType),
          StatisticsService.getTrendData(currentDate, periodType),
          StatisticsService.getStructureData(currentDate, periodType, 'expense')
        ]);
        
        if (mounted) {
          setStats(pStats);
          setTrendData(tData);
          setStructureData(sData);
        }
      } catch (error) {
        console.error('Failed to load statistics:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    
    fetchData();
    
    return () => { mounted = false; };
  }, [currentDate, periodType]);

  const displayDate = periodType === 'month' 
    ? `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`
    : `${currentDate.getFullYear()}年`;

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
              <Skeleton height={100} style={{ flex: 2, borderRadius: 20 }} />
              <Skeleton height={100} style={{ flex: 1, borderRadius: 20 }} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
              <Skeleton height={100} style={{ flex: 1, borderRadius: 20 }} />
              <Skeleton height={100} style={{ flex: 1, borderRadius: 20 }} />
            </View>
            <Skeleton height={200} style={{ marginBottom: 24, borderRadius: 16 }} />
            <Skeleton height={200} style={{ marginBottom: 24, borderRadius: 16 }} />
          </View>
        ) : (
          <>
            <SummaryBentoGrid stats={stats} />
            <TrendChart data={trendData} />
            <StructureChart data={structureData} />
            <CategoryRanking data={structureData} periodType={periodType} currentDate={currentDate} type="expense" />
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
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  navTitle: {
    fontSize: 18,
    fontFamily: 'Manrope-SemiBold',
  },
  scrollContent: {
    paddingBottom: 40,
  }
});
