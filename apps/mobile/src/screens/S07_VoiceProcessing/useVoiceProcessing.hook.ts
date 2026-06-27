import { useEffect, useCallback, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../api';

export interface VoiceProcessingViewModel {
  userText: string;
  onDismiss: () => void;
}

export const useVoiceProcessing = (): VoiceProcessingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceProcessing'>>();
  const { userText, context } = route.params;
  const cancelledRef = useRef(false);

  const onDismiss = useCallback(() => {
    cancelledRef.current = true;
    navigation.navigate('Dashboard');
  }, [navigation]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Processing your request.');

    (async () => {
      try {
        const session = await api.conversation.start();
        const res = await api.conversation.input(session.sessionId, userText);
        if (cancelledRef.current) return;

        const firstQuote = res.quotes?.[0] ?? res.foodQuotes?.[0];

        navigation.navigate('VoiceSpeaking', {
          userText,
          aiText: res.promptText,
          context,
          sessionId: res.sessionId,
          quotePartner: firstQuote?.partner,
          canConfirmOrder: res.state === 'ORDERING' && !!firstQuote,
        });
      } catch (err) {
        if (cancelledRef.current) return;
        navigation.navigate('VoiceError');
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    userText,
    onDismiss,
  };
};
