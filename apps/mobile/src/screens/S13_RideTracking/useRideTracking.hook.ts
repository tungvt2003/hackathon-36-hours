import { useEffect, useState, useCallback, useMemo } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { 
  RIDE_STEPS, 
  RIDE_STATUS_ANNOUNCEMENTS, 
  MOCK_DRIVER, 
  RideStatus, 
  RideStep 
} from './rideTracking.service';

export interface RideTrackingViewModel {
  currentStatus: RideStatus;
  stepIndex: number;
  steps: RideStep[];
  driver: typeof MOCK_DRIVER;
  orderId: string;
  intent: any;
  canCancel: boolean;
  onCancel: () => void;
  onBack: () => void;
  announcement: string | null;
}

export const useRideTracking = (): RideTrackingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'RideTracking'>>();
  const { orderId, intent } = route.params;

  const [currentStatus, setCurrentStatus] = useState<RideStatus>('finding');
  const [announcement, setAnnouncement] = useState<string | null>(null);
  
  const stepIndex = RIDE_STEPS.findIndex(s => s.id === currentStatus);
  const canCancel = currentStatus === 'finding' || currentStatus === 'en_route';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStatus(prev => {
        const idx = RIDE_STEPS.findIndex(s => s.id === prev);
        if (idx < RIDE_STEPS.length - 1) {
          return RIDE_STEPS[idx + 1].id;
        }
        clearInterval(timer);
        return prev;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const text = RIDE_STATUS_ANNOUNCEMENTS[currentStatus];
    setAnnouncement(text);
    AccessibilityInfo.announceForAccessibility(text);

    if (currentStatus === 'completed') {
      const timeout = setTimeout(() => {
        navigation.navigate('DeliverySuccess', { orderId });
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [currentStatus, navigation, orderId]);

  const onCancel = useCallback(() => {
    if (canCancel) {
      navigation.navigate('CancellationAlert', { orderId, intent });
    }
  }, [canCancel, navigation, orderId, intent]);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    currentStatus,
    stepIndex,
    steps: RIDE_STEPS,
    driver: MOCK_DRIVER,
    orderId,
    intent,
    canCancel,
    onCancel,
    onBack,
    announcement,
  };
};
