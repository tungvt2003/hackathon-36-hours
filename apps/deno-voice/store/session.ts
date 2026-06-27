import type { SessionContext } from "../types.ts";

const sessions = new Map<string, SessionContext>();

export function createSession(userId?: string): SessionContext {
  const session: SessionContext = {
    session_id: crypto.randomUUID(),
    user_id: userId ?? crypto.randomUUID(),
    locale: "vi-VN",
    user_location: { lat: 10.7769, lng: 106.7009, accuracy_m: 12 },
    saved_address: "12 Nguyễn Huệ, Quận 1",

    current_flow: null,
    current_state: "GREETING",
    state_stack: [],

    slots_filled: {},
    last_offered_options: [],

    pending_confirmation: null,

    active_cart: null,
    active_booking: null,

    retry_count: 0,
    last_prompt_ssml: "",
    last_nlg_request: null,
    turn_index: 0,
    updated_at: new Date().toISOString(),

    _options_page: 0,
    _all_options: [],

    conversation_history: [],
  };

  sessions.set(session.session_id, session);
  return session;
}

export function getSession(sessionId: string): SessionContext | null {
  return sessions.get(sessionId) ?? null;
}

export function saveSession(session: SessionContext): void {
  sessions.set(session.session_id, session);
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function listSessions(): string[] {
  return [...sessions.keys()];
}
