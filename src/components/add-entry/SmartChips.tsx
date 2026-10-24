import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { getDatabase } from '@/src/database/connection';

interface SmartChipsProps {
  category: string;
  onSelect: (note: string) => void;
}

export function SmartChips({ category, onSelect }: SmartChipsProps) {
  const { colors, isDark } = useTheme();
  const [chips, setChips] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function fetchRecentNotes() {
      if (!category) return;
      try {
        const db = await getDatabase();
        // 获取该分类下最近使用过的独立备注 (非空)，最多 5 个
        const query = `
          SELECT DISTINCT note 
          FROM transactions 
          WHERE category = ? AND note != '' 
          ORDER BY created_at DESC 
          LIMIT 5
        `;
        const rows = await db.getAllAsync<{ note: string }>(query, [category]);
        if (mounted) {
          setChips(rows.map(r => r.note));
        }
      } catch (e) {
        console.error('Failed to fetch smart chips', e);
      }
    }

    fetchRecentNotes();

    return () => { mounted = false; };
  }, [category]);

  if (chips.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {chips.map((chip, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.chip,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9' }
            ]}
            onPress={() => onSelect(chip)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 32,
    marginBottom: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Manrope-Regular',
  },
});
