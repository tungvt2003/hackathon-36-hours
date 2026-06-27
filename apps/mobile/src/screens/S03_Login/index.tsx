// apps/mobile/src/screens/S03_Login/index.tsx
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLogin } from './useLogin.hook';
import { PLATFORM_AI_GREETING } from './login.service';
import { theme } from '../../theme/theme';
import { ASSETS } from '../../assets';
import { BrandedBackground } from '../../components/BrandedBackground';
import { SuaraLogo } from '../../components/SuaraLogo';
import { PrimaryButton } from '../../components/PrimaryButton';

type PartnerTile = {
  id: string;
  label: string;
  available: boolean;
  logoImage?: any;
  iconName?: string;
  iconColor?: string;
};

const PARTNER_TILES: PartnerTile[] = [
  { id: 'grab', label: 'Grab', available: true, logoImage: ASSETS.images.grabLogo },
  { id: 'be', label: 'Be', available: false, iconName: 'car-multiple', iconColor: '#FFB800' },
  { id: 'xanhsm', label: 'Xanh SM', available: false, iconName: 'leaf', iconColor: '#22C55E' },
  { id: 'shopee', label: 'ShopeeFood', available: false, iconName: 'shopping', iconColor: '#EE4D2D' },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loading, handleConnect, handleSkip } = useLogin();

  return (
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.top}>
          <View style={{ marginBottom: 24, alignSelf: 'center' }}>
            <SuaraLogo size="sm" />
          </View>

          {/* AI speak card */}
          <View style={styles.aiCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiIconCircle}>
                <MaterialCommunityIcons name="robot" size={18} color="#00B14F" />
              </View>
              <Text style={styles.aiLabel}>ACCESSAI NÓI</Text>
            </View>
            <Text style={styles.aiText}>{PLATFORM_AI_GREETING}</Text>
          </View>

          {/* Platform tiles */}
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
                    tile.available ? `Kết nối với ${tile.label}` : `${tile.label} — sắp ra mắt`
                  }
                  accessibilityState={{ disabled: !tile.available }}
                >
                  {tile.logoImage ? (
                    <Image
                      source={tile.logoImage}
                      style={[styles.partnerLogo, !tile.available && { opacity: 0.3 }]}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={[styles.partnerIconCircle, !tile.available && { opacity: 0.35 }]}>
                      <MaterialCommunityIcons name={tile.iconName as any} size={32} color={tile.iconColor ?? '#9CA3AF'} />
                    </View>
                  )}
                  <Text style={[styles.partnerLabel, !tile.available && styles.partnerLabelLocked]}>
                    {tile.label}
                  </Text>
                  {!tile.available && <Text style={styles.comingSoonText}>Sắp ra mắt</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.voiceHint}>
            <MaterialCommunityIcons name="microphone" size={16} color="#00B14F" />
            <Text style={styles.voiceHintText}>Hoặc nói tên nền tảng bạn muốn</Text>
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <PrimaryButton
            label={loading ? 'Đang kết nối...' : 'Kết nối với Grab'}
            onPress={handleConnect}
            disabled={loading}
          />
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton} accessibilityRole="button">
            <Text style={styles.skipText}>Thử trước, kết nối sau</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </BrandedBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  top: { paddingHorizontal: 24, paddingTop: 16, flex: 1 },
  aiCard: {
    backgroundColor: 'rgba(0,177,79,0.08)',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(0,177,79,0.25)',
    padding: 20,
    marginBottom: 28,
    shadowColor: '#00B14F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  aiCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  aiIconCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,177,79,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  aiLabel: { fontSize: 11, fontWeight: '700', color: '#00B14F', letterSpacing: 1.2, textTransform: 'uppercase', marginLeft: 8 },
  aiText: { fontSize: 18, fontWeight: '500', color: theme.colors.textPrimary, lineHeight: 27 },
  partnerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  partnerTile: {
    width: '47%', aspectRatio: 1.1, backgroundColor: 'white', borderRadius: 20, borderWidth: 1.5,
    borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  partnerTileActive: {
    borderColor: '#00B14F', backgroundColor: '#E8F8EF',
    shadowColor: '#00B14F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 12, elevation: 4,
  },
  partnerTileLocked: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', opacity: 0.6 },
  partnerLogo: { width: 88, height: 36, marginBottom: 8 },
  partnerIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  partnerLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  partnerLabelLocked: { color: theme.colors.textMuted },
  comingSoonText: { fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.6 },
  voiceHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
  voiceHintText: { fontSize: 14, color: '#6B7280' },
  footer: { paddingHorizontal: 24 },
  skipButton: { height: 48, justifyContent: 'center', alignItems: 'center' },
  skipText: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
});
