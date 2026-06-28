import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
const RIDE_LOADING_MESSAGE = "You want to go to Ben Thanh Market, I'm finding a ride for you now...";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const pendingFoodRef = useRef<{ restaurantId: string } | null>(null);
  const beginListeningRef = useRef<() => void>(() => { });
  const lastSpokenTextRef = useRef('');
  const sttStartedRef = useRef(false);
  const stopFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { platformRef.current = platform; }, [platform]);

  // Reset voice session khi Dashboard được focus lại (sau khi hoàn thành đơn)
  useFocusEffect(useCallback(() => {
    if (voiceContextRef.current !== 'platform_select') {
      voiceContextRef.current = 'platform_select';
      awaitingGrabRef.current = false;
      awaitingFoodRef.current = false;
      pendingFoodRef.current = null;
      lastSpokenTextRef.current = '';
      setUserText('');
      setStage('idle');
      setPlatform(null);
      setAiText(PLATFORM_SELECT_GREETING);
    }
  }, []));

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
    try {

    if (voiceContextRef.current === 'ride' && transcript.trim()) {
      tts(RIDE_LOADING_MESSAGE);
      await wait(2000);
      navigation.navigate('OrderConfirmation', {
        orderId: 'mock-ride-place-ben-thanh',
        partner: PartnerCode.GRAB,
        mode: 'confirm',
      });
      setStage('idle');
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
      await wait(2000);
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
      return;
    }
    } catch (e) {
      console.warn('processTranscript error', e);
    } finally {
      setStage('idle');
    }
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
          if (stopFallbackRef.current) { clearTimeout(stopFallbackRef.current); stopFallbackRef.current = null; }
          sttStartedRef.current = false;
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
    sttStartedRef.current = false;

    if (TEXT_INPUT_MODE) {
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
      sttStartedRef.current = true;
    } catch (e) {
      console.warn('STT start failed', e);
      setStage('idle');
    }
  }, []);

  useEffect(() => { beginListeningRef.current = beginListening; }, [beginListening]);

  const onMicPress = useCallback(() => {
    if (stage === 'thinking') return;

    if (stage === 'listening') {
      if (!TEXT_INPUT_MODE) {
        if (sttStartedRef.current) {
          const speechModule = getSpeechRecognitionModule();
          try { speechModule?.stop(); } catch { /* ignore */ }
          // Fallback: if end event doesn't fire within 1s, force idle
          if (stopFallbackRef.current) clearTimeout(stopFallbackRef.current);
          stopFallbackRef.current = setTimeout(() => {
            setStage(prev => prev === 'listening' ? 'idle' : prev);
          }, 1000);
        } else {
          // STT not started yet (permission pending) — just reset
          setStage('idle');
        }
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
