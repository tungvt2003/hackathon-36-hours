import { httpHelper } from '../api';
import {
  ConfirmOrderRequest,
  ConfirmOrderResponse,
  VoiceOrderRequest,
  VoiceOrderResponse,
} from '../types';

export const api = {
  voiceOrder: (body: VoiceOrderRequest): Promise<VoiceOrderResponse> =>
    httpHelper.post('/orders/voice', body),

  confirmOrder: (body: ConfirmOrderRequest): Promise<ConfirmOrderResponse> =>
    httpHelper.post('/orders/confirm', body),

  health: (): Promise<{ ok: boolean }> => httpHelper.get('/health'),
};