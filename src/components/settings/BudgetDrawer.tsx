import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BottomDrawer } from '../common/BottomDrawer';
import { NumericKeypad } from '../add-entry/NumericKeypad';
import { useTheme } from '@/src/hooks/useTheme';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { evaluateExpression } from '@/src/utils/numberUtils';
import { COLORS } from '@/src/constants/Colors';

interface BudgetDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export function BudgetDrawer({ visible, onClose }: BudgetDrawerProps) {
  const { colors, isDark } = useTheme();
  const { monthlyBudget, setMonthlyBudget } = useSettingsStore();
  const [expression, setExpression] = useState('');

  useEffect(() => {
    if (visible) {
      setExpression(monthlyBudget.toString());
    }
  }, [visible, monthlyBudget]);

  const handleNum = (num: string) => {
    setExpression((prev) => prev === '0' ? num : prev + num);
  };

  const handleOp = (op: string) => {
    const lastChar = expression.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
      setExpression((prev) => prev.slice(0, -1) + op);
    } else {
      setExpression((prev) => prev + op);
    }
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleSave = () => {
    const val = evaluateExpression(expression);
    if (val >= 0) {
      setMonthlyBudget(val);
      onClose();
    }
  };

  const preview = evaluateExpression(expression);
  const showPreview = ['+', '-', '*', '/'].some(op => expression.includes(op));

  return (
    <BottomDrawer visible={visible} onClose={onClose} title="每月预算设置" height={520}>
      <View style={styles.container}>
        <View style={styles.displayContainer}>
          <Text style={[styles.currency, { color: colors.text }]}>¥</Text>
          <Text style={[styles.amount, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
            {expression || '0'}
          </Text>
        </View>
        
        {showPreview && (
          <Text style={[styles.preview, { color: colors.textSecondary }]}>
            = {preview.toFixed(2)}
          </Text>
        )}

        <View style={styles.keypadContainer}>
          <NumericKeypad 
            onPressNum={handleNum}
            onPressOp={handleOp}
            onPressBackspace={handleBackspace}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: colors.tint }]} 
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>保存预算</Text>
        </TouchableOpacity>
      </View>
    </BottomDrawer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
  },
  currency: {
    fontSize: 24,
    fontFamily: 'Manrope-SemiBold',
    marginRight: 4,
  },
  amount: {
    fontSize: 40,
    fontFamily: 'JetBrainsMono',
  },
  preview: {
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'JetBrainsMono',
    marginBottom: 16,
  },
  keypadContainer: {
    flex: 1,
  },
  saveButton: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
  },
});
