// apps/mobile/src/screens/S07_VoiceProcessing/index.tsx
import React, { useEffect, useRef } from 'react';
import { 
  Animated, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useVoiceProcessing } from './useVoiceProcessing.hook';
import { theme } from '../../theme/theme';

export default function VoiceProcessingScreen() {
  const insets = useSafeAreaInsets();
  const { userText, onDismiss } = useVoiceProcessing();

  const spinVal = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinVal, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      })
    ).start();

    // Pulse dots
    const createPulse = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.2,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createPulse(dot1, 0),
      createPulse(dot2, 250),
      createPulse(dot3, 500),
    ]).start();
  }, []);

  const spin = spinVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <TouchableOpacity 
        style={[styles.closeButton, { top: insets.top + 12 }]} 
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Hủy xử lý"
      >
        <MaterialCommunityIcons name="close" size={22} color="white" />
      </TouchableOpacity>

      <View style={styles.userCard}>
        <Text style={styles.cardLabel}>BẠN NÓI</Text>
        <Text style={styles.userText}>{userText}</Text>
      </View>

      <View style={styles.processingContainer}>
        <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]} />
        <View style={styles.innerCircle}>
          <MaterialCommunityIcons name="creation" size={36} color={theme.colors.primary} />
        </View>
      </View>

      <Text style={styles.processingLabel}>AI đang xử lý...</Text>

      <View style={styles.dotContainer}>
        <Animated.View style={[styles.dot, { opacity: dot1 }]} />
        <Animated.View style={[styles.dot, { opacity: dot2 }]} />
        <Animated.View style={[styles.dot, { opacity: dot3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A1F14',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 40,
    marginBottom: 64,
    width: '85%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  userText: {
    fontSize: 26,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    lineHeight: 34,
  },
  processingContainer: {
    width: 104,
    height: 104,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  spinner: {
    width: 104,
    height: 104,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    borderRadius: 52,
    borderTopColor: 'transparent',
  },
  innerCircle: {
    position: 'absolute',
    width: 88,
    height: 88,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingLabel: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.80)',
    marginTop: 24,
    fontWeight: '500',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  dot: {
    width: 10,
    height: 10,
    backgroundColor: theme.colors.primary,
    borderRadius: 5,
  },
});
