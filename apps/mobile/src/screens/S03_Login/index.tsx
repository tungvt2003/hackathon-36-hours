// apps/mobile/src/screens/S03_Login/index.tsx
import React from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLogin } from './useLogin.hook';
import { theme } from '../../theme/theme';
import { ASSETS } from '../../assets';

// ── Partner tile definition ──────────────────────────────
type PartnerTile = {
  id: string;
  label: string;
  available: boolean;
  // For Grab: render the PNG logo. For others: render a MaterialCommunityIcons name.
  logoImage?: any;
  iconName?: string;
  iconColor?: string;
};

const PARTNER_TILES: PartnerTile[] = [
  {
    id: 'grab',
    label: 'Grab',
    available: true,
    logoImage: ASSETS.images.grabLogo,
  },
  {
    id: 'be',
    label: 'Be',
    available: false,
    iconName: 'car-multiple',
    iconColor: '#FFB800',
  },
  {
    id: 'xanhsm',
    label: 'Xanh SM',
    available: false,
    iconName: 'leaf',
    iconColor: '#22C55E',
  },
  {
    id: 'shopee',
    label: 'ShopeeFood',
    available: false,
    iconName: 'shopping',
    iconColor: '#EE4D2D',
  },
];

const TrustBadge = ({ icon, label }: { icon: string; label: string }) => (
  <View style={styles.badge}>
    <MaterialCommunityIcons name={icon as any} size={13} color={theme.colors.primary} />
    <Text style={styles.badgeText}>{label}</Text>
  </View>
);

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loading, micEnabled, toggleMic, handleBack, handleConnect, handleSkip } = useLogin();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={26} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ── */}
        <Text style={styles.heading}>Choose your platform</Text>
        <Text style={styles.body}>
          Suara works as a voice layer on top of your favourite service. Only Grab is available right now.
        </Text>

        {/* ── Partner Grid ── */}
        <View style={styles.partnerGrid}>
          {PARTNER_TILES.map((tile) => {
            const isGrab = tile.id === 'grab';
            return (
              <TouchableOpacity
                key={tile.id}
                style={[
                  styles.partnerTile,
                  isGrab && styles.partnerTileActive,
                  !tile.available && styles.partnerTileLocked,
                ]}
                onPress={tile.available ? handleConnect : undefined}
                disabled={!tile.available || loading}
                accessibilityRole="button"
                accessibilityLabel={
                  tile.available
                    ? `Connect with ${tile.label}`
                    : `${tile.label} — coming soon`
                }
                accessibilityState={{ disabled: !tile.available }}
              >
                {/* Lock badge for unavailable */}
                {!tile.available && (
                  <View style={styles.lockBadge}>
                    <MaterialCommunityIcons name="lock" size={11} color="#FFFFFF" />
                  </View>
                )}

                {/* Logo or icon */}
                {tile.logoImage ? (
                  <Image
                    source={tile.logoImage}
                    style={[
                      styles.partnerLogo,
                      !tile.available && styles.partnerLogoLocked,
                    ]}
                    resizeMode="contain"
                    accessibilityLabel={`${tile.label} logo`}
                  />
                ) : (
                  <View
                    style={[
                      styles.partnerIconCircle,
                      !tile.available && { opacity: 0.35 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={tile.iconName as any}
                      size={32}
                      color={tile.iconColor ?? '#9CA3AF'}
                    />
                  </View>
                )}

                <Text
                  style={[
                    styles.partnerLabel,
                    !tile.available && styles.partnerLabelLocked,
                  ]}
                >
                  {tile.label}
                </Text>

                {!tile.available && (
                  <Text style={styles.comingSoonText}>Coming soon</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Trust Badges ── */}
        <View style={styles.badgeRow}>
          <TrustBadge icon="shield-lock" label="SSL Encrypted" />
          <TrustBadge icon="lock-check" label="No password stored" />
          <TrustBadge icon="certificate" label="OAuth 2.0" />
        </View>

        {/* ── Divider ── */}
        <View style={styles.divider} />

        {/* ── Mic permission toggle ── */}
        <View style={styles.micCard}>
          <View style={styles.micIconCircle}>
            <MaterialCommunityIcons name="microphone" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.micTextContainer}>
            <Text style={styles.micTitle}>Allow Microphone</Text>
            <Text style={styles.micSubtitle}>Required to receive your voice commands</Text>
          </View>
          <Switch
            value={micEnabled}
            onValueChange={toggleMic}
            trackColor={{ false: '#D1D5DB', true: theme.colors.primary }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D5DB"
            accessibilityLabel="Microphone permission toggle"
          />
        </View>
      </ScrollView>

      {/* ── Fixed footer CTA ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          onPress={handleConnect}
          disabled={loading}
          style={[styles.primaryButton, loading && styles.primaryButtonLoading]}
          accessibilityRole="button"
          accessibilityLabel="Connect with Grab"
        >
          {loading ? (
            <>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={[styles.primaryButtonText, { marginLeft: 10 }]}>
                Connecting…
              </Text>
            </>
          ) : (
            <>
              {ASSETS.images.grabLogo ? (
                <Image
                  source={ASSETS.images.grabLogo}
                  style={styles.ctaGrabLogo}
                  resizeMode="contain"
                  accessibilityElementsHidden
                />
              ) : (
                <MaterialCommunityIcons name="car-connected" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.primaryButtonText}>Connect with Grab</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
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
    backgroundColor: theme.colors.surface,
  },
  header: {
    height: 56,
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
    paddingTop: 8,
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  body: {
    fontSize: 17,
    color: theme.colors.textSecondary,
    lineHeight: 26,
    marginBottom: 28,
  },

  // ── Partner grid ──────────────────────────────────────
  partnerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  partnerTile: {
    width: '47%',
    aspectRatio: 1.2,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
  },
  partnerTileActive: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.primarySoft,
    // Shadow
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  partnerTileLocked: {
    backgroundColor: '#F9FAFB',
    borderColor: theme.colors.borderSoft,
  },
  lockBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerLogo: {
    width: 88,
    height: 36,
    marginBottom: 8,
  },
  partnerLogoLocked: {
    opacity: 0.3,
  },
  partnerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  partnerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  partnerLabelLocked: {
    color: theme.colors.textMuted,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // ── Trust badges ──────────────────────────────────────
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.full,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primaryDeep,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 20,
  },

  // ── Mic card ─────────────────────────────────────────
  micCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 14,
  },
  micIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micTextContainer: {
    flex: 1,
  },
  micTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  micSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // ── Footer ───────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  primaryButton: {
    height: 60,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryButtonLoading: {
    opacity: 0.82,
  },
  ctaGrabLogo: {
    width: 56,
    height: 22,
    marginRight: 10,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  skipText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
