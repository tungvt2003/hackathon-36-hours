// §4 — Payload schemas + §5 Intent taxonomy + §6 Slot/Entity

// ── Enums ───────────────────────────────────────────────────

export type Flow = "FOOD" | "NAV";

export type NavState =
  | "CAPTURE_DESTINATION"
  | "DISAMBIGUATE"
  | "CONFIRM_DESTINATION"
  | "SELECT_VEHICLE"
  | "CONFIRM_BOOKING"
  | "BOOKING_PLACED";

export type FoodState =
  | "CHOOSE_ENTRY"
  | "SELECT_RESTAURANT"
  | "BROWSE_MENU"
  | "SET_QUANTITY"
  | "REVIEW_CART"
  | "VOUCHER_OFFER"
  | "APPLY_VOUCHER_CONFIRM"
  | "SELECT_PAYMENT"
  | "CONFIRM_ORDER"
  | "ORDER_PLACED";

export type DialogState = NavState | FoodState | "IDLE" | "GREETING";

export type PaymentMethod = "WALLET" | "CASH";

export type PlaceStatusState = "available" | "closed" | "warning";

export type ConfirmationKind =
  | "APPLY_VOUCHER"
  | "PLACE_ORDER"
  | "BOOK_RIDE"
  | "CANCEL_CONFIRM";

// §5 — Intent taxonomy

export type GlobalIntent =
  | "GLOBAL_CANCEL"
  | "GLOBAL_BACK"
  | "GLOBAL_REPEAT"
  | "GLOBAL_REPEAT_OPTIONS"
  | "GLOBAL_MORE_OPTIONS"
  | "GLOBAL_HELP"
  | "GLOBAL_READ_ORDER"
  | "GLOBAL_PAUSE"
  | "GLOBAL_RESUME"
  | "GLOBAL_STOP"
  | "CONFIRM_YES"
  | "CONFIRM_NO";

export type NavIntent =
  | "NAVIGATE"
  | "SELECT_OPTION"
  | "REQUEST_SUGGESTIONS";

export type FoodIntent =
  | "ORDER_FOOD"
  | "CHOOSE_BY_DISH"
  | "CHOOSE_BY_RESTAURANT"
  | "REQUEST_SUGGESTIONS"
  | "SELECT_OPTION"
  | "SELECT_ITEM"
  | "SET_QUANTITY"
  | "ADD_MORE_ITEM"
  | "CHECKOUT"
  | "APPLY_VOUCHER"
  | "SKIP_VOUCHER"
  | "SELECT_PAYMENT";

export type FallbackIntent = "UNKNOWN" | "OUT_OF_SCOPE";

export type Intent = GlobalIntent | NavIntent | FoodIntent | FallbackIntent;

// ── §4.1 SessionContext ─────────────────────────────────────

export interface OptionEntry {
  index: number;
  ref_type: "PLACE" | "RESTAURANT" | "ITEM" | "VOUCHER" | "PAYMENT" | "GENERIC";
  ref_id: string;
  label: string;
}

export interface CartItem {
  item_id: string;
  name: string;
  unit_price: number;
  qty: number;
  line_total: number;
}

export interface CartVoucher {
  code: string;
  discount: number;
}

export interface ActiveCart {
  cart_id: string;
  restaurant_id: string;
  restaurant_name: string;
  items: CartItem[];
  subtotal: number;
  voucher: CartVoucher | null;
  shipping_fee: number;
  total: number;
  currency: string;
}

export interface ActiveBooking {
  booking_id: string;
  place_id: string;
  place_name: string;
  address: string;
  vehicle_type: string;
  vehicle_label: string;
  price: number;
  driver_name: string;
  driver_phone: string;
  license_plate: string;
  eta_min: number;
  status: string;
}

export interface PendingConfirmation {
  kind: ConfirmationKind;
  payload_ref: string;
  prompt_said: string;
}

export interface StateStackEntry {
  flow: Flow;
  state: DialogState;
  snapshot_ref: string;
}

export interface SessionContext {
  session_id: string;
  user_id: string;
  locale: string;
  user_location: { lat: number; lng: number; accuracy_m: number };
  saved_address: string;

  current_flow: Flow | null;
  current_state: DialogState;
  state_stack: StateStackEntry[];

  slots_filled: Record<string, string | number>;
  last_offered_options: OptionEntry[];

  pending_confirmation: PendingConfirmation | null;

  active_cart: ActiveCart | null;
  active_booking: ActiveBooking | null;

  retry_count: number;
  last_prompt_ssml: string;
  last_nlg_request: NLGRequest | null;
  turn_index: number;
  updated_at: string;

  // pagination for options
  _options_page: number;
  _all_options: OptionEntry[];

  // conversation history for LLM context
  conversation_history: { role: "user" | "assistant"; content: string }[];
}

// ── §4.2 ASRResult ──────────────────────────────────────────

export interface ASRResult {
  request_id: string;
  session_id: string;
  transcript: string;
  confidence: number;
  is_final: boolean;
  alternatives: { transcript: string; confidence: number }[];
  language: string;
  audio_duration_ms: number;
  barge_in: boolean;
}

// ── §4.3 NLUResult ──────────────────────────────────────────

export interface NLUResult {
  request_id: string;
  session_id: string;
  transcript: string;
  intent: Intent;
  intent_confidence: number;
  is_global_command: boolean;
  slots: Record<string, string | number>;
  alternatives: { intent: Intent; confidence: number }[];
  timestamp: string;
}

// ── §4.4 DialogAction ───────────────────────────────────────

export interface APICall {
  name: string;
  request: Record<string, unknown>;
}

export interface DialogAction {
  session_id: string;
  next_state: DialogState;
  api_call: APICall | null;
  nlg_request: NLGRequest;
  set_pending_confirmation: PendingConfirmation | null;
  push_state_stack: boolean;
  pop_state_stack: boolean;
  reset_retry: boolean;
}

// ── §4.5 NLGRequest / NLGResponse ───────────────────────────

export type NLGTemplate =
  | "OFFER_OPTIONS"
  | "CONFIRM_EXPLICIT"
  | "INFORM"
  | "DISAMBIGUATE"
  | "ERROR"
  | "NUDGE"
  | "GREETING"
  | "ORDER_SUMMARY";

export interface NLGOption {
  index: number;
  label: string;
  detail?: string;
}

export interface NLGRequest {
  template: NLGTemplate;
  status_line?: string;
  body?: string;
  options?: NLGOption[];
  has_more_options?: boolean;
  escape_hint?: string;
  confirm_question?: string;
  earcon_post?: string;
}

export interface NLGResponse {
  ssml: string;
  plain_text: string;
  earcon_pre: string | null;
  earcon_post: string | null;
  expects_input: boolean;
  expected_intents: Intent[];
}

// ── §4.6 TTSRequest ─────────────────────────────────────────

export interface TTSRequest {
  ssml: string;
  voice: string;
  rate: number;
  pitch: number;
  barge_in_enabled: boolean;
  earcon_pre: string | null;
  earcon_post: string | null;
}

// ── §7 API response envelope ────────────────────────────────

export interface APIResponse<T> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
}

// §7.1
export interface PlaceCandidate {
  place_id: string;
  name: string;
  address: string;
  distance_m: number;
  eta_min: number;
}

// §7.2
export interface PlaceStatusData {
  state: PlaceStatusState;
  opening_hours: { open: string; close: string; is_open_now: boolean };
  next_open: string;
  weather: { condition: string; severity: string; note: string } | null;
}

// §7.3 FareEstimate
export interface VehicleEstimate {
  vehicle_type: string;
  label: string;
  price: number;
  eta_min: number;
}

export interface FareEstimateData {
  place_id: string;
  distance_m: number;
  estimates: VehicleEstimate[];
}

// §7.10 BookRide
export interface BookRideData {
  booking_id: string;
  vehicle_type: string;
  vehicle_label: string;
  price: number;
  driver_name: string;
  driver_phone: string;
  license_plate: string;
  eta_min: number;
  status: string;
}

// §7.4
export interface RestaurantCandidate {
  restaurant_id: string;
  name: string;
  rating: number;
  eta_min: number;
  min_order: number;
}

// §7.5
export interface MenuItem {
  item_id: string;
  name: string;
  price: number;
  popular?: boolean;
}

export interface MenuCategory {
  name: string;
  items: MenuItem[];
}

export interface MenuData {
  restaurant_id: string;
  categories: MenuCategory[];
}

// §7.6
export interface PriceQuoteData {
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  currency: string;
}

// §7.7
export interface VoucherEntry {
  code: string;
  label: string;
  type: "fixed" | "percent";
  value: number;
  cap?: number;
  discount_applied: number;
}

// §7.9
export interface PlaceOrderData {
  order_id: string;
  total_charged: number;
  eta_min: number;
  status: string;
}
