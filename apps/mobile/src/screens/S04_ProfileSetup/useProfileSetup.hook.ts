import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useProfileStore } from '../../stores/useProfileStore';

export interface ProfileSetupViewModel {
  modes: { visual: boolean; motor: boolean; handsFree: boolean };
  speed: 'slow' | 'normal' | 'fast';
  toggleMode: (id: 'visual' | 'motor' | 'handsFree') => void;
  setSpeed: (s: 'slow' | 'normal' | 'fast') => void;
  handleSave: () => void;
  handleBack: () => void;
}

export const useProfileSetup = (): ProfileSetupViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { 
    accessibilityModes: modes, 
    speakingSpeed: speed, 
    setAccessibilityModes, 
    setSpeakingSpeed, 
    setConfigured
  } = useProfileStore();
  const [hasGreeted, setHasGreeted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasGreeted) {
        setHasGreeted(true);
        navigation.navigate('VoiceAssistantIntent', {
          context: 'home',
          aiGreeting: 'Chào mừng bạn đến với AccessAI! Tôi sẽ điều chỉnh giao diện theo nhu cầu của bạn. Bạn có bị khiếm thị không?',
        });
      }
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMode = useCallback((id: 'visual' | 'motor' | 'handsFree') => {
    setAccessibilityModes({
      ...modes,
      [id]: !modes[id],
    });
  }, [modes, setAccessibilityModes]);

  const setSpeed = useCallback((s: 'slow' | 'normal' | 'fast') => {
    setSpeakingSpeed(s);
  }, [setSpeakingSpeed]);

  const handleSave = useCallback(() => {
    setConfigured(true);
    navigation.replace('Dashboard');
  }, [navigation, setConfigured]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    modes,
    speed,
    toggleMode,
    setSpeed,
    handleSave,
    handleBack,
  };
};
