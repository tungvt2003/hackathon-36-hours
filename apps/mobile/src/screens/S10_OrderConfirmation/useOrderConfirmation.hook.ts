import { useEffect, useCallback, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
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

  useEffect(() => {
    const summary = `Order from ${order.restaurantName}, total ${order.total}đ. ${
      isViewMode ? 'View only' : 'Confirm to place order'
    }`;
    AccessibilityInfo.announceForAccessibility(summary);
  }, [order, isViewMode]);

  const onConfirm = useCallback(() => {
    navigation.navigate('FoodTracking', { 
      orderId, 
      intent: { 
        type: 'FOOD' as any, 
        restaurant: order.restaurantName, 
        items: ['Phở Bò Tái'] 
      } 
    });
  }, [navigation, orderId, order.restaurantName]);

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
