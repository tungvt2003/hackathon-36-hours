// apps/mobile/src/screens/S04_ProfileSetup/index.tsx
import React from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Switch 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProfileSetup } from './useProfileSetup.hook';
import { ACCESSIBILITY_OPTIONS, SPEED_OPTIONS } from './profileSetup.service';
import { PrimaryButton } from '../../components/PrimaryButton';
import { theme } from '../../theme/theme';
import { ScreenHeader } from '../../components/ScreenHeader';
import { SuaraLogo } from '../../components/SuaraLogo';
import { BrandedBackground } from '../../components/BrandedBackground';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { modes, speed, toggleMode, setSpeed, handleSave, handleBack } = useProfileSetup();

  return (
    <BrandedBackground variant="default">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="Set Up Your Profile" showLogo={false} onBack={handleBack} />

        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrapper}>
            <SuaraLogo size="sm" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Accessibility Mode</Text>
            <Text style={styles.sectionSubtitle}>Select all that apply</Text>
            
            {ACCESSIBILITY_OPTIONS.map((option) => {
              const isActive = modes[option.id];
              return (
                <View 
                  key={option.id} 
                  style={[
                    styles.card, 
                    isActive && { borderColor: option.color, backgroundColor: option.color + '10' }
                  ]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: option.color + '20' }]}>
                    <MaterialCommunityIcons name={option.icon as any} size={24} color={option.color} />
                  </View>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardTitle}>{option.label}</Text>
                    <Text style={styles.cardDescription}>{option.description}</Text>
                  </View>
                  <Switch 
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                    value={isActive}
                    onValueChange={() => toggleMode(option.id)}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Speaking Speed</Text>
            <View style={styles.speedRow}>
              {SPEED_OPTIONS.map((s) => {
                const isActive = speed === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.speedChip,
                      isActive ? styles.speedChipActive : styles.speedChipInactive
                    ]}
                    onPress={() => setSpeed(s)}
                    accessibilityRole="button"
                    accessibilityLabel={`${s} speaking speed`}
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={[
                      styles.speedChipText,
                      isActive ? styles.speedChipTextActive : styles.speedChipTextInactive
                    ]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <PrimaryButton label="Save & Continue" onPress={handleSave} />
            <TouchableOpacity 
              onPress={handleSave} 
              style={styles.skipButton}
              accessibilityRole="button"
              accessibilityLabel="Skip for now"
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </BrandedBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  speedChip: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
  },
  speedChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  speedChipInactive: {
    backgroundColor: theme.colors.primaryXSoft,
    borderColor: theme.colors.border,
  },
  speedChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  speedChipTextActive: {
    color: '#FFFFFF',
  },
  speedChipTextInactive: {
    color: theme.colors.textSecondary,
  },
  footer: {
    marginTop: 12,
    gap: 8,
  },
  skipButton: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  skipText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
});
