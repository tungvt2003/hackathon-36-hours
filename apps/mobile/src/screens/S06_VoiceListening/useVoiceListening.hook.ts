import { useEffect, useState, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

export interface VoiceListeningViewModel {
  phase: 'listening' | 'done';
  onDismiss: () => void;
  onMicPress: () => void;
  initialPromptHint?: string;
}

export const useVoiceListening = (): VoiceListeningViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceAssistant'>>();
  const { initialPromptHint } = route.params || {};

  const [phase, setPhase] = useState<'listening' | 'done'>('listening');

  const onDismiss = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onMicPress = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Listening. Speak now.');

    const timer = setTimeout(() => {
      setPhase('done');
      navigation.navigate('VoiceProcessing', { 
        userText: 'Đặt phở bò từ Phở Hà Nội' 
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return {
    phase,
    onDismiss,
    onMicPress,
    initialPromptHint,
  };
};
