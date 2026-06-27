import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Image,
  ImageBackground,
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
    <SafeAreaView edges={['top']} style={styles.root}>
      <ScreenHeader
        title="Chuyến đi của bạn"
        onBack={onBack}
        rightElement={
          <View style={styles.grabBadge}>
            {ASSETS.images.grabLogo ? (
              <Image
                source={ASSETS.images.grabLogo}
                style={styles.grabLogoImg}
                resizeMode="contain"
              />
            ) : (
              <Text style={styles.grabBadgeText}>Grab</Text>
            )}
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* MAP ZONE */}
        <View style={styles.mapZoneContainer}>
          <ImageBackground
            source={ASSETS.images.mapPlaceholder ?? undefined}
            style={styles.mapZone}
            imageStyle={{ borderRadius: 20, opacity: 0.15 }}
          >
            {!ASSETS.images.mapPlaceholder && <View style={styles.mapPlaceholderBg} />}
            <MaterialCommunityIcons name="car" size={52} color="#00B14F" />
            <Text style={styles.mapEtaText}>
              {etaLabel === '–' ? 'Đang tìm xe...' : etaLabel}
            </Text>

            <View style={[styles.etaBadge, styles.shadow]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
              <Text style={styles.etaBadgeText}>{etaLabel}</Text>
            </View>

            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>
                {steps[stepIndex]?.label || ''}
              </Text>
            </View>
          </ImageBackground>
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
                        backgroundColor: isPending ? '#E5E7EB' : '#00B14F',
                      },
                    ]}
                  >
                    {isDone ? (
                      <MaterialCommunityIcons name="check" size={18} color="white" />
                    ) : (
                      <MaterialCommunityIcons
                        name={step.icon as any}
                        size={16}
                        color={isPending ? '#9CA3AF' : 'white'}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isDone ? '#009040' : isActive ? '#00B14F' : '#9CA3AF',
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
                        backgroundColor: index < stepIndex ? '#00B14F' : '#E5E7EB',
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
              <MaterialCommunityIcons name="account" size={36} color="#00B14F" />
            </View>
            <View style={styles.driverInfoCenter}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.driverRatingRow}>
                <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                <Text style={styles.driverRatingText}>{driver.rating}</Text>
                <Text style={styles.dotSeparator}>·</Text>
                <MaterialCommunityIcons name="car" size={13} color="#6B7280" />
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
                <MaterialCommunityIcons name="phone" size={22} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="Nhắn tin tài xế"
              >
                <MaterialCommunityIcons name="chat-outline" size={22} color="#374151" />
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
              <MaterialCommunityIcons name="shield-check" size={14} color="#00B14F" />
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
            <MaterialCommunityIcons name="map-marker-outline" size={18} color="#00B14F" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>ĐIỂM ĐÓN</Text>
              <Text style={styles.locationText}>
                {intent?.origin ?? '123 Lê Lợi, Q.1'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.locationRow}>
            <MaterialCommunityIcons name="map-marker-check" size={18} color="#EF4444" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>ĐIỂM ĐẾN</Text>
              <Text style={styles.locationText}>
                {intent?.destination ?? 'Bến Thành Market'}
              </Text>
            </View>
          </View>
          <View style={styles.divider} />
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
            { top: insets.top + 8, opacity: toastOpacity },
          ]}
          accessibilityLiveRegion="polite"
          importantForAccessibility="yes"
        >
          <MaterialCommunityIcons name="volume-high" size={16} color="#00B14F" />
          <Text style={styles.toastText} numberOfLines={2}>
            {announcement}
          </Text>
        </Animated.View>
      )}

      {/* FOOTER */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 16 },
        ]}
      >
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
            <Text style={styles.disabledFooterText}>Không thể huỷ</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },
  scrollContent: {
    paddingBottom: 140,
  },
  grabBadge: {
    backgroundColor: '#00B14F',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  grabBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  grabLogoImg: {
    width: 16,
    height: 16,
  },
  mapZoneContainer: {
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  mapZone: {
    height: 200,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#E8F8EF',
  },
  mapPlaceholderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#E8F8EF',
  },
  mapEtaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00B14F',
    marginTop: 8,
  },
  etaBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  statusPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,177,79,0.9)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
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
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    width: 64,
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: -18,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 12,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  driverRow: {
    flexDirection: 'row',
  },
  driverAvatar: {
    width: 64,
    height: 64,
    backgroundColor: '#E8F8EF',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverInfoCenter: {
    flex: 1,
    marginLeft: 14,
  },
  driverName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  driverRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  driverRatingText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 3,
  },
  dotSeparator: {
    marginHorizontal: 4,
    color: '#6B7280',
  },
  vehicleText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 3,
  },
  plateView: {
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  plateText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 2,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#00B14F',
  },
  otpHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.9,
    textAlign: 'center',
    marginBottom: 12,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  otpBox: {
    width: 56,
    height: 56,
    backgroundColor: '#E8F8EF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDigit: {
    fontSize: 32,
    fontWeight: '800',
    color: '#00B14F',
  },
  otpHint: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#00B14F',
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  locationInfo: {
    marginLeft: 10,
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.9,
  },
  locationText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 28,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  voiceToast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },
  toastText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelBtn: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  disabledFooter: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledFooterText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default RideTrackingScreen;
