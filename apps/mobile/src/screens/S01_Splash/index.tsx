import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSplash } from './useSplash.hook';
import { theme } from '../../theme/theme';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const { logoScale, taglineOpacity } = useSplash();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoContainer, logoScale]}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="microphone" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.wordmark}>AccessAI</Text>
        </Animated.View>
        
        <Animated.Text style={[styles.tagline, taglineOpacity]}>
          Your voice, your independence.
        </Animated.Text>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.grabBadge}>
          <View style={styles.grabDot} />
          <Text style={styles.poweredBy}>Powered by Grab</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary, // #00B14F
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  wordmark: {
    fontSize: 44,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  grabBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  grabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginRight: 8,
  },
  poweredBy: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});
