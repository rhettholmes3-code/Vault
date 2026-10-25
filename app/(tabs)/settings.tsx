import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/GlassCard';
import { BudgetDrawer } from '@/src/components/settings/BudgetDrawer';
import { ExportDrawer } from '@/src/components/settings/ExportDrawer';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { NotificationService } from '@/src/services/NotificationService';
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
  const currencySymbol = getCurrencySymbol();
  
  const [budgetVisible, setBudgetVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);

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
        {
          id: 'more_settings',
          label: t('settings.more'),
          value: '',
          icon: 'tune',
          color: '#6366f1',
          onPress: () => router.push('/more-settings' as any),
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
