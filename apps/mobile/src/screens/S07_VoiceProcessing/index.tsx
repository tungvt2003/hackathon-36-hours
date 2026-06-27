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
        accessibilityLabel="Cancel processing"
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
          <MaterialCommunityIcons name="creation" size={32} color="#00B14F" />
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
    backgroundColor: 'rgba(17, 24, 39, 0.93)',
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
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 40,
    marginBottom: 40,
    width: '80%',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  userText: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '400',
  },
  processingContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  spinner: {
    width: 96,
    height: 96,
    borderWidth: 3,
    borderColor: '#00B14F',
    borderRadius: 48,
    borderTopColor: 'transparent',
  },
  innerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: '#1A2B1F',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingLabel: {
    fontSize: 18,
    color: '#9CA3AF',
    marginTop: 24,
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#00B14F',
    borderRadius: 4,
  },
});
