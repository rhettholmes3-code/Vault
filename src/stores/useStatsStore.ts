import { create } from 'zustand';
import { PeriodType } from '../types/statistics';

interface StatsState {
  periodType: PeriodType;
  currentDate: Date;
  chartMode: 'trend' | 'structure';
  selectedCategory: string | null;
  
  setPeriodType: (type: PeriodType) => void;
  setCurrentDate: (date: Date) => void;
  setChartMode: (mode: 'trend' | 'structure') => void;
  setSelectedCategory: (category: string | null) => void;
  
  goToNextPeriod: () => void;
  goToPrevPeriod: () => void;
  goToToday: () => void;
}

/**
 * 统计分析视图状态管理 Store (Zustand)
 * 管理统计 Tab 页面的视图周期切换、日期导航、图表类型、分类下钻筛选状态
 */
export const useStatsStore = create<StatsState>((set) => ({
  periodType: 'month',
  currentDate: new Date(),
  chartMode: 'trend',
  selectedCategory: null,

  setPeriodType: (type) => set({ periodType: type, selectedCategory: null }),
  
  setCurrentDate: (date) => set({ currentDate: date }),
  
  setChartMode: (mode) => set({ chartMode: mode }),
  
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  goToNextPeriod: () => set((state) => {
    const nextDate = new Date(state.currentDate);
    if (state.periodType === 'month') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    return { currentDate: nextDate, selectedCategory: null };
  }),

  goToPrevPeriod: () => set((state) => {
    const prevDate = new Date(state.currentDate);
    if (state.periodType === 'month') {
      prevDate.setMonth(prevDate.getMonth() - 1);
    } else {
      prevDate.setFullYear(prevDate.getFullYear() - 1);
    }
    return { currentDate: prevDate, selectedCategory: null };
  }),

  goToToday: () => set({ currentDate: new Date(), selectedCategory: null }),
}));
