import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { theme } from '../../theme/theme';
import { styles } from './styles';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && !loading && styles.pressed,
        disabled && styles.disabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.surface} />
      ) : (
        <Text style={styles.text}>{label}</Text>
      )}
    </Pressable>
  );
};
