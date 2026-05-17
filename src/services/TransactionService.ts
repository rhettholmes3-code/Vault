import * as Crypto from 'expo-crypto';
import { getDatabase } from '../database/connection';
import { QUERIES } from '../database/queries';
import { Transaction, TransactionType } from '../types/transaction';

export class TransactionService {
  /**
   * 获取所有交易记录
   */
  static async getAllTransactions(): Promise<Transaction[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Transaction>(QUERIES.GET_ALL_TRANSACTIONS);
    return result;
  }

  /**
   * 获取指定日期范围内的交易记录
   */
  static async getTransactionsByRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<Transaction>(
      QUERIES.GET_TRANSACTIONS_BY_RANGE,
      [startDate, endDate]
    );
    return result;
  }

  /**
   * 创建新交易
   */
  static async createTransaction(data: {
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    note: string;
  }): Promise<Transaction> {
    const db = await getDatabase();
    const id = Crypto.randomUUID();
    const now = Date.now();
    
    const newTransaction: Transaction = {
      id,
      ...data,
      created_at: now,
      updated_at: now,
    };

    await db.runAsync(
      QUERIES.INSERT_TRANSACTION,
      [
        newTransaction.id,
        newTransaction.type,
        newTransaction.amount,
        newTransaction.category,
        newTransaction.date,
        newTransaction.note,
        newTransaction.created_at,
        newTransaction.updated_at,
      ]
    );

    return newTransaction;
  }

  /**
   * 更新交易记录
   */
  static async updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'created_at'>>): Promise<void> {
    const db = await getDatabase();
    const now = Date.now();
    
    // 获取现有交易以填充缺省值
    const existing = await db.getFirstAsync<Transaction>(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    
    if (!existing) {
      throw new Error(`Transaction with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...data,
      updated_at: now,
    };

    await db.runAsync(
      QUERIES.UPDATE_TRANSACTION,
      [
        updated.type,
        updated.amount,
        updated.category,
        updated.date,
        updated.note,
        updated.updated_at,
        id,
      ]
    );
  }

  /**
   * 删除交易记录
   */
  static async deleteTransaction(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(QUERIES.DELETE_TRANSACTION, [id]);
  }

  /**
   * 获取指定分类的常用备注（最近使用的 5 个）
   */
  static async getRecentNotes(category: string): Promise<string[]> {
    const db = await getDatabase();
    const result = await db.getAllAsync<{ note: string }>(
      'SELECT DISTINCT note FROM transactions WHERE category = ? AND note != "" ORDER BY created_at DESC LIMIT 5',
      [category]
    );
    return result.map(r => r.note);
  }
}
