import { useEffect, useCallback, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { OrderType } from '../../types';
import { orderConfirmationService, MockOrder } from './orderConfirmation.service';

export interface OrderConfirmationViewModel {
  order: MockOrder;
  isViewMode: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

export const useOrderConfirmation = (): OrderConfirmationViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>();
  
  const { orderId = 'mock-default', mode = 'confirm' } = route.params || {};

  const order = useMemo(() => orderConfirmationService.getMockOrder(orderId), [orderId]);
  const isViewMode = mode === 'view';

  const isRide = orderId.includes('ride');

  useEffect(() => {
    const summary = isRide
      ? `Chuyến đi đến ${order.restaurantName}, giá ${order.total} đồng. Hãy xác nhận để đặt xe.`
      : `Đơn hàng từ ${order.restaurantName}, tổng cộng ${order.total} đồng. Hãy xác nhận để đặt món.`;
    AccessibilityInfo.announceForAccessibility(summary);
  }, [order, isRide]);

  const onConfirm = useCallback(() => {
    if (isRide) {
      navigation.navigate('RideTracking', {
        orderId,
        intent: {
          type: OrderType.RIDE,
          origin: '123 Lê Lợi, Quận 1',
          destination: order.restaurantName,
        },
      });
      return;
    }
    navigation.navigate('FoodTracking', {
      orderId,
      intent: {
        type: OrderType.FOOD,
        restaurant: order.restaurantName,
        items: order.items.map((i) => i.name),
      },
    });
  }, [navigation, orderId, order, isRide]);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    order,
    isViewMode,
    onConfirm,
    onBack,
  };
};
