import { Intent, PartnerQuote } from '../types';

/** Interface cho đối tác xe (Grab, Be, Xanh SM) */
export interface RideProvider {
  /** Lấy báo giá từ đối tác - đọc fixture, chạy mapper */
  quote(intent: Intent): Promise<PartnerQuote>;
  /** Xác nhận đặt - trả mã đơn giả từ fixture */
  confirm(orderId: string): Promise<{ externalId: string; message: string }>;
}

/** Interface cho đối tác đồ ăn (tương lai: ShopeeFood, GrabFood, v.v.) */
export interface FoodProvider {
  quote(intent: Intent): Promise<PartnerQuote>;
  confirm(orderId: string): Promise<{ externalId: string; message: string }>;
}

export const PARTNERS_SERVICE = 'PARTNERS_SERVICE';
