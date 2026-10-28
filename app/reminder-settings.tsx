import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/src/hooks/useTheme';
import { GlassCard } from '@/src/components/common/GlassCard';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { NotificationService } from '@/src/services/NotificationService';
import { t } from '@/src/constants/i18n';

export default function ReminderSettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    dailyReminderEnabled,
    setDailyReminderEnabled,
    periodicSummaryEnabled,
    setPeriodicSummaryEnabled,
    dailyReminderLunchTime,
    dailyReminderEveningTime,
    setDailyReminderTimes,
  } = useSettingsStore();

  const [timePickerTarget, setTimePickerTarget] = useState<'lunch' | 'evening' | null>(null);

  // 1. 切换每日记账提醒主开关
  const handleDailyReminderToggle = async (val: boolean) => {
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

  // 2. 切换周/月支出总结开关
  const handlePeriodicSummaryToggle = async (val: boolean) => {
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

  // 3. 时间选择器辅助函数
  const parseTimeToDate = (timeStr: string): Date => {
    const [h, m] = (timeStr || '12:00').split(':').map(Number);
    const d = new Date();
    d.setHours(isNaN(h) ? 12 : h, isNaN(m) ? 0 : m, 0, 0);
    return d;
  };

  const handleTimePickerChange = async (event: any, selectedDate?: Date) => {
    const target = timePickerTarget;
    setTimePickerTarget(null);
    if (!selectedDate || event?.type === 'dismissed') return;

    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const newTime = `${hours}:${minutes}`;

    if (target === 'lunch') {
      await setDailyReminderTimes(newTime, dailyReminderEveningTime);
      await NotificationService.scheduleDailyReminders(newTime, dailyReminderEveningTime);
    } else if (target === 'evening') {
      await setDailyReminderTimes(dailyReminderLunchTime, newTime);
      await NotificationService.scheduleDailyReminders(dailyReminderLunchTime, newTime);
    }
  };

  // 4. 准时提醒排查指南弹窗
  const handleBatteryGuidePress = () => {
    Alert.alert(
      t('settings.battery_guide_title'),
      t('settings.battery_guide_content'),
      [
        { text: t('notifications.cancel'), style: 'cancel' },
        { text: t('settings.go_to_app_settings'), onPress: () => Linking.openSettings() },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings.reminders_title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* 卡片 1：每日记账提醒（主开关 + 动态展开子选项） */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.daily_reminders_group')}
          </Text>
          <GlassCard style={styles.card}>
            {/* 主开关行 */}
            <View style={styles.menuItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#f59e0b18' }]}>
                <MaterialIcons name="alarm" size={22} color="#f59e0b" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.daily_reminder')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                  {t('settings.daily_reminder_desc')}
                </Text>
              </View>
              <Switch
                value={dailyReminderEnabled}
                onValueChange={handleDailyReminderToggle}
                trackColor={{ false: colors.border, true: '#f59e0b' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* 开启状态下动态展示子选项 */}
            {dailyReminderEnabled && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* 午间提醒时刻 */}
                <TouchableOpacity
                  style={[styles.menuItem, styles.subItem]}
                  onPress={() => setTimePickerTarget('lunch')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('settings.reminder_time_lunch')}, ${dailyReminderLunchTime}`}
                >
                  <View style={[styles.iconContainer, { backgroundColor: '#f59e0b12' }]}>
                    <MaterialIcons name="schedule" size={20} color="#f59e0b" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.itemLabel, { color: colors.text }]}>
                      {t('settings.reminder_time_lunch')}
                    </Text>
                  </View>
                  <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
                    {dailyReminderLunchTime}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {/* 晚间复盘时刻 */}
                <TouchableOpacity
                  style={[styles.menuItem, styles.subItem]}
                  onPress={() => setTimePickerTarget('evening')}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('settings.reminder_time_evening')}, ${dailyReminderEveningTime}`}
                >
                  <View style={[styles.iconContainer, { backgroundColor: '#6366f112' }]}>
                    <MaterialIcons name="nights-stay" size={20} color="#6366f1" />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.itemLabel, { color: colors.text }]}>
                      {t('settings.reminder_time_evening')}
                    </Text>
                  </View>
                  <Text style={[styles.itemValue, { color: colors.textSecondary }]}>
                    {dailyReminderEveningTime}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </>
            )}
          </GlassCard>
        </View>

        {/* 卡片 2：周期财务分析（独立卡片） */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.periodic_reports_group')}
          </Text>
          <GlassCard style={styles.card}>
            <View style={styles.menuItem}>
              <View style={[styles.iconContainer, { backgroundColor: '#3b82f618' }]}>
                <MaterialIcons name="insights" size={22} color="#3b82f6" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.periodic_summary')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                  {t('settings.periodic_summary_desc')}
                </Text>
              </View>
              <Switch
                value={periodicSummaryEnabled}
                onValueChange={handlePeriodicSummaryToggle}
                trackColor={{ false: colors.border, true: '#3b82f6' }}
                thumbColor="#ffffff"
              />
            </View>
          </GlassCard>
        </View>

        {/* 卡片 3：准时保障与排查 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('settings.reliability_group')}
          </Text>
          <GlassCard style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleBatteryGuidePress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t('settings.battery_guide')}
            >
              <View style={[styles.iconContainer, { backgroundColor: '#10b98118' }]}>
                <MaterialIcons name="help-outline" size={22} color="#10b981" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.itemLabel, { color: colors.text }]}>{t('settings.battery_guide')}</Text>
                <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                  {t('settings.battery_guide_desc')}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </GlassCard>
        </View>
      </ScrollView>

      {/* 原生时分选择器 */}
      {timePickerTarget !== null && (
        <DateTimePicker
          value={parseTimeToDate(
            timePickerTarget === 'lunch' ? dailyReminderLunchTime : dailyReminderEveningTime
          )}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimePickerChange}
        />
      )}
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
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 8,
  },
  card: {
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  subItem: {
    paddingLeft: 24,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  itemValue: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
});
