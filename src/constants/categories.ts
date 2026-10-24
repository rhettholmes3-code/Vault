import { TransactionType } from '@/src/types/transaction';
import { t } from './i18n';

export interface CategoryInfo {
  id: string;
  type: TransactionType;
  name: string;
  icon: string; // MaterialIcons name
  color: string; // HEX primary color
  bg: string;    // HEX light-mode card bg tint
  is_active: number; // 1 = active, 0 = candidate
  is_custom: number; // 1 = custom, 0 = system preset
  sort_order: number; // order rank
}

// System preset expense categories
export const DEFAULT_EXPENSE_CATEGORIES: Omit<CategoryInfo, 'name'>[] = [
  { id: 'food', type: 'expense', icon: 'lunch-dining', color: '#f97316', bg: '#ffedd5', is_active: 1, is_custom: 0, sort_order: 0 },
  { id: 'transport', type: 'expense', icon: 'directions-car', color: '#3b82f6', bg: '#dbeafe', is_active: 1, is_custom: 0, sort_order: 1 },
  { id: 'shopping', type: 'expense', icon: 'shopping-bag', color: '#ec4899', bg: '#fce7f3', is_active: 1, is_custom: 0, sort_order: 2 },
  { id: 'housing', type: 'expense', icon: 'home', color: '#8b5cf6', bg: '#ede9fe', is_active: 1, is_custom: 0, sort_order: 3 },
  { id: 'clothing', type: 'expense', icon: 'checkroom', color: '#06b6d4', bg: '#ecfeff', is_active: 1, is_custom: 0, sort_order: 4 },
  { id: 'telecom', type: 'expense', icon: 'smartphone', color: '#6366f1', bg: '#e0e7ff', is_active: 1, is_custom: 0, sort_order: 5 },
  { id: 'dining', type: 'expense', icon: 'restaurant', color: '#f59e0b', bg: '#fef3c7', is_active: 1, is_custom: 0, sort_order: 6 },
  { id: 'entertainment', type: 'expense', icon: 'sports-esports', color: '#ef4444', bg: '#fee2e2', is_active: 1, is_custom: 0, sort_order: 7 },
  { id: 'travel', type: 'expense', icon: 'flight', color: '#14b8a6', bg: '#ccfbf1', is_active: 1, is_custom: 0, sort_order: 8 },
  { id: 'medical', type: 'expense', icon: 'medical-services', color: '#f43f5e', bg: '#ffe4e6', is_active: 1, is_custom: 0, sort_order: 9 },
  // Candidates (Inactive by default)
  { id: 'gift', type: 'expense', icon: 'redeem', color: '#d946ef', bg: '#fdf4ff', is_active: 0, is_custom: 0, sort_order: 10 },
  { id: 'sports', type: 'expense', icon: 'fitness-center', color: '#22c55e', bg: '#f0fdf4', is_active: 0, is_custom: 0, sort_order: 11 },
  { id: 'fruit', type: 'expense', icon: 'eco', color: '#a3e635', bg: '#f7fee7', is_active: 0, is_custom: 0, sort_order: 12 },
  { id: 'pet', type: 'expense', icon: 'pets', color: '#a855f7', bg: '#faf5ff', is_active: 0, is_custom: 0, sort_order: 13 },
  { id: 'snack', type: 'expense', icon: 'icecream', color: '#fb923c', bg: '#fff7ed', is_active: 0, is_custom: 0, sort_order: 14 },
  { id: 'medicine', type: 'expense', icon: 'medication', color: '#e11d48', bg: '#fff1f2', is_active: 0, is_custom: 0, sort_order: 15 },
  { id: 'other', type: 'expense', icon: 'more-horiz', color: '#6b7280', bg: '#f3f4f6', is_active: 0, is_custom: 0, sort_order: 16 },
];

// System preset income categories
export const DEFAULT_INCOME_CATEGORIES: Omit<CategoryInfo, 'name'>[] = [
  { id: 'salary', type: 'income', icon: 'payments', color: '#10b981', bg: '#d1fae5', is_active: 1, is_custom: 0, sort_order: 0 },
  { id: 'bonus', type: 'income', icon: 'celebration', color: '#f59e0b', bg: '#fef3c7', is_active: 1, is_custom: 0, sort_order: 1 },
  { id: 'investment', type: 'income', icon: 'trending-up', color: '#3b82f6', bg: '#dbeafe', is_active: 1, is_custom: 0, sort_order: 2 },
  { id: 'parttime', type: 'income', icon: 'work', color: '#8b5cf6', bg: '#ede9fe', is_active: 1, is_custom: 0, sort_order: 3 },
  { id: 'refund', type: 'income', icon: 'currency-exchange', color: '#14b8a6', bg: '#ccfbf1', is_active: 1, is_custom: 0, sort_order: 4 },
  // Candidates (Inactive by default)
  { id: 'other', type: 'income', icon: 'more-horiz', color: '#6b7280', bg: '#f3f4f6', is_active: 0, is_custom: 0, sort_order: 5 },
];

// Available icons for custom categories
export const AVAILABLE_ICONS = [
  'lunch-dining', 'restaurant', 'local-cafe', 'cake', 'icecream', 'local-bar', 'fastfood',
  'directions-car', 'directions-bus', 'directions-subway', 'flight', 'directions-bike', 'local-shipping',
  'shopping-bag', 'shopping-cart', 'card-giftcard', 'redeem', 'monetization-on', 'payments', 'credit-card',
  'home', 'hotel', 'kitchen', 'construction', 'apartment', 'weekend',
  'checkroom', 'watch', 'brush', 'spa',
  'smartphone', 'computer', 'headset', 'tv', 'router', 'gamepad',
  'sports-esports', 'movie', 'music-note', 'sports-soccer', 'fitness-center', 'golf-course',
  'medical-services', 'medication', 'pets', 'eco', 'local-florist',
  'school', 'menu-book', 'work', 'domain',
  'more-horiz', 'help', 'favorite', 'star', 'tag', 'emoji-emotions'
];

// Available colors for custom categories
export const AVAILABLE_COLORS = [
  '#ef4444', '#f43f5e', '#ec4899', '#d946ef', // Red, Pink, Magenta
  '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', // Purple, Violet, Blue, Sky Blue
  '#06b6d4', '#14b8a6', '#10b981', '#22c55e', // Cyan, Teal, Emerald Green
  '#84cc16', '#eab308', '#f97316', '#6b7280'  // Lime, Yellow, Orange, Gray
];

export function getCategoryConfig(type: TransactionType, categoryId: string): CategoryInfo {
  // Try to load dynamically from the store state first to avoid duplication
  try {
    const { useCategoryStore } = require('../stores/useCategoryStore');
    if (useCategoryStore) {
      const config = useCategoryStore.getState().getCategoryConfig(categoryId, type);
      if (config) return config;
    }
  } catch (e) {
    // Ignore store import errors during initialization
  }

  // Fallback to static defaults
  const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
  const found = defaults.find(c => c.id === categoryId);
  if (found) {
    return {
      ...found,
      name: t(`category.${found.id}`)
    };
  }

  // Final fallback
  return {
    id: categoryId,
    type,
    name: categoryId === 'other' ? t('category.other') : categoryId,
    icon: 'help',
    color: '#6b7280',
    bg: '#f3f4f6',
    is_active: 1,
    is_custom: 1,
    sort_order: 999
  };
}
