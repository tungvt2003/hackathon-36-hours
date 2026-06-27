import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import { styles } from './styles';

interface MicButtonProps {
  state?: 'idle' | 'listening' | 'disabled';
  onPress: () => void;
}

export const MicButton: React.FC<MicButtonProps> = ({ state = 'idle', onPress }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const isDisabled = state === 'disabled';
  
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={`Microphone, ${state === 'listening' ? 'listening' : 'tap to speak'}`}
      accessibilityHint="Starts voice command for ordering food or booking a ride"
      style={({ pressed }) => [
        styles.container,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
    >
      {state === 'listening' && (
        <Animated.View
          style={[
            styles.pulse,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
      <View style={styles.button}>
        <MaterialCommunityIcons
          name={state === 'listening' ? 'microphone' : 'microphone-outline'}
          size={32}
          color={theme.colors.surface}
        />
      </View>
    </Pressable>
  );
};
