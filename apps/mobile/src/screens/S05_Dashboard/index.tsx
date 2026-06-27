// apps/mobile/src/screens/S05_Dashboard/index.tsx
import React from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDashboard } from './useDashboard.hook';
import { MicButton } from '../../components/MicButton';
import { BottomNavBar } from '../../components/BottomNavBar';
import { DashboardAction } from './dashboard.service';
import { theme } from '../../theme/theme';
import { ASSETS } from '../../assets';

const { width } = Dimensions.get('window');
// Two columns, 20px edge padding each side, 12px gap between
const CARD_WIDTH = (width - 40 - 12) / 2;

export default function DashboardScreen() {
  const { userName, actions, micState, onMicPress, onActionPress, onTabPress } = useDashboard();

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Suara wordmark — left */}
      <View style={styles.brandMark}>
        {ASSETS.images.suaraLogo ? (
          <Image
            source={ASSETS.images.suaraLogo}
            style={styles.suaraLogoSmall}
            resizeMode="contain"
            accessibilityLabel="Suara"
          />
        ) : (
          <Text style={styles.suaraWordmark}>Suara</Text>
        )}
      </View>

      {/* Greeting — center */}
      <View style={styles.headerGreeting}>
        <Text style={styles.greetingTop} numberOfLines={1}>
          Good morning
        </Text>
        <Text style={styles.greetingName} numberOfLines={1}>
          {userName}
        </Text>
      </View>

      {/* Notification bell — right */}
      <TouchableOpacity
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  const renderAction = ({ item }: { item: DashboardAction }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onActionPress(item)}
      accessibilityRole="button"
      accessibilityLabel={item.title}
      accessibilityHint={item.hint}
      activeOpacity={0.85}
    >
      <View style={styles.iconBadge}>
        <MaterialCommunityIcons
          name={item.icon as any}
          size={28}
          color={theme.colors.primary}
        />
      </View>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardHint} numberOfLines={2}>
        {item.hint}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={ASSETS.images.bgTexture}
      style={styles.root}
      imageStyle={styles.bgImage}
      resizeMode="repeat"
    >
      {/* Gradient overlay on top of texture */}
      <LinearGradient
        colors={['rgba(240,250,245,0.92)', 'rgba(245,246,250,0.96)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        {renderHeader()}

        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
      </SafeAreaView>

      <FlatList
        data={actions}
        renderItem={renderAction}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Voice zone ── */}
      <View style={styles.voiceZone}>
        {/* Subtle radial glow behind mic */}
        <View style={styles.micGlow} />
        <MicButton state={micState} onPress={onMicPress} />
        <Text style={styles.micLabel}>Tap to speak</Text>
      </View>

      <SafeAreaView style={styles.safeBottom} edges={['bottom']}>
        <BottomNavBar activeTab="home" onTabPress={onTabPress} />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bgImage: {
    opacity: 0.18,  // texture subtle, not overpowering
  },

  // ── Header ────────────────────────────────────────────
  safeTop: {
    // transparent so gradient shows through
  },
  header: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 70,
    justifyContent: 'center',
  },
  suaraLogoSmall: {
    width: 64,
    height: 28,
  },
  suaraWordmark: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerGreeting: {
    flex: 1,
    alignItems: 'center',
  },
  greetingTop: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  greetingName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },

  // ── Section label ─────────────────────────────────────
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },

  // ── Cards ─────────────────────────────────────────────
  columnWrapper: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 200,  // space for voice zone + nav
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardHint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // ── Voice zone ────────────────────────────────────────
  voiceZone: {
    position: 'absolute',
    bottom: 88,   // sits above BottomNavBar (80px) + 8px gap
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 8,
  },
  micGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.primaryGlow,
    top: -32,
  },
  micLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 10,
    fontWeight: '500',
  },

  // ── Bottom nav ────────────────────────────────────────
  safeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
  },
});
