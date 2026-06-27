import { StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing[2],
  },
  transcriptContainer: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing[4],
    borderRadius: 16,
    width: '100%',
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  transcriptText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
