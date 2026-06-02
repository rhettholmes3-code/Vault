import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/constants/Colors';
import { TransactionType } from '@/src/types/transaction';
import { CATEGORIES } from '@/src/constants/categories';
import { evaluateExpression } from '@/src/utils/numberUtils';
import { formatToSqlDate, isYesterday, toDate, formatDate } from '@/src/utils/dateUtils';
import { useTransactionStore } from '@/src/stores/useTransactionStore';
import { t } from '@/src/constants/i18n';

// Common Components
import { SegmentedControl } from '../common/SegmentedControl';
import { BottomDrawer } from '../common/BottomDrawer';
import { ConfirmModal } from '../common/ConfirmModal';

// AddEntry Sub-Components
import { AmountDisplay } from './AmountDisplay';
import { CategoryGrid } from './CategoryGrid';
import { NumericKeypad } from './NumericKeypad';
import { SmartChips } from './SmartChips';

interface EntryFormProps {
  id?: string; // Present in Edit Mode
}

export function EntryForm({ id }: EntryFormProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  // Core stores
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactionStore();

  // Load existing transaction if editing
  const editingTx = useMemo(() => {
    return id ? transactions.find(tData => tData.id === id) : null;
  }, [id, transactions]);

  // Core form states
  const [type, setType] = useState<TransactionType>('expense');
  const [rawInput, setRawInput] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [note, setNote] = useState<string>('');

  // UI States
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Initialize values on mount or when editingTx loads
  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type);
      setRawInput(editingTx.amount.toString());
      setSelectedCategory(editingTx.category);
      setCurrentDate(toDate(editingTx.date));
      setNote(editingTx.note || '');
    } else {
      // Create mode default: select first expense category
      setSelectedCategory(Object.keys(CATEGORIES.expense)[0]);
    }
  }, [editingTx]);

  // Auto-switch selected category if active type doesn't contain it
  useEffect(() => {
    const validCats = Object.keys(CATEGORIES[type]);
    if (!validCats.includes(selectedCategory)) {
      setSelectedCategory(validCats[0]);
    }
  }, [type]);

  // Derive display values from raw calculation input
  const { displayAmount, expressionString, finalValue, validAmount } = useMemo(() => {
    const hasOp = /[+\-*/]/.test(rawInput);
    
    if (!hasOp) {
      const parsed = parseFloat(rawInput) || 0;
      return {
        displayAmount: rawInput,
        expressionString: '',
        finalValue: parsed,
        validAmount: parsed > 0
      };
    }
    
    // Clean trailing operators for calculation
    let cleanInput = rawInput;
    const lastChar = rawInput.slice(-1);
    if (['+', '-', '*', '/'].includes(lastChar)) {
      cleanInput = rawInput.slice(0, -1);
    }
    
    const computed = evaluateExpression(cleanInput);
    
    return {
      displayAmount: computed.toString(),
      expressionString: rawInput,
      finalValue: computed,
      validAmount: computed > 0
    };
  }, [rawInput]);

  // Haptic feedback helper
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  // Keyboard Handlers
  const handlePressNum = (num: string) => {
    triggerHaptic();
    setRawInput(prev => {
      if (prev === '0' && num !== '.') {
        return num;
      }
      
      // Decimals validation per segment
      if (num === '.') {
        const parts = prev.split(/[+\-*/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) {
          return prev;
        }
        if (['+', '-', '*', '/'].includes(prev.slice(-1))) {
          return prev + '0.';
        }
      }
      
      return prev + num;
    });
  };

  const handlePressOp = (op: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setRawInput(prev => {
      const lastChar = prev.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        return prev.slice(0, -1) + op;
      }
      return prev + op;
    });
  };

  const handlePressBackspace = () => {
    triggerHaptic();
    setRawInput(prev => {
      if (prev.length <= 1) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  };

  // Date Logic
  const isDateYesterday = isYesterday(currentDate);

  const toggleYesterday = () => {
    triggerHaptic();
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (isDateYesterday) {
      setCurrentDate(today);
    } else {
      setCurrentDate(yesterday);
    }
  };

  const getDateDisplayText = () => {
    const today = new Date();
    if (currentDate.toDateString() === today.toDateString()) {
      return t('overview.today');
    }
    if (isDateYesterday) {
      return t('overview.yesterday');
    }
    return formatDate(currentDate);
  };

  // Save logic
  const handleSave = async () => {
    if (!validAmount) return;
    
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    
    const formattedDate = formatToSqlDate(currentDate);
    
    try {
      if (id) {
        // Edit Mode Update
        await updateTransaction(id, {
          type,
          amount: finalValue,
          category: selectedCategory,
          date: formattedDate,
          note: note.trim()
        });
      } else {
        // Create Mode Add
        await addTransaction({
          type,
          amount: finalValue,
          category: selectedCategory,
          date: formattedDate,
          note: note.trim()
        });
      }
      router.back();
    } catch (e) {
      console.error('Failed to save transaction:', e);
    }
  };

  // Delete logic
  const handleDelete = async () => {
    if (!id) return;
    
    setShowDeleteConfirm(false);
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      await deleteTransaction(id);
      router.back();
    } catch (e) {
      console.error('Failed to delete transaction:', e);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea}>
        
        {/* TOP HEADER: Expense/Income Toggle */}
        <View style={styles.header}>
          <SegmentedControl
            values={[t('overview.expense'), t('overview.income')]}
            selectedIndex={type === 'expense' ? 0 : 1}
            onChange={(idx) => {
              triggerHaptic();
              setType(idx === 0 ? 'expense' : 'income');
            }}
            style={styles.segmentedControl}
          />
        </View>

        {/* MIDDLE CONTENT: Scrollable Category Grid */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <CategoryGrid
            type={type}
            selectedId={selectedCategory}
            onSelect={(catId) => {
              triggerHaptic();
              setSelectedCategory(catId);
            }}
          />
        </ScrollView>

        {/* BOTTOM PANEL: Calculator and Input Controls */}
        <View style={[
          styles.bottomPanel,
          { 
            backgroundColor: isDark ? colors.card : '#ffffff',
            borderTopColor: colors.border
          }
        ]}>
          
          {/* 1. Amount Display */}
          <AmountDisplay
            expression={expressionString}
            displayAmount={displayAmount}
            type={type}
          />

          {/* 1.5 Smart Chips for Notes */}
          <SmartChips 
            category={selectedCategory} 
            onSelect={(selectedNote) => setNote(selectedNote)} 
          />

          {/* 2. Interactive Date Note Input Bar */}
          <View style={styles.inputBarWrapper}>
            <View style={[
              styles.inputBar,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : COLORS.slate[50] }
            ]}>
              {/* Date selection wrapper */}
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                style={styles.dateSelector}
                activeOpacity={0.7}
              >
                <MaterialIcons name="calendar-today" size={16} color={colors.textSecondary} />
                <Text style={[styles.dateText, { color: isDateYesterday || getDateDisplayText() === t('overview.today') ? colors.text : COLORS.primary }]}>
                  {getDateDisplayText()}
                </Text>
              </TouchableOpacity>

              {/* Quick toggle yesterday chip */}
              <TouchableOpacity
                onPress={toggleYesterday}
                style={[
                  styles.yesterdayChip,
                  { 
                    backgroundColor: isDateYesterday 
                      ? (isDark ? 'rgba(99, 102, 241, 0.2)' : COLORS.slate[200]) 
                      : (isDark ? 'rgba(255,255,255,0.06)' : '#ffffff'),
                    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
                  }
                ]}
              >
                <Text style={[styles.yesterdayChipText, { color: isDateYesterday ? colors.tint : colors.textSecondary }]}>
                  {isDateYesterday ? t('overview.today') : t('overview.yesterday')}
                </Text>
              </TouchableOpacity>

              {/* Vertical divider separator */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* note input field */}
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t('entry.note_placeholder')}
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                style={[styles.noteInput, { color: colors.text }]}
                maxLength={40}
              />
            </View>
          </View>

          {/* 3. Numerical Keypad */}
          <NumericKeypad
            onPressNum={handlePressNum}
            onPressOp={handlePressOp}
            onPressBackspace={handlePressBackspace}
          />

          {/* 4. Action Buttons (Cancel / Submit) */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              onPress={() => {
                triggerHaptic();
                router.back();
              }}
              style={[styles.actionBtn, styles.cancelBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>{t('overview.cancel')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSave}
              disabled={!validAmount}
              style={[
                styles.actionBtn, 
                styles.submitBtn, 
                { 
                  backgroundColor: validAmount 
                    ? (type === 'expense' ? COLORS.danger : COLORS.success)
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : COLORS.slate[200]),
                  shadowColor: validAmount ? (type === 'expense' ? COLORS.danger : COLORS.success) : 'transparent',
                }
              ]}
              activeOpacity={0.8}
            >
              <Text 
                style={[
                  styles.actionBtnText, 
                  { 
                    color: validAmount ? '#ffffff' : (isDark ? 'rgba(255,255,255,0.2)' : COLORS.slate[400]),
                    fontFamily: 'Manrope-Bold'
                  }
                ]}
              >
                {t('entry.save')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 5. Delete Button (Edit Mode ONLY) */}
          {id && (
            <TouchableOpacity 
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                setShowDeleteConfirm(true);
              }}
              style={[styles.deleteBtn, { borderTopColor: colors.border }]}
              activeOpacity={0.6}
            >
              <MaterialIcons name="delete" size={18} color={COLORS.danger} />
              <Text style={styles.deleteBtnText}>{t('entry.delete_record')}</Text>
            </TouchableOpacity>
          )}

        </View>

        {/* iOS Date Selection Drawer */}
        <BottomDrawer
          visible={showDatePicker && Platform.OS === 'ios'}
          onClose={() => setShowDatePicker(false)}
          title={t('entry.select_date')}
          height={320}
        >
          <View style={styles.datePickerDrawer}>
            <DateTimePicker
              value={currentDate}
              mode="date"
              display="spinner"
              textColor={colors.text}
              themeVariant={isDark ? 'dark' : 'light'}
              maximumDate={new Date()} // Prevent setting future transactions
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setCurrentDate(selectedDate);
                }
              }}
            />
          </View>
        </BottomDrawer>

        {/* Android Native Date Picker API */}
        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={currentDate}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setCurrentDate(selectedDate);
              }
            }}
          />
        )}

        {/* Delete Double Confirmation Modal */}
        <ConfirmModal
          visible={showDeleteConfirm}
          title={t('overview.delete_confirm_title')}
          message={t('overview.delete_confirm_desc')}
          confirmText={t('overview.delete')}
          isDestructive={true}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  segmentedControl: {
    width: '100%',
    maxWidth: 320,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 12,
    paddingBottom: 24,
  },
  bottomPanel: {
    borderTopWidth: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
  },
  inputBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 4,
    height: 44,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Manrope-Bold',
  },
  yesterdayChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  yesterdayChipText: {
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: 12,
  },
  noteInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope-Regular',
    padding: 0, // Reset default padding
    height: '100%',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  submitBtn: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: 'Manrope-Bold',
  },
  deleteBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  deleteBtnText: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
    color: COLORS.danger,
  },
  datePickerDrawer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
