import { useEffect, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

export interface VoiceProcessingViewModel {
  userText: string;
  onDismiss: () => void;
}

export const useVoiceProcessing = (): VoiceProcessingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceProcessing'>>();
  const { userText } = route.params;

  const onDismiss = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Processing your request.');

    const timer = setTimeout(() => {
      navigation.navigate('VoiceSpeaking', { 
        userText, 
        aiText: 'Tôi tìm thấy Phở Hà Nội. Phở Bò Tái 65.000đ, giao 25 phút. Xác nhận không?' 
      });
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation, userText]);

  return {
    userText,
    onDismiss,
  };
};
