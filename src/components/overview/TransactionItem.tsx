import React from 'react';
import { StyleSheet, View, Text, Animated as RNAnimated, TouchableOpacity, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { Transaction } from '@/src/types/transaction';
import { getCategoryConfig } from '@/src/constants/categories';
import { useTheme } from '@/src/hooks/useTheme';
import { formatAmount } from '@/src/utils/numberUtils';
import { COLORS } from '@/src/constants/Colors';
import { useRouter } from 'expo-router';
import { t } from '@/src/constants/i18n';

interface TransactionItemProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const categoryConfig = getCategoryConfig(transaction.type, transaction.category);

  const handleDelete = () => {
    Alert.alert(
      t('overview.delete_confirm_title'), 
      t('overview.delete_confirm_desc'), 
      [
        { text: t('overview.cancel'), style: 'cancel' },
        { text: t('overview.delete'), style: 'destructive', onPress: () => onDelete(transaction.id) },
      ]
    );
  };

  const renderRightActions = (progress: RNAnimated.AnimatedInterpolation<number>, dragX: RNAnimated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={handleDelete} activeOpacity={0.8}>
        <View style={[styles.deleteAction, { backgroundColor: COLORS.danger }]}>
          <RNAnimated.View style={{ transform: [{ scale }] }}>
            <MaterialIcons name="delete-outline" size={24} color="#fff" />
          </RNAnimated.View>
        </View>
      </TouchableOpacity>
    );
  };

  const onPress = () => {
    router.push(`/edit-entry/${transaction.id}`);
  };

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.iconBg : categoryConfig.bg }]}>
            <MaterialIcons name={categoryConfig.icon as any} size={22} color={categoryConfig.color} />
          </View>
          
          <View style={styles.detailsContainer}>
            <View style={styles.row}>
              <Text style={[styles.categoryName, { color: colors.text }]}>{categoryConfig.name}</Text>
              <Text 
                style={[
                  styles.amount, 
                  { color: transaction.type === 'expense' ? colors.text : COLORS.success }
                ]}
              >
                {transaction.type === 'expense' ? '-' : '+'}{formatAmount(transaction.amount)}
              </Text>
            </View>
            
            {!!transaction.note && (
              <Text style={[styles.note, { color: colors.textSecondary }]} numberOfLines={1}>
                {transaction.note}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontFamily: 'Manrope-SemiBold',
  },
  amount: {
    fontSize: 18,
    fontFamily: 'JetBrainsMono',
  },
  note: {
    fontSize: 13,
    fontFamily: 'Manrope-Regular',
    marginTop: 4,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
});
