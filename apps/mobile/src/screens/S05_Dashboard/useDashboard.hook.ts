import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { BottomNavTab } from '../../components/BottomNavBar';
import { getSpeechRecognitionModule, STT_AVAILABLE } from '../../services/speechRecognition';
import { DEV_FORCE_TEXT_INPUT } from '../../constants/devFlags';
import { PartnerCode, OrderType } from '../../types';
import { PLATFORM_SELECT_GREETING } from './dashboard.service';
import {
  parseVoiceInput,
  isYes,
  isNo,
  VoiceNluContext,
} from '../../services/voice/voice-nlu.service';
import { voiceNlg } from '../../services/voice/voice-nlg.service';
import { tts } from '../../services/voice/tts';

// simulator k voice được -> ép hiện modal nhập text thay vì tự mở mic
const TEXT_INPUT_MODE = DEV_FORCE_TEXT_INPUT || !STT_AVAILABLE;
const SCRIPT_PHO_PRICE = 65000;
const SCRIPT_DELIVERY_FEE = 15000;
const SCRIPT_VOUCHER_DISCOUNT = 10000;

type ScriptPhoStep = 'none' | 'offer' | 'quantity' | 'payment' | 'confirm';
type ScriptPaymentMethod = 'thẻ ngân hàng' | 'tiền mặt';

function normalizeVoice(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[.!?,;:]+$/g, '')
    .trim();
}

function normalizeScriptText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.!?,;:]+$/g, '')
    .trim();
}

function wantsScriptPhoOrder(text: string): boolean {
  const raw = normalizeScriptText(text);
  return raw === 'phở bò từ phở hà nội' || raw === 'beef pho from pho hanoi';
}

function isScriptPhoOrderSlot(slots: Record<string, string | number>): boolean {
  return slots.restaurantName === 'Phở Hà Nội' && slots.dishName === 'Phở Bò Tái';
}

function parseScriptQuantity(text: string): number | null {
  const n = normalizeVoice(text);
  const digit = n.match(/\b([1-9])\b/);
  if (digit) return Number(digit[1]);
  if (/\b(mot|một)\b/.test(n)) return 1;
  if (/\b(hai)\b/.test(n)) return 2;
  if (/\b(ba)\b/.test(n)) return 3;
  return null;
}

function parseScriptPaymentMethod(text: string): ScriptPaymentMethod | null {
  const n = normalizeVoice(text);
  if (
    n.includes('the ngan hang') ||
    n.includes('ngan hang') ||
    n.includes('thanh toan ngan hang') ||
    n.includes('chuyen khoan') ||
    n.includes('the') ||
    n.includes('card') ||
    n.includes('bank')
  ) {
    return 'thẻ ngân hàng';
  }
  if (n.includes('tien mat') || n.includes('cash')) {
    return 'tiền mặt';
  }
  return null;
}

function isScriptConfirm(text: string): boolean {
  const n = normalizeVoice(text);
  return isYes(text) || n.includes('xac nhan') || n.includes('confirm');
}

function scriptPhoTotals(quantity: number) {
  const subtotal = SCRIPT_PHO_PRICE * quantity;
  const totalBeforeVoucher = subtotal + SCRIPT_DELIVERY_FEE;
  const total = Math.max(0, totalBeforeVoucher - SCRIPT_VOUCHER_DISCOUNT);
  return { subtotal, totalBeforeVoucher, total };
}

function scriptPhoVoucherText(quantity: number): string {
  const { subtotal, totalBeforeVoucher, total } = scriptPhoTotals(quantity);
  return `Tiền món là ${subtotal.toLocaleString('vi-VN')} đồng, phí giao hàng ${SCRIPT_DELIVERY_FEE.toLocaleString('vi-VN')} đồng, tổng trước voucher là ${totalBeforeVoucher.toLocaleString('vi-VN')} đồng. Tôi đã giúp bạn áp voucher giảm ${SCRIPT_VOUCHER_DISCOUNT.toLocaleString('vi-VN')} đồng, nên tổng còn ${total.toLocaleString('vi-VN')} đồng. Bạn muốn thanh toán bằng thẻ ngân hàng hay tiền mặt?`;
}

function scriptPhoOfferText(): string {
  return 'Quán Phở Hà Nội hiện chỉ còn Phở Bò Tái. Mỗi phần giá 65 nghìn đồng, chưa bao gồm phí giao hàng. Bạn có muốn ăn món này không?';
}

function scriptPhoConfirmText(quantity: number, paymentMethod: ScriptPaymentMethod): string {
  const { subtotal, total } = scriptPhoTotals(quantity);
  return `Đây là đơn hàng của bạn từ Phở Hà Nội: Phở Bò Tái, số lượng ${quantity}, ${subtotal.toLocaleString('vi-VN')} đồng. Phí giao hàng: ${SCRIPT_DELIVERY_FEE.toLocaleString('vi-VN')} đồng. Voucher giảm ${SCRIPT_VOUCHER_DISCOUNT.toLocaleString('vi-VN')} đồng. Tổng cộng còn ${total.toLocaleString('vi-VN')} đồng. Phương thức thanh toán là ${paymentMethod}. Hãy nói xác nhận để đặt đơn, hoặc hủy để quay lại.`;
}

export type DashboardStage = 'idle' | 'listening' | 'thinking';

export interface DashboardViewModel {
  userName: string;
  aiText: string;
  userText: string;
  stage: DashboardStage;
  sttAvailable: boolean;
  manualInput: string;
  setManualInput: (v: string) => void;
  submitManualInput: () => void;
  onMicPress: () => void;
  onTabPress: (tab: BottomNavTab) => void;
  onHistoryPress: () => void;
}

export const useDashboard = (): DashboardViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const userName = 'Minh';

  const [platform, setPlatform] = useState<PartnerCode | null>(null);
  const [aiText, setAiText] = useState(PLATFORM_SELECT_GREETING);
  const [userText, setUserText] = useState('');
  const [stage, setStage] = useState<DashboardStage>('idle');
  const [manualInput, setManualInput] = useState('');

  const platformRef = useRef<PartnerCode | null>(null);
  const voiceContextRef = useRef<VoiceNluContext>('platform_select');
  const awaitingGrabRef = useRef(false);
  const awaitingFoodRef = useRef(false);
  const scriptPhoStepRef = useRef<ScriptPhoStep>('none');
  const scriptPhoQuantityRef = useRef(1);
  const scriptPhoPaymentRef = useRef<ScriptPaymentMethod>('tiền mặt');
  const pendingFoodRef = useRef<{ restaurantId: string } | null>(null);
  const beginListeningRef = useRef<() => void>(() => { });
  const lastSpokenTextRef = useRef('');
  useEffect(() => { platformRef.current = platform; }, [platform]);

  useEffect(() => {
    if (lastSpokenTextRef.current === aiText) {
      return;
    }
    lastSpokenTextRef.current = aiText;

    tts(aiText, () => {
      if (!TEXT_INPUT_MODE) {
        beginListeningRef.current();
      }
    });
    if (TEXT_INPUT_MODE) {
      beginListeningRef.current();
    }
    return () => { Speech.stop(); };
  }, [aiText]);

  const processTranscript = useCallback(async (transcript: string) => {
    setUserText(transcript);
    setStage('thinking');

    if (scriptPhoStepRef.current !== 'none') {
      if (isNo(transcript)) {
        scriptPhoStepRef.current = 'none';
        voiceContextRef.current = 'food';
        setAiText(voiceNlg.serviceFoodSelected());
        setStage('idle');
        return;
      }

      if (scriptPhoStepRef.current === 'offer') {
        if (!isYes(transcript)) {
          setAiText(scriptPhoOfferText());
          setStage('idle');
          return;
        }

        scriptPhoStepRef.current = 'quantity';
        setAiText('Bạn muốn đặt bao nhiêu phần Phở Bò Tái?');
        setStage('idle');
        return;
      }

      if (scriptPhoStepRef.current === 'quantity') {
        const quantity = parseScriptQuantity(transcript);
        if (!quantity) {
          setAiText('Tôi chưa nghe rõ số lượng. Bạn muốn đặt bao nhiêu phần Phở Bò Tái?');
          setStage('idle');
          return;
        }

        scriptPhoQuantityRef.current = quantity;
        scriptPhoStepRef.current = 'payment';
        setAiText(scriptPhoVoucherText(quantity));
        setStage('idle');
        return;
      }

      if (scriptPhoStepRef.current === 'payment') {
        const paymentMethod = parseScriptPaymentMethod(transcript);
        if (!paymentMethod) {
          setAiText('Bạn muốn thanh toán bằng thẻ ngân hàng hay tiền mặt?');
          setStage('idle');
          return;
        }

        scriptPhoPaymentRef.current = paymentMethod;
        scriptPhoStepRef.current = 'confirm';
        setAiText(scriptPhoConfirmText(scriptPhoQuantityRef.current, paymentMethod));
        setStage('idle');
        return;
      }

      const repeatedPaymentMethod = parseScriptPaymentMethod(transcript);
      if (repeatedPaymentMethod) {
        scriptPhoPaymentRef.current = repeatedPaymentMethod;
        setAiText(`Bạn đã chọn thanh toán bằng ${repeatedPaymentMethod}. Hãy nói xác nhận để đặt đơn, hoặc hủy để quay lại.`);
        setStage('idle');
        return;
      }

      if (!isScriptConfirm(transcript)) {
        setAiText('Tôi chưa đặt đơn. Hãy nói xác nhận để đặt đơn, hoặc hủy để quay lại.');
        setStage('idle');
        return;
      }

      scriptPhoStepRef.current = 'none';
      voiceContextRef.current = 'home';
      setAiText('Nhà hàng đã nhận đơn của bạn. Tôi cũng đã báo với nhà hàng và tài xế rằng bạn là người khiếm thị, nên họ sẽ mang đơn đến tận cửa và gọi bạn khi đến nơi.');
      setStage('idle');
      setTimeout(() => {
        navigation.navigate('FoodTracking', {
          orderId: `suara-pho-${Date.now()}`,
          intent: {
            type: OrderType.FOOD,
            restaurant: 'Phở Hà Nội',
            items: ['Phở Bò Tái'],
          },
        });
      }, 5500);
      return;
    }

    if (awaitingFoodRef.current && pendingFoodRef.current) {
      if (isYes(transcript)) {
        const pending = pendingFoodRef.current;
        pendingFoodRef.current = null;
        awaitingFoodRef.current = false;
        navigation.navigate('OrderConfirmation', {
          orderId: `mock-${pending.restaurantId}`,
          partner: PartnerCode.GRAB,
          mode: 'confirm',
        });
        setStage('idle');
        return;
      }
      if (isNo(transcript)) {
        pendingFoodRef.current = null;
        awaitingFoodRef.current = false;
        voiceContextRef.current = 'food';
        setAiText(voiceNlg.foodDeclined());
        setStage('idle');
        return;
      }
    }

    if (awaitingGrabRef.current) {
      if (isYes(transcript)) {
        awaitingGrabRef.current = false;
        setPlatform(PartnerCode.GRAB);
        platformRef.current = PartnerCode.GRAB;
        voiceContextRef.current = 'home';
        setAiText(voiceNlg.platformGrabConfirmedAfterFallback());
        setStage('idle');
        return;
      }
      if (isNo(transcript)) {
        awaitingGrabRef.current = false;
        voiceContextRef.current = 'platform_select';
        setAiText(voiceNlg.platformRetryPrompt());
        setStage('idle');
        return;
      }
    }

    const ctx = voiceContextRef.current;

    if (ctx === 'food' && wantsScriptPhoOrder(transcript)) {
      scriptPhoStepRef.current = 'offer';
      setAiText(scriptPhoOfferText());
      setStage('idle');
      return;
    }

    const nlu = parseVoiceInput(transcript, ctx);
    const aiResponse = voiceNlg.fromNlu(ctx, nlu, 0);

    if (nlu.intent === 'PLATFORM_UNSUPPORTED') {
      awaitingGrabRef.current = true;
      setAiText(aiResponse);
      setStage('idle');
      return;
    }

    if (nlu.intent === 'SELECT_PLATFORM') {
      setPlatform(PartnerCode.GRAB);
      platformRef.current = PartnerCode.GRAB;
      voiceContextRef.current = 'home';
      setAiText(aiResponse);
      setStage('idle');
      return;
    }

    if (nlu.intent === 'SELECT_SERVICE_FOOD') {
      voiceContextRef.current = 'food';
      setAiText(aiResponse);
      setStage('idle');
      return;
    }

    if (nlu.intent === 'SELECT_SERVICE_RIDE') {
      voiceContextRef.current = 'ride';
      setAiText(aiResponse);
      setStage('idle');
      return;
    }

    if (nlu.intent === 'SELECT_FOOD_DISH') {
      if (isScriptPhoOrderSlot(nlu.slots)) {
        pendingFoodRef.current = null;
        awaitingFoodRef.current = false;
        scriptPhoStepRef.current = 'offer';
        setAiText(scriptPhoOfferText());
        setStage('idle');
        return;
      }

      if (Number(nlu.slots.restaurantCount) > 1) {
        navigation.navigate('RestaurantSelection', {
          intent: {
            type: OrderType.FOOD,
            restaurant: String(nlu.slots.dishName),
            items: [String(nlu.slots.dishName)],
          },
        });
        setStage('idle');
        return;
      }
      pendingFoodRef.current = { restaurantId: String(nlu.slots.restaurantId) };
      awaitingFoodRef.current = true;
      setAiText(aiResponse);
      setStage('idle');
      return;
    }

    if (nlu.intent === 'FOOD_NOT_FOUND' || (nlu.intent === 'UNKNOWN' && ctx === 'food')) {
      setAiText(nlu.intent === 'FOOD_NOT_FOUND' ? aiResponse : voiceNlg.foodUnclear());
      setStage('idle');
      return;
    }

    if (nlu.intent === 'SELECT_DESTINATION') {
      navigation.navigate('OrderConfirmation', {
        orderId: `mock-ride-${nlu.slots.placeId}`,
        partner: PartnerCode.GRAB,
        mode: 'confirm',
      });
      setStage('idle');
      return;
    }

    if (nlu.intent === 'DESTINATION_INVALID' || (nlu.intent === 'UNKNOWN' && ctx === 'ride')) {
      setAiText(
        nlu.intent === 'DESTINATION_INVALID' ? aiResponse : voiceNlg.rideUnclear(),
      );
      setStage('idle');
      return;
    }

    if (nlu.intent === 'UNKNOWN' && ctx === 'platform_select') {
      setAiText(aiResponse);
      setStage('idle');
      return;
    }

    if (nlu.intent === 'UNKNOWN' && ctx === 'home') {
      setAiText(aiResponse);
      setStage('idle');
      return;
    }

    if (nlu.intent === 'GLOBAL_CANCEL') {
      voiceContextRef.current = 'home';
      setAiText(aiResponse);
      setStage('idle');
      return;
    }

    setStage('idle');
  }, [navigation]);

  useEffect(() => {
    const speechModule = getSpeechRecognitionModule();
    if (!speechModule) return;

    const finalTranscriptRef = { current: '' };
    let subs: { remove(): void }[] = [];
    try {
      subs = [
        speechModule.addListener('result', (event: any) => {
          const text: string = event.results?.[0]?.transcript ?? '';
          if (event.isFinal && text) finalTranscriptRef.current = text;
        }),
        speechModule.addListener('end', () => {
          const text = finalTranscriptRef.current;
          finalTranscriptRef.current = '';
          if (text) processTranscript(text);
          else setStage('idle');
        }),
        speechModule.addListener('error', (event: any) => {
          console.warn('STT error', event.error, event.message);
          setStage('idle');
        }),
      ];
    } catch (e) {
      console.warn('STT listeners failed', e);
    }

    return () => {
      subs.forEach((s) => s?.remove());
      try { speechModule.abort(); } catch { /* ignore */ }
    };
  }, [processTranscript]);

  const beginListening = useCallback(async () => {
    setUserText('');
    setStage('listening');

    if (TEXT_INPUT_MODE) {
      // simulator / dev: chỉ mở modal nhập text, không đụng STT thật
      return;
    }
    try {
      const speechModule = getSpeechRecognitionModule();
      if (!speechModule) {
        setStage('idle');
        return;
      }
      const perm = await speechModule.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Cần quyền microphone');
        setStage('idle');
        return;
      }
      speechModule.start({ lang: 'vi-VN', continuous: false, interimResults: true });
    } catch (e) {
      console.warn('STT start failed', e);
      setStage('idle');
    }
  }, []);

  useEffect(() => { beginListeningRef.current = beginListening; }, [beginListening]);

  const onMicPress = useCallback(() => {
    if (stage === 'thinking') return;

    if (stage === 'listening') {
      const speechModule = getSpeechRecognitionModule();
      if (speechModule && !TEXT_INPUT_MODE) {
        try { speechModule.stop(); } catch { /* ignore */ }
      } else {
        setStage('idle');
      }
      return;
    }

    beginListening();
  }, [stage, beginListening]);

  const submitManualInput = useCallback(() => {
    if (!manualInput.trim()) return;
    const text = manualInput;
    setManualInput('');
    processTranscript(text);
  }, [manualInput, processTranscript]);

  const onTabPress = useCallback((tab: BottomNavTab) => {
    if (tab === 'home') return;
    if (tab === 'stats') navigation.navigate('Stats');
    if (tab === 'settings') navigation.navigate('Settings');
  }, [navigation]);

  const onHistoryPress = useCallback(() => {
    navigation.navigate('OrderHistory');
  }, [navigation]);

  return {
    userName,
    aiText,
    userText,
    stage,
    sttAvailable: !TEXT_INPUT_MODE,
    manualInput,
    setManualInput,
    submitManualInput,
    onMicPress,
    onTabPress,
    onHistoryPress,
  };
};
