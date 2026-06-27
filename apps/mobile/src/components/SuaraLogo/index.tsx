// apps/mobile/src/components/SuaraLogo/index.tsx
/**
 * SuaraLogo
 * Renders the Suara.png image asset with consistent sizing.
 * Falls back to a wordmark Text if the asset is unavailable.
 *
 * Usage:
 *   <SuaraLogo size="sm" />    → 56×24px
 *   <SuaraLogo size="md" />    → 80×34px (default)
 *   <SuaraLogo size="lg" />    → 120×52px (splash)
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { ASSETS } from '../../assets';
import { theme } from '../../theme/theme';

type LogoSize = 'sm' | 'md' | 'lg';

interface SuaraLogoProps {
  size?: LogoSize;
  /** Override tint if the PNG supports it */
  tint?: string;
  accessibilityLabel?: string;
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number; fontSize: number }> = {
  sm: { width: 56,  height: 24, fontSize: 18 },
  md: { width: 80,  height: 34, fontSize: 24 },
  lg: { width: 120, height: 52, fontSize: 36 },
};

export const SuaraLogo: React.FC<SuaraLogoProps> = ({
  size = 'md',
  accessibilityLabel = 'Suara',
}) => {
  const { width, height, fontSize } = SIZE_MAP[size];

  if (ASSETS.images.suaraLogo) {
    return (
      <Image
        source={ASSETS.images.suaraLogo}
        style={{ width, height }}
        resizeMode="contain"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
      />
    );
  }

  // Fallback wordmark
  return (
    <View accessible accessibilityLabel={accessibilityLabel} accessibilityRole="image">
      <Text style={[styles.wordmark, { fontSize }]}>Suara</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wordmark: {
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
});
