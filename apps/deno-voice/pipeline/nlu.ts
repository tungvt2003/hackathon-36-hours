import type { Intent, NLUResult, SessionContext } from "../types.ts";

const GLOBAL_PATTERNS: [RegExp, Intent][] = [
  [/(hủy|cancel)/i, "GLOBAL_CANCEL"],
  [/(quay lại|lùi|back)/i, "GLOBAL_BACK"],
  [/(lặp lại|nói lại|nhắc lại)/i, "GLOBAL_REPEAT"],
  [/(đọc lại lựa chọn|đọc lại danh sách)/i, "GLOBAL_REPEAT_OPTIONS"],
  [/(nghe thêm|còn gì nữa|xem thêm)/i, "GLOBAL_MORE_OPTIONS"],
  [/(trợ giúp|hướng dẫn|làm sao|help)/i, "GLOBAL_HELP"],
  [/(đọc lại đơn|giỏ hàng có gì|đơn hàng có gì)/i, "GLOBAL_READ_ORDER"],
  [/(tạm dừng|pause)/i, "GLOBAL_PAUSE"],
  [/(tiếp tục|tiếp|resume)/i, "GLOBAL_RESUME"],
  [/(dừng lại|dừng|stop)/i, "GLOBAL_STOP"],
];

const YES_PATTERN = /^(đúng|ừ|uh|ờ|ok|vâng|rồi|đồng ý|xác nhận|áp|phải|có|chắc|luôn|được|yes|yep|đặt|đi|đúng rồi|ừ rồi|ok rồi|xác nhận đặt đơn|xác nhận đặt|có chắc|đi thôi|đặt luôn|đặt đi|đúng đó)$/i;
const NO_PATTERN = /^(không|sai|khoan|chưa|no|nope|thôi|đừng|hong|hông|ko|sai rồi|không phải|không đúng|hông phải|thôi bỏ)$/i;

const NUMBER_MAP: Record<string, number> = {
  "một": 1, "hai": 2, "ba": 3, "bốn": 4, "năm": 5,
  "sáu": 6, "bảy": 7, "tám": 8, "chín": 9, "mười": 10,
  "đôi": 2,
};

function parseNumber(text: string): number | null {
  const digitMatch = text.match(/\d+/);
  if (digitMatch) return parseInt(digitMatch[0]);
  for (const [word, num] of Object.entries(NUMBER_MAP)) {
    if (text.includes(word)) return num;
  }
  return null;
}

export function parseNLU(
  transcript: string,
  session: SessionContext,
): NLUResult {
  const text = transcript.trim().toLowerCase();
  const slots: Record<string, string | number> = {};
  let intent: Intent = "UNKNOWN";
  let confidence = 0.5;
  let isGlobal = false;

  // 1) Check global commands first
  for (const [pattern, globalIntent] of GLOBAL_PATTERNS) {
    if (pattern.test(text)) {
      intent = globalIntent;
      confidence = 0.9;
      isGlobal = true;
      break;
    }
  }

  // 2) Check yes/no (in confirm-expecting states or when pending_confirmation exists)
  const confirmStates = ["CONFIRM_DESTINATION", "CONFIRM_BOOKING", "CONFIRM_ORDER", "APPLY_VOUCHER_CONFIRM"];
  if (!isGlobal && (session.pending_confirmation || confirmStates.includes(session.current_state))) {
    if (YES_PATTERN.test(text)) {
      intent = "CONFIRM_YES";
      confidence = 0.95;
      isGlobal = true;
    } else if (NO_PATTERN.test(text)) {
      intent = "CONFIRM_NO";
      confidence = 0.95;
      isGlobal = true;
    }
  }

  // 3) Flow-specific intents (checked BEFORE option selection to avoid label collision)
  if (!isGlobal && (intent as string) === "UNKNOWN") {
    if (session.current_flow === null || session.current_state === "IDLE" || session.current_state === "GREETING") {
      if (/(dẫn|đặt\s+xe|đi\s+(?:tới|đến)|đi\s+\S|navigate|chỉ đường|tới\s+\S)/i.test(text)) {
        intent = "NAVIGATE";
        confidence = 0.88;
        const destMatch = text.match(/(?:dẫn|đặt\s+xe|đi|tới|đến|chỉ đường)\s+(?:tới\s+|đến\s+|mình\s+(?:tới|đến)\s+)?(.+)/i);
        if (destMatch) slots["destination_query"] = destMatch[1].trim();
      } else if (/(đặt\s+đồ\s+ăn|đặt\s+món|gọi\s+đồ\s+ăn|order\s+food|đặt\s+đồ|đặt\s+cơm|đặt\s+phở|đặt\s+bún|đặt\s+cho)/i.test(text)) {
        intent = "ORDER_FOOD";
        confidence = 0.88;
        const foodMatch = text.match(/đặt\s+(?:cho\s+(?:mình|tôi|tui)\s+)?(\d+|một|hai|ba|bốn|năm)?\s*(?:phần|ly|tô|cái|suất)?\s*(.+)?/i);
        if (foodMatch) {
          if (foodMatch[1]) {
            const qty = parseNumber(foodMatch[1]);
            if (qty) slots["quantity"] = qty;
          }
          if (foodMatch[2]) {
            const fq = foodMatch[2].trim();
            if (fq && !/^(đồ\s*ăn|cho\s+mình|cho\s+tôi)$/i.test(fq)) slots["food_query"] = fq;
          }
        }
      } else if (/(gợi ý|suggest)/i.test(text)) {
        intent = "REQUEST_SUGGESTIONS";
        confidence = 0.85;
      } else if (/(muốn ăn|thích ăn)/i.test(text)) {
        intent = "ORDER_FOOD";
        confidence = 0.82;
        const match = text.match(/(?:muốn ăn|thích ăn)\s+(.+)/i);
        if (match) slots["food_query"] = match[1].trim();
      }
    }

    // NAV flow intents
    if (session.current_flow === "NAV" && intent === "UNKNOWN") {
      if (/(dẫn|đi|tới|đến)/i.test(text)) {
        intent = "NAVIGATE";
        confidence = 0.85;
        const destMatch = text.match(/(?:dẫn|đi|tới|đến)\s+(?:tới\s+|đến\s+)?(.+)/i);
        if (destMatch) slots["destination_query"] = destMatch[1].trim();
      } else if (/(gợi ý)/i.test(text)) {
        intent = "REQUEST_SUGGESTIONS";
        confidence = 0.80;
      }
    }

    // FOOD flow intents
    if (session.current_flow === "FOOD" && intent === "UNKNOWN") {
      if (/(quán|nhà hàng|tiệm)/i.test(text)) {
        intent = "CHOOSE_BY_RESTAURANT";
        confidence = 0.82;
        const match = text.match(/(?:quán|nhà hàng|tiệm)\s+(.+)/i);
        if (match) slots["restaurant_query"] = match[1].trim();
      } else if (/(muốn ăn|thích ăn)/i.test(text) && !/đặt/.test(text)) {
        intent = "CHOOSE_BY_DISH";
        confidence = 0.80;
        const match = text.match(/(?:muốn ăn|thích ăn)\s+(.+)/i);
        if (match) slots["food_query"] = match[1].trim();
      } else if (/(gợi ý)/i.test(text)) {
        intent = "REQUEST_SUGGESTIONS";
        confidence = 0.80;
      } else if (/(thêm món|thêm)/i.test(text)) {
        intent = "ADD_MORE_ITEM";
        confidence = 0.88;
      } else if (/(thanh toán|đặt luôn|checkout|xong|hoàn tất)/i.test(text)) {
        intent = "CHECKOUT";
        confidence = 0.90;
      } else if (/(voucher|mã giảm|giảm giá|khuyến mãi)/i.test(text) && !/không|bỏ qua|skip/.test(text)) {
        intent = "APPLY_VOUCHER";
        confidence = 0.85;
        const idxMatch = text.match(/(?:số\s+)?(\d+|một|hai|ba)/);
        if (idxMatch) {
          const idx = parseNumber(idxMatch[0]);
          if (idx) slots["voucher_index"] = idx;
        }
      } else if (/(không.*voucher|bỏ qua|skip|không giảm)/i.test(text)) {
        intent = "SKIP_VOUCHER";
        confidence = 0.88;
      } else if (/(tiền mặt|cash)/i.test(text)) {
        intent = "SELECT_PAYMENT";
        confidence = 0.90;
        slots["payment_method"] = "CASH";
      } else if (/(ví|wallet|momo|zalopay)/i.test(text)) {
        intent = "SELECT_PAYMENT";
        confidence = 0.90;
        slots["payment_method"] = "WALLET";
      }

      // SET_QUANTITY only in SET_QUANTITY state (not BROWSE_MENU where numbers mean option selection)
      if (
        intent === "UNKNOWN" &&
        session.current_state === "SET_QUANTITY"
      ) {
        const qty = parseNumber(text);
        if (qty !== null) {
          intent = "SET_QUANTITY";
          confidence = 0.80;
          slots["quantity"] = qty;
        }
      }

      // In BROWSE_MENU, if no intent matched and no option will match, try item name
      if (
        intent === "UNKNOWN" &&
        session.current_state === "BROWSE_MENU" &&
        session.last_offered_options.length > 0
      ) {
        // Don't set SELECT_ITEM if text looks like a number/option selection — let step 4 handle it
        const looksLikeOptionSelect = /^(số\s+)?(\d+|một|hai|ba|bốn|năm)$/.test(text.trim());
        if (!looksLikeOptionSelect) {
          intent = "SELECT_ITEM";
          confidence = 0.70;
          slots["item_query"] = text;
        }
      }
    }
  }

  // 4) Check option selection by number/name (after flow intents, to avoid label collisions)
  if (!isGlobal && (intent as string) === "UNKNOWN" && session.last_offered_options.length > 0) {
    const numMatch = text.match(/\b(số\s+)?(\d+|một|hai|ba|bốn|năm)\b/);
    if (numMatch) {
      const idx = parseNumber(numMatch[0]);
      if (idx !== null && idx >= 1 && idx <= session.last_offered_options.length) {
        intent = "SELECT_OPTION";
        slots["option_index"] = idx;
        confidence = 0.92;
      }
    }

    if ((intent as string) === "UNKNOWN") {
      for (const opt of session.last_offered_options) {
        if (text.includes(opt.label.toLowerCase())) {
          intent = "SELECT_OPTION";
          slots["option_name"] = opt.label;
          slots["option_index"] = opt.index;
          confidence = 0.85;
          break;
        }
      }
    }
  }

  // Yes/No fallback even without pending_confirmation (for states expecting it)
  if ((intent as string) === "UNKNOWN") {
    if (YES_PATTERN.test(text)) {
      intent = "CONFIRM_YES";
      confidence = 0.85;
      isGlobal = true;
    } else if (NO_PATTERN.test(text)) {
      intent = "CONFIRM_NO";
      confidence = 0.85;
      isGlobal = true;
    }
  }

  return {
    request_id: crypto.randomUUID(),
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
