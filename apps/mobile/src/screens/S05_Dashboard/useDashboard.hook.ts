import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { dashboardService, DashboardAction } from './dashboard.service';

export interface DashboardViewModel {
  userName: string;
  actions: DashboardAction[];
  micState: 'idle' | 'listening' | 'disabled';
  onMicPress: () => void;
  onActionPress: (action: DashboardAction) => void;
  onTabPress: (tab: 'home' | 'history' | 'account') => void;
}

export const useDashboard = (): DashboardViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [micState, setMicState] = useState<'idle' | 'listening' | 'disabled'>('idle');

  const actions = dashboardService.getActions();
  const userName = "John Doe"; // To be fetched from store in production

  const onMicPress = useCallback(() => {
    setMicState('listening');
    setTimeout(() => {
      setMicState('idle');
      navigation.navigate('VoiceAssistant', {});
    }, 1500);
  }, [navigation]);

  const onActionPress = useCallback((action: DashboardAction) => {
    navigation.navigate(action.route as any);
  }, [navigation]);

  const onTabPress = useCallback((tab: 'home' | 'history' | 'account') => {
    if (tab === 'history') navigation.navigate('OrderHistory');
    if (tab === 'account') navigation.navigate('ProfileSetup');
  }, [navigation]);

  return {
    userName,
    actions,
    micState,
    onMicPress,
    onActionPress,
    onTabPress,
  };
};
