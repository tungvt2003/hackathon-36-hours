// apps/mobile/src/screens/S09_VoiceError/index.tsx
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
import { useVoiceError } from './useVoiceError.hook';
import { theme } from '../../theme/theme';

export default function VoiceErrorScreen() {
  const insets = useSafeAreaInsets();
  const { onRetry, onCancel } = useVoiceError();

  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(pulse1, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse2, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const createPulseStyle = (val: Animated.Value) => ({
    transform: [{
      scale: val.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.4],
      }),
    }],
    opacity: val.interpolate({
      inputRange: [0, 1],
      outputRange: [0.28, 0],
    }),
  });

  return (
    <View style={styles.root}>
      <TouchableOpacity 
        style={[styles.closeButton, { top: insets.top + 12 }]} 
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      >
        <MaterialCommunityIcons name="close" size={22} color="white" />
      </TouchableOpacity>

      <View style={styles.micArea}>
        <Animated.View style={[styles.pulseCircle, styles.pulse1, createPulseStyle(pulse1)]} />
        <Animated.View style={[styles.pulseCircle, styles.pulse2, createPulseStyle(pulse2)]} />
        
        <View style={styles.micCircle}>
          <MaterialCommunityIcons name="microphone-off" size={44} color={theme.colors.error} />
        </View>
      </View>

      <Text style={styles.title}>Could not hear you</Text>
      <Text style={styles.subtitle}>Please speak more clearly or try again</Text>

      <View style={styles.buttonGroup}>
        <TouchableOpacity 
          style={styles.retryBtn} 
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry listening"
        >
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.cancelBtn} 
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 32,
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
  micArea: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    borderRadius: 999,
  },
  pulse1: {
    width: 140,
    height: 140,
    backgroundColor: 'rgba(239, 68, 68, 0.28)',
  },
  pulse2: {
    width: 180,
    height: 180,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  micCircle: {
    width: 104,
    height: 104,
    backgroundColor: theme.colors.errorBg,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 32,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 26,
    fontWeight: '400',
  },
  buttonGroup: {
    width: '100%',
    marginTop: 64,
    gap: 12,
  },
  retryBtn: {
    height: 60,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  retryBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 56,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
