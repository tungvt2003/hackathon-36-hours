import React from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Switch, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLogin } from './useLogin.hook';
import { theme } from '../../theme/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loading, micEnabled, toggleMic, handleBack, handleConnect, handleSkip } = useLogin();

  const TrustBadge = ({ label }: { label: string }) => (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <View style={styles.heroCard}>
            <View style={styles.lockIconCircle}>
              <MaterialCommunityIcons name="lock" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.grabWordmark}>Grab</Text>
          </View>
          <View style={styles.heroShadow} />
        </View>

        <Text style={styles.heading}>Connect Grab Account</Text>
        <Text style={styles.body}>
          Use your Grab account for orders and payments. AccessAI never stores your password.
        </Text>

        <View style={styles.badgeRow}>
          <TrustBadge label="✓ SSL Encrypted" />
          <TrustBadge label="✓ No password stored" />
          <TrustBadge label="✓ OAuth 2.0" />
        </View>

        <View style={styles.divider} />

        <View style={styles.micCard}>
          <View style={styles.micIconCircle}>
            <MaterialCommunityIcons name="microphone" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.micTextContainer}>
            <Text style={styles.micTitle}>Allow Microphone</Text>
            <Text style={styles.micSubtitle}>Required for voice commands</Text>
          </View>
          <Switch 
            value={micEnabled} 
            onValueChange={toggleMic}
            trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D5DB"
          />
        </View>

        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>🔒 Secure OAuth</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity 
          onPress={handleConnect} 
          disabled={loading}
          style={styles.primaryButton}
          accessibilityRole="button"
          accessibilityLabel="Connect with Grab"
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>Connect with Grab</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleSkip} 
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip connect grab account"
        >
          <Text style={styles.skipText}>Skip, try first</Text>
        </TouchableOpacity>
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
    height: 64,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroContainer: {
    width: 240,
    height: 180,
    backgroundColor: '#E8F8EF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  heroCard: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 2,
  },
  heroShadow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 177, 79, 0.1)',
    zIndex: 1,
  },
  grabWordmark: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 12,
    position: 'absolute',
    bottom: -40,
  },
  lockIconCircle: {
    // Icon is inside heroCard
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 18,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 300,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  badge: {
    backgroundColor: '#E8F8EF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(0, 177, 79, 0.2)',
  },
  badgeText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 32,
  },
  micCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    width: '100%',
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  micIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F8EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  micTextContainer: {
    flex: 1,
  },
  micTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  micSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#E8F8EF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  primaryButton: {
    height: 56,
    backgroundColor: theme.colors.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
