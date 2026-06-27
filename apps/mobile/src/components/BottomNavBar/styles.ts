// apps/mobile/src/components/BottomNavBar/styles.ts
import { StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 72,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    // Subtle top shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
    minWidth: 48,
    paddingBottom: 6,
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
