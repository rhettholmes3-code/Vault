import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { t } from '../constants/i18n';
import { getDatabase } from '../database/connection';
import { useSettingsStore } from '../stores/useSettingsStore';

// 配置通知展示策略：前台也弹出横幅与声音
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const REMINDERS_CHANNEL_ID = 'vault_reminders';
const LUNCH_REMINDER_ID = 'vault_lunch_reminder';
const EVENING_REMINDER_ID = 'vault_evening_reminder';
const WEEKLY_SUMMARY_ID = 'vault_weekly_summary';
const MONTHLY_SUMMARY_ID = 'vault_monthly_summary';

export const NotificationService = {
  /**
   * 初始化并配置 Android 通知通道
   */
  initNotificationChannel: async () => {
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
          name: t('notifications.channel_reminders_name'),
          description: t('notifications.channel_reminders_desc'),
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
          showBadge: false,
        });
      } catch (e) {
        console.warn('[NotificationService] 创建通知通道失败:', e);
      }
    }
  },

  /**
   * 检查并请求系统通知权限
   */
  requestPermissions: async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === 'granted';
    } catch (e) {
      console.warn('[NotificationService] 请求通知权限失败:', e);
      return false;
    }
  },

  /**
   * 检查通知权限当前状态
   */
  hasPermissions: async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      return false;
    }
  },

  /**
   * 获取今天已记账笔数
   */
  getTodayTransactionCount: async (): Promise<number> => {
    try {
      const db = await getDatabase();
      const today = new Date().toISOString().split('T')[0];
      const res = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM transactions WHERE date = ?;',
        [today]
      );
      return res?.count || 0;
    } catch (e) {
      return 0;
    }
  },

  /**
   * 调度每日记账提醒 (12:30 & 21:30)
   */
  scheduleDailyReminders: async () => {
    try {
      await NotificationService.initNotificationChannel();

      // 先取消旧的每日定时提醒
      await Notifications.cancelScheduledNotificationAsync(LUNCH_REMINDER_ID).catch(() => {});
      await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID).catch(() => {});

      // 1. 中午 12:30 提醒
      await Notifications.scheduleNotificationAsync({
        identifier: LUNCH_REMINDER_ID,
        content: {
          title: t('notifications.lunch_title'),
          body: t('notifications.lunch_body'),
          data: { type: 'daily_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 12,
          minute: 30,
          channelId: REMINDERS_CHANNEL_ID,
        },
      });

      // 2. 晚间 21:30 提醒（根据当天记账情况动态优化文案）
      const count = await NotificationService.getTodayTransactionCount();
      const eveningBody = count > 0
        ? t('notifications.evening_body_done', { count })
        : t('notifications.evening_body_zero');

      await Notifications.scheduleNotificationAsync({
        identifier: EVENING_REMINDER_ID,
        content: {
          title: t('notifications.evening_title'),
          body: eveningBody,
          data: { type: 'daily_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 30,
          channelId: REMINDERS_CHANNEL_ID,
        },
      });
    } catch (e) {
      console.warn('[NotificationService] 调度每日提醒失败:', e);
    }
  },

  /**
   * 调度周期花费总结提醒 (每周一 09:00 & 每月 1 号 09:30)
   */
  schedulePeriodicSummaries: async () => {
    try {
      await NotificationService.initNotificationChannel();

      await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID).catch(() => {});
      await Notifications.cancelScheduledNotificationAsync(MONTHLY_SUMMARY_ID).catch(() => {});

      const currencySymbol = useSettingsStore.getState().getCurrencySymbol();
      const db = await getDatabase();

      // 1. 每周一 09:00 上周总结
      // 计算上周花费数据以生成动态文案模板（若有）
      const now = new Date();
      const lastWeekStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];

      const weekStats = await db.getFirstAsync<{ total_expense: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total_expense FROM transactions WHERE type = 'expense' AND date >= ? AND date < ?;`,
        [lastWeekStart, todayStr]
      );

      const topCat = await db.getFirstAsync<{ category: string }>(
        `SELECT category, SUM(amount) as total FROM transactions WHERE type = 'expense' AND date >= ? AND date < ? GROUP BY category ORDER BY total DESC LIMIT 1;`,
        [lastWeekStart, todayStr]
      );

      let weeklyBody = t('notifications.weekly_body_none');
      if (weekStats && weekStats.total_expense > 0) {
        const catKey = `category.${topCat?.category || 'other'}`;
        const catName = t(catKey);
        weeklyBody = t('notifications.weekly_body', {
          currency: currencySymbol,
          amount: weekStats.total_expense.toFixed(2),
          category: catName,
        });
      }

      await Notifications.scheduleNotificationAsync({
        identifier: WEEKLY_SUMMARY_ID,
        content: {
          title: t('notifications.weekly_title'),
          body: weeklyBody,
          data: { type: 'weekly_summary' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: 2, // 1 = Sunday, 2 = Monday in expo-notifications
          hour: 9,
          minute: 0,
          channelId: REMINDERS_CHANNEL_ID,
        },
      });

      // 2. 每月 1 号 09:30 上月总结
      const monthlyBudget = useSettingsStore.getState().monthlyBudget;
      const monthStats = await db.getFirstAsync<{ total_expense: number }>(
        `SELECT COALESCE(SUM(amount), 0) as total_expense FROM transactions WHERE type = 'expense' AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now', '-1 month');`
      );
      const lastMonthExpense = monthStats?.total_expense || 0;

      let monthlyBody = '';
      if (monthlyBudget > 0) {
        const diff = monthlyBudget - lastMonthExpense;
        if (diff >= 0) {
          monthlyBody = t('notifications.monthly_body_budget', {
            currency: currencySymbol,
            amount: lastMonthExpense.toFixed(2),
            balance: diff.toFixed(2),
          });
        } else {
          monthlyBody = t('notifications.monthly_body_over', {
            currency: currencySymbol,
            amount: lastMonthExpense.toFixed(2),
            balance: Math.abs(diff).toFixed(2),
          });
        }
      } else {
        monthlyBody = t('notifications.monthly_body_no_budget', {
          currency: currencySymbol,
          amount: lastMonthExpense.toFixed(2),
        });
      }

      await Notifications.scheduleNotificationAsync({
        identifier: MONTHLY_SUMMARY_ID,
        content: {
          title: t('notifications.monthly_title'),
          body: monthlyBody,
          data: { type: 'monthly_summary' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
          day: 1,
          hour: 9,
          minute: 30,
          channelId: REMINDERS_CHANNEL_ID,
        },
      });
    } catch (e) {
      console.warn('[NotificationService] 调度周期总结失败:', e);
    }
  },

  /**
   * 同步调度所有提醒状态
   */
  syncReminders: async (dailyEnabled: boolean, periodicEnabled: boolean) => {
    if (dailyEnabled) {
      await NotificationService.scheduleDailyReminders();
    } else {
      await Notifications.cancelScheduledNotificationAsync(LUNCH_REMINDER_ID).catch(() => {});
      await Notifications.cancelScheduledNotificationAsync(EVENING_REMINDER_ID).catch(() => {});
    }

    if (periodicEnabled) {
      await NotificationService.schedulePeriodicSummaries();
    } else {
      await Notifications.cancelScheduledNotificationAsync(WEEKLY_SUMMARY_ID).catch(() => {});
      await Notifications.cancelScheduledNotificationAsync(MONTHLY_SUMMARY_ID).catch(() => {});
    }
  },

  /**
   * 设置通知交互点击监听器
   */
  setupNotificationListeners: (router: any) => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (!data) return;

      if (data.type === 'daily_reminder') {
        // 点击记账提醒直接打开全屏记账 Modal
        router.push('/add-entry');
      } else if (data.type === 'weekly_summary' || data.type === 'monthly_summary') {
        // 点击总结提醒直接跳转到统计标签页
        router.push('/(tabs)/statistics');
      }
    });

    return () => {
      subscription.remove();
    };
  },
};
