import { useEffect, useCallback, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../api';
import { getCurrentLocation } from '../../services/location';
import { tts } from '../../services/voice/tts';
import { PartnerCode } from '../../types';

const RIDE_LOADING_MESSAGE = "You want to go to Ben Thanh Market, I'm finding a ride for you now...";

export interface VoiceProcessingViewModel {
  userText: string;
  onDismiss: () => void;
}

export const useVoiceProcessing = (): VoiceProcessingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceProcessing'>>();
  const { audioBase64, userText: initialUserText, context } = route.params;
  const cancelledRef = useRef(false);
  const [userText, setUserText] = useState(initialUserText ?? 'Đang xử lý...');

  const onDismiss = useCallback(() => {
    cancelledRef.current = true;
    navigation.navigate('Dashboard');
  }, [navigation]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Đang xử lý yêu cầu của bạn.');

    (async () => {
      try {
        if (context === 'ride' && initialUserText?.trim()) {
          tts(RIDE_LOADING_MESSAGE);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (cancelledRef.current) return;
          navigation.navigate('OrderConfirmation', {
            orderId: 'mock-ride-place-ben-thanh',
            partner: PartnerCode.GRAB,
            mode: 'confirm',
          });
          return;
        }

        // Lấy vị trí thực tế của người dùng
        const loc = await getCurrentLocation();

        // Gửi audio base64 trực tiếp lên VoiceController của NestJS kèm tọa độ thực tế
        const res = await api.voice.turn({
          transcript: initialUserText,
          audio_base64: audioBase64,
          sample_rate: 16000, // Google STT / VNPT tiêu chuẩn
          currentLat: loc.lat,
          currentLng: loc.lng,
        });

        if (cancelledRef.current) return;

        const firstQuote = res.quotes?.[0] ?? res.foodQuotes?.[0];

        if (cancelledRef.current) return;

        let finalAiText = res.promptText;

        navigation.navigate('VoiceSpeaking', {
          userText,
          aiText: finalAiText,
          context,
          sessionId: res.sessionId,
          quotePartner: firstQuote?.partner || 'GRAB',
          canConfirmOrder: true,
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
