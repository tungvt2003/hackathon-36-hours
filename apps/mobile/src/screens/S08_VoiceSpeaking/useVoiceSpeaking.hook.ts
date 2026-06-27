import { useEffect, useCallback, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { OrderType, PartnerCode } from '../../types';
import { api } from '../../api';

export interface VoiceSpeakingViewModel {
  userText: string;
  aiText: string;
  context?: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

export const useVoiceSpeaking = (): VoiceSpeakingViewModel => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VoiceSpeaking'>>();
  const { userText, aiText, context, sessionId, quotePartner, canConfirmOrder } = route.params;
  const [loading, setLoading] = useState(false);

  const routeAfterConfirm = useCallback((orderId: string) => {
    if (context === 'ride') {
      navigation.navigate('RideTracking', {
        orderId,
        intent: { type: OrderType.RIDE, origin: '123 Lê Lợi, Q.1', destination: 'Bến Thành Market' },
      });
      return;
    }
    navigation.navigate('OrderConfirmation', {
      orderId,
      partner: quotePartner ?? PartnerCode.GRAB,
      mode: 'confirm',
    });
  }, [navigation, context, quotePartner]);

  const onConfirm = useCallback(async () => {
    if (context === 'platform_select') {
      navigation.navigate('ProfileSetup');
      return;
    }

    if (sessionId && quotePartner && canConfirmOrder) {
      setLoading(true);
      try {
        const res = await api.conversation.confirm(sessionId, quotePartner);
        routeAfterConfirm(res.orderId);
      } catch {
        navigation.navigate('VoiceError');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Chưa có quote thật (vẫn đang COLLECTING) — quay lại trợ lý đầy đủ để tiếp tục hội thoại
    navigation.navigate('VoiceAssistant', { context });
  }, [navigation, context, sessionId, quotePartner, canConfirmOrder, routeAfterConfirm]);

  const onCancel = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  const onDismiss = useCallback(() => {
    onCancel();
  }, [onCancel]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(aiText);
  }, [aiText]);

  return {
    userText,
    aiText,
    context,
    loading,
    onConfirm,
    onCancel,
    onDismiss,
  };
};
