// apps/mobile/src/screens/S12_FoodTracking/index.tsx
import React, { useEffect, useRef, useState } from 'react';
import { 
  Animated, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFoodTracking } from './useFoodTracking.hook';
import { ScreenHeader } from '../../components/ScreenHeader';
import { ASSETS } from '../../assets';
import { theme } from '../../theme/theme';
import { SuaraLogo } from '../../components/SuaraLogo';
import { BrandedBackground } from '../../components/BrandedBackground';

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

    const labelColor = isDone ? theme.colors.primaryDark : (isActive ? theme.colors.primary : theme.colors.textMuted);

    return (
      <View key={step.id} style={styles.stepItem}>
        <View style={styles.stepCircleContainer}>
          <View style={[
            styles.stepCircle, 
            (isActive || isDone) && { backgroundColor: theme.colors.primary },
            isPending && { backgroundColor: theme.colors.border }
          ]}>
            {isDone ? (
              <MaterialCommunityIcons name="check" size={18} color="white" />
            ) : (
              <MaterialCommunityIcons 
                name={step.icon} 
                size={16} 
                color={isActive ? "white" : theme.colors.textMuted} 
              />
            )}
          </View>
        </View>
        <Text style={[styles.stepLabel, { color: labelColor }]}>{step.label}</Text>
      </View>
    );
  };

  return (
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <ScreenHeader 
          title={`Đơn #${orderId.slice(-3)}`} 
          onBack={onBack}
          showLogo={false}
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
          {/* Map Placeholder with Floating Logo */}
          <View style={styles.mapArea}>
            {ASSETS.images.mapPlaceholder ? (
              <Image 
                source={ASSETS.images.mapPlaceholder} 
                style={styles.mapImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.mapFallBack}>
                <MaterialCommunityIcons name="map-marker-path" size={48} color={theme.colors.primary} />
              </View>
            )}
            
            <View style={styles.floatingLogoPill}>
              <SuaraLogo size="sm" />
            </View>

            <View style={styles.etaBadge}>
              <View style={styles.iconTextPair}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.textPrimary} />
                <Text style={styles.etaValue}>18</Text>
                <Text style={styles.etaUnit}>phút</Text>
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
                <MaterialCommunityIcons name="account" size={28} color={theme.colors.primary} />
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
                    <MaterialCommunityIcons name="bike" size={13} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>GrabBike</Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionIcons}>
                <TouchableOpacity style={styles.iconBtn}>
                  <MaterialCommunityIcons name="phone" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, styles.ml12]}>
                  <MaterialCommunityIcons name="chat-processing" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Order Summary Card */}
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="food" size={20} color={theme.colors.primary} />
              <Text style={styles.summaryTitle}>Phở Bò Tái ×1</Text>
              <Text style={styles.summaryPrice}>80.000đ</Text>
            </View>
          </View>
        </ScrollView>

        {/* Voice Toast */}
        {showToast && (
          <Animated.View style={[
            styles.voiceToast, 
            { top: insets.top + 70, opacity: toastOpacity }
          ]}>
            <View style={styles.toastInner}>
              <MaterialCommunityIcons name="volume-high" size={20} color={theme.colors.primary} />
              <Text style={styles.toastText} numberOfLines={2}>{announcement}</Text>
            </View>
          </Animated.View>
        )}

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {canCancel ? (
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onCancel}
            >
              <Text style={styles.cancelBtnText}>Huỷ đơn hàng</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledFooter}>
              <MaterialCommunityIcons name="lock" size={14} color={theme.colors.textMuted} />
              <Text style={styles.disabledText}>Không thể huỷ lúc này</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </BrandedBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 160,
  },
  flex1: {
    flex: 1,
  },
  grabLogoImg: {
    width: 60,
    height: 24,
  },
  mapArea: {
    height: 240,
    marginHorizontal: 16,
    backgroundColor: '#E8EDEA',
    borderRadius: theme.radius.card,
    marginTop: 12,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapFallBack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingLogoPill: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -42, // roughly half our sm logo pill width
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
  iconTextPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  etaUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginLeft: 2,
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
  stepCircleContainer: {
    marginBottom: 8,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: 80,
  },
  connector: {
    flex: 1,
    height: 3,
    marginTop: -26,
    borderRadius: 2,
  },
  connectorActive: {
    backgroundColor: theme.colors.primary,
  },
  connectorPending: {
    backgroundColor: theme.colors.border,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  driverMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  metaSeparator: {
    color: theme.colors.border,
    marginHorizontal: 8,
  },
  actionIcons: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryXSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ml12: {
    marginLeft: 12,
  },
  summaryTitle: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  summaryPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
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
    width: '100%',
    height: 60,
    borderRadius: theme.radius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: theme.colors.error,
    fontSize: 17,
    fontWeight: '700',
  },
  disabledFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
  disabledText: {
    fontSize: 15,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginLeft: 6,
  },
});
