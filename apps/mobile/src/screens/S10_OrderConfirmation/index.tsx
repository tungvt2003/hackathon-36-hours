// apps/mobile/src/screens/S10_OrderConfirmation/index.tsx
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
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

export default function OrderConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const { order, isViewMode, onConfirm, onBack } = useOrderConfirmation();
  const { openVoice } = useVoice();

  return (
    <BrandedBackground variant="default">
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <ScreenHeader
          title={isViewMode ? 'Order details' : 'Confirm order'}
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
          {/* AI confirmation strip */}
          <View style={styles.aiStrip}>
            <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} />
            <Text style={styles.aiStripText}>Vui lòng kiểm tra lại đơn hàng</Text>
          </View>

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
          {!isViewMode ? (
            <PrimaryButton
              label={`Place order - ${order.total.toLocaleString()} dong`}
              onPress={onConfirm}
            />
          ) : (
            <View style={styles.actionRow}>
              <View style={styles.flex1}>
                <SecondaryButton label="Đóng" onPress={onBack} />
              </View>
              <View style={[styles.flex1, styles.ml12]}>
                <PrimaryButton
                  label="Order again"
                  onPress={() => onConfirm()}
                />
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.voiceFab, { bottom: 100 + insets.bottom }]}
          onPress={() => openVoice('home', 'Bạn cần trợ giúp gì? Tôi có thể đặt lại hoặc thay đổi đơn hàng cho bạn.')}
          accessibilityRole="button"
          accessibilityLabel="Tap to speak with AI"
        >
          <MaterialCommunityIcons name="microphone" size={32} color="white" />
        </TouchableOpacity>
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
    paddingBottom: 140,
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
  confirmBtn: {
    height: 60,
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
  voiceFab: {
    position: 'absolute',
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
