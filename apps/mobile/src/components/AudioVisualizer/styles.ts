import { StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 4,
  },
  bar: {
    width: 4,
    height: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
});
