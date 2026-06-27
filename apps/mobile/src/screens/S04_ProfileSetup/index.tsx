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

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const { modes, speed, toggleMode, setSpeed, handleSave, handleBack } = useProfileSetup();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Set Up Your Profile</Text>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
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
                  trackColor={{ false: '#D1D5DB', true: '#00B14F' }}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    marginBottom: 12,
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
    fontWeight: '600',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  speedChip: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  speedChipActive: {
    backgroundColor: '#00B14F',
    borderColor: '#00B14F',
  },
  speedChipInactive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  speedChipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  speedChipTextActive: {
    color: '#FFFFFF',
  },
  speedChipTextInactive: {
    color: '#374151',
  },
  footer: {
    marginTop: 32,
    gap: 8,
  },
  skipButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
