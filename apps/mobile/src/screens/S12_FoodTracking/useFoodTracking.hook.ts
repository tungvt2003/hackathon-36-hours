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
    let cancelled = false;

    const advance = (status: TrackingStatus) => {
      if (cancelled) return;
      const text = STATUS_ANNOUNCEMENTS[status];
      setCurrentStatus(status);
      setAnnouncement(text);

      const idx = TRACKING_STEPS.findIndex(s => s.id === status);
      const isLast = idx >= TRACKING_STEPS.length - 1;

      tts(text, () => {
        if (cancelled) return;
        if (isLast) {
          setTimeout(() => {
            if (!cancelled) navigation.navigate('DeliverySuccess', { orderId });
          }, 600);
        } else {
          setTimeout(() => {
            if (!cancelled) advance(TRACKING_STEPS[idx + 1].id);
          }, 800);
        }
      });
    };

    advance('received');
    return () => { cancelled = true; };
  }, [navigation, orderId]);

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
