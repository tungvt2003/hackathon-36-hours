import { StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary, // #00B14F from theme
    minHeight: 48,
    borderRadius: 999, // rounded-full
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  text: {
    color: theme.colors.surface,
    fontSize: 18,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    backgroundColor: theme.colors.textSecondary,
    opacity: 0.5,
  },
});
