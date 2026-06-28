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
  onMicPress: () => void;
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
      speechModule.start({ lang: 'vi-VN', continuous: false, interimResults: true });
      timeoutRef.current = setTimeout(() => stopListening(), LISTEN_TIMEOUT_MS);
    } catch { /* ignore */ }
  }, [stopListening]);

  const isConfirmText = useCallback((transcript: string) => {
    const text = transcript
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[.!?,;:]+$/g, '')
      .trim();
    return (
      isYes(transcript) ||
      text.includes('xac nhan') ||
      text.includes('dat don') ||
      text.includes('dat hang') ||
      text.includes('dat di') ||
      text.includes('dat luon') ||
      text === 'co' ||
      text.startsWith('co ') ||
      /\bco\b/.test(text)
    );
  }, []);

  const handleAnswer = useCallback((transcript: string) => {
    if (isConfirmText(transcript)) {
      tts('Đang đặt đơn cho bạn.');
      setTimeout(() => onConfirm(), 350);
    } else if (isNo(transcript)) {
      tts('Đã huỷ. Quay lại trang trước.');
      setTimeout(() => onBack(), 350);
    } else {
      handledRef.current = false;
      tts('Xin lỗi, bạn nói gì vậy? Nói Có để xác nhận hoặc Không để huỷ.', () => {
        if (USE_VOICE_INPUT) startRecognition();
      });
    }
  }, [isConfirmText, onConfirm, onBack, startRecognition]);

  const submitTextInput = useCallback(() => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput('');
    handleAnswer(text);
  }, [textInput, handleAnswer]);

  const onMicPress = useCallback(() => {
    if (isViewMode) return;
    if (!USE_VOICE_INPUT) {
      submitTextInput();
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    startRecognition();
  }, [isViewMode, isListening, stopListening, startRecognition, submitTextInput]);

  // Mount: speak short summary, then start listening immediately after brief cue
  useEffect(() => {
    if (isViewMode) return;

    const itemList = order.items.map((i) => `${i.qty} ${i.name}`).join(', ');
    const summary = isRide
      ? `Xe từ vị trí của bạn đến điểm đến. Tổng ${order.total.toLocaleString('vi-VN')} đồng. Nói Có để đặt, Không để huỷ.`
      : `Đơn ${order.restaurantName}: ${itemList}. Tổng ${order.total.toLocaleString('vi-VN')} đồng. Nói Có để đặt, Không để huỷ.`;

    tts(summary, () => {
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
      speechModule.addListener('result', (event: { results?: { transcript?: string }[]; isFinal?: boolean }) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        if (!transcript || handledRef.current) return;
        // act on final result or any result matching confirmation
        if (event.isFinal || isConfirmText(transcript) || isNo(transcript)) {
          handledRef.current = true;
          stopListening();
          handleAnswer(transcript);
        }
      }),
      speechModule.addListener('end', () => {
        // STT ended without a handled result — restart if still on screen
        if (!handledRef.current) {
          setIsListening(false);
          if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        }
      }),
      speechModule.addListener('error', () => { stopListening(); }),
    ];

    return () => { subs.forEach((s) => s.remove()); };
  }, [isViewMode, stopListening, handleAnswer, isConfirmText]);

  return {
    order,
    isViewMode,
    isListening,
    useTextInput: DEV_FORCE_TEXT_INPUT || !STT_AVAILABLE,
    textInput,
    setTextInput,
    submitTextInput,
    onMicPress,
    onConfirm,
    onBack,
  };
};
