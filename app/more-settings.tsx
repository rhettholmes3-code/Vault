import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { GlassCard } from '@/src/components/common/GlassCard';
import { ConfirmModal } from '@/src/components/common/ConfirmModal';
import { BackupService, VaultBackupSchemaV1 } from '@/src/services/BackupService';
import { NotificationService } from '@/src/services/NotificationService';
import { useTransactionStore } from '@/src/stores/useTransactionStore';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { t } from '@/src/constants/i18n';

export default function MoreSettingsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { clearAllTransactions } = useTransactionStore();
  const { getCurrencySymbol } = useSettingsStore();
  const currencySymbol = getCurrencySymbol();

  const [pendingRestoreData, setPendingRestoreData] = useState<VaultBackupSchemaV1 | null>(null);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);

  // 1. 导出全量备份
  const handleExportBackup = async () => {
    try {
      await BackupService.exportBackup();
    } catch (e: any) {
      Alert.alert(t('settings.export_fail'), t('backup.export_fail', { error: e.message || '' }));
    }
  };

  // 2. 导入并恢复数据
  const handleImportBackup = async () => {
    try {
      const backup = await BackupService.pickAndValidateBackup();
      if (!backup) return;
      setPendingRestoreData(backup);
      setRestoreModalVisible(true);
    } catch (e: any) {
      Alert.alert(t('settings.export_fail'), t('backup.invalid_file'));
    }
  };

  // 3. 确认覆盖恢复
  const handleConfirmRestore = async () => {
    if (!pendingRestoreData) return;
    try {
      await BackupService.executeRestore(pendingRestoreData);
      setRestoreModalVisible(false);
      setPendingRestoreData(null);
      Alert.alert(t('backup.confirm_restore_title'), t('backup.restore_success'));
    } catch (e: any) {
      Alert.alert(t('settings.export_fail'), t('backup.restore_fail', { error: e.message || '' }));
    }
  };

  // 4. 撤回上一次导入
  const handleRollbackPress = async () => {
    const hasSnapshot = await BackupService.hasSafetySnapshot();
    if (!hasSnapshot) {
      Alert.alert(t('backup.rollback_title'), t('backup.no_snapshot'));
      return;
    }
    setRollbackModalVisible(true);
  };

  const handleConfirmRollback = async () => {
    try {
      await BackupService.rollbackSafetySnapshot();
      setRollbackModalVisible(false);
      Alert.alert(t('backup.rollback_title'), t('backup.rollback_success'));
    } catch (e: any) {
      Alert.alert(t('backup.rollback_title'), t('backup.rollback_fail', { error: e.message || '' }));
    }
  };

  // 5. 开发者选项：发送测试提醒通知
  const handleSendTestNotification = async () => {
    try {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          t('notifications.permission_denied_title'),
          t('notifications.permission_denied_desc')
        );
        return;
      }
      await NotificationService.sendTestNotification();
      Alert.alert(t('settings.test_notification'), t('settings.test_notification_sent'));
    } catch (e) {
      Alert.alert('Error', 'Failed to trigger test notification');
    }
  };

  // 5.1 开发者选项：1分钟真实定时唤醒测试 (AlarmManager)
  const handleScheduleOneMinuteAlarmTest = async () => {
    try {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          t('notifications.permission_denied_title'),
          t('notifications.permission_denied_desc')
        );
        return;
      }
      await NotificationService.scheduleOneMinuteAlarmTest();
      Alert.alert(t('settings.alarm_test'), t('settings.alarm_test_scheduled'));
    } catch (e) {
      Alert.alert('Error', 'Failed to schedule 1-minute alarm test');
    }
  };

  // 6. 开发者选项：生成 180 天演示数据
  const handleGenerateMockData = () => {
    Alert.alert(
      t('settings.confirm_generate'),
      t('settings.confirm_generate_desc'),
      [
        { text: t('overview.cancel'), style: 'cancel' },
        { 
          text: t('settings.confirm_ok'), 
          onPress: async () => {
            try {
              const { MockDataService } = await import('@/src/services/MockDataService');
              const count = await MockDataService.generateMockData();
              await useTransactionStore.getState().fetchTransactions();
              Alert.alert(t('settings.mock_success'), `${count} records generated.`);
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to generate mock data.');
            }
          }
        },
      ]
    );
  };

  // 7. 开发者选项：清空所有数据
  const handleClearData = () => {
    Alert.alert(
      t('settings.clear_confirm_title'),
      t('settings.clear_confirm_desc'),
      [
        { text: t('overview.cancel'), style: 'cancel' },
        { 
          text: t('settings.confirm_delete_ok'), 
          style: 'destructive',
          onPress: async () => {
            await clearAllTransactions();
            Alert.alert(t('settings.clear_success'), t('settings.data_cleared'));
          }
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 顶部 Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.more')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* 数据安全与备份 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('backup.card_title')}</Text>
          <GlassCard style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleExportBackup} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#3b82f618' }]}>
                <MaterialIcons name="cloud-upload" size={22} color="#3b82f6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('backup.export_btn')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{t('backup.export_desc')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleImportBackup} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#10b98118' }]}>
                <MaterialIcons name="cloud-download" size={22} color="#10b981" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('backup.import_btn')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{t('backup.import_desc')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleRollbackPress} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#ec489918' }]}>
                <MaterialIcons name="history" size={22} color="#ec4899" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('backup.rollback_btn')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{t('backup.rollback_desc')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* 开发者选项 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('settings.dev_options')}</Text>
          <GlassCard style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleSendTestNotification} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#6366f118' }]}>
                <MaterialIcons name="notifications-active" size={22} color="#6366f1" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.test_notification')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{t('settings.test_notification_desc')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleScheduleOneMinuteAlarmTest} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#8b5cf618' }]}>
                <MaterialIcons name="alarm" size={22} color="#8b5cf6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.alarm_test')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{t('settings.alarm_test_desc')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleGenerateMockData} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#eab30818' }]}>
                <MaterialIcons name="science" size={22} color="#eab308" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.mock_data')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{t('settings.mock_data_desc')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.menuItem} onPress={handleClearData} activeOpacity={0.7}>
              <View style={[styles.iconContainer, { backgroundColor: '#ef444418' }]}>
                <MaterialIcons name="delete-forever" size={22} color="#ef4444" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: '#ef4444' }]}>{t('settings.clear_data')}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </GlassCard>
        </View>
      </ScrollView>

      {/* 恢复备份确认审计弹窗 */}
      <ConfirmModal
        visible={restoreModalVisible}
        title={t('backup.confirm_restore_title')}
        message={
          pendingRestoreData
            ? t('backup.confirm_restore_desc', {
                date: pendingRestoreData.metadata.exportDate.split('T')[0],
                count: pendingRestoreData.metadata.totalTransactions,
                currency: currencySymbol,
                expense: pendingRestoreData.metadata.totalExpense.toFixed(2),
                income: pendingRestoreData.metadata.totalIncome.toFixed(2),
              })
            : ''
        }
        confirmText={t('overview.delete')}
        cancelText={t('overview.cancel')}
        isDestructive={true}
        onConfirm={handleConfirmRestore}
        onCancel={() => {
          setRestoreModalVisible(false);
          setPendingRestoreData(null);
        }}
      />

      {/* 撤回快照确认弹窗 */}
      <ConfirmModal
        visible={rollbackModalVisible}
        title={t('backup.rollback_confirm_title')}
        message={t('backup.rollback_confirm_desc')}
        confirmText={t('overview.delete')}
        cancelText={t('overview.cancel')}
        isDestructive={true}
        onConfirm={handleConfirmRollback}
        onCancel={() => setRollbackModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 12,
    marginBottom: 12,
  },
  card: {
    paddingVertical: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
  },
  itemSub: {
    fontSize: 12,
    fontFamily: 'Manrope-Regular',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 70,
  },
});
