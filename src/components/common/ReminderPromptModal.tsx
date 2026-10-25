import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/constants/Colors';
import { t } from '@/src/constants/i18n';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { NotificationService } from '@/src/services/NotificationService';

interface ReminderPromptModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReminderPromptModal({ visible, onClose }: ReminderPromptModalProps) {
  const { colors, isDark } = useTheme();
  const {
    setDailyReminderEnabled,
    setPeriodicSummaryEnabled,
    setHasPromptedNotification,
  } = useSettingsStore();

  const handleEnable = async () => {
    try {
      const granted = await NotificationService.requestPermissions();
      if (granted) {
        await setDailyReminderEnabled(true);
        await setPeriodicSummaryEnabled(true);
        await NotificationService.syncReminders(true, true);
      }
    } catch (e) {
      console.warn('请求通知权限失败:', e);
    } finally {
      await setHasPromptedNotification(true);
      onClose();
    }
  };

  const handleSkip = async () => {
    await setHasPromptedNotification(true);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={styles.overlay}>
        <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.45)' }]} />
        <View style={[styles.card, { backgroundColor: isDark ? colors.background : '#fff', borderColor: colors.border }]}>
          <View style={styles.headerIcon}>
            <View style={[styles.iconBg, { backgroundColor: '#f59e0b18' }]}>
              <MaterialIcons name="notifications-active" size={28} color="#f59e0b" />
            </View>
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>{t('notifications.prompt_title')}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{t('notifications.prompt_desc')}</Text>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.btn, styles.skipBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : COLORS.slate[100] }]} 
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>{t('notifications.prompt_skip')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.confirmBtn, { backgroundColor: COLORS.primary }]} 
              onPress={handleEnable}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, styles.whiteText]}>{t('notifications.prompt_enable')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  headerIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtn: {},
  confirmBtn: {},
  btnText: {
    fontSize: 15,
    fontFamily: 'Manrope-Bold',
  },
  whiteText: {
    color: '#fff',
  },
});
