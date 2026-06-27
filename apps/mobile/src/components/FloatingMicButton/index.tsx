import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';

interface FloatingMicButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  size?: number;
}

const RING_CONFIG = [
  { extra: 24, opacity: 0.12, delay: 0 },
  { extra: 48, opacity: 0.07, delay: 400 },
  { extra: 72, opacity: 0.03, delay: 800 },
];

export const FloatingMicButton: React.FC<FloatingMicButtonProps> = ({ onPress, style, size = 88 }) => {
  const breath = useRef(new Animated.Value(1)).current;
  const ringScales = useRef(RING_CONFIG.map(() => new Animated.Value(1))).current;

  useEffect(() => {
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1.04, duration: 1100, useNativeDriver: true }),
        Animated.timing(breath, { toValue: 1.0, duration: 1100, useNativeDriver: true }),
      ]),
    );
    breathLoop.start();

    const ringLoops = ringScales.map((scale, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(RING_CONFIG[i].delay),
          Animated.timing(scale, { toValue: 1.08, duration: 1400, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.0, duration: 1400, useNativeDriver: true }),
        ]),
      ),
    );
    ringLoops.forEach((l) => l.start());

    return () => {
      breathLoop.stop();
      ringLoops.forEach((l) => l.stop());
    };
  }, [breath, ringScales]);

  return (
    <View style={[styles.wrapper, { width: size + 72, height: size + 72 }, style]}>
      {RING_CONFIG.map((ring, i) => (
        <Animated.View
          key={i}
          style={[
            styles.ring,
            {
              width: size + ring.extra,
              height: size + ring.extra,
              borderRadius: (size + ring.extra) / 2,
              backgroundColor: theme.colors.primary,
              opacity: ring.opacity,
              transform: [{ scale: ringScales[i] }],
            },
          ]}
        />
      ))}
      <Animated.View style={{ transform: [{ scale: breath }] }}>
        <TouchableOpacity
          style={[
            styles.button,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Nhấn để nói với AI"
        >
          <MaterialCommunityIcons name="microphone" size={size * 0.45} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { justifyContent: 'center', alignItems: 'center' },
  ring: { position: 'absolute' },
  button: {
    backgroundColor: 'rgba(0,177,79,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
});

export default FloatingMicButton;
