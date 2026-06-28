// apps/mobile/src/screens/S01_Splash/index.tsx
import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSplash } from './useSplash.hook';
import { theme } from '../../theme/theme';
import { ASSETS } from '../../assets';
import { SuaraLogo } from '../../components/SuaraLogo';
import { BrandedBackground } from '../../components/BrandedBackground';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { logoScale, taglineOpacity } = useSplash();

  return (
    <BrandedBackground variant="default">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <Animated.View style={[styles.logoContainer, logoScale]}>
            <SuaraLogo size="xl" />
          </Animated.View>
          
          <Animated.Text style={[styles.tagline, taglineOpacity]}>
            Giọng nói của bạn, sự độc lập của bạn.
          </Animated.Text>
        </View>
      </SafeAreaView>
    </BrandedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  footer: {
    alignItems: 'center',
  },
  grabLogoFooter: {
    width: 110,
    height: 44,
  },
});
