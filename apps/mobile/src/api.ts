import Constants from 'expo-constants';
import {
  VoiceOrderRequest,
  VoiceOrderResponse,
  ConfirmOrderRequest,
  ConfirmOrderResponse,
} from './types';

// BASE_URL lấy từ app.json extra.apiUrl
// Khi test trên điện thoại thật: đổi thành IP LAN của máy chạy API
// vd: http://192.168.1.x:3000 (KHÔNG dùng localhost)
const BASE_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path} failed ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  /** Gửi yêu cầu đặt xe/đồ ăn bằng text (giai đoạn basic) */
  voiceOrder: (body: VoiceOrderRequest): Promise<VoiceOrderResponse> =>
    request('/orders/voice', { method: 'POST', body: JSON.stringify(body) }),

  /** Xác nhận chọn đối tác */
  confirmOrder: (body: ConfirmOrderRequest): Promise<ConfirmOrderResponse> =>
    request('/orders/confirm', { method: 'POST', body: JSON.stringify(body) }),

  /** Kiểm tra API còn sống không */
  health: (): Promise<{ ok: boolean }> => request('/health'),
};
