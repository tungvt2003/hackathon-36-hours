import { Injectable, Logger } from '@nestjs/common';

export interface SessionData {
  session_id: string;
  intent: string;
  step: string;
  user_location?: { lat: number; lng: number };
  // Lưu kết quả từ bước trước để dùng ở bước sau
  last_restaurants?: { id: string; name: string }[];
  selected_restaurant_id?: string;
  selected_items?: { item_id: string; quantity: number }[];
  order_id?: string;
  created_at: number;
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 phút

@Injectable()
export class SessionCacheService {
  private readonly logger = new Logger(SessionCacheService.name);
  private readonly store = new Map<string, SessionData>();

  /** Lấy session, trả undefined nếu không tồn tại hoặc đã hết hạn */
  get(sessionId: string): SessionData | undefined {
    const session = this.store.get(sessionId);
    if (!session) return undefined;

    if (Date.now() - session.created_at > SESSION_TTL_MS) {
      this.store.delete(sessionId);
      this.logger.log(`[session-cache] Session expired: ${sessionId}`);
      return undefined;
    }

    return session;
  }

  /** Tạo session mới hoặc ghi đè */
  set(sessionId: string, data: Omit<SessionData, 'created_at'>): SessionData {
    const existing = this.store.get(sessionId);
    const session: SessionData = {
      ...existing,       // giữ lại fields cũ (vd: last_restaurants khi sang select_restaurant)
      ...data,
      created_at: existing?.created_at ?? Date.now(),
    };
    this.store.set(sessionId, session);
    this.logger.log(`[session-cache] Set session=${sessionId} step=${session.step}`);
    return session;
  }

  /** Merge thêm data vào session đang có */
  merge(sessionId: string, partial: Partial<SessionData>): SessionData | undefined {
    const existing = this.get(sessionId);
    if (!existing) return undefined;
    const updated = { ...existing, ...partial };
    this.store.set(sessionId, updated);
    return updated;
  }

  /** Xóa session */
  delete(sessionId: string): void {
    this.store.delete(sessionId);
  }

  /** Dọn session hết hạn (có thể gọi định kỳ) */
  cleanup(): void {
    const now = Date.now();
    let count = 0;
    for (const [id, session] of this.store.entries()) {
      if (now - session.created_at > SESSION_TTL_MS) {
        this.store.delete(id);
        count++;
      }
    }
    if (count > 0) this.logger.log(`[session-cache] Cleaned up ${count} expired sessions`);
  }

  get size(): number {
    return this.store.size;
  }
}
