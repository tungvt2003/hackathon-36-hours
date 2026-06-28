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
const MOCK_THINKING_DELAY_MS = 850;
const DEMO_VOUCHER_DISCOUNT = 10000;

type FoodStep =
  | 'none'
  | 'asking_dish'
  | 'choosing_restaurant'
  | 'choosing_item'
  | 'asking_quantity'
  | 'cart_decision'
  | 'payment_method'
  | 'final_confirm';

interface DemoRestaurant {
  id: string;
  name: string;
  rating: number;
  etaMin: number;
}

interface DemoMenuItem {
  id: string;
  name: string;
  price: number;
  keywords: string[];
}

interface DemoCartItem {
  restaurantName: string;
  itemName: string;
  qty: number;
  price: number;
}

const FRIED_CHICKEN_RESTAURANTS: DemoRestaurant[] = [
  { id: 'kfc-ben-thanh', name: 'KFC Bến Thành', rating: 4.7, etaMin: 25 },
  { id: 'texas-nguyen-hue', name: 'Texas Chicken Nguyễn Huệ', rating: 4.6, etaMin: 30 },
  { id: 'ga-ran-seoul', name: 'Gà Rán Seoul', rating: 4.5, etaMin: 28 },
];

const FRIED_CHICKEN_MENUS: Record<string, DemoMenuItem[]> = {
  'kfc-ben-thanh': [
    { id: 'original-1', name: 'Gà rán 1 miếng', price: 45000, keywords: ['ga ran 1 mieng', 'mot mieng', 'ga ran'] },
    { id: 'combo-2', name: 'Combo gà rán 2 miếng và nước', price: 89000, keywords: ['combo ga ran 2 mieng va nuoc', 'combo ga ran', 'combo hai mieng', 'hai mieng va nuoc'] },
    { id: 'burger-ga-gion', name: 'Burger gà giòn', price: 55000, keywords: ['burger ga gion', 'burger', 'ga gion'] },
  ],
  'texas-nguyen-hue': [
    { id: 'texas-2', name: 'Combo gà rán Texas 2 miếng', price: 92000, keywords: ['combo ga ran texas', 'texas 2 mieng', 'combo hai mieng'] },
    { id: 'mexicana', name: 'Burger Mexicana', price: 65000, keywords: ['burger mexicana', 'mexicana', 'burger'] },
    { id: 'khoai-tay', name: 'Khoai tây chiên lớn', price: 39000, keywords: ['khoai tay chien lon', 'khoai tay', 'fries'] },
  ],
  'ga-ran-seoul': [
    { id: 'seoul-cay', name: 'Gà rán sốt cay Seoul', price: 79000, keywords: ['ga ran sot cay seoul', 'sot cay', 'ga cay'] },
    { id: 'seoul-mat-ong', name: 'Gà rán mật ong', price: 85000, keywords: ['ga ran mat ong', 'mat ong'] },
    { id: 'tokbokki', name: 'Tokbokki phô mai', price: 59000, keywords: ['tokbokki pho mai', 'tokbokki'] },
  ],
};

function normalizeVoice(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .trim();
}

function formatVnd(amount: number): string {
  return amount.toLocaleString('vi-VN') + ' đồng';
}

function formatRestaurantOptions(restaurants: DemoRestaurant[]): string {
  return restaurants
    .map((r) => `${r.name}, đánh giá ${r.rating} sao, giao khoảng ${r.etaMin} phút`)
    .join('. ');
}

function formatMenuOptions(items: DemoMenuItem[]): string {
  return items.map((item) => `${item.name}, ${formatVnd(item.price)}`).join('. ');
}

function matchRestaurantByName(text: string): DemoRestaurant | null {
  const n = normalizeVoice(text);
  const aliases: Record<string, string[]> = {
    'kfc-ben-thanh': ['kfc ben thanh', 'kfc', 'ben thanh'],
    'texas-nguyen-hue': ['texas chicken nguyen hue', 'texas chicken', 'texas', 'nguyen hue'],
    'ga-ran-seoul': ['ga ran seoul', 'seoul'],
  };

  for (const restaurant of FRIED_CHICKEN_RESTAURANTS) {
    if (normalizeVoice(restaurant.name).includes(n) || n.includes(normalizeVoice(restaurant.name))) {
      return restaurant;
    }
    if (aliases[restaurant.id]?.some((alias) => n.includes(alias))) {
      return restaurant;
    }
  }

  if (/\b(1|mot|dau tien)\b/.test(n)) return FRIED_CHICKEN_RESTAURANTS[0];
  if (/\b(2|hai)\b/.test(n)) return FRIED_CHICKEN_RESTAURANTS[1];
  if (/\b(3|ba)\b/.test(n)) return FRIED_CHICKEN_RESTAURANTS[2];
  return null;
}

function matchMenuItemByName(text: string, items: DemoMenuItem[]): DemoMenuItem | null {
  const n = normalizeVoice(text);
  for (const item of items) {
    const itemName = normalizeVoice(item.name);
    if (itemName.includes(n) || n.includes(itemName)) return item;
    if (item.keywords.some((keyword) => n.includes(normalizeVoice(keyword)))) return item;
  }

  if (/\b(1|mot|dau tien)\b/.test(n)) return items[0];
  if (/\b(2|hai)\b/.test(n)) return items[1];
  if (/\b(3|ba)\b/.test(n)) return items[2];
  return null;
}

function parseQuantity(text: string): number | null {
  const n = normalizeVoice(text);
  const digit = n.match(/\b([1-9])\b/);
  if (digit) return Number(digit[1]);
  if (/\b(mot|một)\b/.test(n)) return 1;
  if (/\b(hai|doi|đôi)\b/.test(n)) return 2;
  if (/\b(ba)\b/.test(n)) return 3;
  if (/\b(bon|bốn|tu|tư)\b/.test(n)) return 4;
  if (/\b(nam|năm)\b/.test(n)) return 5;
  return null;
}

function wantsSuggestion(text: string): boolean {
  const n = normalizeVoice(text);
  return n.includes('goi y') || n.includes('khong biet') || n.includes('an gi cung duoc');
}

function wantsFriedChicken(text: string): boolean {
  const n = normalizeVoice(text);
  return n.includes('ga ran') || n.includes('gà rán') || n.includes('fried chicken') || n.includes('kfc');
}

function wantsCheckout(text: string): boolean {
  const n = normalizeVoice(text);
  return n.includes('thanh toan') || n.includes('dat hang') || n.includes('chot don') || n.includes('tra tien');
}

function wantsAddMore(text: string): boolean {
  const n = normalizeVoice(text);
  return n.includes('dat them') || n.includes('them mon') || n.includes('mua them') || n.includes('chon them');
}

function matchPaymentMethod(text: string): 'thẻ ngân hàng' | 'tiền mặt' | null {
  const n = normalizeVoice(text);
  if (n.includes('the ngan hang') || n.includes('the') || n.includes('card') || n.includes('bank')) {
    return 'thẻ ngân hàng';
  }
  if (n.includes('tien mat') || n.includes('cash')) {
    return 'tiền mặt';
  }
  return null;
}

function cartTotal(cart: DemoCartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function payableTotal(cart: DemoCartItem[]): number {
  return Math.max(0, cartTotal(cart) - DEMO_VOUCHER_DISCOUNT);
}

function cartSummary(cart: DemoCartItem[]): string {
  return cart
    .map((item) => `${item.qty} phần ${item.itemName} từ ${item.restaurantName}`)
    .join(', ');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wantsRepeat(text: string): boolean {
  const n = normalizeVoice(text);
  return n.includes('doc lai') || n.includes('noi lai') || n.includes('lap lai') || n.includes('nghe lai');
}

function repeatFoodPrompt(
  step: FoodStep,
  restaurant: DemoRestaurant | null,
  item: DemoMenuItem | null,
  cart: DemoCartItem[],
): string {
  if (step === 'asking_dish') {
    return 'Tôi đọc lại. Bạn muốn ăn món gì? Bạn có thể nói tên món, hoặc nói gợi ý nếu chưa biết ăn gì.';
  }
  if (step === 'choosing_restaurant') {
    return `Tôi đọc lại các quán có gà rán gần bạn: ${formatRestaurantOptions(FRIED_CHICKEN_RESTAURANTS)}. Bạn muốn chọn quán nào?`;
  }
  if (step === 'choosing_item' && restaurant) {
    return `Tôi đọc lại các món ở ${restaurant.name}: ${formatMenuOptions(FRIED_CHICKEN_MENUS[restaurant.id])}. Bạn muốn chọn món nào?`;
  }
  if (step === 'asking_quantity' && item) {
    return `Tôi đọc lại. Bạn muốn đặt bao nhiêu phần ${item.name}?`;
  }
  if (step === 'cart_decision') {
    return `Tôi đọc lại. Đơn hiện có ${cartSummary(cart)}. Tôi đã giúp bạn áp voucher giảm ${formatVnd(DEMO_VOUCHER_DISCOUNT)}. Tổng còn ${formatVnd(payableTotal(cart))}. Bạn muốn thanh toán hay đặt thêm món?`;
  }
  if (step === 'payment_method') {
    return `Tôi đọc lại. Đơn hàng của bạn gồm ${cartSummary(cart)}. Sau voucher, tổng còn ${formatVnd(payableTotal(cart))}. Bạn muốn thanh toán bằng thẻ ngân hàng hay tiền mặt?`;
  }
  if (step === 'final_confirm') {
    return `Tôi đọc lại. Đơn hàng của bạn gồm ${cartSummary(cart)}. Sau voucher, tổng còn ${formatVnd(payableTotal(cart))}. Bạn xác nhận đặt hàng không?`;
  }
  return 'Tôi đọc lại. Bạn muốn đặt đồ ăn hay đặt xe?';
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

  const [platform, setPlatform] = useState<PartnerCode | null>(PartnerCode.GRAB);
  const [aiText, setAiText] = useState(PLATFORM_SELECT_GREETING);
  const [userText, setUserText] = useState('');
  const [stage, setStage] = useState<DashboardStage>('idle');
  const [manualInput, setManualInput] = useState('');

  const platformRef = useRef<PartnerCode | null>(null);
  const voiceContextRef = useRef<VoiceNluContext>('home');
  const foodStepRef = useRef<FoodStep>('none');
  const awaitingGrabRef = useRef(false);
  const awaitingFoodRef = useRef(false);
  const pendingFoodRef = useRef<{ restaurantId: string } | null>(null);
  const selectedRestaurantRef = useRef<DemoRestaurant | null>(null);
  const selectedItemRef = useRef<DemoMenuItem | null>(null);
  const cartRef = useRef<DemoCartItem[]>([]);
  const beginListeningRef = useRef<() => void>(() => { });
  useEffect(() => { platformRef.current = platform; }, [platform]);

  useEffect(() => {
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
    await wait(MOCK_THINKING_DELAY_MS);

    if (foodStepRef.current !== 'none') {
      if (wantsRepeat(transcript)) {
        setAiText(repeatFoodPrompt(
          foodStepRef.current,
          selectedRestaurantRef.current,
          selectedItemRef.current,
          cartRef.current,
        ));
        setStage('idle');
        return;
      }

      if (isNo(transcript) || normalizeVoice(transcript).includes('huy')) {
        foodStepRef.current = 'none';
        selectedRestaurantRef.current = null;
        selectedItemRef.current = null;
        cartRef.current = [];
        voiceContextRef.current = 'home';
        setAiText('Tôi đã hủy luồng đặt món. Bạn muốn đặt xe hay đặt đồ ăn?');
        setStage('idle');
        return;
      }

      if (foodStepRef.current === 'asking_dish') {
        if (wantsSuggestion(transcript)) {
          setAiText('Mình gợi ý vài món dễ ăn như cơm tấm sườn, gà rán, phở bò hoặc trà sữa. Mình có thể hỗ trợ gà rán rất nhanh. Bạn muốn ăn món nào?');
          setStage('idle');
          return;
        }

        if (!wantsFriedChicken(transcript)) {
          setAiText('Mình chưa tìm thấy món đó phù hợp lúc này. Bạn có muốn thử gà rán không?');
          setStage('idle');
          return;
        }

        foodStepRef.current = 'choosing_restaurant';
        setAiText(`Tôi tìm thấy vài quán có gà rán gần bạn: ${formatRestaurantOptions(FRIED_CHICKEN_RESTAURANTS)}. Bạn muốn chọn quán nào?`);
        setStage('idle');
        return;
      }

      if (foodStepRef.current === 'choosing_restaurant') {
        const restaurant = matchRestaurantByName(transcript);
        if (!restaurant) {
          setAiText('Tôi chưa xác định được quán bạn chọn. Bạn có thể nói KFC Bến Thành, Texas Chicken Nguyễn Huệ, hoặc Gà Rán Seoul.');
          setStage('idle');
          return;
        }

        selectedRestaurantRef.current = restaurant;
        foodStepRef.current = 'choosing_item';
        const menu = FRIED_CHICKEN_MENUS[restaurant.id];
        setAiText(`Bạn chọn ${restaurant.name}. Tôi tìm thấy các món gần với gà rán: ${formatMenuOptions(menu)}. Bạn muốn chọn món nào?`);
        setStage('idle');
        return;
      }

      if (foodStepRef.current === 'choosing_item') {
        const restaurant = selectedRestaurantRef.current;
        if (!restaurant) {
          foodStepRef.current = 'choosing_restaurant';
          setAiText('Bạn muốn chọn quán nào: KFC Bến Thành, Texas Chicken Nguyễn Huệ, hay Gà Rán Seoul?');
          setStage('idle');
          return;
        }

        const item = matchMenuItemByName(transcript, FRIED_CHICKEN_MENUS[restaurant.id]);
        if (!item) {
          setAiText(`Tôi chưa rõ món bạn chọn. Các món hiện có là: ${formatMenuOptions(FRIED_CHICKEN_MENUS[restaurant.id])}. Bạn muốn chọn món nào?`);
          setStage('idle');
          return;
        }

        selectedItemRef.current = item;
        foodStepRef.current = 'asking_quantity';
        setAiText(`Bạn muốn đặt bao nhiêu phần ${item.name}?`);
        setStage('idle');
        return;
      }

      if (foodStepRef.current === 'asking_quantity') {
        const qty = parseQuantity(transcript);
        const restaurant = selectedRestaurantRef.current;
        const item = selectedItemRef.current;
        if (!qty || !restaurant || !item) {
          setAiText('Tôi chưa nghe rõ số lượng. Bạn muốn đặt bao nhiêu phần?');
          setStage('idle');
          return;
        }

        cartRef.current = [
          ...cartRef.current,
          { restaurantName: restaurant.name, itemName: item.name, qty, price: item.price },
        ];
        foodStepRef.current = 'cart_decision';
        setAiText(`Tôi đã thêm ${qty} phần ${item.name} vào đơn hàng. Tôi đã giúp bạn áp voucher giảm ${formatVnd(DEMO_VOUCHER_DISCOUNT)}. Tổng còn ${formatVnd(payableTotal(cartRef.current))}. Bạn muốn thanh toán hay đặt thêm món?`);
        setStage('idle');
        return;
      }

      if (foodStepRef.current === 'cart_decision') {
        if (wantsAddMore(transcript)) {
          foodStepRef.current = 'choosing_item';
          const restaurant = selectedRestaurantRef.current ?? FRIED_CHICKEN_RESTAURANTS[0];
          selectedRestaurantRef.current = restaurant;
          setAiText(`Bạn muốn đặt thêm món nào từ ${restaurant.name}? ${formatMenuOptions(FRIED_CHICKEN_MENUS[restaurant.id])}.`);
          setStage('idle');
          return;
        }

        if (!wantsCheckout(transcript) && !isYes(transcript)) {
          setAiText('Bạn muốn thanh toán hay đặt thêm món? Bạn cũng có thể nói hủy nếu không muốn đặt nữa.');
          setStage('idle');
          return;
        }

        foodStepRef.current = 'payment_method';
        const total = payableTotal(cartRef.current);
        const firstRestaurant = cartRef.current[0]?.restaurantName ?? 'quán đã chọn';
        setAiText(`Đơn hàng của bạn gồm ${cartSummary(cartRef.current)}. Sau voucher, tổng còn ${formatVnd(total)}, dự kiến giao trong khoảng 25 phút. Bạn muốn thanh toán bằng thẻ ngân hàng hay tiền mặt?`);
        selectedRestaurantRef.current = FRIED_CHICKEN_RESTAURANTS.find((r) => r.name === firstRestaurant) ?? selectedRestaurantRef.current;
        setStage('idle');
        return;
      }

      if (foodStepRef.current === 'payment_method') {
        const paymentMethod = matchPaymentMethod(transcript);
        if (!paymentMethod) {
          setAiText('Bạn muốn thanh toán bằng thẻ ngân hàng hay tiền mặt?');
          setStage('idle');
          return;
        }

        foodStepRef.current = 'final_confirm';
        setAiText(`Bạn chọn thanh toán bằng ${paymentMethod}. Tôi sẽ đặt đơn hàng này. Bạn xác nhận đặt hàng không?`);
        setStage('idle');
        return;
      }

      if (foodStepRef.current === 'final_confirm') {
        if (!isYes(transcript) && !wantsCheckout(transcript)) {
          foodStepRef.current = 'payment_method';
          setAiText('Tôi chưa đặt hàng. Bạn muốn thanh toán bằng thẻ ngân hàng hay tiền mặt?');
          setStage('idle');
          return;
        }

        const orderId = `mock-food-${Date.now()}`;
        const restaurantName = cartRef.current[0]?.restaurantName ?? 'KFC Bến Thành';
        const items = cartRef.current.map((item) => item.itemName);
        foodStepRef.current = 'none';
        voiceContextRef.current = 'home';
        setAiText('Đặt hàng thành công.');
        setStage('idle');
        setTimeout(() => {
          navigation.navigate('FoodTracking', {
            orderId,
            intent: {
              type: OrderType.FOOD,
              restaurant: restaurantName,
              items,
            },
          });
        }, 2500);
        return;
      }
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
      foodStepRef.current = 'asking_dish';
      selectedRestaurantRef.current = null;
      selectedItemRef.current = null;
      cartRef.current = [];
      setAiText('Bạn muốn ăn món gì? Bạn có thể nói tên món, hoặc nói gợi ý nếu chưa biết ăn gì.');
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
        Alert.alert('Microphone permission required');
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
