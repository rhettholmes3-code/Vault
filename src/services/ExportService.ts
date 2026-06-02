import { cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Transaction } from '../types/transaction';
import { getCategoryConfig } from '../constants/categories';
import { t } from '../constants/i18n';
import { useSettingsStore, getDeviceCurrency } from '../stores/useSettingsStore';

export class ExportService {
  /**
   * 导出交易数据为 CSV 文件并调起分享
   */
  static async exportToCSV(transactions: Transaction[], suffix: string = 'All') {
    if (transactions.length === 0) {
      throw new Error(t('settings.export_fail'));
    }

    const state = useSettingsStore.getState();
    const activeCurrency = state.currencyPreference === 'auto' ? getDeviceCurrency() : state.currencyPreference;

    // CSV 表头
    const header = [
      t('csv.date'), 
      t('csv.type'), 
      `${t('csv.amount')} (${activeCurrency})`, 
      t('csv.category'), 
      t('csv.note')
    ].join(',');
    
    // CSV 数据行
    const rows = transactions.map(tData => {
      const config = getCategoryConfig(tData.type, tData.category);
      return [
        tData.date.split('T')[0],
        tData.type === 'expense' ? t('csv.expense') : t('csv.income'),
        tData.amount.toFixed(2),
        config.name,
        `"${tData.note.replace(/"/g, '""')}"` // 处理备注中的引号
      ].join(',');
    });

    // UTF-8 BOM 以支持 Excel 直接打开中文不乱码
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const fileName = `${t('csv.filename')}_${suffix}.csv`;
    const fileUri = `${cacheDirectory}${fileName}`;

    try {
      // 写入临时文件
      await writeAsStringAsync(fileUri, csvContent, {
        encoding: EncodingType.UTF8,
      });

      // 检查分享是否可用
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: t('settings.data_export'),
          UTI: 'public.comma-separated-values-text', // iOS 特有
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
}
