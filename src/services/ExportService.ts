import { cacheDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Transaction } from '../types/transaction';
import { getCategoryConfig } from '../constants/categories';

export class ExportService {
  /**
   * 导出交易数据为 CSV 文件并调起分享
   */
  static async exportToCSV(transactions: Transaction[], suffix: string = 'All') {
    if (transactions.length === 0) {
      throw new Error('没有可导出的交易记录');
    }

    // CSV 表头
    const header = ['日期', '类型', '金额', '分类', '备注'].join(',');
    
    // CSV 数据行
    const rows = transactions.map(t => {
      const config = getCategoryConfig(t.type, t.category);
      return [
        t.date.split('T')[0],
        t.type === 'expense' ? '支出' : '收入',
        t.amount.toFixed(2),
        config.name,
        `"${t.note.replace(/"/g, '""')}"` // 处理备注中的引号
      ].join(',');
    });

    // UTF-8 BOM 以支持 Excel 直接打开中文不乱码
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const fileName = `Vault_Export_${suffix}.csv`;
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
          dialogTitle: '导出账单',
          UTI: 'public.comma-separated-values-text', // iOS 特有
        });
      } else {
        throw new Error('当前设备不支持分享文件');
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
}
