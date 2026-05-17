import { create } from 'zustand';
import { Transaction, TransactionType } from '../types/transaction';
import { TransactionService } from '../services/TransactionService';
import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  fetchTransactions: () => Promise<void>;
  addTransaction: (data: {
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    note: string;
  }) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Omit<Transaction, 'id' | 'created_at'>>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
}

/**
 * 交易记录状态管理 Store (Zustand)
 * 作为 UI 和 SQLite 数据库之间的桥梁，管理全局账单流水状态
 */
export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const txs = await TransactionService.getAllTransactions();
      set({ transactions: txs, isLoading: false });
    } catch (e) {
      console.error('[TransactionStore] 获取交易记录失败:', e);
      set({ isLoading: false });
    }
  },

  addTransaction: async (data) => {
    set({ isLoading: true });
    try {
      const newTx = await TransactionService.createTransaction(data);
      // 插入后重新拉取以确保正确的排序逻辑 (按日期与创建时间递减)
      await get().fetchTransactions();
      return newTx;
    } catch (e) {
      console.error('[TransactionStore] 添加交易失败:', e);
      set({ isLoading: false });
      throw e;
    }
  },

  updateTransaction: async (id, data) => {
    set({ isLoading: true });
    try {
      await TransactionService.updateTransaction(id, data);
      await get().fetchTransactions();
    } catch (e) {
      console.error('[TransactionStore] 更新交易失败:', e);
      set({ isLoading: false });
      throw e;
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true });
    try {
      await TransactionService.deleteTransaction(id);
      await get().fetchTransactions();
    } catch (e) {
      console.error('[TransactionStore] 删除交易失败:', e);
      set({ isLoading: false });
      throw e;
    }
  },

  clearAllTransactions: async () => {
    set({ isLoading: true });
    try {
      const db = await getDatabase();
      // 清空所有的交易表数据
      await db.runAsync(QUERIES.CLEAR_ALL_TRANSACTIONS);
      // 同时清空配置表数据，还原为默认设置
      await db.runAsync(QUERIES.CLEAR_ALL_SETTINGS);
      
      set({ transactions: [], isLoading: false });
    } catch (e) {
      console.error('[TransactionStore] 清空所有数据失败:', e);
      set({ isLoading: false });
      throw e;
    }
  },
}));
