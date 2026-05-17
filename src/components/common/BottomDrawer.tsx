import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';

interface BottomDrawerProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BottomDrawer({ visible, onClose, title, children, height = SCREEN_HEIGHT * 0.5 }: BottomDrawerProps) {
  const { colors, isDark } = useTheme();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(visible);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      translateY.value = withSpring(0, { damping: 22, stiffness: 150 });
      backdropOpacity.value = withTiming(0.4, { duration: 250 });
    } else {
      translateY.value = withSpring(SCREEN_HEIGHT, { damping: 22, stiffness: 150 }, (finished) => {
        if (finished) {
          runOnJS(setShouldRender)(false);
        }
      });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!shouldRender) return null;

  return (
    <Modal visible={true} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />
        </TouchableWithoutFeedback>

        <Animated.View 
          style={[
            styles.sheet, 
            { 
              backgroundColor: isDark ? colors.background : '#fff',
              borderTopColor: colors.border,
              height: height,
            },
            animatedSheetStyle
          ]}
        >
          {/* 顶部手势装饰条 */}
          <View style={styles.dragIndicatorContainer}>
            <View style={[styles.dragIndicator, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)' }]} />
          </View>

          {title && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            </View>
          )}

          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  dragIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Manrope-Bold',
  },
  content: {
    flex: 1,
  },
});
