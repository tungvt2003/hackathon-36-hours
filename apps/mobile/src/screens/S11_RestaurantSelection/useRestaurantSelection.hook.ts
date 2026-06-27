import { useEffect, useCallback, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { restaurantSelectionService, MockRestaurant } from './restaurantSelection.service';
import { PartnerCode, Intent } from '../../types';

export interface RestaurantSelectionViewModel {
  restaurants: MockRestaurant[];
  intent: Intent;
  onSelect: (r: MockRestaurant) => void;
  onBack: () => void;
}

export const useRestaurantSelection = (): RestaurantSelectionViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'RestaurantSelection'>>();
  
  const intent = route.params?.intent || { type: 'FOOD' as any };

  const restaurants = useMemo(() => restaurantSelectionService.getMockRestaurants(), []);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${restaurants.length} restaurants found for your search.`);
  }, [restaurants.length]);

  const onSelect = useCallback((r: MockRestaurant) => {
    navigation.navigate('OrderConfirmation', { 
      orderId: 'mock-' + r.id, 
      partner: PartnerCode.GRAB, 
      mode: 'confirm' 
    });
  }, [navigation]);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    restaurants,
    intent,
    onSelect,
    onBack,
  };
};
