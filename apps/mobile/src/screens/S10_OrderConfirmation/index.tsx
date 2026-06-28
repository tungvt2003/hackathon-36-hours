// apps/mobile/src/screens/S10_OrderConfirmation/index.tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOrderConfirmation } from './useOrderConfirmation.hook';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ASSETS } from '../../assets';
import { PartnerCode } from '../../types';
import { theme } from '../../theme/theme';
import { BrandedBackground } from '../../components/BrandedBackground';
import { useVoice } from '../../contexts/VoiceContext';
import { FloatingMicButton } from '../../components/FloatingMicButton';

export default function OrderConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const {
    order, isViewMode, isListening,
    useTextInput, textInput, setTextInput, submitTextInput,
    onMicPress, onConfirm, onBack,
  } = useOrderConfirmation();
  const { openVoice } = useVoice();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isListening) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  return (
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <ScreenHeader
          title={isViewMode ? 'Chi tiết đơn' : 'Xác nhận đơn'}
          showLogo={false}
          onBack={onBack}
          rightElement={
            order.partner === PartnerCode.GRAB ? (
              <Image
                source={ASSETS.images.grabLogo}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.partnerBadge}>
                <Text style={styles.partnerBadgeText}>{order.partnerLabel}</Text>
              </View>
            )
          }
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Voice listening banner / AI strip */}
          {isListening ? (
            <View style={styles.listeningBanner}>
              <Animated.View style={[styles.micPulseRing, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.micPulseCore}>
                  <MaterialCommunityIcons name="microphone" size={28} color="white" />
                </View>
              </Animated.View>
              <View style={styles.listeningTextBlock}>
                <Text style={styles.listeningTitle}>Đang lắng nghe…</Text>
                <Text style={styles.listeningHint}>Nói "Có" để đặt đơn · "Không" để huỷ</Text>
              </View>
            </View>
          ) : (
            <View style={styles.aiStrip}>
              <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} />
              <Text style={styles.aiStripText}>Vui lòng kiểm tra lại đơn hàng</Text>
            </View>
          )}

          {/* Card 1: Restaurant */}
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.row}>
              <View style={styles.imageContainer}>
                {ASSETS.images.restaurantDefault ? (
                  <Image
                    source={ASSETS.images.restaurantDefault}
                    style={styles.restaurantImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.iconBox}>
                    <MaterialCommunityIcons name="food" size={32} color={theme.colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.flex1}>
                <Text style={styles.restaurantName}>{order.restaurantName}</Text>
                <View style={styles.metaRow}>
                  <View style={styles.iconTextPair}>
                    <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.metaText}>{order.restaurantRating}</Text>
                  </View>
                  <Text style={styles.metaSeparator}>·</Text>
                  <View style={styles.iconTextPair}>
                    <MaterialCommunityIcons name="clock-outline" size={13} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>{order.etaMin}–{order.etaMax} phút</Text>
                  </View>
                </View>
              </View>
              <View style={styles.openBadge}>
                <Text style={styles.openBadgeText}>Mở cửa</Text>
              </View>
            </View>
          </View>

          {/* Card 2: Order Items */}
          <View style={[styles.card, styles.shadow]}>
            <Text style={styles.cardHeading}>ĐƠN HÀNG CỦA BẠN</Text>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price.toLocaleString()}đ</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.rowBetween}>
              <Text style={styles.summaryLabel}>Phí giao hàng</Text>
              <Text style={styles.summaryValue}>{order.deliveryFee.toLocaleString()}đ</Text>
            </View>
            <View style={[styles.rowBetween, styles.mt8]}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{order.total.toLocaleString()}đ</Text>
            </View>
          </View>

          {/* Card 3: Delivery */}
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="map-marker" size={20} color={theme.colors.primary} />
              <Text style={styles.addressText}>{order.address}</Text>
              {!isViewMode && (
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Chỉnh sửa địa chỉ giao hàng"
                >
                  <Text style={styles.editLink}>Thay đổi</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Card 4: Payment */}
          <View style={[styles.card, styles.shadow]}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="credit-card-outline" size={20} color={theme.colors.textMuted} />
              <Text style={styles.paymentText}>{order.paymentMethod}</Text>
              {!isViewMode && (
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Đổi phương thức thanh toán"
                >
                  <Text style={styles.editLink}>Đổi</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          {isViewMode ? (
            <View style={styles.actionRow}>
              <View style={styles.flex1}>
                <SecondaryButton label="Đóng" onPress={onBack} />
              </View>
              <View style={[styles.flex1, styles.ml12]}>
                <PrimaryButton label="Đặt lại" onPress={() => onConfirm()} />
              </View>
            </View>
          ) : useTextInput ? (
            /* Dev/web mode: show both text input and a visible mic button like dashboard */
            <View style={styles.confirmVoicePanel}>
              <View style={styles.devInputRow}>
                <TextInput
                  style={styles.devInput}
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder="Nhập Có / Không hoặc xác nhận..."
                  placeholderTextColor={theme.colors.textMuted}
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={submitTextInput}
                  accessibilityLabel="Nhập xác nhận đơn hàng"
                />
                <TouchableOpacity
                  style={styles.devSendBtn}
                  onPress={submitTextInput}
                  accessibilityRole="button"
                  accessibilityLabel="Gửi"
                >
                  <MaterialCommunityIcons name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.confirmMicZone}>
                <FloatingMicButton onPress={onMicPress} size={88} />
                <Text style={styles.voiceLabel}>Nhấn để nói</Text>
              </View>
            </View>
          ) : (
            /* Voice mode: pressable mic like dashboard */
            <View style={styles.voicePanel}>
              <TouchableOpacity
                onPress={onMicPress}
                accessibilityRole="button"
                accessibilityLabel={isListening ? 'Dừng nghe' : 'Nhấn để nói xác nhận đơn hàng'}
                activeOpacity={0.82}
              >
                <Animated.View style={[styles.micRing, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={[styles.micCore, isListening && styles.micCoreActive]}>
                    <MaterialCommunityIcons
                      name={isListening ? 'microphone' : 'microphone-outline'}
                      size={34}
                      color="white"
                    />
                  </View>
                </Animated.View>
              </TouchableOpacity>
              <Text style={[styles.voiceLabel, isListening && styles.voiceLabelActive]}>
                {isListening ? 'Đang lắng nghe…' : 'Nhấn để nói'}
              </Text>
              <Text style={styles.voiceHint}>Nói "Có" để đặt · "Không" để huỷ</Text>
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
    paddingHorizontal: 20,
    paddingBottom: 170,
    paddingTop: 16,
  },
  aiStrip: {
    backgroundColor: theme.colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,177,79,0.1)',
  },
  aiStripText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  listeningBanner: {
    backgroundColor: '#fff0f0',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#E53935',
  },
  micPulseRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229,57,53,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micPulseCore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listeningTextBlock: {
    flex: 1,
  },
  listeningTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B71C1C',
  },
  listeningHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E53935',
    marginTop: 3,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: 18,
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: theme.colors.primarySoft,
  },
  restaurantImage: {
    width: '100%',
    height: '100%',
  },
  iconBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  iconTextPair: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  metaSeparator: {
    marginHorizontal: 8,
    color: theme.colors.border,
  },
  openBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  openBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  qtyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    flex: 1,
    marginLeft: 12,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 16,
  },
  summaryLabel: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  mt8: {
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  addressText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    flex: 1,
    marginLeft: 12,
  },
  paymentText: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    flex: 1,
    marginLeft: 12,
  },
  editLink: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  partnerBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
  },
  partnerBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '700',
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
  actionRow: {
    flexDirection: 'row',
  },
  ml12: {
    marginLeft: 12,
  },
  headerLogo: {
    width: 64,
    height: 24,
  },
  /* Centered voice panel */
  confirmVoicePanel: {
    alignItems: 'center',
    gap: 14,
  },
  confirmMicZone: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  voicePanel: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  micRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(229,57,53,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micCore: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micCoreActive: {
    backgroundColor: '#E53935',
  },
  voiceLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  voiceLabelActive: {
    color: '#B71C1C',
  },
  voiceHint: {
    fontSize: 13,
    color: '#E53935',
    fontWeight: '500',
  },
  /* Dev text input */
  devInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  devInput: {
    flex: 1,
    height: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  devSendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
