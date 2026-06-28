import { useEffect, useState, useCallback, useRef } from 'react';
import { Animated, BackHandler } from 'react-native';
import { tts } from '../../services/voice/tts';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { getSuccessContent, SuccessContent } from './deliverySuccess.service';
import { soundService } from '../../services/sound.service';
import { getSpeechRecognitionModule, STT_AVAILABLE } from '../../services/speechRecognition';
import { isYes, isNo } from '../../services/voice/voice-nlu.service';
import { DEV_FORCE_TEXT_INPUT } from '../../constants/devFlags';

const USE_VOICE = STT_AVAILABLE && !DEV_FORCE_TEXT_INPUT;

interface ViewModel {
  content: SuccessContent;
  circleScale: Animated.Value;
  confettiAnims: { x: Animated.Value; y: Animated.Value; opacity: Animated.Value }[];
  isListening: boolean;
  onRateNow: () => void;
  onOrderAgain: () => void;
  onDone: () => void;
}

export const useDeliverySuccess = (): ViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DeliverySuccess'>>();
  const { orderId } = route.params;
  const content = getSuccessContent(orderId);
  const [isListening, setIsListening] = useState(false);
  const handledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const circleScale = useRef(new Animated.Value(0)).current;
  const confettiAnims = useRef(
    Array.from({ length: 8 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    try { getSpeechRecognitionModule()?.stop(); } catch { /* ignore */ }
  }, []);

  const onOrderAgain = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  const onDone = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  const onRateNow = useCallback(() => {
    navigation.navigate('RatingScreen', { orderId });
  }, [navigation, orderId]);

  const startListening = useCallback(() => {
    if (!USE_VOICE) return;
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;
    try {
      handledRef.current = false;
      setIsListening(true);
      speechModule.start({ lang: 'vi-VN', continuous: false, interimResults: false });
      timeoutRef.current = setTimeout(() => stopListening(), 8000);
    } catch { stopListening(); }
  }, [stopListening]);

  // STT listeners
  useEffect(() => {
    if (!USE_VOICE) return;
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;

    const subs = [
      speechModule.addListener('result', (event: { results?: { transcript?: string }[] }) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        if (!transcript || handledRef.current) return;
        handledRef.current = true;
        stopListening();
        if (isYes(transcript)) {
          navigation.navigate('Dashboard');
        } else if (isNo(transcript)) {
          BackHandler.exitApp();
        } else {
          // unrecognized — restart
          tts('Nói Có để tiếp tục sử dụng, hoặc Không để thoát.', startListening);
        }
      }),
      speechModule.addListener('end', () => {
        if (!handledRef.current) stopListening();
      }),
      speechModule.addListener('error', () => stopListening()),
    ];

    return () => {
      subs.forEach(s => s.remove());
      stopListening();
    };
  }, [navigation, stopListening, startListening]);

  // Mount: animations + TTS + start STT
  useEffect(() => {
    soundService.playSuccess();

    const circleTimer = setTimeout(() => {
      Animated.spring(circleScale, {
        toValue: 1, tension: 40, friction: 6, useNativeDriver: true,
      }).start();
    }, 80);

    const confettiTimer = setTimeout(() => {
      const angles = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
      const radius = 90;
      Animated.parallel(
        confettiAnims.map((anim, i) => {
          const angle = (angles[i] * Math.PI) / 180;
          return Animated.parallel([
            Animated.timing(anim.x, { toValue: Math.cos(angle) * radius, duration: 550, useNativeDriver: true }),
            Animated.timing(anim.y, { toValue: Math.sin(angle) * radius, duration: 550, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(anim.opacity, { toValue: 1, duration: 50, useNativeDriver: true }),
              Animated.delay(300),
              Animated.timing(anim.opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
            ]),
          ]);
        })
      ).start();
    }, 180);

    const voicePrompt = `${content.announcement} Bạn có muốn sử dụng dịch vụ khác không? Nói Có để về trang chủ, Không để thoát.`;

    // Pre-request mic permission while animations play so STT starts instantly after TTS
    if (USE_VOICE) {
      getSpeechRecognitionModule()?.requestPermissionsAsync().catch(() => {/* ignore */});
    }

    const announcementTimer = setTimeout(() => {
      tts(voicePrompt, () => startListening());
    }, 600);

    return () => {
      clearTimeout(circleTimer);
      clearTimeout(confettiTimer);
      clearTimeout(announcementTimer);
    };
  }, []);

  return { content, circleScale, confettiAnims, isListening, onRateNow, onOrderAgain, onDone };
};
