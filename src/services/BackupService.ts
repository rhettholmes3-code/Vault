import { cacheDirectory, documentDirectory, writeAsStringAsync, readAsStringAsync, getInfoAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from '../database/connection';
import { useTransactionStore } from '../stores/useTransactionStore';
import { useCategoryStore } from '../stores/useCategoryStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { NotificationService } from './NotificationService';

export interface VaultBackupSchemaV1 {
  schemaVersion: 1;
  metadata: {
    appVersion: string;
    exportTimestamp: number;
    exportDate: string;
    totalTransactions: number;
    totalExpense: number;
    totalIncome: number;
    checksum: string;
  };
  settings: Record<string, string>;
  categories: Array<{
    id: string;
    type: string;
    name: string;
    icon: string;
    color: string;
    bg: string;
    is_active: number;
    is_custom: number;
    sort_order: number;
    created_at: number;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    category: string;
    date: string;
    note: string;
    created_at: number;
    updated_at: number;
  }>;
}

const SAFETY_SNAPSHOT_FILE = `${documentDirectory || cacheDirectory}vault_safety_snapshot.json`;

/**
 * 计算简单的防篡改/完整性校验码
 */
function calculateChecksum(transactions: any[], totalExpense: number, totalIncome: number): string {
  const seed = `${transactions.length}_${totalExpense.toFixed(2)}_${totalIncome.toFixed(2)}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export const BackupService = {
  /**
   * 导出当前全部数据为遵循 Schema v1 的 JSON 文件，并通过系统原生分享调起保存
   */
  exportBackup: async (): Promise<string> => {
    const db = await getDatabase();

    // 1. 获取所有交易记录
    const transactions = await db.getAllAsync<any>(
      'SELECT id, type, amount, category, date, note, created_at, updated_at FROM transactions ORDER BY date DESC, created_at DESC;'
    );

    // 2. 获取所有分类配置
    const categories = await db.getAllAsync<any>(
      'SELECT id, type, name, icon, color, bg, is_active, is_custom, sort_order, created_at FROM categories ORDER BY type ASC, sort_order ASC;'
    );

    // 3. 获取所有设置项
    const settingsRows = await db.getAllAsync<{ key: string; value: string }>(
      'SELECT key, value FROM settings;'
    );
    const settings: Record<string, string> = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    // 4. 计算汇总与校验和
    let totalExpense = 0;
    let totalIncome = 0;
    for (const t of transactions) {
      if (t.type === 'expense') totalExpense += Number(t.amount);
      if (t.type === 'income') totalIncome += Number(t.amount);
    }

    const now = new Date();
    const backupData: VaultBackupSchemaV1 = {
      schemaVersion: 1,
      metadata: {
        appVersion: '1.1.0',
        exportTimestamp: now.getTime(),
        exportDate: now.toISOString(),
        totalTransactions: transactions.length,
        totalExpense,
        totalIncome,
        checksum: calculateChecksum(transactions, totalExpense, totalIncome),
      },
      settings,
      categories,
      transactions,
    };

    const dateStr = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const fileName = `vault_backup_${dateStr}.json`;
    const fileUri = `${cacheDirectory}${fileName}`;

    await writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2), {
      encoding: EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Vault 全量数据备份',
        UTI: 'public.json',
      });
    }

    return fileUri;
  },

  /**
   * 自动生成还原前的本地安全快照（用于误操作一键回滚）
   */
  createSafetySnapshot: async (): Promise<void> => {
    try {
      const db = await getDatabase();
      const transactions = await db.getAllAsync<any>('SELECT * FROM transactions;');
      const categories = await db.getAllAsync<any>('SELECT * FROM categories;');
      const settingsRows = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM settings;');
      const settings: Record<string, string> = {};
      for (const row of settingsRows) {
        settings[row.key] = row.value;
      }

      let totalExpense = 0;
      let totalIncome = 0;
      for (const t of transactions) {
        if (t.type === 'expense') totalExpense += Number(t.amount);
        if (t.type === 'income') totalIncome += Number(t.amount);
      }

      const snapshot: VaultBackupSchemaV1 = {
        schemaVersion: 1,
        metadata: {
          appVersion: '1.1.0',
          exportTimestamp: Date.now(),
          exportDate: new Date().toISOString(),
          totalTransactions: transactions.length,
          totalExpense,
          totalIncome,
          checksum: calculateChecksum(transactions, totalExpense, totalIncome),
        },
        settings,
        categories,
        transactions,
      };

      await writeAsStringAsync(SAFETY_SNAPSHOT_FILE, JSON.stringify(snapshot), {
        encoding: EncodingType.UTF8,
      });
    } catch (e) {
      console.warn('[BackupService] 创建安全快照失败:', e);
    }
  },

  /**
   * 检查是否存在可回退的安全快照
   */
  hasSafetySnapshot: async (): Promise<boolean> => {
    try {
      const info = await getInfoAsync(SAFETY_SNAPSHOT_FILE);
      return info.exists;
    } catch (e) {
      return false;
    }
  },

  /**
   * 选择并校验备份文件
   */
  pickAndValidateBackup: async (): Promise<VaultBackupSchemaV1 | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/*', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const fileUri = result.assets[0].uri;
    const fileContent = await readAsStringAsync(fileUri, {
      encoding: EncodingType.UTF8,
    });

    // 清理可能的 UTF-8 BOM
    const cleanContent = fileContent.replace(/^\uFEFF/, '');
    const data = JSON.parse(cleanContent) as VaultBackupSchemaV1;

    // 格式合法性校验
    if (
      !data ||
      data.schemaVersion !== 1 ||
      !Array.isArray(data.transactions) ||
      !Array.isArray(data.categories) ||
      typeof data.settings !== 'object'
    ) {
      throw new Error('Invalid backup schema format');
    }

    return data;
  },

  /**
   * 在 SQLite 事务中原子执行数据恢复
   */
  executeRestore: async (backupData: VaultBackupSchemaV1): Promise<void> => {
    // 1. 覆盖前先生成隐式安全快照
    await BackupService.createSafetySnapshot();

    const db = await getDatabase();

    // 2. 事务性全量清空与数据重灌
    await db.withTransactionAsync(async () => {
      // 清空现有表
      await db.runAsync('DELETE FROM transactions;');
      await db.runAsync('DELETE FROM categories;');
      await db.runAsync('DELETE FROM settings;');

      // 重灌交易数据
      for (const t of backupData.transactions) {
        await db.runAsync(
          `INSERT INTO transactions (id, type, amount, category, date, note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            t.id,
            t.type,
            t.amount,
            t.category,
            t.date,
            t.note || '',
            t.created_at || Date.now(),
            t.updated_at || Date.now(),
          ]
        );
      }

      // 重灌分类数据
      for (const c of backupData.categories) {
        await db.runAsync(
          `INSERT INTO categories (id, type, name, icon, color, bg, is_active, is_custom, sort_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            c.id,
            c.type,
            c.name,
            c.icon,
            c.color,
            c.bg,
            c.is_active,
            c.is_custom,
            c.sort_order,
            c.created_at || Date.now(),
          ]
        );
      }

      // 重灌设置项
      if (backupData.settings) {
        for (const [key, value] of Object.entries(backupData.settings)) {
          await db.runAsync(
            'INSERT INTO settings (key, value) VALUES (?, ?);',
            [key, value]
          );
        }
      }
    });

    // 3. 刷新全量全局 Store 状态
    await useTransactionStore.getState().fetchTransactions();
    await useCategoryStore.getState().initCategories();
    await useSettingsStore.getState().fetchSettings();

    // 4. 根据恢复后的设置同步通知提醒
    const settings = useSettingsStore.getState();
    await NotificationService.syncReminders(
      settings.dailyReminderEnabled,
      settings.periodicSummaryEnabled
    );
  },

  /**
   * 撤回恢复：从安全快照一键回滚
   */
  rollbackSafetySnapshot: async (): Promise<void> => {
    const hasSnapshot = await BackupService.hasSafetySnapshot();
    if (!hasSnapshot) {
      throw new Error('No snapshot found');
    }

    const content = await readAsStringAsync(SAFETY_SNAPSHOT_FILE, {
      encoding: EncodingType.UTF8,
    });
    const snapshotData = JSON.parse(content.replace(/^\uFEFF/, '')) as VaultBackupSchemaV1;

    const db = await getDatabase();

    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM transactions;');
      await db.runAsync('DELETE FROM categories;');
      await db.runAsync('DELETE FROM settings;');

      for (const t of snapshotData.transactions) {
        await db.runAsync(
          `INSERT INTO transactions (id, type, amount, category, date, note, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          [t.id, t.type, t.amount, t.category, t.date, t.note || '', t.created_at, t.updated_at]
        );
      }

      for (const c of snapshotData.categories) {
        await db.runAsync(
          `INSERT INTO categories (id, type, name, icon, color, bg, is_active, is_custom, sort_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [c.id, c.type, c.name, c.icon, c.color, c.bg, c.is_active, c.is_custom, c.sort_order, c.created_at]
        );
      }

      for (const [key, value] of Object.entries(snapshotData.settings)) {
        await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?);', [key, value]);
      }
    });

    await useTransactionStore.getState().fetchTransactions();
    await useCategoryStore.getState().initCategories();
    await useSettingsStore.getState().fetchSettings();

    const settings = useSettingsStore.getState();
    await NotificationService.syncReminders(
      settings.dailyReminderEnabled,
      settings.periodicSummaryEnabled
    );
  },
};
