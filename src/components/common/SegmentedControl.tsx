import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';

interface SegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: any;
}

export function SegmentedControl({ values, selectedIndex, onChange, style }: SegmentedControlProps) {
  const { colors, isDark } = useTheme();
  const count = values.length;
  
  const translateX = useSharedValue(0);
  const containerWidth = useSharedValue(0);

  useEffect(() => {
    if (containerWidth.value > 0) {
      const itemWidth = containerWidth.value / count;
      translateX.value = withSpring(selectedIndex * itemWidth, {
        damping: 20,
        stiffness: 150,
      });
    }
  }, [selectedIndex, count]);

  const animatedStyle = useAnimatedStyle(() => {
    const itemWidth = containerWidth.value > 0 ? containerWidth.value / count : 0;
    return {
      width: itemWidth - 8,
      transform: [{ translateX: translateX.value + 4 }],
    };
  });

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          borderColor: colors.border
        },
        style
      ]}
      onLayout={(e) => {
        containerWidth.value = e.nativeEvent.layout.width;
        const itemWidth = e.nativeEvent.layout.width / count;
        translateX.value = selectedIndex * itemWidth;
      }}
    >
      {containerWidth.value > 0 && (
        <Animated.View 
          style={[
            styles.slider, 
            { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#fff',
              shadowColor: isDark ? 'transparent' : '#000',
            }, 
            animatedStyle
          ]} 
        />
      )}
      {values.map((val, idx) => {
        const isSelected = selectedIndex === idx;
        return (
          <TouchableOpacity
            key={idx}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => onChange(idx)}
          >
            <Text 
              style={[
                styles.label, 
                { 
                  color: isSelected ? colors.text : colors.textSecondary,
                  fontFamily: isSelected ? 'Manrope-Bold' : 'Manrope-SemiBold'
                }
              ]}
            >
              {val}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
  },
  slider: {
    position: 'absolute',
    height: '100%',
    top: 4,
    bottom: 4,
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
  },
});

