import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { VoiceSessionContext } from './voice.types';

@Injectable()
export class VoiceSessionStore {
  private readonly sessions = new Map<string, VoiceSessionContext>();

  create(userId?: string): VoiceSessionContext {
    const session: VoiceSessionContext = {
      session_id: randomUUID(),
      user_id: userId ?? randomUUID(),
      locale: 'vi-VN',
      user_location: { lat: 10.7769, lng: 106.7009, accuracy_m: 12 },
      saved_address: '12 Nguyen Hue, Quan 1',
      current_flow: null,
      current_state: 'GREETING',
      slots_filled: {},
      last_offered_options: [],
      retry_count: 0,
      last_prompt_ssml: '',
      last_nlg_request: null,
      turn_index: 0,
      updated_at: new Date().toISOString(),
      conversation_history: [],
    };

    this.sessions.set(session.session_id, session);
    return session;
  }

  get(sessionId: string): VoiceSessionContext | null {
    return this.sessions.get(sessionId) ?? null;
  }

  save(session: VoiceSessionContext): void {
    session.updated_at = new Date().toISOString();
    this.sessions.set(session.session_id, session);
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  list(): string[] {
    return [...this.sessions.keys()];
  }
}
