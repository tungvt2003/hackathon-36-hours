import { useEffect, useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';

export interface VoiceErrorViewModel {
  onRetry: () => void;
  onCancel: () => void;
}

export const useVoiceError = (): VoiceErrorViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const onRetry = useCallback(() => {
    navigation.replace('VoiceAssistant', {});
  }, [navigation]);

  const onCancel = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(
      'Xin lỗi, có lỗi xảy ra. Bạn muốn thử lại hay quay về trang chủ?',
    );
  }, []);

  return {
    onRetry,
    onCancel,
  };
};
