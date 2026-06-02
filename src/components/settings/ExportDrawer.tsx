import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomDrawer } from '../common/BottomDrawer';
import { useTheme } from '@/src/hooks/useTheme';
import { ExportService } from '@/src/services/ExportService';
import { getDatabase } from '@/src/database/connection';
import { QUERIES } from '@/src/database/queries';
import { Transaction } from '@/src/types/transaction';
import { t } from '@/src/constants/i18n';

interface ExportDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function ExportDrawer({ visible, onClose }: ExportDrawerProps) {
  const { colors, isDark } = useTheme();
  const [selectedRange, setSelectedRange] = useState<string>('this_month');
  const [isExporting, setIsExporting] = useState(false);

  const exportRanges = [
    { id: 'this_month', label: t('settings.export_this_month') },
    { id: 'last_month', label: t('settings.export_last_month') },
    { id: 'this_year', label: t('settings.export_this_year') },
    { id: 'last_year', label: t('settings.export_last_year') },
    { id: 'all', label: t('settings.export_all') },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const db = await getDatabase();
      let query = QUERIES.GET_ALL_TRANSACTIONS;
      let params: string[] = [];

      const now = new Date();
      let startDate = '';
      let endDate = '';

      switch (selectedRange) {
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
          break;
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1).toISOString();
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
          break;
        case 'last_year':
          startDate = new Date(now.getFullYear() - 1, 0, 1).toISOString();
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString();
          break;
        case 'all':
        default:
          break;
      }

      if (selectedRange !== 'all') {
        query += ` WHERE date >= ? AND date <= ? ORDER BY date DESC`;
        params = [startDate, endDate];
      } else {
        query += ` ORDER BY date DESC`;
      }

      const transactions = await db.getAllAsync<Transaction>(query, params);
      
      if (transactions.length === 0) {
        Alert.alert(t('settings.export_fail'), t('overview.no_transactions'));
        setIsExporting(false);
        return;
      }

      await ExportService.exportToCSV(transactions, selectedRange);
      onClose();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', t('settings.export_fail'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <BottomDrawer visible={visible} onClose={onClose} title={t('settings.export_title')} height={420}>
      <View style={styles.container}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t('settings.export_subtitle')}</Text>
        
        <View style={styles.optionsContainer}>
          {exportRanges.map((range) => {
            const isSelected = selectedRange === range.id;
            return (
              <TouchableOpacity
                key={range.id}
                style={[
                  styles.optionRow,
                  { backgroundColor: colors.surfaceSubtle },
                  isSelected && { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : '#e0e7ff', borderColor: colors.tint, borderWidth: 1 }
                ]}
                onPress={() => setSelectedRange(range.id)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.optionText,
                  { color: isSelected ? colors.tint : colors.text }
                ]}>
                  {range.label}
                </Text>
                {isSelected && (
                  <MaterialIcons name="check" size={20} color={colors.tint} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity 
          style={[
            styles.exportButton, 
            { backgroundColor: colors.tint },
            isExporting && { opacity: 0.7 }
          ]} 
          onPress={handleExport}
          activeOpacity={0.8}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="ios-share" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.exportButtonText}>{t('settings.export_csv_btn')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </BottomDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    marginBottom: 16,
    marginTop: 8,
  },
  optionsContainer: {
    gap: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Manrope-Regular',
  },
  exportButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
  },
});
