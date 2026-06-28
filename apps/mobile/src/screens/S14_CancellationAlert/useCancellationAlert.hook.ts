import { useEffect, useCallback } from 'react';
import { tts } from '../../services/voice/tts';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { getCancellationInfo, CancellationInfo } from './cancellationAlert.service';
import { soundService } from '../../services/sound.service';

interface ViewModel {
  info: CancellationInfo;
  isFood: boolean;
  onFindAnother: () => void;
  onGoHome: () => void;
}

export const useCancellationAlert = (): ViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CancellationAlert'>>();
  const { orderId, intent } = route.params;
  const isFood = intent?.type === 'FOOD';
  const info = getCancellationInfo(isFood);

  useEffect(() => {
    soundService.playError();
    tts(info.announcement);
  }, []);

  const onFindAnother = useCallback(() => {
    if (isFood) {
      navigation.navigate('RestaurantSelection', { intent });
    } else {
      // Ride re-booking out of scope — go home
      navigation.navigate('Dashboard');
    }
  }, [isFood, navigation, intent]);

  const onGoHome = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  return { info, isFood, onFindAnother, onGoHome };
};
