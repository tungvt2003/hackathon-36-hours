import type { Intent, NLUResult, SessionContext } from "../types.ts";
import { parseNLU as keywordNLU } from "./nlu.ts";
import { getEnv } from "../config/env.ts";

const LLM_BASE_URL = getEnv("LLM_BASE_URL", "http://localhost:20128/v1");
const LLM_MODEL = getEnv("LLM_MODEL", "cx/gpt-5.5");
const LLM_TIMEOUT_MS = 15000;

const VALID_INTENTS = new Set<string>([
  "GLOBAL_CANCEL", "GLOBAL_BACK", "GLOBAL_REPEAT", "GLOBAL_REPEAT_OPTIONS",
  "GLOBAL_MORE_OPTIONS", "GLOBAL_HELP", "GLOBAL_READ_ORDER",
  "GLOBAL_PAUSE", "GLOBAL_RESUME", "GLOBAL_STOP",
  "CONFIRM_YES", "CONFIRM_NO",
  "NAVIGATE", "SELECT_OPTION", "REQUEST_SUGGESTIONS",
  "ORDER_FOOD", "CHOOSE_BY_DISH", "CHOOSE_BY_RESTAURANT",
  "SELECT_ITEM", "SET_QUANTITY", "ADD_MORE_ITEM",
  "CHECKOUT", "APPLY_VOUCHER", "SKIP_VOUCHER", "SELECT_PAYMENT",
  "UNKNOWN", "OUT_OF_SCOPE",
]);

function buildSystemPrompt(session: SessionContext): string {
  const optionsDesc = session.last_offered_options.length > 0
    ? `\nCác lựa chọn đang hiển thị: ${JSON.stringify(session.last_offered_options.map(o => ({ index: o.index, label: o.label, ref_type: o.ref_type })))}`
    : "\nKhông có lựa chọn nào đang hiển thị.";

  const confirmDesc = session.pending_confirmation
    ? `\nĐang chờ xác nhận: ${session.pending_confirmation.kind} — "${session.pending_confirmation.prompt_said}"`
    : "";

  const cartDesc = session.active_cart
    ? `\nGiỏ hàng: ${session.active_cart.items.map(i => `${i.qty}x ${i.name}`).join(", ")}, tổng ${session.active_cart.total}`
    : "";

  return `Bạn là NLU parser cho voice assistant tiếng Việt (app dành cho người mù). Phân tích câu nói của user thành JSON.
App có 2 chức năng: đặt xe (kiểu Grab) và đặt đồ ăn.

Trạng thái hiện tại:
- Flow: ${session.current_flow ?? "chưa chọn"}
- State: ${session.current_state}${optionsDesc}${confirmDesc}${cartDesc}

Trả về JSON duy nhất (không markdown, không giải thích):
{
  "intent": "<intent>",
  "confidence": <0.0-1.0>,
  "slots": { ... }
}

Danh sách intent hợp lệ:
GLOBAL: GLOBAL_CANCEL, GLOBAL_BACK, GLOBAL_REPEAT, GLOBAL_REPEAT_OPTIONS, GLOBAL_MORE_OPTIONS, GLOBAL_HELP, GLOBAL_READ_ORDER, GLOBAL_PAUSE, GLOBAL_RESUME, GLOBAL_STOP, CONFIRM_YES, CONFIRM_NO
NAV (đặt xe): NAVIGATE (slot: destination_query), SELECT_OPTION (slot: option_index/option_name), REQUEST_SUGGESTIONS
FOOD: ORDER_FOOD (slot: food_query?, quantity?), CHOOSE_BY_DISH (slot: food_query), CHOOSE_BY_RESTAURANT (slot: restaurant_query), SELECT_OPTION (slot: option_index/option_name), SELECT_ITEM (slot: item_query/item_id), SET_QUANTITY (slot: quantity), ADD_MORE_ITEM, CHECKOUT, APPLY_VOUCHER (slot: voucher_index?), SKIP_VOUCHER, SELECT_PAYMENT (slot: payment_method: WALLET|CASH)
FALLBACK: UNKNOWN, OUT_OF_SCOPE

Quy tắc:
- "đặt xe tới/đi tới/dẫn tới/chở mình tới" → NAVIGATE với destination_query
- Khi state là SET_QUANTITY: số ("một","hai","ba","1","2","3") → SET_QUANTITY với slot quantity, KHÔNG phải SELECT_OPTION
- "số một/hai/ba" hoặc "1/2/3" khi có lựa chọn VÀ state KHÔNG phải SET_QUANTITY → SELECT_OPTION với option_index
- "đúng/ừ/ok/vâng/có" khi đang chờ xác nhận → CONFIRM_YES
- "không/sai/khoan" khi đang chờ xác nhận → CONFIRM_NO
- Số đếm: "một"=1, "hai"=2, "ba"=3, "bốn"=4, "năm"=5, "đôi"=2
- Ưu tiên global intent trước, sau đó flow-specific
- "tiền mặt" → SELECT_PAYMENT với payment_method: "CASH"
- "ví" hoặc "ví điện tử" → SELECT_PAYMENT với payment_method: "WALLET"`;
}

interface LLMResponse {
  intent: string;
  confidence: number;
  slots: Record<string, string | number>;
}

async function callLLM(
  transcript: string,
  session: SessionContext,
): Promise<LLMResponse | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const messages: { role: string; content: string }[] = [
      { role: "system", content: buildSystemPrompt(session) },
    ];
    // Add conversation history for context (last 10 turns)
    for (const msg of session.conversation_history) {
      messages.push(msg);
    }
    // Current user input
    messages.push({ role: "user", content: transcript });

    const resp = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        max_tokens: 150,
        temperature: 0,
      }),
    });

    clearTimeout(timer);

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error(`[LLM NLU] HTTP ${resp.status}: ${errBody.slice(0, 200)}`);
      return null;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON from response (handle possible markdown wrapping)
    const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonStr);

    if (!parsed.intent || !VALID_INTENTS.has(parsed.intent)) {
      console.error(`[LLM NLU] Invalid intent: ${parsed.intent}`);
      return null;
    }

    return {
      intent: parsed.intent,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.85,
      slots: parsed.slots ?? {},
    };
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      console.error("[LLM NLU] Timeout");
    } else {
      console.error(`[LLM NLU] Error: ${e}`);
    }
    return null;
  }
}

export async function parseLLM(
  transcript: string,
  session: SessionContext,
): Promise<NLUResult> {
  // Try LLM first
  const llmResult = await callLLM(transcript, session);

  if (llmResult) {
    const isGlobal = llmResult.intent.startsWith("GLOBAL_") ||
      llmResult.intent === "CONFIRM_YES" ||
      llmResult.intent === "CONFIRM_NO";

    console.log(`[LLM NLU] ✓ "${transcript}" → ${llmResult.intent} (${llmResult.confidence})`);

    return {
      request_id: crypto.randomUUID(),
      session_id: session.session_id,
      transcript,
      intent: llmResult.intent as Intent,
      intent_confidence: llmResult.confidence,
      is_global_command: isGlobal,
      slots: llmResult.slots,
      alternatives: [],
      timestamp: new Date().toISOString(),
    };
  }

  // Fallback to keyword-based NLU
  console.log(`[LLM NLU] ✗ Fallback to keyword NLU for "${transcript}"`);
  return keywordNLU(transcript, session);
}
