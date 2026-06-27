import { useEffect, useState, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
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
}

export const useDashboard = (): DashboardViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [userName] = useState('John Doe'); // Mock user
  const [micState, setMicState] = useState<'idle' | 'listening' | 'disabled'>('idle');
  const [actions] = useState<DashboardAction[]>(dashboardService.getQuickActions());

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Dashboard loaded. Welcome back, John Doe. You can speak to order food or book a ride.');
  }, []);

  const onMicPress = useCallback(() => {
    setMicState('listening');
    // In a real app, this would trigger voice recognition
    // For now, let's navigate to VoiceAssistant after 1s
    setTimeout(() => {
      setMicState('idle');
      navigation.navigate('VoiceAssistant', { initialPromptHint: 'How can I help you today?' });
    }, 1500);
  }, [navigation]);

  const onActionPress = useCallback((action: DashboardAction) => {
    // Correctly typed navigation
    navigation.navigate(action.route as any);
  }, [navigation]);

  return {
    userName,
    actions,
    micState,
    onMicPress,
    onActionPress,
  };
};
