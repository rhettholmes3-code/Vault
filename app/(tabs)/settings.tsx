import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/GlassCard';
import { ConfirmModal } from '@/src/components/common/ConfirmModal';
import { BudgetDrawer } from '@/src/components/settings/BudgetDrawer';
import { ExportDrawer } from '@/src/components/settings/ExportDrawer';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useTransactionStore } from '@/src/stores/useTransactionStore';
import { NotificationService } from '@/src/services/NotificationService';
import { BackupService, VaultBackupSchemaV1 } from '@/src/services/BackupService';
import { t } from '@/src/constants/i18n';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const {
    monthlyBudget,
    fetchSettings,
    languagePreference,
    setLanguagePreference,
    currencyPreference,
    setCurrencyPreference,
    getCurrencySymbol,
    dailyReminderEnabled,
    setDailyReminderEnabled,
    periodicSummaryEnabled,
    setPeriodicSummaryEnabled,
  } = useSettingsStore();
  const { clearAllTransactions } = useTransactionStore();
  const currencySymbol = getCurrencySymbol();
  
  const [budgetVisible, setBudgetVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);
  const [pendingRestoreData, setPendingRestoreData] = useState<VaultBackupSchemaV1 | null>(null);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [rollbackModalVisible, setRollbackModalVisible] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggleDailyReminder = async (val: boolean) => {
    if (val) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          t('notifications.permission_denied_title'),
          t('notifications.permission_denied_desc'),
          [
            { text: t('notifications.cancel'), style: 'cancel' },
            { text: t('notifications.go_to_settings'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      await setDailyReminderEnabled(true);
      await NotificationService.scheduleDailyReminders();
    } else {
      await setDailyReminderEnabled(false);
      await NotificationService.syncReminders(false, periodicSummaryEnabled);
    }
  };

  const handleTogglePeriodicSummary = async (val: boolean) => {
    if (val) {
      const granted = await NotificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          t('notifications.permission_denied_title'),
          t('notifications.permission_denied_desc'),
          [
            { text: t('notifications.cancel'), style: 'cancel' },
            { text: t('notifications.go_to_settings'), onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      await setPeriodicSummaryEnabled(true);
      await NotificationService.schedulePeriodicSummaries();
    } else {
      await setPeriodicSummaryEnabled(false);
      await NotificationService.syncReminders(dailyReminderEnabled, false);
    }
  };

  const handleExportBackup = async () => {
    try {
      await BackupService.exportBackup();
    } catch (e: any) {
      Alert.alert(t('settings.export_fail'), t('backup.export_fail', { error: e.message || '' }));
    }
  };

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

  const handleLanguagePress = () => {
    Alert.alert(
      t('settings.language'),
      t('settings.language_desc'),
      [
        { 
          text: t('settings.lang_auto'), 
          onPress: () => setLanguagePreference('auto') 
        },
        { 
          text: t('settings.lang_zh'), 
          onPress: () => setLanguagePreference('zh') 
        },
        { 
          text: t('settings.lang_en'), 
          onPress: () => setLanguagePreference('en') 
        },
        { text: t('overview.cancel'), style: 'cancel' }
      ]
    );
  };

  const getLanguageLabel = () => {
    if (languagePreference === 'auto') return t('settings.lang_auto');
    if (languagePreference === 'zh') return t('settings.lang_zh');
    return t('settings.lang_en');
  };

  const handleCurrencyPress = () => {
    Alert.alert(
      t('settings.currency'),
      t('settings.currency_desc'),
      [
        { 
          text: t('settings.currency_auto'), 
          onPress: () => setCurrencyPreference('auto') 
        },
        { text: 'CNY (¥)', onPress: () => setCurrencyPreference('CNY') },
        { text: 'USD ($)', onPress: () => setCurrencyPreference('USD') },
        { text: 'GBP (£)', onPress: () => setCurrencyPreference('GBP') },
        { text: 'CAD (C$)', onPress: () => setCurrencyPreference('CAD') },
        { text: 'AUD (A$)', onPress: () => setCurrencyPreference('AUD') },
        { text: 'NZD (NZ$)', onPress: () => setCurrencyPreference('NZD') },
        { text: t('overview.cancel'), style: 'cancel' }
      ]
    );
  };

  const getCurrencyLabel = () => {
    if (currencyPreference === 'auto') return t('settings.currency_auto');
    return currencyPreference;
  };

  const menuItems: { title: string; items: any[] }[] = [
    {
      title: t('settings.account'),
      items: [
        { 
          id: 'budget', 
          label: t('settings.budget'), 
          value: `${currencySymbol}${monthlyBudget.toLocaleString()}`, 
          icon: 'account-balance-wallet', 
          color: '#3b82f6',
          onPress: () => setBudgetVisible(true)
        },
        { 
          id: 'export', 
          label: t('settings.data_export'), 
          value: t('settings.csv_format'), 
          icon: 'file-download', 
          color: '#10b981',
          onPress: () => setExportVisible(true)
        },
      ]
    },
    {
      title: t('settings.reminders'),
      items: [
        {
          id: 'daily_reminder',
          label: t('settings.daily_reminder'),
          icon: 'alarm',
          color: '#f59e0b',
          right: (
            <Switch
              value={dailyReminderEnabled}
              onValueChange={handleToggleDailyReminder}
              trackColor={{ false: '#cbd5e1', true: '#f59e0b' }}
              thumbColor="#fff"
            />
          ),
        },
        {
          id: 'periodic_summary',
          label: t('settings.periodic_summary'),
          icon: 'insights',
          color: '#8b5cf6',
          right: (
            <Switch
              value={periodicSummaryEnabled}
              onValueChange={handleTogglePeriodicSummary}
              trackColor={{ false: '#cbd5e1', true: '#8b5cf6' }}
              thumbColor="#fff"
            />
          ),
        },
      ],
    },
    {
      title: t('backup.card_title'),
      items: [
        {
          id: 'backup_export',
          label: t('backup.export_btn'),
          icon: 'cloud-upload',
          color: '#3b82f6',
          onPress: handleExportBackup,
        },
        {
          id: 'backup_import',
          label: t('backup.import_btn'),
          icon: 'cloud-download',
          color: '#10b981',
          onPress: handleImportBackup,
        },
        {
          id: 'backup_rollback',
          label: t('backup.rollback_btn'),
          icon: 'history',
          color: '#ec4899',
          onPress: handleRollbackPress,
        },
      ],
    },
    {
      title: t('settings.preferences'),
      items: [
        {
          id: 'categories',
          label: t('settings.categories'),
          value: '',
          icon: 'category',
          color: '#f97316',
          onPress: () => router.push('/category-management' as any)
        },
        { 
          id: 'theme', 
          label: t('settings.theme'), 
          icon: 'dark-mode', 
          color: '#8b5cf6',
          right: (
            <Switch 
              value={isDark} 
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: '#3b82f6' }}
              thumbColor="#fff"
            />
          )
        },
        { 
          id: 'language', 
          label: t('settings.language'), 
          value: getLanguageLabel(), 
          icon: 'language', 
          color: '#3b82f6',
          onPress: handleLanguagePress
        },
        { 
          id: 'currency', 
          label: t('settings.currency'), 
          value: getCurrencyLabel(), 
          icon: 'monetization-on', 
          color: '#10b981',
          onPress: handleCurrencyPress
        },
      ]
    },
    {
      title: t('settings.about'),
      items: [
        { 
          id: 'version', 
          label: t('settings.version'), 
          value: `v1.1.0 (${t('settings.stable')})`, 
          icon: 'info', 
          color: '#64748b' 
        },
        { 
          id: 'github', 
          label: t('settings.github'), 
          icon: 'code', 
          color: '#334155',
          onPress: () => Linking.openURL('https://github.com')
        },
      ]
    },
    {
      title: t('settings.dev_options'),
      items: [
        {
          id: 'generate_mock',
          label: t('settings.mock_data'),
          value: t('settings.mock_data_desc'),
          icon: 'science',
          color: '#eab308',
          onPress: handleGenerateMockData
        },
        { 
          id: 'clear', 
          label: t('settings.clear_data'), 
          icon: 'delete-forever', 
          color: '#ef4444', 
          onPress: handleClearData
        },
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {menuItems.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <GlassCard style={styles.card}>
              {section.items.map((item, itemIdx) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.menuItem, 
                    itemIdx < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                  ]}
                  onPress={item.onPress}
                  disabled={!item.onPress}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                    <MaterialIcons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={[styles.itemLabel, { color: colors.text }]}>{item.label}</Text>
                  {item.value && (
                    <Text style={[styles.itemValue, { color: colors.textSecondary }]}>{item.value}</Text>
                  )}
                  {item.right ? item.right : item.onPress && (
                    <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              ))}
            </GlassCard>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Vault © 2026</Text>
          <Text style={[styles.footerSubText, { color: colors.textSecondary + '80' }]}>{t('settings.footer_desc')}</Text>
        </View>
      </ScrollView>

      <BudgetDrawer visible={budgetVisible} onClose={() => setBudgetVisible(false)} />
      <ExportDrawer visible={exportVisible} onClose={() => setExportVisible(false)} />

      {/* 恢复备份审计确认弹窗 */}
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

      {/* 撤销恢复回滚确认弹窗 */}
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
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Manrope-Bold',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
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
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
  },
  itemValue: {
    fontSize: 14,
    fontFamily: 'JetBrainsMono',
    marginRight: 4,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
  },
  footerSubText: {
    fontSize: 12,
    fontFamily: 'Manrope-Regular',
  },
});
