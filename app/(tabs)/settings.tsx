import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert, Linking } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@/src/components/common/GlassCard';
import { BudgetDrawer } from '@/src/components/settings/BudgetDrawer';
import { ExportDrawer } from '@/src/components/settings/ExportDrawer';
import { useSettingsStore } from '@/src/stores/useSettingsStore';
import { useTransactionStore } from '@/src/stores/useTransactionStore';
import * as Constants from 'expo-constants';

export default function SettingsScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { monthlyBudget, fetchSettings } = useSettingsStore();
  const { clearAllTransactions } = useTransactionStore();
  
  const [budgetVisible, setBudgetVisible] = useState(false);
  const [exportVisible, setExportVisible] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleClearData = () => {
    Alert.alert(
      '清除所有数据',
      '此操作将永久删除所有交易记录和设置，且无法撤销。确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定删除', 
          style: 'destructive',
          onPress: async () => {
            await clearAllTransactions();
            Alert.alert('已清除', '所有本地数据已成功清除。');
          }
        },
      ]
    );
  };

  const handleGenerateMockData = () => {
    Alert.alert(
      '生成演示数据',
      '此操作将清除所有现有数据，并生成过去 180 天的高拟真收支记录用于演示。确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '确定生成', 
          onPress: async () => {
            try {
              const { MockDataService } = await import('@/src/services/MockDataService');
              const count = await MockDataService.generateMockData();
              await useTransactionStore.getState().fetchTransactions();
              Alert.alert('生成成功', `已成功生成 ${count} 条演示记录！`);
            } catch (e) {
              console.error(e);
              Alert.alert('生成失败', '生成演示数据时出现错误。');
            }
          }
        },
      ]
    );
  };

  const menuItems: { title: string; items: any[] }[] = [
    {
      title: '账户设置',
      items: [
        { 
          id: 'budget', 
          label: '每月预算', 
          value: `¥${monthlyBudget.toLocaleString()}`, 
          icon: 'account_balance_wallet', 
          color: '#3b82f6',
          onPress: () => setBudgetVisible(true)
        },
        { 
          id: 'export', 
          label: '导出账单', 
          value: 'CSV 格式', 
          icon: 'file_download', 
          color: '#10b981',
          onPress: () => setExportVisible(true)
        },
      ]
    },
    {
      title: '应用偏好',
      items: [
        { 
          id: 'theme', 
          label: '深色模式', 
          icon: 'dark_mode', 
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
      ]
    },
    {
      title: '关于与支持',
      items: [
        { 
          id: 'version', 
          label: '版本信息', 
          value: 'v1.0.0 (Stable)', 
          icon: 'info', 
          color: '#64748b' 
        },
        { 
          id: 'github', 
          label: 'GitHub 开源', 
          icon: 'code', 
          color: '#334155',
          onPress: () => Linking.openURL('https://github.com')
        },
      ]
    },
    {
      title: '开发者选项',
      items: [
        {
          id: 'generate_mock',
          label: '生成演示数据',
          value: '180天数据',
          icon: 'science',
          color: '#eab308',
          onPress: handleGenerateMockData
        },
        { 
          id: 'clear', 
          label: '清除所有数据', 
          icon: 'delete_forever', 
          color: '#ef4444', 
          onPress: handleClearData
        },
      ]
    }
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>更多</Text>
      
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
          <Text style={[styles.footerSubText, { color: colors.textSecondary + '80' }]}>隐私优先 · 离线存储 · 开源记账</Text>
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
