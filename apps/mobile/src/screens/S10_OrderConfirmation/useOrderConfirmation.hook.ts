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
      ? `Ride to ${order.restaurantName}, fare ${order.total} dong. Confirm to book the ride.`
      : `Order from ${order.restaurantName}, total ${order.total} dong. Confirm to place order.`;
    AccessibilityInfo.announceForAccessibility(summary);
  }, [order, isRide]);

  const onConfirm = useCallback(() => {
    if (isRide) {
      navigation.navigate('RideTracking', {
        orderId,
        intent: {
          type: OrderType.RIDE,
          origin: '123 Le Loi, District 1',
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
