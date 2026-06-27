import { useEffect, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { PartnerCode } from '../../types';

export interface VoiceSpeakingViewModel {
  userText: string;
  aiText: string;
  onConfirm: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export const useVoiceSpeaking = (): VoiceSpeakingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceSpeaking'>>();
  const { userText, aiText } = route.params;

  const onConfirm = useCallback(() => {
    navigation.navigate('OrderConfirmation', { 
      orderId: 'mock-food-001', 
      partner: PartnerCode.GRAB, 
      mode: 'confirm' 
    });
  }, [navigation]);

  const onCancel = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  const onDismiss = useCallback(() => {
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(aiText);
  }, [aiText]);

  return {
    userText,
    aiText,
    onConfirm,
    onCancel,
    onDismiss,
  };
};
