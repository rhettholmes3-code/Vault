import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Pressable, Alert, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useCategoryStore } from '../../stores/useCategoryStore';
import { CategoryInfo } from '../../constants/categories';
import { TransactionType } from '../../types/transaction';
import { useTheme } from '../../hooks/useTheme';
import { COLORS } from '../../constants/Colors';
import { t } from '../../constants/i18n';
import { GlassCard } from '../common/GlassCard';
import { CreateCategoryDrawer } from './CreateCategoryDrawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CategoryManagementScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [drawerVisible, setDrawerVisible] = useState(false);

  const rawCategories = useCategoryStore((state) => 
    activeTab === 'expense' ? state.expenseCategories : state.incomeCategories
  );

  const toggleCategoryActive = useCategoryStore((state) => state.toggleCategoryActive);
  const reorderCategories = useCategoryStore((state) => state.reorderCategories);
  const deleteCustomCategory = useCategoryStore((state) => state.deleteCustomCategory);

  // Derive active list (sorted by sort_order)
  const activeCategories = React.useMemo(() => {
    return rawCategories
      .filter((c) => c.is_active === 1)
      .map((c) => ({
        ...c,
        displayName: c.is_custom === 1 ? c.name : t('category.' + c.id)
      }));
  }, [rawCategories]);

  // Derive candidate list
  const candidateCategories = React.useMemo(() => {
    return rawCategories
      .filter((c) => c.is_active === 0)
      .map((c) => ({
        ...c,
        displayName: c.is_custom === 1 ? c.name : t('category.' + c.id)
      }));
  }, [rawCategories]);

  const handleDeactivate = (id: string) => {
    // Prevent hiding if it is the last active category
    if (activeCategories.length <= 1) {
      Alert.alert(t('category_mgmt.title'), t('category_mgmt.toast_empty_name') === 'Please enter category name' ? 'Must have at least one active category' : '必须保留至少一个启用类别');
      return;
    }
    toggleCategoryActive(id, activeTab);
  };

  const handleActivate = (id: string) => {
    toggleCategoryActive(id, activeTab);
  };

  const handleLongPressCandidate = (category: CategoryInfo & { displayName: string }) => {
    if (category.is_custom !== 1) return; // Preset categories cannot be deleted

    Alert.alert(
      t('category_mgmt.delete_title'),
      t('category_mgmt.delete_desc'),
      [
        { text: t('category_mgmt.cancel'), style: 'cancel' },
        { 
          text: t('category_mgmt.delete_confirm'), 
          style: 'destructive',
          onPress: () => deleteCustomCategory(category.id, activeTab)
        }
      ]
    );
  };

  const renderActiveItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
    const isRemoveDisabled = activeCategories.length <= 1;
    
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          style={[
            styles.rowItem,
            { 
              backgroundColor: isActive 
                ? (isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9') 
                : (isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff'),
              borderBottomColor: colors.border
            }
          ]}
        >
          {/* Drag Handle */}
          <Pressable onPressIn={drag} style={styles.dragHandle}>
            <MaterialIcons 
              name="drag-indicator" 
              size={20} 
              color={colors.textSecondary + '80'} 
            />
          </Pressable>

          {/* Category Icon */}
          <View style={[styles.iconContainer, { backgroundColor: item.bg }]}>
            <MaterialIcons name={item.icon as any} size={20} color={item.color} />
          </View>

          {/* Category Label */}
          <Text style={[styles.rowLabel, { color: colors.text }]}>
            {item.displayName}
          </Text>

          {/* Custom Indicator Badge if custom */}
          {item.is_custom === 1 && (
            <View style={[styles.customBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9' }]}>
              <Text style={[styles.customBadgeText, { color: colors.textSecondary }]}>Custom</Text>
            </View>
          )}

          {/* Deactivate Button */}
          <TouchableOpacity 
            style={[styles.removeButton, isRemoveDisabled && { opacity: 0.3 }]} 
            onPress={() => handleDeactivate(item.id)}
            disabled={isRemoveDisabled}
          >
            <MaterialIcons name="do-not-disturb-on" size={22} color="#ef4444" />
          </TouchableOpacity>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('category_mgmt.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <View style={[styles.tabSelectorBg, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' }]}>
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'expense' && { backgroundColor: isDark ? '#334155' : '#ffffff' }
            ]}
            onPress={() => setActiveTab('expense')}
          >
            <Text 
              style={[
                styles.tabText, 
                { 
                  color: activeTab === 'expense' ? colors.text : colors.textSecondary,
                  fontFamily: activeTab === 'expense' ? 'Manrope-Bold' : 'Manrope-Regular'
                }
              ]}
            >
              {t('category_mgmt.expense')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'income' && { backgroundColor: isDark ? '#334155' : '#ffffff' }
            ]}
            onPress={() => setActiveTab('income')}
          >
            <Text 
              style={[
                styles.tabText, 
                { 
                  color: activeTab === 'income' ? colors.text : colors.textSecondary,
                  fontFamily: activeTab === 'income' ? 'Manrope-Bold' : 'Manrope-Regular'
                }
              ]}
            >
              {t('category_mgmt.income')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main content draggable list */}
      <DraggableFlatList
        data={activeCategories}
        onDragEnd={({ data }) => reorderCategories(activeTab, data.map(d => d.id))}
        keyExtractor={(item) => item.id}
        renderItem={renderActiveItem}
        containerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>
              {t('category_mgmt.active_section_edit')}
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {/* Candidates Pool Section */}
            <View style={styles.candidateHeader}>
              <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>
                {t('category_mgmt.candidate_section_delete')}
              </Text>
            </View>

            {candidateCategories.length === 0 ? (
              <View style={styles.emptyCandidates}>
                <Text style={[styles.emptyCandidatesText, { color: colors.textSecondary + '70' }]}>
                  {isDark ? 'No candidates available' : '暂无候选类别'}
                </Text>
              </View>
            ) : (
              <View style={styles.candidatesGrid}>
                {candidateCategories.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleActivate(item.id)}
                    onLongPress={() => handleLongPressCandidate(item)}
                    style={[
                      styles.candidateItem,
                      { 
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                        borderColor: colors.border
                      }
                    ]}
                  >
                    <View style={[styles.candidateIconBg, { backgroundColor: item.bg }]}>
                      <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                    </View>
                    <Text 
                      numberOfLines={1} 
                      style={[styles.candidateLabel, { color: colors.text }]}
                    >
                      {item.displayName}
                    </Text>
                    {item.is_custom === 1 && (
                      <View style={styles.candidateDeleteDot}>
                        <MaterialIcons name="close" size={10} color="#ffffff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Bottom button spacer */}
            <View style={{ height: 100 }} />
          </View>
        }
      />

      {/* Floating Bottom Add button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.addButton, { backgroundColor: COLORS.primary }]}
          onPress={() => setDrawerVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#ffffff" />
          <Text style={styles.addButtonText}>{t('category_mgmt.add_custom')}</Text>
        </TouchableOpacity>
      </View>

      <CreateCategoryDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        type={activeTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
  },
  headerPlaceholder: {
    width: 40,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  tabSelectorBg: {
    flexDirection: 'row',
    height: 46,
    borderRadius: 14,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: 24,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 12,
    fontFamily: 'Manrope-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dragHandle: {
    padding: 10,
    marginLeft: -4,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Manrope-SemiBold',
    flex: 1,
  },
  customBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  customBadgeText: {
    fontSize: 10,
    fontFamily: 'Manrope-Bold',
  },
  removeButton: {
    padding: 8,
    marginRight: -4,
  },
  footerContainer: {
    paddingTop: 30,
  },
  candidateHeader: {
    paddingHorizontal: 24,
    marginBottom: 14,
  },
  emptyCandidates: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyCandidatesText: {
    fontSize: 14,
    fontFamily: 'Manrope-Regular',
  },
  candidatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  candidateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: (SCREEN_WIDTH - 52) / 2, // 2 items per row nicely
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    position: 'relative',
  },
  candidateIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  candidateLabel: {
    fontSize: 13,
    fontFamily: 'Manrope-SemiBold',
    flex: 1,
  },
  candidateDeleteDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  addButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
  },
});
export default CategoryManagementScreen;
