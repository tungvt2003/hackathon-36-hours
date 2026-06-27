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
          backgroundColor: active ? theme.colors.primary : '#D1D5DB' 
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
      <View style={styles.header}>
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
          label={currentIndex === slides.length - 1 ? 'Get Started' : 'Next →'} 
          onPress={handleNext}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    height: 48,
  },
  skipButton: {
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  skipText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    width: width,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 240,
    height: 240,
    backgroundColor: '#E8F8EF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 48,
  },
  pulseContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 177, 79, 0.1)',
  },
  pulse: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 177, 79, 0.2)',
    transform: [{ scale: 1.5 }],
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    lineHeight: 1.65 * 18,
    fontWeight: '400',
    color: '#374151',
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
