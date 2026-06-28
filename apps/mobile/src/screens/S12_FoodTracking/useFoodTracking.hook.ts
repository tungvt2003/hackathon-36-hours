import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { tts } from '../../services/voice/tts';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { 
  TRACKING_STEPS, 
  STATUS_ANNOUNCEMENTS, 
  TrackingStatus, 
  TrackingStep 
} from './foodTracking.service';

export interface FoodTrackingViewModel {
  currentStatus: TrackingStatus;
  stepIndex: number;
  steps: TrackingStep[];
  orderId: string;
  intent: any;
  canCancel: boolean;
  onCancel: () => void;
  onBack: () => void;
  announcement: string | null;
}

export const useFoodTracking = (): FoodTrackingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'FoodTracking'>>();
  const { orderId, intent } = route.params;

  const [currentStatus, setCurrentStatus] = useState<TrackingStatus>('received');
  const [announcement, setAnnouncement] = useState<string | null>(null);
  
  const stepIndex = TRACKING_STEPS.findIndex(s => s.id === currentStatus);
  const canCancel = stepIndex < 2;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStatus(prev => {
        const idx = TRACKING_STEPS.findIndex(s => s.id === prev);
        if (idx < TRACKING_STEPS.length - 1) {
          const nextStatus = TRACKING_STEPS[idx + 1].id;
          return nextStatus;
        }
        clearInterval(timer);
        return prev;
      });
    }, 3500); // 3.5s to show UI transitions better

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const text = STATUS_ANNOUNCEMENTS[currentStatus];
    setAnnouncement(text);
    tts(text);

    if (currentStatus === 'delivered') {
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
    steps: TRACKING_STEPS,
    orderId,
    intent,
    canCancel,
    onCancel,
    onBack,
    announcement,
  };
};
