export enum OrderType {
  RIDE = 'RIDE',
  FOOD = 'FOOD',
}

export interface Intent {
  type: OrderType;
  restaurant?: string;
  items?: string[];
  origin?: string;
  destination?: string;
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

export interface PartnerQuote {
  partner: PartnerCode;
  price: number;
  etaMinutes: number;
  driverName?: string;
  available: boolean;
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

// ── Conversation API ──────────────────────────────────────────

export interface ConversationStartResponse {
  sessionId: string;
  promptText: string;
}

export interface ConversationInputResponse {
  sessionId: string;
  state: 'COLLECTING' | 'ORDERING' | 'DONE';
  missingField?: string;
  promptText: string;
  quotes?: PartnerQuote[];
  foodQuotes?: FoodQuote[];
  orderId?: string;
}

export interface ConversationConfirmResponse {
  sessionId: string;
  state: string;
  promptText: string;
  orderId: string;
}

// ── Order status ──────────────────────────────────────────────

export interface OrderStatusResponse {
  orderId: string;
  status: OrderStatus;
  partner?: string;
  responseText: string;
  etaMinutes?: number;
  partnerDriverId?: string;
  driverName?: string;
}

// ── Review ────────────────────────────────────────────────────

export interface ReviewRequest {
  restaurantRating: number;
  driverRating: number;
  voiceText?: string;
}

export interface ReviewResponse {
  reviewId: string;
  responseText: string;
  earnedPoints: number;
}

export interface RestaurantMatch {
  placeId: string;
  name: string;
  rating: number;
  distanceKm: number;
  etaMinutes: number;
  priceFrom: number;
  isOpen: boolean;
}

export interface OrderTrackingStatus {
  orderId: string;
  status: 'CONFIRMED' | 'PICKED_UP' | 'DELIVERING' | 'ARRIVING' | 'DELIVERED' | 'CANCELLED';
  etaMinutes: number;
  driver?: {
    name: string;
    rating: number;
    vehicle: string;
    plate: string;
  };
  confirmationCode?: string;
}

export interface OrderSummary {
  orderId: string;
  title: string;
  totalPrice: number;
  status: string;
  source: 'GrabFood' | 'GrabCar' | 'GrabBike';
  createdAt: string;
}

export interface RateOrderRequest {
  stars: number;
  tags?: string[];
  comment?: string;
}

export interface AccessibilityProfile {
  modes: ('VISUAL' | 'MOTOR' | 'HANDS_FREE')[];
  aiSpeed: 'SLOW' | 'NORMAL' | 'FAST';
}

// ── Voice API ─────────────────────────────────────────────────

export interface PlaceStatus {
  name: string;
  isOpen: boolean;
  address?: string;
  latitude?: number;
  longitude?: number;
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
