import React, { useEffect, useRef } from 'react';
import { 
  Animated, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Image 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRideTracking } from './useRideTracking.hook';
import { ScreenHeader } from '../../components/ScreenHeader';
import { theme } from '../../theme/theme';
import { ASSETS } from '../../assets';

export default function RideTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { 
    currentStatus, 
    stepIndex, 
    steps, 
    driver, 
    onCancel, 
    onBack, 
    intent,
    announcement 
  } = useRideTracking();

  const toastAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (announcement) {
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: insets.top + 16, duration: 500, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(toastAnim, { toValue: -100, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [currentStatus, insets.top, announcement]);

  const renderStep = (step: any, index: number) => {
    const isActive = index === stepIndex;
    const isDone = index < stepIndex;
    return (
      <View key={step.id} style={styles.stepItem}>
        <View style={[
          styles.stepCircle, 
          (isActive || isDone) && { backgroundColor: '#00B14F' },
          (!isActive && !isDone) && { backgroundColor: '#E5E7EB' }
        ]}>
          {isDone ? (
            <MaterialCommunityIcons name="check" size={18} color="white" />
          ) : (
            <MaterialCommunityIcons 
              name={step.icon} 
              size={16} 
              color={isActive ? "white" : "#9CA3AF"} 
            />
          )}
        </View>
        <Text style={[
          styles.stepLabel, 
          { color: isDone ? '#009040' : (isActive ? '#00B14F' : '#9CA3AF') }
        ]}>
          {step.label}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <ScreenHeader 
        title="Chuyến đi của bạn" 
        onBack={onBack}
        rightElement={
          <View style={styles.grabBadge}>
            <Text style={styles.grabBadgeText}>Grab</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map Area */}
        <View style={styles.mapArea}>
          {ASSETS.images.mapPlaceholder ? (
            <Image 
              source={ASSETS.images.mapPlaceholder} 
              style={styles.mapImage} 
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons name="car" size={48} color="#00B14F" />
          )}
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>~6 phút</Text>
          </View>
        </View>

        {/* Steps */}
        <View style={styles.stepRow}>
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              {renderStep(step, idx)}
              {idx < steps.length - 1 && (
                <View style={[
                  styles.connector, 
                  idx < stepIndex ? styles.connectorActive : styles.connectorPending
                ]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Driver Card */}
        <View style={[styles.card, styles.shadow]}>
          <View style={styles.row}>
            <View style={styles.driverAvatar}>
              <MaterialCommunityIcons name="account" size={36} color="#00B14F" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <View style={styles.driverMetaRow}>
                <View style={styles.iconTextPair}>
                  <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.metaText}>{driver.rating}</Text>
                </View>
                <Text style={styles.metaSeparator}>·</Text>
                <Text style={styles.metaText}>{driver.vehicle}</Text>
              </View>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{driver.plate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* OTP Card */}
        {currentStatus === 'arrived' && (
          <View style={styles.otpCard}>
            <Text style={styles.otpLabel}>Mã OTP của bạn</Text>
            <View style={styles.otpRow}>
              {driver.otp.split('').map((digit, idx) => (
                <View key={idx} style={styles.otpBox}>
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.otpSublabel}>Chia sẻ mã này với tài xế</Text>
          </View>
        )}

        {/* Ride Details */}
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#6B7280" />
            <Text style={styles.detailText} numberOfLines={1}>{intent?.origin || '123 Lê Lợi, Q.1'}</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="navigation" size={20} color="#00B14F" />
            <Text style={styles.detailText} numberOfLines={1}>{intent?.destination || 'Bến Thành Market'}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Giá cước dự kiến</Text>
            <Text style={styles.farePrice}>~45.000đ</Text>
          </View>
        </View>
      </ScrollView>

      {/* Voice Toast */}
      <Animated.View style={[styles.voiceToast, { transform: [{ translateY: toastAnim }] }]}>
        <MaterialCommunityIcons name="volume-high" size={16} color="#00B14F" />
        <Text style={styles.toastText}>{announcement}</Text>
      </Animated.View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {currentStatus === 'finding' || currentStatus === 'en_route' ? (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={onCancel}
          >
            <Text style={styles.cancelBtnText}>Huỷ chuyến</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.disabledFooter}>
            <Text style={styles.disabledText}>Không thể huỷ lúc này</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  grabBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  mapArea: {
    height: 200,
    marginHorizontal: 20,
    backgroundColor: '#E8F8EF',
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  etaBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    elevation: 2,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stepItem: {
    alignItems: 'center',
    width: 65,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    width: 80,
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: -20,
  },
  connectorActive: {
    backgroundColor: '#00B14F',
  },
  connectorPending: {
    backgroundColor: '#E5E7EB',
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F8EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  flex1: {
    flex: 1,
  },
  driverName: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111827',
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  iconTextPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaSeparator: {
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  plateBadge: {
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
  otpCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#00B14F',
  },
  otpLabel: {
    fontSize: 13,
    color: '#6B7280',
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
  otpSublabel: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 10,
    flex: 1,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
    marginLeft: 30,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fareLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  farePrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  voiceToast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
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
    paddingTop: 12,
  },
  cancelBtn: {
    width: '100%',
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledFooter: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
  },
  disabledText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
