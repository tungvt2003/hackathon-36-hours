// apps/mobile/src/components/BrandedBackground/index.tsx
/**
 * BrandedBackground
 * Wraps content with the bg-texture + LinearGradient overlay.
 * Use this as the root View replacement on any screen that needs
 * the textured background treatment.
 *
 * Usage:
 *   <BrandedBackground style={styles.root}>
 *     {children}
 *   </BrandedBackground>
 */
import React from 'react';
import { ImageBackground, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ASSETS } from '../../assets';
import { theme } from '../../theme/theme';

interface BrandedBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Gradient variant — defaults to 'default' */
  variant?: 'default' | 'voice' | 'success';
}

const GRADIENTS: Record<string, [string, string]> = {
  default: ['rgba(240,250,245,0.90)', 'rgba(245,246,250,0.96)'],
  voice:   ['rgba(240,250,245,0.95)', 'rgba(255,255,255,1.00)'],
  success: ['rgba(232,248,239,0.95)', 'rgba(255,255,255,1.00)'],
};

export const BrandedBackground: React.FC<BrandedBackgroundProps> = ({
  children,
  style,
  variant = 'default',
}) => {
  const gradientColors = GRADIENTS[variant] as [string, string];

  return (
    <ImageBackground
      source={ASSETS.images.bgTexture}
      style={[styles.root, style]}
      imageStyle={styles.bgImage}
      resizeMode="repeat"
    >
      <LinearGradient
        colors={gradientColors}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.content}>
        {children}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bgImage: {
    opacity: 0.15,
  },
  content: {
    flex: 1,
  },
});
