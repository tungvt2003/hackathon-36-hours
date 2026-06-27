// ============================================================
// COPY từ packages/shared/src/index.ts
// Giữ đồng bộ với packages/shared — khi sửa type ở shared,
// cập nhật file này cùng nội dung.
// apps/mobile là standalone nên không import trực tiếp shared package.
// ============================================================

export enum OrderType {
  RIDE = 'RIDE',
  FOOD = 'FOOD',
}

export enum OrderStatus {
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum PartnerCode {
  GRAB = 'GRAB',
  BE = 'BE',
  XANH_SM = 'XANH_SM',
}

export interface Intent {
  type: OrderType;
  origin?: string;
  destination?: string;
  restaurant?: string;
  items?: string[];
  note?: string;
  confidence?: number;
}

export interface PlaceStatus {
  name: string;
  isOpen: boolean;
  address?: string;
}

export interface WeatherInfo {
  tempC: number;
  condition: string;
  willRain: boolean;
}

export interface Enrichment {
  place?: PlaceStatus;
  weather?: WeatherInfo;
}

export interface PartnerQuote {
  partner: PartnerCode;
  price: number;
  etaMinutes: number;
  driverName?: string;
  available: boolean;
}

export interface VoiceOrderRequest {
  userId?: string;
  transcript?: string;
  audioBase64?: string;
}

export interface VoiceOrderResponse {
  orderId: string;
  transcript: string;
  intent: Intent;
  enrichment: Enrichment;
  quotes: PartnerQuote[];
  responseText: string;
}

export interface ConfirmOrderRequest {
  orderId: string;
  partner: PartnerCode;
}

export interface ConfirmOrderResponse {
  orderId: string;
  status: OrderStatus;
  partner: PartnerCode;
  responseText: string;
}
