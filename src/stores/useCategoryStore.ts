import { create } from 'zustand';
import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, CategoryInfo } from '../constants/categories';
import { TransactionType } from '../types/transaction';
import { t } from '../constants/i18n';

interface CategoryState {
  expenseCategories: CategoryInfo[];
  incomeCategories: CategoryInfo[];
  initCategories: () => Promise<void>;
  getActiveCategories: (type: TransactionType) => CategoryInfo[];
  getAllCategories: (type: TransactionType) => CategoryInfo[];
  toggleCategoryActive: (id: string, type: TransactionType) => Promise<void>;
  reorderCategories: (type: TransactionType, orderedIds: string[]) => Promise<void>;
  addCustomCategory: (name: string, icon: string, color: string, type: TransactionType) => Promise<void>;
  deleteCustomCategory: (id: string, type: TransactionType) => Promise<void>;
  getCategoryConfig: (id: string, type: TransactionType) => CategoryInfo | undefined;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  expenseCategories: [],
  incomeCategories: [],

  initCategories: async () => {
    try {
      const db = await getDatabase();
      
      // Load current categories from DB
      let expenseList = await db.getAllAsync<any>(QUERIES.GET_CATEGORIES_BY_TYPE, ['expense']);
      let incomeList = await db.getAllAsync<any>(QUERIES.GET_CATEGORIES_BY_TYPE, ['income']);

      // If empty, seed database with default categories
      if (expenseList.length === 0 && incomeList.length === 0) {
        console.log('[CategoryStore] Seeding database with default categories...');
        const now = Date.now();

        // Seed Expenses
        for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
          await db.runAsync(QUERIES.UPSERT_CATEGORY, [
            cat.id,
            'expense',
            cat.id, // For preset, store ID as name key
            cat.icon,
            cat.color,
            cat.bg,
            cat.is_active,
            cat.is_custom,
            cat.sort_order,
            now
          ]);
        }

        // Seed Incomes
        for (const cat of DEFAULT_INCOME_CATEGORIES) {
          await db.runAsync(QUERIES.UPSERT_CATEGORY, [
            cat.id,
            'income',
            cat.id,
            cat.icon,
            cat.color,
            cat.bg,
            cat.is_active,
            cat.is_custom,
            cat.sort_order,
            now
          ]);
        }

        // Fetch seeded records
        expenseList = await db.getAllAsync<any>(QUERIES.GET_CATEGORIES_BY_TYPE, ['expense']);
        incomeList = await db.getAllAsync<any>(QUERIES.GET_CATEGORIES_BY_TYPE, ['income']);
      }

      set({
        expenseCategories: expenseList,
        incomeCategories: incomeList
      });
      console.log('[CategoryStore] Categories loaded successfully:', {
        expensesCount: expenseList.length,
        incomesCount: incomeList.length
      });
    } catch (e) {
      console.error('[CategoryStore] Failed to initialize categories:', e);
    }
  },

  getActiveCategories: (type: TransactionType) => {
    const list = type === 'expense' ? get().expenseCategories : get().incomeCategories;
    return list
      .filter((c) => c.is_active === 1)
      .map((c) => ({
        ...c,
        name: c.is_custom === 1 ? c.name : t('category.' + c.id)
      }));
  },

  getAllCategories: (type: TransactionType) => {
    const list = type === 'expense' ? get().expenseCategories : get().incomeCategories;
    return list.map((c) => ({
      ...c,
      name: c.is_custom === 1 ? c.name : t('category.' + c.id)
    }));
  },

  toggleCategoryActive: async (id: string, type: TransactionType) => {
    try {
      const db = await getDatabase();
      const list = type === 'expense' ? get().expenseCategories : get().incomeCategories;
      const target = list.find((c) => c.id === id);
      
      if (!target) return;

      const nextActive = target.is_active === 1 ? 0 : 1;
      await db.runAsync(QUERIES.UPDATE_CATEGORY_ACTIVE, [nextActive, id, type]);

      // Refresh memory list
      const updatedList = list.map((c) => 
        c.id === id ? { ...c, is_active: nextActive } : c
      );

      if (type === 'expense') {
        set({ expenseCategories: updatedList });
      } else {
        set({ incomeCategories: updatedList });
      }
    } catch (e) {
      console.error('[CategoryStore] Failed to toggle category active status:', e);
    }
  },

  reorderCategories: async (type: TransactionType, orderedIds: string[]) => {
    try {
      const db = await getDatabase();
      const list = type === 'expense' ? get().expenseCategories : get().incomeCategories;

      // Update sort order in SQLite database
      const now = Date.now();
      for (let i = 0; i < orderedIds.length; i++) {
        const id = orderedIds[i];
        await db.runAsync(QUERIES.UPDATE_CATEGORY_ORDER, [i, id, type]);
      }

      // Re-fetch sorted lists to ensure state aligns perfectly with SQLite
      const updatedList = await db.getAllAsync<any>(QUERIES.GET_CATEGORIES_BY_TYPE, [type]);

      if (type === 'expense') {
        set({ expenseCategories: updatedList });
      } else {
        set({ incomeCategories: updatedList });
      }
    } catch (e) {
      console.error('[CategoryStore] Failed to reorder categories:', e);
    }
  },

  addCustomCategory: async (name: string, icon: string, color: string, type: TransactionType) => {
    try {
      const db = await getDatabase();
      const list = type === 'expense' ? get().expenseCategories : get().incomeCategories;
      
      const customId = 'custom_' + Date.now();
      const bg = color + '15'; // 15% opacity light-mode background tint
      const maxSortOrder = list.reduce((max, c) => c.sort_order > max ? c.sort_order : max, -1);
      const newSortOrder = maxSortOrder + 1;
      const now = Date.now();

      await db.runAsync(QUERIES.UPSERT_CATEGORY, [
        customId,
        type,
        name,
        icon,
        color,
        bg,
        1, // is_active = 1 (active by default)
        1, // is_custom = 1
        newSortOrder,
        now
      ]);

      // Re-fetch category list from database
      const updatedList = await db.getAllAsync<any>(QUERIES.GET_CATEGORIES_BY_TYPE, [type]);

      if (type === 'expense') {
        set({ expenseCategories: updatedList });
      } else {
        set({ incomeCategories: updatedList });
      }
      console.log('[CategoryStore] Added custom category:', { customId, name, type });
    } catch (e) {
      console.error('[CategoryStore] Failed to add custom category:', e);
    }
  },

  deleteCustomCategory: async (id: string, type: TransactionType) => {
    try {
      const db = await getDatabase();
      await db.runAsync(QUERIES.DELETE_CATEGORY, [id, type]);

      // Re-fetch list
      const updatedList = await db.getAllAsync<any>(QUERIES.GET_CATEGORIES_BY_TYPE, [type]);

      if (type === 'expense') {
        set({ expenseCategories: updatedList });
      } else {
        set({ incomeCategories: updatedList });
      }
      console.log('[CategoryStore] Deleted custom category:', { id, type });
    } catch (e) {
      console.error('[CategoryStore] Failed to delete custom category:', e);
    }
  },

  getCategoryConfig: (id: string, type: TransactionType) => {
    const list = type === 'expense' ? get().expenseCategories : get().incomeCategories;
    const found = list.find((c) => c.id === id);
    if (found) {
      return {
        ...found,
        name: found.is_custom === 1 ? found.name : t('category.' + found.id)
      };
    }
    return undefined;
  }
}));
