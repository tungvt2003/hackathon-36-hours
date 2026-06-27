import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { loginService, PLATFORM_AI_GREETING } from './login.service';

export interface LoginViewModel {
  loading: boolean;
  autoOpenedVoice: boolean;
  handleConnect: () => void;
  handleSkip: () => void;
  handleBack: () => void;
}

export const useLogin = (): LoginViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [autoOpenedVoice, setAutoOpenedVoice] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('VoiceAssistantIntent', {
        context: 'platform_select',
        aiGreeting: PLATFORM_AI_GREETING,
      });
      setAutoOpenedVoice(true);
      AccessibilityInfo.announceForAccessibility(PLATFORM_AI_GREETING);
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    await loginService.mockGrabAuth();
    setLoading(false);
    navigation.navigate('ProfileSetup');
  }, [navigation]);

  const handleSkip = useCallback(() => {
    navigation.navigate('ProfileSetup');
  }, [navigation]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return {
    loading,
    autoOpenedVoice,
    handleConnect,
    handleSkip,
    handleBack,
  };
};
