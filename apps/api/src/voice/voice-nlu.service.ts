import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  VoiceIntent,
  VoiceNluResult,
  VoiceSessionContext,
} from './voice.types';
import { VoiceEnvService } from './voice-env.service';

const GLOBAL_PATTERNS: [RegExp, VoiceIntent][] = [
  [/(huy|hủy|cancel)/i, 'GLOBAL_CANCEL'],
  [/(quay lai|quay lại|lui|lùi|back)/i, 'GLOBAL_BACK'],
  [/(lap lai|lặp lại|noi lai|nói lại|nhac lai|nhắc lại)/i, 'GLOBAL_REPEAT'],
  [
    /(doc lai lua chon|đọc lại lựa chọn|doc lai danh sach|đọc lại danh sách)/i,
    'GLOBAL_REPEAT_OPTIONS',
  ],
  [/(nghe them|nghe thêm|con gi nua|còn gì nữa|xem them|xem thêm)/i, 'GLOBAL_MORE_OPTIONS'],
  [/(tro giup|trợ giúp|huong dan|hướng dẫn|lam sao|làm sao|help)/i, 'GLOBAL_HELP'],
  [/(doc lai don|đọc lại đơn|gio hang co gi|giỏ hàng có gì)/i, 'GLOBAL_READ_ORDER'],
  [/(tam dung|tạm dừng|pause)/i, 'GLOBAL_PAUSE'],
  [/(tiep tuc|tiếp tục|resume)/i, 'GLOBAL_RESUME'],
  [/(dung lai|dừng lại|dung|dừng|stop)/i, 'GLOBAL_STOP'],
];

const YES_PATTERN =
  /^(dung|đúng|u|ừ|uh|ờ|ok|vang|vâng|roi|rồi|dong y|đồng ý|xac nhan|xác nhận|phai|phải|co|có|yes|yep|dat|đặt|di|đi|dung roi|đúng rồi|ok roi|ok rồi)$/i;
const NO_PATTERN =
  /^(khong|không|sai|khoan|chua|chưa|no|nope|thoi|thôi|dung|đừng|hong|hông|ko|khong phai|không phải|sai roi|sai rồi)$/i;

const NUMBER_MAP: Record<string, number> = {
  mot: 1,
  một: 1,
  hai: 2,
  ba: 3,
  bon: 4,
  bốn: 4,
  nam: 5,
  năm: 5,
  sau: 6,
  sáu: 6,
  bay: 7,
  bảy: 7,
  tam: 8,
  tám: 8,
  chin: 9,
  chín: 9,
  muoi: 10,
  mười: 10,
  doi: 2,
  đôi: 2,
};

const VALID_INTENTS = new Set<string>([
  'GLOBAL_CANCEL',
  'GLOBAL_BACK',
  'GLOBAL_REPEAT',
  'GLOBAL_REPEAT_OPTIONS',
  'GLOBAL_MORE_OPTIONS',
  'GLOBAL_HELP',
  'GLOBAL_READ_ORDER',
  'GLOBAL_PAUSE',
  'GLOBAL_RESUME',
  'GLOBAL_STOP',
  'CONFIRM_YES',
  'CONFIRM_NO',
  'NAVIGATE',
  'SELECT_OPTION',
  'REQUEST_SUGGESTIONS',
  'ORDER_FOOD',
  'CHOOSE_BY_DISH',
  'CHOOSE_BY_RESTAURANT',
  'SELECT_ITEM',
  'SET_QUANTITY',
  'ADD_MORE_ITEM',
  'CHECKOUT',
  'APPLY_VOUCHER',
  'SKIP_VOUCHER',
  'SELECT_PAYMENT',
  'UNKNOWN',
  'OUT_OF_SCOPE',
]);

interface LlmParseResponse {
  intent: VoiceIntent;
  confidence: number;
  slots: Record<string, string | number>;
}

@Injectable()
export class VoiceNluService {
  private readonly logger = new Logger(VoiceNluService.name);

  constructor(private readonly env: VoiceEnvService) {}

  async parse(
    transcript: string,
    session: VoiceSessionContext,
  ): Promise<VoiceNluResult> {
    const mode = this.env.get('NLU_MODE', 'llm');
    if (mode !== 'keyword') {
      const llmResult = await this.parseWithLlm(transcript, session);
      if (llmResult) return this.toResult(transcript, session, llmResult);
    }

    return this.parseKeyword(transcript, session);
  }

  parseKeyword(
    transcript: string,
    session: VoiceSessionContext,
  ): VoiceNluResult {
    const text = transcript.trim().toLowerCase();
    const slots: Record<string, string | number> = {};
    let intent: VoiceIntent = 'UNKNOWN';
    let confidence = 0.5;
    let isGlobal = false;

    for (const [pattern, globalIntent] of GLOBAL_PATTERNS) {
      if (pattern.test(text)) {
        intent = globalIntent;
        confidence = 0.9;
        isGlobal = true;
        break;
      }
    }

    if (!isGlobal && this.isConfirmState(session)) {
      if (YES_PATTERN.test(text)) {
        intent = 'CONFIRM_YES';
        confidence = 0.95;
        isGlobal = true;
      } else if (NO_PATTERN.test(text)) {
        intent = 'CONFIRM_NO';
        confidence = 0.95;
        isGlobal = true;
      }
    }

    if (!isGlobal && intent === 'UNKNOWN') {
      if (
        session.current_flow === null ||
        session.current_state === 'IDLE' ||
        session.current_state === 'GREETING'
      ) {
        this.parseEntryIntent(text, slots, (nextIntent, nextConfidence) => {
          intent = nextIntent;
          confidence = nextConfidence;
        });
      } else if (session.current_flow === 'NAV') {
        this.parseNavIntent(text, slots, (nextIntent, nextConfidence) => {
          intent = nextIntent;
          confidence = nextConfidence;
        });
      } else if (session.current_flow === 'FOOD') {
        this.parseFoodIntent(text, slots, (nextIntent, nextConfidence) => {
          intent = nextIntent;
          confidence = nextConfidence;
        });
      }
    }

    if (!isGlobal && intent === 'UNKNOWN' && session.last_offered_options.length) {
      const selected = this.parseOptionSelection(text, session);
      if (selected) {
        intent = 'SELECT_OPTION';
        confidence = selected.confidence;
        slots.option_index = selected.index;
        slots.option_name = selected.label;
      }
    }

    if (intent === 'UNKNOWN') {
      if (YES_PATTERN.test(text)) {
        intent = 'CONFIRM_YES';
        confidence = 0.85;
        isGlobal = true;
      } else if (NO_PATTERN.test(text)) {
        intent = 'CONFIRM_NO';
        confidence = 0.85;
        isGlobal = true;
      }
    }

    return {
      request_id: randomUUID(),
      session_id: session.session_id,
      transcript,
      intent,
      intent_confidence: confidence,
      is_global_command: isGlobal,
      slots,
      alternatives: [],
      timestamp: new Date().toISOString(),
    };
  }

  private parseEntryIntent(
    text: string,
    slots: Record<string, string | number>,
    setIntent: (intent: VoiceIntent, confidence: number) => void,
  ): void {
    if (/(dat xe|đặt xe|di toi|đi tới|di den|đi đến|dan toi|dẫn tới|cho minh toi|chở mình tới|navigate|chi duong|chỉ đường)/i.test(text)) {
      setIntent('NAVIGATE', 0.88);
      const destination = text.match(
        /(?:dat xe|đặt xe|di|đi|toi|tới|den|đến|dan|dẫn|cho minh|chở mình|chi duong|chỉ đường)\s+(?:toi\s+|tới\s+|den\s+|đến\s+)?(.+)/i,
      );
      if (destination?.[1]) slots.destination_query = destination[1].trim();
      return;
    }

    if (this.looksLikeFood(text)) {
      setIntent('ORDER_FOOD', 0.88);
      this.extractFoodSlots(text, slots);
      return;
    }

    if (/(goi y|gợi ý|suggest)/i.test(text)) {
      setIntent('REQUEST_SUGGESTIONS', 0.85);
    }
  }

  private parseNavIntent(
    text: string,
    slots: Record<string, string | number>,
    setIntent: (intent: VoiceIntent, confidence: number) => void,
  ): void {
    if (/(dat xe|đặt xe|di|đi|toi|tới|den|đến|dan|dẫn)/i.test(text)) {
      setIntent('NAVIGATE', 0.85);
      const destination = text.match(
        /(?:dat xe|đặt xe|di|đi|toi|tới|den|đến|dan|dẫn)\s+(?:toi\s+|tới\s+|den\s+|đến\s+)?(.+)/i,
      );
      if (destination?.[1]) slots.destination_query = destination[1].trim();
      return;
    }

    if (sessionNeedsFreeTextDestination(text)) {
      setIntent('NAVIGATE', 0.7);
      slots.destination_query = text.trim();
    }
  }

  private parseFoodIntent(
    text: string,
    slots: Record<string, string | number>,
    setIntent: (intent: VoiceIntent, confidence: number) => void,
  ): void {
    if (/(them mon|thêm món|them|thêm)/i.test(text)) {
      setIntent('ADD_MORE_ITEM', 0.88);
      return;
    }

    if (/(thanh toan|thanh toán|dat luon|đặt luôn|checkout|xong|hoan tat|hoàn tất)/i.test(text)) {
      setIntent('CHECKOUT', 0.9);
      return;
    }

    if (/(tien mat|tiền mặt|cash)/i.test(text)) {
      setIntent('SELECT_PAYMENT', 0.9);
      slots.payment_method = 'CASH';
      return;
    }

    if (/(vi dien tu|ví điện tử|vi|ví|momo|zalopay|wallet)/i.test(text)) {
      setIntent('SELECT_PAYMENT', 0.9);
      slots.payment_method = 'WALLET';
      return;
    }

    if (/(quan|quán|nha hang|nhà hàng|tiem|tiệm)/i.test(text)) {
      setIntent('CHOOSE_BY_RESTAURANT', 0.82);
      const restaurant = text.match(/(?:quan|quán|nha hang|nhà hàng|tiem|tiệm)\s+(.+)/i);
      if (restaurant?.[1]) slots.restaurant_query = restaurant[1].trim();
      return;
    }

    if (this.looksLikeFood(text)) {
      setIntent('ORDER_FOOD', 0.82);
      this.extractFoodSlots(text, slots);
    }
  }

  private looksLikeFood(text: string): boolean {
    return (
      /(dat do an|đặt đồ ăn|dat mon|đặt món|goi do an|gọi đồ ăn|order food|dat com|đặt cơm|dat pho|đặt phở|dat bun|đặt bún|muon an|muốn ăn|thich an|thích ăn)/i.test(
        text,
      ) ||
      /\b(pho|phở|bun|bún|com|cơm|banh|bánh|pizza|burger|ga ran|gà rán|kfc)\b/i.test(
        text,
      )
    );
  }

  private extractFoodSlots(
    text: string,
    slots: Record<string, string | number>,
  ): void {
    const quantityMatch = text.match(/\b(\d+|mot|một|hai|ba|bon|bốn|nam|năm|doi|đôi)\b/i);
    const qty = quantityMatch ? this.parseNumber(quantityMatch[1]) : null;
    if (qty) slots.quantity = qty;

    const restaurant = text.match(
      /(?:quan|quán|nha hang|nhà hàng|tiem|tiệm)\s+(.+?)(?:\s+(?:mon|món|goi|gọi)|$)/i,
    );
    if (restaurant?.[1]) slots.restaurant_query = restaurant[1].trim();

    const foodQuery =
      text.match(/(?:dat|đặt|goi|gọi|mua|muon an|muốn ăn|thich an|thích ăn)\s+(?:cho\s+(?:minh|mình|toi|tôi)\s+)?(?:\d+|mot|một|hai|ba|bon|bốn|nam|năm|doi|đôi)?\s*(?:phan|phần|ly|to|tô|cai|cái|suat|suất)?\s*(.+)/i)
        ?.at(1)
        ?.trim() ?? '';

    if (foodQuery && !/^(do an|đồ ăn|mon|món)$/i.test(foodQuery)) {
      slots.food_query = foodQuery;
    }
  }

  private parseOptionSelection(
    text: string,
    session: VoiceSessionContext,
  ): { index: number; label: string; confidence: number } | null {
    const numMatch = text.match(/\b(?:so\s+|số\s+)?(\d+|mot|một|hai|ba|bon|bốn|nam|năm)\b/i);
    if (numMatch?.[1]) {
      const index = this.parseNumber(numMatch[1]);
      const option = session.last_offered_options.find((o) => o.index === index);
      if (option) return { index: option.index, label: option.label, confidence: 0.92 };
    }

    const normalized = text.toLowerCase().replace(/[.,!?]+$/g, '');
    const option = session.last_offered_options.find((o) =>
      normalized.includes(o.label.toLowerCase()),
    );
    if (option) return { index: option.index, label: option.label, confidence: 0.85 };

    return null;
  }

  private parseNumber(text: string): number | null {
    const digitMatch = text.match(/\d+/);
    if (digitMatch) return Number.parseInt(digitMatch[0], 10);

    const normalized = text.trim().toLowerCase();
    return NUMBER_MAP[normalized] ?? null;
  }

  private isConfirmState(session: VoiceSessionContext): boolean {
    return (
      session.current_state === 'CONFIRMING' ||
      session.current_state === 'QUOTING' ||
      session.current_state === 'ORDER_PLACED'
    );
  }

  private async parseWithLlm(
    transcript: string,
    session: VoiceSessionContext,
  ): Promise<LlmParseResponse | null> {
    const baseUrl = this.env.get('LLM_BASE_URL', 'http://localhost:20128/v1');
    const model = this.env.get('LLM_MODEL', 'cx/gpt-5.5');
    const apiKey = this.env.get('LLM_API_KEY', '');
    const timeoutMs = Number.parseInt(this.env.get('LLM_TIMEOUT_MS', '30000'), 10);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: this.buildSystemPrompt(session) },
            ...session.conversation_history,
            { role: 'user', content: transcript },
          ],
          max_tokens: 150,
          temperature: 0,
        }),
      });

      clearTimeout(timer);

      if (!response.ok) {
        this.logger.warn(`LLM NLU HTTP ${response.status}: ${(await response.text()).slice(0, 160)}`);
        return null;
      }

      const data = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) return null;

      const parsed = JSON.parse(
        content.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim(),
      ) as Partial<LlmParseResponse>;

      if (!parsed.intent || !VALID_INTENTS.has(parsed.intent)) {
        this.logger.warn(`LLM NLU invalid intent: ${String(parsed.intent)}`);
        return null;
      }

      return {
        intent: parsed.intent,
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        slots: parsed.slots ?? {},
      };
    } catch (error) {
      clearTimeout(timer);
      this.logger.warn(`LLM NLU fallback: ${String(error)}`);
      return null;
    }
  }

  private toResult(
    transcript: string,
    session: VoiceSessionContext,
    parsed: LlmParseResponse,
  ): VoiceNluResult {
    return {
      request_id: randomUUID(),
      session_id: session.session_id,
      transcript,
      intent: parsed.intent,
      intent_confidence: parsed.confidence,
      is_global_command:
        parsed.intent.startsWith('GLOBAL_') ||
        parsed.intent === 'CONFIRM_YES' ||
        parsed.intent === 'CONFIRM_NO',
      slots: parsed.slots,
      alternatives: [],
      timestamp: new Date().toISOString(),
    };
  }

  private buildSystemPrompt(session: VoiceSessionContext): string {
    const optionsDesc = session.last_offered_options.length
      ? `\nCac lua chon dang hien thi: ${JSON.stringify(
          session.last_offered_options.map((option) => ({
            index: option.index,
            label: option.label,
            ref_type: option.ref_type,
          })),
        )}`
      : '\nKhong co lua chon nao dang hien thi.';

    const lastOrder = session.last_order_id
      ? `\nDang co orderId: ${session.last_order_id}`
      : '';

    return `Ban la NLU parser cho voice assistant tieng Viet trong app dat xe/dat do an.
Tra ve JSON duy nhat, khong markdown:
{"intent":"<intent>","confidence":0.0,"slots":{}}

Trang thai hien tai:
- Flow: ${session.current_flow ?? 'chua chon'}
- State: ${session.current_state}${optionsDesc}${lastOrder}

Intent hop le:
GLOBAL_CANCEL, GLOBAL_BACK, GLOBAL_REPEAT, GLOBAL_REPEAT_OPTIONS, GLOBAL_MORE_OPTIONS, GLOBAL_HELP, GLOBAL_READ_ORDER, GLOBAL_PAUSE, GLOBAL_RESUME, GLOBAL_STOP, CONFIRM_YES, CONFIRM_NO,
NAVIGATE, SELECT_OPTION, REQUEST_SUGGESTIONS,
ORDER_FOOD, CHOOSE_BY_DISH, CHOOSE_BY_RESTAURANT, SELECT_ITEM, SET_QUANTITY, ADD_MORE_ITEM, CHECKOUT, APPLY_VOUCHER, SKIP_VOUCHER, SELECT_PAYMENT,
UNKNOWN, OUT_OF_SCOPE.

Quy tac:
- "dat xe toi/di toi/dan toi/cho minh toi" -> NAVIGATE, slot destination_query.
- "dat do an/dat mon/muon an/dat pho/com/bun" -> ORDER_FOOD, slot food_query va quantity neu co.
- Khi co lua chon, "so mot/hai/ba" hoac "1/2/3" -> SELECT_OPTION, slot option_index.
- "dung/ok/vang/co" khi dang xac nhan -> CONFIRM_YES.
- "khong/sai/khoan" khi dang xac nhan -> CONFIRM_NO.
- "tien mat" -> SELECT_PAYMENT payment_method CASH; "vi dien tu" -> WALLET.`;
  }
}

function sessionNeedsFreeTextDestination(text: string): boolean {
  const cleaned = text.trim();
  if (/^(?:so\s+|số\s+)?(?:\d+|mot|một|hai|ba|bon|bốn|nam|năm)$/i.test(cleaned)) {
    return false;
  }
  return cleaned.length >= 2 && !/(tro giup|trợ giúp|huy|hủy)/i.test(cleaned);
}
