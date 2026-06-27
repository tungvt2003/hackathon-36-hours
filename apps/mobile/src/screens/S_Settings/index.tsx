import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from './useSettings.hook';
import { ABOUT_TEXT } from './settings.service';
import { ACCESSIBILITY_OPTIONS, SPEED_OPTIONS } from '../S04_ProfileSetup/profileSetup.service';
import { ScreenHeader } from '../../components/ScreenHeader';
import { BrandedBackground } from '../../components/BrandedBackground';
import { BottomNavBar } from '../../components/BottomNavBar';
import { theme } from '../../theme/theme';

export default function SettingsScreen() {
  const { modes, speed, toggleMode, setSpeed, onBack, onMicPress, onTabPress } = useSettings();

  return (
    <BrandedBackground variant="default">
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScreenHeader title="Settings" showLogo={false} onBack={onBack} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionHeading}>Trợ năng</Text>
          {ACCESSIBILITY_OPTIONS.map((option) => {
            const isActive = modes[option.id];
            return (
              <View
                key={option.id}
                style={[styles.card, isActive && { borderColor: option.color, backgroundColor: option.color + '10' }]}
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

          <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Giọng nói</Text>
          <View style={styles.speedRow}>
            {SPEED_OPTIONS.map((s) => {
              const isActive = speed === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.speedChip, isActive ? styles.speedChipActive : styles.speedChipInactive]}
                  onPress={() => setSpeed(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tốc độ ${s}`}
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.speedChipText, isActive ? styles.speedChipTextActive : styles.speedChipTextInactive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.sectionHeading, { marginTop: 32 }]}>Giới thiệu</Text>
          <View style={styles.aboutBox}>
            <Text style={styles.aboutText}>{ABOUT_TEXT}</Text>
          </View>
        </ScrollView>

        <TouchableOpacity
          style={styles.voiceFab}
          onPress={onMicPress}
          accessibilityRole="button"
          accessibilityLabel="Tap to speak with AI"
        >
          <MaterialCommunityIcons name="microphone" size={32} color="white" />
        </TouchableOpacity>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']}>
        <BottomNavBar activeTab="settings" onTabPress={onTabPress} />
      </SafeAreaView>
    </BrandedBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
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
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  cardTextContainer: { flex: 1, marginHorizontal: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textPrimary },
  cardDescription: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  speedRow: { flexDirection: 'row', gap: 10 },
  speedChip: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: theme.radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
  },
  speedChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  speedChipInactive: { backgroundColor: theme.colors.primaryXSoft, borderColor: theme.colors.border },
  speedChipText: { fontSize: 15, fontWeight: '600' },
  speedChipTextActive: { color: '#FFFFFF' },
  speedChipTextInactive: { color: theme.colors.textSecondary },
  aboutBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  aboutText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  voiceFab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
