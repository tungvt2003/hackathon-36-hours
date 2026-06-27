export type VoiceFlow = 'FOOD' | 'NAV';

export type VoiceDialogState =
  | 'IDLE'
  | 'GREETING'
  | 'CAPTURE_DESTINATION'
  | 'CHOOSE_ENTRY'
  | 'QUOTING'
  | 'CONFIRMING'
  | 'ORDER_PLACED';

export type VoiceIntent =
  | 'GLOBAL_CANCEL'
  | 'GLOBAL_BACK'
  | 'GLOBAL_REPEAT'
  | 'GLOBAL_REPEAT_OPTIONS'
  | 'GLOBAL_MORE_OPTIONS'
  | 'GLOBAL_HELP'
  | 'GLOBAL_READ_ORDER'
  | 'GLOBAL_PAUSE'
  | 'GLOBAL_RESUME'
  | 'GLOBAL_STOP'
  | 'CONFIRM_YES'
  | 'CONFIRM_NO'
  | 'NAVIGATE'
  | 'SELECT_OPTION'
  | 'REQUEST_SUGGESTIONS'
  | 'ORDER_FOOD'
  | 'CHOOSE_BY_DISH'
  | 'CHOOSE_BY_RESTAURANT'
  | 'SELECT_ITEM'
  | 'SET_QUANTITY'
  | 'ADD_MORE_ITEM'
  | 'CHECKOUT'
  | 'APPLY_VOUCHER'
  | 'SKIP_VOUCHER'
  | 'SELECT_PAYMENT'
  | 'UNKNOWN'
  | 'OUT_OF_SCOPE';

export type VoiceOptionRefType =
  | 'PLACE'
  | 'RESTAURANT'
  | 'ITEM'
  | 'VOUCHER'
  | 'PAYMENT'
  | 'PARTNER'
  | 'GENERIC';

export interface VoiceOptionEntry {
  index: number;
  ref_type: VoiceOptionRefType;
  ref_id: string;
  label: string;
}

export interface VoiceNlgOption {
  index: number;
  label: string;
  detail?: string;
}

export type VoiceNlgTemplate =
  | 'OFFER_OPTIONS'
  | 'CONFIRM_EXPLICIT'
  | 'INFORM'
  | 'DISAMBIGUATE'
  | 'ERROR'
  | 'NUDGE'
  | 'GREETING'
  | 'ORDER_SUMMARY';

export interface VoiceNlgRequest {
  template: VoiceNlgTemplate;
  status_line?: string;
  body?: string;
  options?: VoiceNlgOption[];
  has_more_options?: boolean;
  escape_hint?: string;
  confirm_question?: string;
  earcon_post?: string;
}

export interface VoiceNlgResponse {
  ssml: string;
  plain_text: string;
  earcon_pre: string | null;
  earcon_post: string | null;
  expects_input: boolean;
  expected_intents: VoiceIntent[];
}

export interface VoiceNluResult {
  request_id: string;
  session_id: string;
  transcript: string;
  intent: VoiceIntent;
  intent_confidence: number;
  is_global_command: boolean;
  slots: Record<string, string | number>;
  alternatives: { intent: VoiceIntent; confidence: number }[];
  timestamp: string;
}

export interface VoiceAsrResult {
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

export interface VoiceTtsResult {
  audio_url: string | null;
  audio_base64: string | null;
  duration_ms: number;
  voice: string;
  error: string | null;
}

export interface VoiceSessionContext {
  session_id: string;
  user_id: string;
  locale: string;
  user_location: { lat: number; lng: number; accuracy_m: number };
  saved_address: string;
  current_flow: VoiceFlow | null;
  current_state: VoiceDialogState;
  slots_filled: Record<string, string | number>;
  last_offered_options: VoiceOptionEntry[];
  retry_count: number;
  last_prompt_ssml: string;
  last_nlg_request: VoiceNlgRequest | null;
  turn_index: number;
  updated_at: string;
  conversation_history: { role: 'user' | 'assistant'; content: string }[];
  last_order_id?: string;
}

export interface VoiceTurnInput {
  session_id?: string;
  transcript?: string;
  audio_base64?: string;
  sample_rate?: number;
  user_id?: string;
  currentLat?: number;
  currentLng?: number;
  accessibilityFlag?: boolean;
}

export interface VoiceTurnOutput {
  session_id: string;
  turn_index: number;
  asr: VoiceAsrResult | null;
  nlu: VoiceNluResult;
  nlg: VoiceNlgResponse;
  tts: VoiceTtsResult | null;
  orderId?: string;
  quotes?: unknown[];
  foodQuotes?: unknown[];
  session_state: {
    current_flow: VoiceFlow | null;
    current_state: VoiceDialogState;
    last_order_id?: string;
    last_offered_options: VoiceOptionEntry[];
  };
}
