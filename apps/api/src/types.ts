// Types nội bộ của API - nguồn sự thật cho OpenAPI spec
// Mobile codegen từ /api-json, không dùng file này trực tiếp

export enum OrderType {
  RIDE = 'RIDE',
  FOOD = 'FOOD',
}

export enum OrderStatus {
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PartnerCode {
  GRAB = 'GRAB',
  BE = 'BE',
  XANH_SM = 'XANH_SM',
  SHOPEE = 'SHOPEE',
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
  latitude?: number;
  longitude?: number;
  /** false khi không tìm thấy địa điểm khớp trong DB/fixtures — chỉ là fallback echo lại query */
  matched?: boolean;
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

export interface OrderedItem {
  menuItemId: string;
  name: string;
  qty: number;
  priceVnd: number;
}

export interface FoodQuote {
  partner: PartnerCode;
  subtotalVnd: number;
  deliveryFeeVnd: number;
  discountVnd: number;
  totalVnd: number;
  promoDescription?: string;
  etaMinutes: number;
  driverName?: string;
  available: boolean;
}

export interface PartnerRestaurant {
  partner: PartnerCode;
  restaurantId: string;
  name: string;
  address: string;
  rating: number; // partner seed rating (cold-start fallback)
  displayRating: number; // accessAiAvgRating ?? partnerRating
  reviewCount: number;
  deliveryFeeVnd: number;
  minOrderVnd: number;
  cuisineType: string;
  keywords: string[];
  available: boolean;
  openHour: number;
  closeHour: number;
}

export interface VoiceOrderResponse {
  orderId: string;
  transcript: string;
  intent: Intent;
  enrichment: Enrichment;
  quotes: PartnerQuote[];
  foodQuotes?: FoodQuote[];
  resolvedRestaurant?: {
    id: string;
    partner: string;
    name: string;
    address: string;
    isOpen: boolean;
  };
  resolvedItems?: OrderedItem[];
  responseText: string;
}

export interface ConfirmOrderResponse {
  orderId: string;
  status: OrderStatus;
  partner: PartnerCode;
  responseText: string;
}
