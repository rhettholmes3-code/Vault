import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/constants/Colors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
  isDestructive = false,
}: ConfirmModalProps) {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)' }]} />
        <View style={[styles.card, { backgroundColor: isDark ? colors.background : '#fff', borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.btn, styles.cancelBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : COLORS.slate[100] }]} 
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, { color: colors.textSecondary }]}>{cancelText}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.btn, 
                isDestructive ? styles.destructiveBtn : styles.confirmBtn,
                { backgroundColor: isDestructive ? COLORS.danger : COLORS.primary }
              ]} 
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnText, styles.whiteText]}>{confirmText}</Text>
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
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    fontFamily: 'Manrope-Regular',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {},
  confirmBtn: {},
  destructiveBtn: {},
  btnText: {
    fontSize: 15,
    fontFamily: 'Manrope-Bold',
  },
  whiteText: {
    color: '#fff',
  },
});
