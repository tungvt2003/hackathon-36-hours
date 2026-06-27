import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { BottomNavTab } from '../../components/BottomNavBar';
import { getSpeechRecognitionModule, STT_AVAILABLE } from '../../services/speechRecognition';
import { DEV_FORCE_TEXT_INPUT } from '../../constants/devFlags';
import { api } from '../../api';
import { PartnerCode } from '../../types';
import { getCurrentLocation } from '../../services/location';
import {
  PLATFORM_SELECT_GREETING,
  HOME_AI_GREETING,
  PARTNER_LABEL,
  matchPlatformFromVoice,
} from './dashboard.service';

// simulator k voice được -> ép hiện modal nhập text thay vì tự mở mic
const TEXT_INPUT_MODE = DEV_FORCE_TEXT_INPUT || !STT_AVAILABLE;
const LISTEN_CUE = ' Bạn có thể bắt đầu nói.';

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

  const sessionIdRef = useRef<string | null>(null);
  const platformRef = useRef<PartnerCode | null>(null);
  const beginListeningRef = useRef<() => void>(() => { });
  useEffect(() => { platformRef.current = platform; }, [platform]);

  // Đọc to mỗi khi aiText đổi — đồng bộ với text hiện trên card.
  // Đọc xong tự mở mic nghe tiếp (hoặc mở modal nhập text nếu TEXT_INPUT_MODE).
  useEffect(() => {
    Speech.stop();
    Speech.speak(aiText + LISTEN_CUE, {
      language: 'vi-VN',
      onDone: () => beginListeningRef.current(),
      onStopped: () => beginListeningRef.current(),
    });
    AccessibilityInfo.announceForAccessibility(aiText);
    return () => { Speech.stop(); };
  }, [aiText]);

  const processTranscript = useCallback(async (transcript: string) => {
    setUserText(transcript);
    setStage('thinking');

    if (!platformRef.current) {
      const matched = matchPlatformFromVoice(transcript);
      if (matched) {
        setPlatform(matched);
        setAiText(`Đã kết nối với ${PARTNER_LABEL[matched]}. ${HOME_AI_GREETING}`);
      } else {
        setAiText('Xin lỗi, tôi chưa nghe rõ. Bạn hãy nói tên nền tảng, ví dụ Grab hoặc Be.');
      }
      setStage('idle');
      return;
    }

    // cho phép đổi nền tảng giữa hội thoại — nói tên đối tác khác là tự chuyển
    const switched = matchPlatformFromVoice(transcript);
    if (switched && switched !== platformRef.current) {
      setPlatform(switched);
      platformRef.current = switched;
    }

    try {
      let sid = sessionIdRef.current;
      if (!sid) {
        const s = await api.conversation.start();
        sid = s.sessionId;
        sessionIdRef.current = sid;
      }
      const loc = await getCurrentLocation();
      const res = await api.conversation.input(
        sid,
        transcript,
        loc.lat,
        loc.lng,
        platformRef.current ?? undefined,
      );
      setAiText(res.promptText);
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
    } finally {
      setStage('idle');
    }
  }, []);

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
