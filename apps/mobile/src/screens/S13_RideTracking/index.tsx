// apps/mobile/src/screens/S13_RideTracking/index.tsx
import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRideTracking } from './useRideTracking.hook';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ASSETS } from '../../assets';
import { theme } from '../../theme/theme';
import { SuaraLogo } from '../../components/SuaraLogo';
import { BrandedBackground } from '../../components/BrandedBackground';
import { useVoice } from '../../contexts/VoiceContext';

const RideTrackingScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    currentStatus,
    stepIndex,
    steps,
    driver,
    canCancel,
    onCancel,
    onBack,
    intent,
    orderId,
    otpDigits,
    showOtp,
    etaLabel,
    announcement,
  } = useRideTracking();
  const { openVoice } = useVoice();

  // Voice toast animation (opacity only)
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastVisible, setToastVisible] = React.useState(false);

  useEffect(() => {
    if (!announcement) return;
    setToastVisible(true);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.delay(3200),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastVisible(false));
  }, [announcement, currentStatus]);

  // OTP card entrance animation
  const otpScale = useRef(new Animated.Value(0.8)).current;
  const otpOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showOtp) {
      Animated.parallel([
        Animated.spring(otpScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(otpOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(otpOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
      otpScale.setValue(0.8);
    }
  }, [showOtp]);

  return (
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <ScreenHeader
          title="Chuyến đi của bạn"
          showLogo={false}
          onBack={onBack}
          rightElement={
            ASSETS.images.grabLogo && (
              <Image
                source={ASSETS.images.grabLogo}
                style={styles.grabLogoImg}
                resizeMode="contain"
              />
            )
          }
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* MAP ZONE */}
          <View style={styles.mapZoneContainer}>
            <View style={styles.mapZone}>
              {ASSETS.images.mapPlaceholder ? (
                <Image
                  source={ASSETS.images.mapPlaceholder}
                  style={styles.mapImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.mapPlaceholderBg}>
                  <MaterialCommunityIcons name="car" size={52} color={theme.colors.primary} />
                </View>
              )}

              <View style={styles.floatingLogoPill}>
                <SuaraLogo size="sm" />
              </View>

              <View style={[styles.etaBadge, styles.shadow]}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.textPrimary} />
                <Text style={styles.etaBadgeText}>{etaLabel}</Text>
              </View>
            </View>
          </View>

          {/* STEP INDICATOR */}
          <View style={styles.stepRow}>
            {steps.map((step, index) => {
              const isDone = index < stepIndex;
              const isActive = index === stepIndex;
              const isPending = index > stepIndex;

              return (
                <React.Fragment key={step.id}>
                  <View style={styles.stepItem}>
                    <View
                      style={[
                        styles.stepCircle,
                        {
                          backgroundColor: isPending ? theme.colors.border : theme.colors.primary,
                        },
                      ]}
                    >
                      {isDone ? (
                        <MaterialCommunityIcons name="check" size={18} color="white" />
                      ) : (
                        <MaterialCommunityIcons
                          name={step.icon as any}
                          size={16}
                          color={isPending ? theme.colors.textMuted : 'white'}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.stepLabel,
                        {
                          color: isDone ? theme.colors.primaryDark : isActive ? theme.colors.primary : theme.colors.textMuted,
                        },
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                  {index < steps.length - 1 && (
                    <View
                      style={[
                        styles.connector,
                        {
                          backgroundColor: index < stepIndex ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* DRIVER CARD */}
          <View
            style={[styles.card, styles.shadow]}
            accessibilityLabel={`Tài xế ${driver.name}, đánh giá ${driver.rating}, ${driver.vehicle}, biển số ${driver.plate}`}
            accessibilityRole="none"
          >
            <View style={styles.driverRow}>
              <View style={styles.driverAvatar}>
                <MaterialCommunityIcons name="account" size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.driverInfoCenter}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.driverRatingRow}>
                  <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.driverRatingText}>{driver.rating}</Text>
                  <Text style={styles.dotSeparator}>·</Text>
                  <MaterialCommunityIcons name="car" size={13} color={theme.colors.textSecondary} />
                  <Text style={styles.vehicleText}>{driver.vehicle}</Text>
                </View>
                <View
                  style={styles.plateView}
                  accessibilityLabel={'Biển số xe ' + driver.plate}
                >
                  <Text style={styles.plateText}>{driver.plate}</Text>
                </View>
              </View>
              <View style={styles.driverActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Gọi tài xế"
                >
                  <MaterialCommunityIcons name="phone" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Nhắn tin tài xế"
                >
                  <MaterialCommunityIcons name="chat-outline" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* OTP CARD */}
          {showOtp && (
            <Animated.View
              style={[
                styles.otpCard,
                { opacity: otpOpacity, transform: [{ scale: otpScale }] },
              ]}
              accessibilityLabel={`Mã OTP của bạn là ${otpDigits.join(' ')}`}
              accessibilityLiveRegion="polite"
            >
              <Text style={styles.otpHeader}>MÃ OTP CỦA BẠN</Text>
              <View style={styles.otpRow}>
                {otpDigits.map((digit, i) => (
                  <View key={i} style={styles.otpBox}>
                    <Text style={styles.otpDigit}>{digit}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.otpHint}>
                Chia sẻ mã này với tài xế để xác nhận lên xe
              </Text>
              <View style={styles.securityRow}>
                <MaterialCommunityIcons name="shield-check" size={14} color={theme.colors.primary} />
                <Text style={styles.securityText}>Mã hết hạn khi chuyến bắt đầu</Text>
              </View>
            </Animated.View>
          )}

          {/* RIDE DETAILS CARD */}
          <View
            style={[styles.card, styles.shadow]}
            accessibilityLabel={`Từ ${intent?.origin ?? '123 Lê Lợi, Q.1'} đến ${
              intent?.destination ?? 'Bến Thành Market'
            }`}
          >
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={18} color={theme.colors.primary} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>ĐIỂM ĐÓN</Text>
                <Text style={styles.locationText}>
                  {intent?.origin ?? '123 Lê Lợi, Q.1'}
                </Text>
              </View>
            </View>
            <View style={styles.locationDivider} />
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker-check" size={18} color={theme.colors.error} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>ĐIỂM ĐẾN</Text>
                <Text style={styles.locationText}>
                  {intent?.destination ?? 'Bến Thành Market'}
                </Text>
              </View>
            </View>
            <View style={styles.locationDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Giá ước tính</Text>
              <Text style={styles.priceValue}>~45.000đ</Text>
            </View>
          </View>
        </ScrollView>

        {/* VOICE TOAST */}
        {toastVisible && (
          <Animated.View
            style={[
              styles.voiceToast,
              { top: insets.top + 70, opacity: toastOpacity },
            ]}
            accessibilityLiveRegion="polite"
            importantForAccessibility="yes"
          >
            <View style={styles.toastInner}>
              <MaterialCommunityIcons name="volume-high" size={20} color={theme.colors.primary} />
              <Text style={styles.toastText} numberOfLines={2}>
                {announcement}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* FOOTER */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {canCancel ? (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel="Huỷ chuyến đi"
              accessibilityHint="Chỉ khả dụng khi đang tìm xe hoặc tài xế đang đến"
            >
              <Text style={styles.cancelBtnText}>Huỷ chuyến</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledFooter}>
              <MaterialCommunityIcons name="lock" size={14} color={theme.colors.textMuted} />
              <Text style={styles.disabledFooterText}>Không thể huỷ lúc này</Text>
            </View>
          )}
        </View>

        {/* Floating Mic FAB */}
        <TouchableOpacity
          style={[styles.micFab, { bottom: Math.max(insets.bottom, 16) + 80 }]}
          onPress={() => openVoice('home', 'Bạn cần trợ giúp gì? Tôi có thể đặt lại hoặc thay đổi đơn hàng cho bạn.')}
          accessibilityRole="button"
          accessibilityLabel="Voice Assistant"
        >
          <MaterialCommunityIcons name="microphone" size={32} color="white" />
        </TouchableOpacity>
      </SafeAreaView>
    </BrandedBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  grabLogoImg: {
    width: 60,
    height: 24,
  },
  mapZoneContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  mapZone: {
    height: 240,
    borderRadius: theme.radius.card,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#E8EDEA',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8EDEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingLogoPill: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -42,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: theme.radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  etaBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: theme.radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  etaBadgeText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  stepItem: {
    alignItems: 'center',
    width: 64,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: 64,
  },
  connector: {
    flex: 1,
    height: 3,
    marginTop: -26,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 56,
    height: 56,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfoCenter: {
    flex: 1,
    marginLeft: 14,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  driverRatingText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 3,
    fontWeight: '600',
  },
  dotSeparator: {
    marginHorizontal: 4,
    color: theme.colors.border,
  },
  vehicleText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 3,
    fontWeight: '500',
  },
  plateView: {
    backgroundColor: '#111827',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  plateText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1.5,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.primaryXSoft,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpCard: {
    backgroundColor: theme.colors.primaryXSoft,
    borderRadius: theme.radius.card,
    marginHorizontal: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  otpHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpBox: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigit: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  otpHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1,
  },
  locationText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  locationDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 30,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  priceLabel: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  voiceToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 100,
  },
  toastInner: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 12,
    flex: 1,
  },
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
  cancelBtn: {
    height: 60,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.error,
  },
  disabledFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  disabledFooterText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginLeft: 6,
  },
  micFab: {
    position: 'absolute',
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default RideTrackingScreen;
