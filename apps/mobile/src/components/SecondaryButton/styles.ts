import { StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.surface,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  text: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  pressed: {
    backgroundColor: theme.colors.background,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    borderColor: theme.colors.textSecondary,
    opacity: 0.5,
  },
});
