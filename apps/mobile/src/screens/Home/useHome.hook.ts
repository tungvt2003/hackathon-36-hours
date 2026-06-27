import { useCallback, useState } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import { PartnerCode, PartnerQuote, ConfirmOrderResponse, VoiceOrderResponse } from '../../types';
import { homeService } from './home.service';

const PARTNER_LABEL: Record<PartnerCode, string> = {
  [PartnerCode.GRAB]: 'Grab',
  [PartnerCode.BE]: 'Be',
  [PartnerCode.XANH_SM]: 'Xanh SM',
};

export interface HomeViewModel {
  transcript: string;
  loading: boolean;
  orderResult: VoiceOrderResponse | null;
  confirmResult: ConfirmOrderResponse | null;
  availableQuotes: PartnerQuote[];
  setTranscript: (transcript: string) => void;
  handleSend: () => Promise<void>;
  handleConfirm: (partner: PartnerCode) => Promise<void>;
  handleReset: () => void;
  getPartnerLabel: (partner: PartnerCode) => string;
}

export function useHome(): HomeViewModel {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<VoiceOrderResponse | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmOrderResponse | null>(null);

  const handleReset = useCallback(() => {
    setOrderResult(null);
    setConfirmResult(null);
    setTranscript('');
  }, []);

  const handleSend = useCallback(async () => {
    if (!transcript.trim()) {
      Alert.alert('Vui lòng nhập yêu cầu');
      return;
    }

    setLoading(true);
    setOrderResult(null);
    setConfirmResult(null);

    try {
      const result = await homeService.submitVoiceOrder({ transcript });
      setOrderResult(result);
      AccessibilityInfo.announceForAccessibility(result.responseText);
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  }, [transcript]);

  const handleConfirm = useCallback(
    async (partner: PartnerCode) => {
      if (!orderResult) {
        return;
      }

      setLoading(true);

      try {
        const result = await homeService.confirmOrder({
          orderId: orderResult.orderId,
          partner,
        });
        setConfirmResult(result);
        AccessibilityInfo.announceForAccessibility(result.responseText);
      } catch (error) {
        Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể xác nhận đơn');
      } finally {
        setLoading(false);
      }
    },
    [orderResult],
  );

  const availableQuotes = orderResult
    ? [...orderResult.quotes].filter((quote) => quote.available).sort((left, right) => left.price - right.price)
    : [];

  return {
    transcript,
    loading,
    orderResult,
    confirmResult,
    availableQuotes,
    setTranscript,
    handleSend,
    handleConfirm,
    handleReset,
    getPartnerLabel: (partner) => PARTNER_LABEL[partner],
  };
}