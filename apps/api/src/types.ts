// Types nội bộ của API - nguồn sự thật cho OpenAPI spec
// Mobile codegen từ /api-json, không dùng file này trực tiếp

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

export interface VoiceOrderResponse {
  orderId: string;
  transcript: string;
  intent: Intent;
  enrichment: Enrichment;
  quotes: PartnerQuote[];
  responseText: string;
}

export interface ConfirmOrderResponse {
  orderId: string;
  status: OrderStatus;
  partner: PartnerCode;
  responseText: string;
}
