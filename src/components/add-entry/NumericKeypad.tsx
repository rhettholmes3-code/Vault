import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { COLORS } from '@/src/constants/Colors';

interface NumericKeypadProps {
  onPressNum: (num: string) => void;
  onPressOp: (op: string) => void;
  onPressBackspace: () => void;
}

export function NumericKeypad({ onPressNum, onPressOp, onPressBackspace }: NumericKeypadProps) {
  const { colors, isDark } = useTheme();
  const { height } = useWindowDimensions();

  // Keypad key height optimized for compact single-handed usage
  const keyHeight = 44;

  const renderKey = (label: string, value: string, isOp: boolean = false) => {
    const handlePress = () => {
      if (isOp) {
        onPressOp(value);
      } else {
        onPressNum(value);
      }
    };

    return (
      <TouchableOpacity
        key={label}
        style={[
          styles.key,
          { 
            height: keyHeight,
            backgroundColor: isOp 
              ? (isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(59, 130, 246, 0.08)')
              : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
            borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.6}
      >
        <Text 
          style={[
            styles.keyText, 
            { 
              color: isOp ? colors.tint : colors.text,
              fontFamily: isOp ? 'Manrope-Bold' : 'JetBrainsMono'
            }
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Row 1 */}
      <View style={styles.row}>
        {renderKey('7', '7')}
        {renderKey('8', '8')}
        {renderKey('9', '9')}
        {renderKey('÷', '/', true)}
      </View>

      {/* Row 2 */}
      <View style={styles.row}>
        {renderKey('4', '4')}
        {renderKey('5', '5')}
        {renderKey('6', '6')}
        {renderKey('×', '*', true)}
      </View>

      {/* Row 3 */}
      <View style={styles.row}>
        {renderKey('1', '1')}
        {renderKey('2', '2')}
        {renderKey('3', '3')}
        {renderKey('−', '-', true)}
      </View>

      {/* Row 4 */}
      <View style={styles.row}>
        {renderKey('.', '.')}
        {renderKey('0', '0')}
        
        {/* Backspace Key */}
        <TouchableOpacity
          style={[
            styles.key,
            { 
              height: keyHeight,
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            }
          ]}
          onPress={onPressBackspace}
          activeOpacity={0.6}
        >
          <MaterialIcons name="backspace" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {renderKey('+', '+', true)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 6,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  key: {
    flex: 1,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  keyText: {
    fontSize: 19,
  },
});
