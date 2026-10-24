import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomDrawer } from '../common/BottomDrawer';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '../../constants/categories';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { TransactionType } from '../../types/transaction';
import { useTheme } from '../../hooks/useTheme';
import { t } from '../../constants/i18n';

interface CreateCategoryDrawerProps {
  visible: boolean;
  onClose: () => void;
  type: TransactionType;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function CreateCategoryDrawer({ visible, onClose, type }: CreateCategoryDrawerProps) {
  const { colors, isDark } = useTheme();
  const addCustomCategory = useCategoryStore((state) => state.addCustomCategory);
  const rawCategories = useCategoryStore((state) => 
    type === 'expense' ? state.expenseCategories : state.incomeCategories
  );

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(AVAILABLE_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);

  // Reset state when drawer becomes visible
  useEffect(() => {
    if (visible) {
      setName('');
      setSelectedIcon(AVAILABLE_ICONS[0]);
      setSelectedColor(AVAILABLE_COLORS[0]);
    }
  }, [visible]);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(t('category_mgmt.title'), t('category_mgmt.toast_empty_name'));
      return;
    }

    // Validation: character length limits (4 for Chinese/General, 12 for English)
    const maxLen = 8;
    if (trimmedName.length > maxLen) {
      Alert.alert(t('category_mgmt.title'), t('category_mgmt.toast_too_long'));
      return;
    }

    // Duplicate check
    const exists = rawCategories.some(
      (c) => (c.is_custom === 1 ? c.name : t('category.' + c.id)).toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      Alert.alert(t('category_mgmt.title'), t('category_mgmt.toast_duplicate_name'));
      return;
    }

    await addCustomCategory(trimmedName, selectedIcon, selectedColor, type);
    onClose();
  };

  return (
    <BottomDrawer
      visible={visible}
      onClose={onClose}
      title={t('category_mgmt.add_custom')}
      height={SCREEN_HEIGHT * 0.82}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Live Preview section */}
        <View style={styles.previewContainer}>
          <View 
            style={[
              styles.previewIconBg, 
              { 
                backgroundColor: selectedColor,
                shadowColor: selectedColor,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 4,
              }
            ]}
          >
            <MaterialIcons name={selectedIcon as any} size={28} color="#ffffff" />
          </View>
          <Text style={[styles.previewLabel, { color: colors.text }]}>
            {name.trim() || t('category_mgmt.title')}
          </Text>
        </View>

        {/* Name input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('category_mgmt.input_placeholder')}
          </Text>
          <TextInput
            style={[
              styles.input, 
              { 
                color: colors.text, 
                borderColor: colors.border,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
              }
            ]}
            value={name}
            onChangeText={setName}
            placeholder={t('category_mgmt.input_placeholder')}
            placeholderTextColor={colors.textSecondary + '70'}
            maxLength={12}
            autoCorrect={false}
          />
        </View>

        {/* Color picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('category_mgmt.select_color')}
          </Text>
          <View style={styles.colorGrid}>
            {AVAILABLE_COLORS.map((color) => {
              const isSelected = selectedColor === color;
              return (
                <TouchableOpacity
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[
                    styles.colorDotWrapper,
                    isSelected && { borderColor: color }
                  ]}
                >
                  <View style={[styles.colorDot, { backgroundColor: color }]} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Icon picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            {t('category_mgmt.select_icon')}
          </Text>
          <View style={styles.iconGrid}>
            {AVAILABLE_ICONS.map((icon) => {
              const isSelected = selectedIcon === icon;
              return (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[
                    styles.iconBox,
                    { 
                      backgroundColor: isSelected ? selectedColor : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                    }
                  ]}
                >
                  <MaterialIcons 
                    name={icon as any} 
                    size={22} 
                    color={isSelected ? '#ffffff' : (isDark ? colors.textSecondary : '#475569')} 
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit button */}
        <TouchableOpacity
          onPress={handleCreate}
          style={[styles.submitButton, { backgroundColor: selectedColor }]}
        >
          <Text style={styles.submitButtonText}>{t('category_mgmt.create_category')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </BottomDrawer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
  },
  previewContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  previewIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 15,
    fontFamily: 'Manrope-Bold',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Manrope-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 4,
  },
  input: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Manrope-SemiBold',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  colorDotWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
  },
});
