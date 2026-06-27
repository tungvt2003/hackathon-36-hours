import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { loginService } from './login.service';

export interface LoginViewModel {
  loading: boolean;
  micEnabled: boolean;
  toggleMic: () => void;
  handleBack: () => void;
  handleConnect: () => void;
  handleSkip: () => void;
}

export const useLogin = (): LoginViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    await loginService.mockGrabAuth();
    setLoading(false);
    navigation.navigate('ProfileSetup');
  }, [navigation]);

  const handleSkip = useCallback(() => {
    navigation.navigate('ProfileSetup');
  }, [navigation]);

  const toggleMic = useCallback(() => {
    setMicEnabled(prev => !prev);
  }, []);

  return {
    loading,
    micEnabled,
    toggleMic,
    handleBack,
    handleConnect,
    handleSkip,
  };
};
