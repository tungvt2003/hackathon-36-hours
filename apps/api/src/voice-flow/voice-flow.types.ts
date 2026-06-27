/** Contract types cho luồng giao tiếp AI Service <-> Backend */

export type VoiceFlowStep =
  // Food order steps
  | 'search_restaurant'
  | 'select_restaurant'
  | 'confirm_order'
  | 'change_item'          // đổi món giữa chừng (food)
  // Ride booking steps
  | 'select_destination'
  | 'confirm_ride'
  | 'change_destination'   // đổi điểm đến giữa chừng (ride)
  // Common steps
  | 'cancel';              // hủy đơn bất kể food hay ride

export type VoiceFlowIntent = 'food_order' | 'ride_booking';

export interface UserLocation {
  lat: number;
  lng: number;
}

// ── Requests (AI Service -> Backend) ─────────────────────────────────────────

export interface VoiceFlowRequest {
  session_id: string;
  intent: VoiceFlowIntent;
  step: VoiceFlowStep;
  user_location: UserLocation;
  payload: Record<string, unknown>;
}

// Food payloads
export interface SearchRestaurantPayload {
  query: string;
}

export interface SelectRestaurantPayload {
  restaurant_id: string;
  query?: string;
}

export interface OrderItem {
  item_id: string;
  quantity: number;
}

export interface DeliveryAddress {
  label?: string;
  lat?: number;
  lng?: number;
  display?: string;
}

export interface ConfirmOrderPayload {
  restaurant_id: string;
  items: OrderItem[];
  delivery_address?: DeliveryAddress;
}

// Ride payloads
export interface SelectDestinationPayload {
  destination: string;       // tên địa điểm user nói (AI đã parse)
  origin?: string;           // điểm xuất phát (nếu AI biết)
}

export interface ConfirmRidePayload {
  destination: string;
  origin?: string;
}

// Change / Cancel payloads
export interface ChangeItemPayload {
  restaurant_id: string;       // vẫn cùng quán
  items: OrderItem[];          // danh sách món mới thay thế hoàn toàn
  delivery_address?: DeliveryAddress;
}

export interface ChangeDestinationPayload {
  destination: string;         // địa điểm mới
  origin?: string;
}

// cancel không cần payload — session_id là đủ để tìm order
export type CancelPayload = Record<string, never>;

// ── Responses (Backend -> AI Service) ────────────────────────────────────────

export interface VoiceFlowResponse {
  session_id: string;
  step: VoiceFlowStep;
  status: 'success' | 'error' | 'cancelled';
  data?: unknown;
  message?: string;
}

// Food response types
export interface RestaurantResult {
  id: string;
  name: string;
  distance_km: number;
  estimated_delivery_min: number;
  rating: number;
}

export interface MenuItemResult {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface OrderedItemSummary {
  name: string;
  quantity: number;
  subtotal: number;
}

// Ride response types
export interface DestinationInfo {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

export interface WeatherResult {
  temp_c: number;
  condition: string;
  will_rain: boolean;
}

export interface RideQuote {
  partner: string;          // GRAB | BE | XANH_SM
  vehicle_type: string;     // GrabCar | beCar | XanhSM Car
  price: number;            // VND
  eta_minutes: number;
  driver_name?: string;
  available: boolean;
}
