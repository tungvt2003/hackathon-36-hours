import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { OrderType } from '../../types';
import { orderConfirmationService, MockOrder } from './orderConfirmation.service';
import { tts } from '../../services/voice/tts';
import { getSpeechRecognitionModule, STT_AVAILABLE } from '../../services/speechRecognition';
import { isYes, isNo } from '../../services/voice/voice-nlu.service';
import { DEV_FORCE_TEXT_INPUT } from '../../constants/devFlags';

const LISTEN_TIMEOUT_MS = 8000;
export const USE_VOICE_INPUT = STT_AVAILABLE && !DEV_FORCE_TEXT_INPUT;

export interface OrderConfirmationViewModel {
  order: MockOrder;
  isViewMode: boolean;
  isListening: boolean;
  useTextInput: boolean;
  textInput: string;
  setTextInput: (v: string) => void;
  submitTextInput: () => void;
  onConfirm: () => void;
  onBack: () => void;
}

export const useOrderConfirmation = (): OrderConfirmationViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'OrderConfirmation'>>();

  const { orderId = 'mock-default', mode = 'confirm' } = route.params || {};

  const order = useMemo(() => orderConfirmationService.getMockOrder(orderId), [orderId]);
  const isViewMode = mode === 'view';
  const isRide = orderId.includes('ride');

  const [isListening, setIsListening] = useState(false);
  const [textInput, setTextInput] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handledRef = useRef(false);

  const onConfirm = useCallback(() => {
    if (isRide) {
      navigation.navigate('RideTracking', {
        orderId,
        intent: {
          type: OrderType.RIDE,
          origin: '123 Lê Lợi, Quận 1',
          destination: order.restaurantName,
        },
      });
      return;
    }
    navigation.navigate('FoodTracking', {
      orderId,
      intent: {
        type: OrderType.FOOD,
        restaurant: order.restaurantName,
        items: order.items.map((i) => i.name),
      },
    });
  }, [navigation, orderId, order, isRide]);

  const onBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    try { getSpeechRecognitionModule()?.stop(); } catch { /* ignore */ }
    try { getSpeechRecognitionModule()?.abort(); } catch { /* ignore */ }
  }, []);

  const startRecognition = useCallback(async () => {
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;
    try {
      const perm = await speechModule.requestPermissionsAsync();
      if (!perm.granted) return;
      handledRef.current = false;
      setIsListening(true);
      speechModule.start({ lang: 'vi-VN', continuous: false, interimResults: false });
      timeoutRef.current = setTimeout(() => stopListening(), LISTEN_TIMEOUT_MS);
    } catch { /* ignore */ }
  }, [stopListening]);

  const handleAnswer = useCallback((transcript: string) => {
    if (isYes(transcript)) {
      tts('Đang đặt đơn cho bạn.', () => onConfirm());
    } else if (isNo(transcript)) {
      tts('Đã huỷ. Quay lại trang trước.', () => onBack());
    } else {
      handledRef.current = false;
      tts('Xin lỗi, bạn nói gì vậy? Nói Có để xác nhận hoặc Không để huỷ.', () => {
        if (USE_VOICE_INPUT) startRecognition();
      });
    }
  }, [onConfirm, onBack, startRecognition]);

  const submitTextInput = useCallback(() => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput('');
    handleAnswer(text);
  }, [textInput, handleAnswer]);

  // Mount: speak order summary then start listening
  useEffect(() => {
    if (isViewMode) return;

    const itemList = order.items.map((i) => `${i.qty} ${i.name}`).join(', ');
    const summary = isRide
      ? `Chuyến xe đến ${order.restaurantName}, giá ${order.total.toLocaleString('vi-VN')} đồng.`
      : `Đơn từ ${order.restaurantName} gồm ${itemList}. Tổng cộng ${order.total.toLocaleString('vi-VN')} đồng.`;
    const question = ' Bạn có muốn đặt không? Nói Có để xác nhận, Không để huỷ.';

    tts(summary + question, () => {
      if (USE_VOICE_INPUT) startRecognition();
    });

    return () => { stopListening(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wire STT listeners once
  useEffect(() => {
    if (isViewMode || !USE_VOICE_INPUT) return;

    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;

    const subs = [
      speechModule.addListener('result', (event: { results?: { transcript?: string }[] }) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        if (!transcript || handledRef.current) return;
        handledRef.current = true;
        stopListening();
        handleAnswer(transcript);
      }),
      speechModule.addListener('error', () => { stopListening(); }),
    ];

    return () => { subs.forEach((s) => s.remove()); };
  }, [isViewMode, stopListening, handleAnswer]);

  return {
    order,
    isViewMode,
    isListening,
    useTextInput: DEV_FORCE_TEXT_INPUT || !STT_AVAILABLE,
    textInput,
    setTextInput,
    submitTextInput,
    onConfirm,
    onBack,
  };
};
