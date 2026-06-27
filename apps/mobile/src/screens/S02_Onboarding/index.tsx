// apps/mobile/src/screens/S02_Onboarding/index.tsx
import React, { useEffect, useRef } from 'react';
import { 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Animated 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboarding } from './useOnboarding.hook';
import { PrimaryButton } from '../../components/PrimaryButton';
import { theme } from '../../theme/theme';
import { OnboardingSlide } from './onboarding.service';
import { SuaraLogo } from '../../components/SuaraLogo';

const { width } = Dimensions.get('window');

const Dot = ({ active }: { active: boolean }) => {
  const widthAnim = useRef(new Animated.Value(active ? 24 : 8)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: active ? 24 : 8,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [active, widthAnim]);

  return (
    <Animated.View 
      style={[
        styles.dot, 
        { 
          width: widthAnim, 
          backgroundColor: active ? theme.colors.primary : theme.colors.border 
        }
      ]} 
    />
  );
};

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { slides, currentIndex, flatListRef, handleSkip, handleNext, onScroll } = useOnboarding();

  const renderSlide = ({ item, index }: { item: OnboardingSlide, index: number }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>
        {index === 1 && (
          <View style={styles.pulseContainer}>
            <Animated.View style={styles.pulse} />
          </View>
        )}
        <MaterialCommunityIcons name={item.icon as any} size={84} color={theme.colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoAndSkipRow}>
        <View style={styles.logoWrapper}>
          <SuaraLogo size="sm" />
        </View>
        <TouchableOpacity 
          onPress={handleSkip} 
          accessibilityRole="button" 
          accessibilityLabel="Skip intro"
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
      />

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.dotContainer}>
          {slides.map((_, i) => (
            <Dot key={i} active={i === currentIndex} />
          ))}
        </View>
        <PrimaryButton 
          label={currentIndex === slides.length - 1 ? 'Get Started' : 'Next'} 
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  logoAndSkipRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 48, // offset skip button width to center logo
  },
  skipButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  slide: {
    width: width,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 200,
    height: 200,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  pulseContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryGlow,
  },
  pulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryGlow,
    transform: [{ scale: 1.5 }],
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 8,
    height: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
