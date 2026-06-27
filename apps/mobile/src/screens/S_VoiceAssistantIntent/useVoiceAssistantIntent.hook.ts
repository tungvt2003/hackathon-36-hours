import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PartnerCode, OrderType } from '../../types';
import { RootStackParamList, VoiceIntentContext } from '../../navigation/types';
import { DEV_FORCE_TEXT_INPUT } from '../../constants/devFlags';
import { getSpeechRecognitionModule, STT_AVAILABLE } from '../../services/speechRecognition';
import {
  isNo,
  isPlatformSupported,
  isYes,
  matchPlatform,
  parseVoiceInput,
  VoiceNluContext,
} from '../../services/voice/voice-nlu.service';
import { voiceNlg } from '../../services/voice/voice-nlg.service';
import { tts } from '../../services/voice/tts';

const USE_TEXT_INPUT = DEV_FORCE_TEXT_INPUT || !STT_AVAILABLE;
const LISTEN_TIMEOUT_MS = 8000;

type Phase = 'ai_speaking' | 'listening' | 'processing';

export function useVoiceAssistantIntent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceAssistantIntent'>>();
  const { context: initialContext, aiGreeting } = route.params;

  const [phase, setPhase] = useState<Phase>('ai_speaking');
  const [activeContext, setActiveContext] = useState<VoiceNluContext>(initialContext);
  const [displayGreeting, setDisplayGreeting] = useState(aiGreeting);
  const [textInput, setTextInput] = useState('');
  const [awaitingGrabConfirm, setAwaitingGrabConfirm] = useState(false);
  const [awaitingFoodConfirm, setAwaitingFoodConfirm] = useState(false);

  const retryCountRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finalTranscriptRef = useRef('');
  const activeContextRef = useRef(activeContext);
  const awaitingGrabRef = useRef(false);
  const awaitingFoodRef = useRef(false);
  const pendingFoodRef = useRef<{ restaurantId: string; dishName: string } | null>(null);

  useEffect(() => { activeContextRef.current = activeContext; }, [activeContext]);
  useEffect(() => { awaitingGrabRef.current = awaitingGrabConfirm; }, [awaitingGrabConfirm]);
  useEffect(() => { awaitingFoodRef.current = awaitingFoodConfirm; }, [awaitingFoodConfirm]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const stopStt = useCallback(() => {
    try { getSpeechRecognitionModule()?.stop(); } catch { /* ignore */ }
    try { getSpeechRecognitionModule()?.abort(); } catch { /* ignore */ }
  }, []);

  const goToProcessing = useCallback((userText: string, context: VoiceIntentContext) => {
    clearTimers();
    stopStt();
    setPhase('processing');
    navigation.navigate('VoiceProcessing', { userText, context });
  }, [navigation, clearTimers, stopStt]);

  const goToSpeaking = useCallback((userText: string, aiText: string, context: VoiceIntentContext) => {
    clearTimers();
    stopStt();
    setPhase('processing');
    navigation.navigate('VoiceSpeaking', { userText, aiText, context });
  }, [navigation, clearTimers, stopStt]);

  const speakAndListen = useCallback((text: string) => {
    setDisplayGreeting(text);
    setPhase('ai_speaking');
    tts(text, () => {
      if (!USE_TEXT_INPUT) {
        setPhase('listening');
        const speechModule = getSpeechRecognitionModule();
        if (!speechModule) return;

        (async () => {
          try {
            const perm = await speechModule.requestPermissionsAsync();
            if (!perm.granted) {
              navigation.navigate('VoiceError');
              return;
            }
            finalTranscriptRef.current = '';
            speechModule.start({ lang: 'en-US', continuous: false, interimResults: false });
            const timeout = setTimeout(() => {
              stopStt();
              navigation.navigate('VoiceError');
            }, LISTEN_TIMEOUT_MS);
            timersRef.current.push(timeout);
          } catch {
            navigation.navigate('VoiceError');
          }
        })();
      }
    });

    if (USE_TEXT_INPUT) {
      setPhase('listening');
    }
  }, [navigation, stopStt]);

  const handleTranscript = useCallback((transcript: string) => {
    clearTimers();
    stopStt();

    const ctx = activeContextRef.current;

    if (awaitingFoodRef.current && pendingFoodRef.current) {
      if (isYes(transcript)) {
        const pending = pendingFoodRef.current;
        pendingFoodRef.current = null;
        setAwaitingFoodConfirm(false);
        clearTimers();
        stopStt();
        navigation.navigate('OrderConfirmation', {
          orderId: `mock-${pending.restaurantId}`,
          partner: PartnerCode.GRAB,
          mode: 'confirm',
        });
        return;
      }
      if (isNo(transcript)) {
        pendingFoodRef.current = null;
        setAwaitingFoodConfirm(false);
        setActiveContext('food');
        speakAndListen(voiceNlg.foodDeclined());
        return;
      }
    }

    if (ctx === 'platform_select' && matchPlatform(transcript) === PartnerCode.GRAB) {
      if (USE_TEXT_INPUT) {
        navigation.navigate('ProfileSetup');
        return;
      }
      goToSpeaking(transcript, voiceNlg.platformGrabSelected(), 'platform_select');
      return;
    }

    if (awaitingGrabRef.current) {
      if (isYes(transcript)) {
        setAwaitingGrabConfirm(false);
        retryCountRef.current = 0;
        if (USE_TEXT_INPUT) {
          navigation.navigate('ProfileSetup');
          return;
        }
        goToSpeaking(transcript, voiceNlg.platformGrabConfirmedAfterFallback(), 'platform_select');
        return;
      }
      if (isNo(transcript)) {
        setAwaitingGrabConfirm(false);
        retryCountRef.current = 0;
        setActiveContext('platform_select');
        speakAndListen(voiceNlg.platformRetryPrompt());
        return;
      }
    }

    const nlu = parseVoiceInput(transcript, ctx);
    const aiText = voiceNlg.fromNlu(ctx, nlu, retryCountRef.current);

    if (nlu.intent === 'UNKNOWN') {
      retryCountRef.current += 1;
      if (ctx === 'platform_select' && retryCountRef.current >= 3) {
        speakAndListen(aiText);
        const t = setTimeout(() => navigation.goBack(), 4000);
        timersRef.current.push(t);
        return;
      }
      speakAndListen(aiText);
      return;
    }

    retryCountRef.current = 0;

    if (nlu.intent === 'PLATFORM_UNSUPPORTED') {
      setAwaitingGrabConfirm(true);
      speakAndListen(aiText);
      return;
    }

    if (nlu.intent === 'SELECT_PLATFORM') {
      if (ctx === 'platform_select') {
        if (USE_TEXT_INPUT) {
          navigation.navigate('ProfileSetup');
          return;
        }
        goToSpeaking(transcript, voiceNlg.platformGrabSelected(), 'platform_select');
        return;
      }
      setActiveContext('home');
      speakAndListen(aiText);
      return;
    }

    if (nlu.intent === 'SELECT_SERVICE_FOOD') {
      setActiveContext('food');
      speakAndListen(aiText);
      return;
    }

    if (nlu.intent === 'SELECT_SERVICE_RIDE') {
      setActiveContext('ride');
      speakAndListen(aiText);
      return;
    }

    if (nlu.intent === 'SELECT_FOOD_DISH') {
      if (Number(nlu.slots.restaurantCount) > 1) {
        clearTimers();
        stopStt();
        navigation.navigate('RestaurantSelection', {
          intent: {
            type: OrderType.FOOD,
            restaurant: String(nlu.slots.dishName),
            items: [String(nlu.slots.dishName)],
          },
        });
        return;
      }
      pendingFoodRef.current = {
        restaurantId: String(nlu.slots.restaurantId),
        dishName: String(nlu.slots.dishName),
      };
      setAwaitingFoodConfirm(true);
      speakAndListen(aiText);
      return;
    }

    if (nlu.intent === 'FOOD_NOT_FOUND') {
      speakAndListen(aiText);
      return;
    }

    if (nlu.intent === 'SELECT_DESTINATION') {
      clearTimers();
      stopStt();
      navigation.navigate('OrderConfirmation', {
        orderId: `mock-ride-${nlu.slots.placeId}`,
        partner: PartnerCode.GRAB,
        mode: 'confirm',
      });
      return;
    }

    if (nlu.intent === 'DESTINATION_INVALID') {
      speakAndListen(aiText);
      return;
    }

    if (nlu.intent === 'GLOBAL_HELP') {
      speakAndListen(aiText);
      return;
    }

    if (nlu.intent === 'GLOBAL_CANCEL') {
      navigation.goBack();
      return;
    }

    // Removed old unreachable platform check block

    goToProcessing(transcript, initialContext);
  }, [
    clearTimers,
    stopStt,
    speakAndListen,
    goToProcessing,
    goToSpeaking,
    navigation,
    initialContext,
  ]);

  const handleTranscriptRef = useRef(handleTranscript);
  useEffect(() => { handleTranscriptRef.current = handleTranscript; }, [handleTranscript]);

  useEffect(() => {
    isCancelledRef.current = false;
    AccessibilityInfo.announceForAccessibility(aiGreeting);
    speakAndListen(aiGreeting);

    const speechModule = getSpeechRecognitionModule();
    if (!speechModule || USE_TEXT_INPUT) {
      return () => clearTimers();
    }

    const subs = [
      speechModule.addListener('result', (event: { results?: { transcript?: string }[] }) => {
        const transcript = event.results?.[0]?.transcript ?? '';
        if (transcript.length > 0) {
          finalTranscriptRef.current = transcript;
          clearTimers();
          handleTranscriptRef.current(transcript);
        }
      }),
      speechModule.addListener('error', () => {
        clearTimers();
        navigation.navigate('VoiceError');
      }),
    ];

    return () => {
      clearTimers();
      stopStt();
      subs.forEach((s) => s.remove());
    };
  }, [aiGreeting, speakAndListen, clearTimers, stopStt, navigation]);

  function onDismiss() {
    clearTimers();
    stopStt();
    navigation.goBack();
  }

  function onMicPress() {
    if (phase !== 'listening') return;
    const text = finalTranscriptRef.current.trim();
    if (text) handleTranscript(text);
    else stopStt();
  }

  function submitTextInput() {
    if (!textInput.trim()) return;
    const text = textInput.trim();
    setTextInput('');
    handleTranscript(text);
  }

  return {
    phase,
    aiGreeting: displayGreeting,
    context: activeContext,
    useTextInput: USE_TEXT_INPUT,
    textInput,
    setTextInput,
    submitTextInput,
    onDismiss,
    onMicPress,
  };
}
