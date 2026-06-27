import React, { useEffect, useRef, useState } from 'react';
import { 
  Animated, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Image,
  ImageBackground
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFoodTracking } from './useFoodTracking.hook';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ASSETS } from '../../assets';
import { PartnerCode } from '../../types';

export default function FoodTrackingScreen() {
  const insets = useSafeAreaInsets();
  const { 
    currentStatus, 
    stepIndex, 
    steps, 
    orderId, 
    canCancel, 
    onCancel, 
    onBack,
    announcement 
  } = useFoodTracking();

  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (announcement) {
      setShowToast(true);
      Animated.sequence([
        Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowToast(false));
    }
  }, [currentStatus, announcement]);

  const renderStep = (step: any, index: number) => {
    const isActive = index === stepIndex;
    const isDone = index < stepIndex;
    const isPending = index > stepIndex;

    const labelColor = isDone ? '#009040' : (isActive ? '#00B14F' : '#9CA3AF');

    return (
      <View key={step.id} style={styles.stepItem}>
        <View style={styles.stepCircleContainer}>
          <View style={[
            styles.stepCircle, 
            (isActive || isDone) && { backgroundColor: '#00B14F' },
            isPending && { backgroundColor: '#E5E7EB' }
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
        </View>
        <Text style={[styles.stepLabel, { color: labelColor }]}>{step.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <ImageBackground 
        source={ASSETS.images.bgTexture} 
        style={styles.flex1}
        resizeMode="repeat"
      >
        <ScreenHeader 
          title={`Đơn #${orderId.slice(-3)}`} 
          onBack={onBack}
          rightElement={
            <View style={styles.grabBadge}>
              <Image 
                source={ASSETS.images.grabLogo} 
                style={styles.grabLogoImg} 
                resizeMode="contain"
              />
            </View>
          }
        />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Map Placeholder */}
        <View style={styles.mapArea}>
          {ASSETS.images.mapPlaceholder ? (
            <Image 
              source={ASSETS.images.mapPlaceholder} 
              style={styles.mapImage} 
              resizeMode="cover"
            />
          ) : (
            <MaterialCommunityIcons name="map-marker-path" size={48} color="#00B14F" />
          )}
          <View style={styles.etaBadge}>
            <View style={styles.iconTextPair}>
              <MaterialCommunityIcons name="clock-outline" size={13} color="#111827" />
              <Text style={styles.etaText}>~18 phút</Text>
            </View>
          </View>
        </View>

        {/* Step Indicator */}
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
            <View style={styles.avatarBox}>
              <MaterialCommunityIcons name="account" size={28} color="#00B14F" />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.driverName}>Nguyễn Văn A</Text>
              <View style={styles.driverMetaRow}>
                <View style={styles.iconTextPair}>
                  <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.metaText}>4.9</Text>
                </View>
                <Text style={styles.metaSeparator}>·</Text>
                <View style={styles.iconTextPair}>
                  <MaterialCommunityIcons name="bike" size={13} color="#6B7280" />
                  <Text style={styles.metaText}>GrabBike</Text>
                </View>
              </View>
            </View>
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.iconBtn}>
                <MaterialCommunityIcons name="phone" size={22} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconBtn, styles.ml12]}>
                <MaterialCommunityIcons name="chat" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Order Summary Card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="food" size={20} color="#00B14F" />
            <Text style={styles.summaryTitle}>Phở Bò Tái ×1</Text>
            <Text style={styles.summaryPrice}>80.000đ</Text>
          </View>
        </View>
      </ScrollView>

      {/* Voice Toast */}
      {showToast && (
        <Animated.View style={[
          styles.voiceToast, 
          { top: insets.top + 16, opacity: toastOpacity }
        ]}>
          <MaterialCommunityIcons name="volume-high" size={16} color="#00B14F" />
          <Text style={styles.toastText}>{announcement}</Text>
        </Animated.View>
      )}

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {canCancel ? (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={onCancel}
          >
            <Text style={styles.cancelBtnText}>Huỷ đơn</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.disabledFooter}>
            <Text style={styles.disabledText}>Không thể huỷ</Text>
          </View>
        )}
      </View>
      </ImageBackground>
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
  flex1: {
    flex: 1,
  },
  grabBadge: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  grabLogoImg: {
    width: 24,
    height: 16,
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
    overflow: 'hidden',
    position: 'relative',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconTextPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
    width: 60,
  },
  stepCircleContainer: {
    marginBottom: 6,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: 80,
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: -16,
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
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E8F8EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  metaSeparator: {
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  actionIcons: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ml12: {
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 15,
    color: '#111827',
    flex: 1,
    marginLeft: 10,
  },
  summaryPrice: {
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
