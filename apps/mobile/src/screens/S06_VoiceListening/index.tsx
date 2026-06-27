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
import { useVoiceListening } from './useVoiceListening.hook';
import { AudioVisualizer } from '../../components/AudioVisualizer';
import { theme } from '../../theme/theme';

export default function VoiceListeningScreen() {
  const insets = useSafeAreaInsets();
  const { onDismiss, onMicPress, initialPromptHint } = useVoiceListening();

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  const startRipple = (val: Animated.Value, delay: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(val, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(val, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    startRipple(ring1, 0);
    startRipple(ring2, 300);
    startRipple(ring3, 600);
  }, []);

  const createRingStyle = (val: Animated.Value) => {
    return {
      transform: [{
        scale: val.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.8],
        }),
      }],
      opacity: val.interpolate({
        inputRange: [0, 1],
        outputRange: [0.32, 0],
      }),
    };
  };

  return (
    <View style={styles.root}>
      <TouchableOpacity 
        style={[styles.closeButton, { top: insets.top + 12 }]} 
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <MaterialCommunityIcons name="close" size={22} color="white" />
      </TouchableOpacity>

      <Text style={styles.statusLabel}>LISTENING</Text>
      
      <Text style={styles.transcriptHint}>
        {initialPromptHint || "Speak now..."}
      </Text>

      <View style={styles.micArea}>
        <Animated.View style={[styles.ripple, styles.ripple1, createRingStyle(ring1)]} />
        <Animated.View style={[styles.ripple, styles.ripple2, createRingStyle(ring2)]} />
        <Animated.View style={[styles.ripple, styles.ripple3, createRingStyle(ring3)]} />
        
        <TouchableOpacity 
          onPress={onMicPress} 
          style={styles.micCircle}
          accessibilityRole="button"
          accessibilityLabel="Microphone"
        >
          <MaterialCommunityIcons name="microphone" size={52} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.visualizerContainer}>
        <AudioVisualizer active={true} />
      </View>

      <Text style={styles.cancelHint}>Tap mic to cancel</Text>
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
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  transcriptHint: {
    fontSize: 18,
    color: '#9CA3AF',
    marginBottom: 48,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  micArea: {
    width: 280,
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#00B14F',
  },
  ripple1: {
    width: 160,
    height: 160,
  },
  ripple2: {
    width: 200,
    height: 200,
  },
  ripple3: {
    width: 240,
    height: 240,
  },
  micCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#00B14F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  visualizerContainer: {
    marginTop: 40,
  },
  cancelHint: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 24,
  },
});
