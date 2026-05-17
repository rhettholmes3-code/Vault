import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { CATEGORIES, CategoryInfo } from '@/src/constants/categories';
import { TransactionType } from '@/src/types/transaction';
import { useTheme } from '@/src/hooks/useTheme';

interface CategoryGridProps {
  type: TransactionType;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function CategoryGrid({ type, selectedId, onSelect }: CategoryGridProps) {
  const categoriesList = Object.values(CATEGORIES[type]);

  return (
    <View style={styles.gridContainer}>
      {categoriesList.map((cat) => (
        <CategoryItem
          key={cat.id}
          category={cat}
          isSelected={selectedId === cat.id}
          onSelect={() => onSelect(cat.id)}
        />
      ))}
    </View>
  );
}

interface CategoryItemProps {
  category: CategoryInfo;
  isSelected: boolean;
  onSelect: () => void;
}

function CategoryItem({ category, isSelected, onSelect }: CategoryItemProps) {
  const { colors, isDark } = useTheme();
  
  // Shared value for high-fidelity spring pop micro-interaction
  const itemScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: itemScale.value }],
    };
  });

  const handlePressIn = () => {
    itemScale.value = withTiming(0.85, { duration: 60 });
  };

  const handlePressOut = () => {
    itemScale.value = withSequence(
      withTiming(1.12, { duration: 80 }),
      withTiming(1.0, { duration: 100 })
    );
  };

  // Dynamically compute background color based on light/dark mode and active/inactive states
  const getBgColor = () => {
    if (isSelected) {
      return category.color; // Bold primary color when selected
    }
    // Subtle translucent tint in dark mode, light background in light mode
    return isDark ? 'rgba(255, 255, 255, 0.05)' : category.bg;
  };

  const getIconColor = () => {
    if (isSelected) {
      return '#ffffff'; // White icon for better contrast on solid color background
    }
    return category.color; // Original category color when unselected
  };

  return (
    <Pressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.itemWrapper}
    >
      <Animated.View style={[styles.itemContainer, animatedStyle]}>
        {/* Rounded Icon Card */}
        <View 
          style={[
            styles.iconContainer, 
            { 
              backgroundColor: getBgColor(),
              // Selected item glows and drops a soft colored shadow
              shadowColor: isSelected ? category.color : 'transparent',
              shadowOffset: isSelected ? { width: 0, height: 6 } : { width: 0, height: 0 },
              shadowOpacity: isSelected ? 0.35 : 0,
              shadowRadius: isSelected ? 8 : 0,
              elevation: isSelected ? 4 : 0,
            }
          ]}
        >
          <MaterialIcons 
            name={category.icon as any} 
            size={22} 
            color={getIconColor()} 
          />
        </View>

        {/* Small category text label */}
        <Text 
          numberOfLines={1} 
          style={[
            styles.label, 
            { 
              color: isSelected ? colors.text : colors.textSecondary,
              fontFamily: isSelected ? 'Manrope-Bold' : 'Manrope-Regular',
            }
          ]}
        >
          {category.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    rowGap: 18,
    paddingHorizontal: 8,
  },
  itemWrapper: {
    width: '20%', // 5 items per row cleanly
    alignItems: 'center',
  },
  itemContainer: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    transition: 'background-color 0.2s',
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});
