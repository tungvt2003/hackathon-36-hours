import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOrderConfirmation } from './useOrderConfirmation.hook';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { ASSETS } from '../../assets';

export default function OrderConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const { order, isViewMode, onConfirm, onBack } = useOrderConfirmation();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
      <ScreenHeader
        title={isViewMode ? 'Chi tiết đơn hàng' : 'Xác nhận đơn hàng'}
        onBack={onBack}
        rightElement={
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>{order.partnerLabel}</Text>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  <MaterialCommunityIcons name="food" size={32} color="#00B14F" />
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
                  <MaterialCommunityIcons name="clock-outline" size={13} color="#6B7280" />
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
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#00B14F" />
            <Text style={styles.addressText}>{order.address}</Text>
            {!isViewMode && (
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Chỉnh sửa địa chỉ giao hàng"
              >
                <Text style={styles.editLink}>Chỉnh sửa</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Card 4: Payment */}
        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="credit-card" size={20} color="#6B7280" />
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
            label={`Đặt ngay - ${order.total.toLocaleString()}đ`}
            onPress={onConfirm}
          />
        ) : (
          <View style={styles.actionRow}>
            <View style={styles.flex1}>
              <SecondaryButton label="Đóng" onPress={onBack} />
            </View>
            <View style={[styles.flex1, styles.ml12]}>
              <PrimaryButton
                label="Đặt lại"
                onPress={() => onConfirm()}
              />
            </View>
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
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
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
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#E8F8EF',
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
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    marginHorizontal: 6,
    color: '#D1D5DB',
  },
  openBadge: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  openBadgeText: {
    fontSize: 11,
    color: 'white',
    fontWeight: '600',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  qtyBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F8EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 13,
    color: '#00B14F',
    fontWeight: '700',
  },
  itemName: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 15,
    color: '#6B7280',
  },
  mt8: {
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#00B14F',
  },
  addressText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    marginLeft: 10,
  },
  paymentText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
    marginLeft: 10,
  },
  editLink: {
    fontSize: 13,
    color: '#00B14F',
    fontWeight: '600',
  },
  partnerBadge: {
    backgroundColor: '#00B14F',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  partnerBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
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
  actionRow: {
    flexDirection: 'row',
  },
  ml12: {
    marginLeft: 12,
  },
});
