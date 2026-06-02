import { TransactionType } from '@/src/types/transaction';
import { t } from './i18n';

export interface CategoryInfo {
  id: string;
  name: string;
  icon: string; // MaterialIcons name
  color: string; // HEX primary color
  bg: string;    // HEX light-mode card bg tint (or opacity fallback)
}

export const CATEGORIES: Record<TransactionType, Record<string, CategoryInfo>> = {
  expense: {
    food: { id: 'food', name: '餐饮', icon: 'lunch-dining', color: '#f97316', bg: '#ffedd5' },
    transport: { id: 'transport', name: '交通', icon: 'directions-car', color: '#3b82f6', bg: '#dbeafe' },
    shopping: { id: 'shopping', name: '购物', icon: 'shopping-bag', color: '#ec4899', bg: '#fce7f3' },
    housing: { id: 'housing', name: '居住', icon: 'home', color: '#8b5cf6', bg: '#ede9fe' },
    clothing: { id: 'clothing', name: '服饰', icon: 'checkroom', color: '#06b6d4', bg: '#ecfeff' },
    telecom: { id: 'telecom', name: '通讯', icon: 'smartphone', color: '#6366f1', bg: '#e0e7ff' },
    dining: { id: 'dining', name: '聚餐', icon: 'restaurant', color: '#f59e0b', bg: '#fef3c7' },
    entertainment: { id: 'entertainment', name: '娱乐', icon: 'sports-esports', color: '#ef4444', bg: '#fee2e2' },
    travel: { id: 'travel', name: '旅行', icon: 'flight', color: '#14b8a6', bg: '#ccfbf1' },
    medical: { id: 'medical', name: '医疗', icon: 'medical-services', color: '#f43f5e', bg: '#ffe4e6' },
  },
  income: {
    salary: { id: 'salary', name: '工资', icon: 'payments', color: '#10b981', bg: '#d1fae5' },
    bonus: { id: 'bonus', name: '奖金', icon: 'celebration', color: '#f59e0b', bg: '#fef3c7' },
    investment: { id: 'investment', name: '理财', icon: 'trending-up', color: '#3b82f6', bg: '#dbeafe' },
    parttime: { id: 'parttime', name: '兼职', icon: 'work', color: '#8b5cf6', bg: '#ede9fe' },
    refund: { id: 'refund', name: '退款', icon: 'currency-exchange', color: '#14b8a6', bg: '#ccfbf1' },
  }
};

export function getCategoryConfig(type: TransactionType, categoryId: string): CategoryInfo {
  const catMap = CATEGORIES[type];
  if (catMap && catMap[categoryId]) {
    const config = catMap[categoryId];
    return {
      ...config,
      name: t(`category.${config.id}`)
    };
  }
  
  // Fallback for custom or unknown categories
  return {
    id: categoryId,
    name: categoryId === 'other' ? t('category.other') : categoryId,
    icon: 'help',
    color: '#6b7280',
    bg: '#f3f4f6'
  };
}
