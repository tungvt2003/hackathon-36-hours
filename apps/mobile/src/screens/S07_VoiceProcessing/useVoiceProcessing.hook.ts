import { useEffect, useCallback, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { api } from '../../api';
import { getCurrentLocation } from '../../services/location';

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
