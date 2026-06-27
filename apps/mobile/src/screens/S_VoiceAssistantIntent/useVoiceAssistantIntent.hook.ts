import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

type Phase = 'ai_speaking' | 'listening' | 'done';

const CONTEXT_USER_TEXT: Record<string, string> = {
  platform_select: 'Grab',
  home: 'Tôi muốn đặt đồ ăn',
  food: 'Tôi muốn đặt phở bò',
  ride: 'Đặt xe đến Bến Thành',
};

export function useVoiceAssistantIntent() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceAssistantIntent'>>();
  const { context, aiGreeting } = route.params;

  const [phase, setPhase] = useState<Phase>('ai_speaking');
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  function goToProcessing() {
    setPhase('done');
    navigation.navigate('VoiceProcessing', {
      userText: CONTEXT_USER_TEXT[context] ?? CONTEXT_USER_TEXT.home,
      context,
    });
  }

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(aiGreeting);

    const t1 = setTimeout(() => setPhase('listening'), 1200);
    const t2 = setTimeout(() => goToProcessing(), 4200);
    timersRef.current = [t1, t2];

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onDismiss() {
    navigation.goBack();
  }

  function onMicPress() {
    if (phase !== 'listening') return;
    timersRef.current.forEach(clearTimeout);
    goToProcessing();
  }

  return { phase, aiGreeting, context, onDismiss, onMicPress };
}
