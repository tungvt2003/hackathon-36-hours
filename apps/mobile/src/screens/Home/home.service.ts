import { api } from '../../services/api';
import { ConfirmOrderRequest, ConfirmOrderResponse, VoiceOrderRequest, VoiceOrderResponse } from '../../types';

export const homeService = {
  submitVoiceOrder: (body: VoiceOrderRequest): Promise<VoiceOrderResponse> => api.voiceOrder(body),

  confirmOrder: (body: ConfirmOrderRequest): Promise<ConfirmOrderResponse> =>
    api.confirmOrder(body),
};