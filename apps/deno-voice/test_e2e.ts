import { getEnv } from "./config/env.ts";

/**
 * E2E Voice Pipeline Test
 *
 * Uses VNPT TTS to generate user speech audio, sends it through the full pipeline:
 *   TTS (user voice) → STT → NLU → Dialog → NLG → TTS (assistant voice)
 *
 * Also tests text-only mode for comparison.
 *
 * Usage:
 *   # Text-only (no TTS/STT needed)
 *   ENABLE_TTS=false deno run --allow-net --allow-env --allow-read=.env test_e2e.ts
 *
 *   # Full audio pipeline (needs VNPT + Google keys)
 *   VNPT_ACCESS_TOKEN=... VNPT_TOKEN_ID=... VNPT_TOKEN_KEY=... \
 *     deno run --allow-net --allow-env --allow-read=.env test_e2e.ts --audio
 */

const BASE = getEnv("API_BASE", "http://localhost:8000");
const VNPT_BASE = getEnv("VNPT_BASE_URL", "https://api.idg.vnpt.vn");
const VNPT_ACCESS_TOKEN = getEnv("VNPT_ACCESS_TOKEN");
const VNPT_TOKEN_ID = getEnv("VNPT_TOKEN_ID");
const VNPT_TOKEN_KEY = getEnv("VNPT_TOKEN_KEY");

const AUDIO_MODE = Deno.args.includes("--audio");

// ── Conversation scripts ────────────────────────────────

interface ConvStep {
  user_says: string;
  expect_state?: string;
  expect_intent?: string;
}

const NAV_FLOW: ConvStep[] = [
  { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE" },
  { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_DESTINATION" },
  { user_says: "đúng rồi", expect_intent: "CONFIRM_YES", expect_state: "SELECT_VEHICLE" },
  { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_BOOKING" },
  { user_says: "đúng rồi", expect_intent: "CONFIRM_YES", expect_state: "BOOKING_PLACED" },
];

const FOOD_FLOW: ConvStep[] = [
  { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
  { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU" },
  { user_says: "phở tái", expect_intent: "SELECT_OPTION", expect_state: "SET_QUANTITY" },
  { user_says: "cho mình hai phần", expect_intent: "SET_QUANTITY", expect_state: "REVIEW_CART" },
  { user_says: "thanh toán", expect_intent: "CHECKOUT", expect_state: "VOUCHER_OFFER" },
  { user_says: "bỏ qua", expect_intent: "SKIP_VOUCHER", expect_state: "SELECT_PAYMENT" },
  { user_says: "tiền mặt", expect_intent: "SELECT_PAYMENT", expect_state: "CONFIRM_ORDER" },
  { user_says: "xác nhận đặt đơn", expect_intent: "CONFIRM_YES", expect_state: "ORDER_PLACED" },
];

// ── TTS: generate user audio ────────────────────────────

async function generateUserAudio(text: string): Promise<string | null> {
  if (!VNPT_ACCESS_TOKEN) return null;

  const url = `${VNPT_BASE}/tts-service/v2/standard`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${VNPT_ACCESS_TOKEN}`,
      "Token-id": VNPT_TOKEN_ID,
      "Token-key": VNPT_TOKEN_KEY,
    },
    body: JSON.stringify({
      text,
      model: "news",
      region: "female_north",
      speed: 1.0,
      audio_format: "wav",
      auto_silence: true,
      use_abbr_converter: true,
      domain: "general",
    }),
  });

  if (!resp.ok) {
    console.error(`  [TTS gen] HTTP ${resp.status}`);
    return null;
  }

  const data = await resp.json();
  const obj = data.object ?? {};
  if (obj.code === "success" && obj.playlist?.length > 0) {
    return obj.playlist[0].audio_link ?? null;
  }
  return null;
}

async function downloadAsBase64(audioUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(audioUrl);
    if (!resp.ok) return null;
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  } catch {
    return null;
  }
}

// ── API calls ───────────────────────────────────────────

async function createSession(): Promise<{ session_id: string; greeting: string; audio_url: string | null }> {
  const resp = await fetch(`${BASE}/session`, { method: "POST" });
  const data = await resp.json();
  return {
    session_id: data.data.session_id,
    greeting: data.data.greeting,
    audio_url: data.data.audio_url,
  };
}

// deno-lint-ignore no-explicit-any
async function sendTurn(sessionId: string, payload: Record<string, unknown>): Promise<Record<string, any>> {
  const resp = await fetch(`${BASE}/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, ...payload }),
  });
  const data = await resp.json();
  if (!data.ok) {
    return {
      asr_transcript: "(error)",
      asr_confidence: 0,
      transcript: "(error)",
      intent: "UNKNOWN",
      intent_confidence: 0,
      response_text: data.error ?? "Unknown error",
      audio_url: null,
      state: { current_state: "ERROR" },
    };
  }
  return data.data;
}

// ── Test runner ─────────────────────────────────────────

async function runConversation(name: string, steps: ConvStep[]) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`  Mode: ${AUDIO_MODE ? "AUDIO (TTS→STT→NLU→Dialog→NLG→TTS)" : "TEXT (NLU→Dialog→NLG)"}`);
  console.log(`${"═".repeat(60)}`);

  const session = await createSession();
  console.log(`\n  Session: ${session.session_id}`);
  console.log(`  🤖 ${session.greeting.slice(0, 90)}...`);
  if (session.audio_url) {
    console.log(`  🔊 ${session.audio_url.slice(0, 70)}...`);
  }

  let passed = 0;
  let failed = 0;

  for (const step of steps) {
    console.log(`\n  👤 "${step.user_says}"`);

    // deno-lint-ignore no-explicit-any
    let result: Record<string, any>;

    if (AUDIO_MODE) {
      // Full audio pipeline: TTS → download → base64 → send as audio
      console.log(`     ⏳ Generating audio via TTS...`);
      const audioUrl = await generateUserAudio(step.user_says);
      if (!audioUrl) {
        console.log(`     ❌ TTS failed — falling back to text`);
        result = await sendTurn(session.session_id, { transcript: step.user_says });
      } else {
        console.log(`     📥 Downloading audio...`);
        const audioB64 = await downloadAsBase64(audioUrl);
        if (!audioB64) {
          console.log(`     ❌ Download failed — falling back to text`);
          result = await sendTurn(session.session_id, { transcript: step.user_says });
        } else {
          console.log(`     📤 Sending audio to pipeline (${(audioB64.length / 1024).toFixed(0)}KB)...`);
          result = await sendTurn(session.session_id, {
            audio_base64: audioB64,
            sample_rate: 22050,
          });
          console.log(`     🎤 STT heard: "${result.asr_transcript}" (${((result.asr_confidence ?? 0) * 100).toFixed(0)}%)`);
        }
      }
    } else {
      result = await sendTurn(session.session_id, { transcript: step.user_says });
    }

    const intent = result.intent;
    const state = result.state?.current_state;
    const response = result.response_text?.slice(0, 100);
    const audioUrl = result.audio_url;

    // Check expectations
    let intentOk = true;
    let stateOk = true;
    if (step.expect_intent && intent !== step.expect_intent) {
      intentOk = false;
    }
    if (step.expect_state && state !== step.expect_state) {
      stateOk = false;
    }

    const statusIcon = intentOk && stateOk ? "✅" : "❌";
    if (intentOk && stateOk) passed++; else failed++;

    console.log(`     ${statusIcon} ${intent} (${result.intent_confidence}) → [${state}]`);
    if (!intentOk) console.log(`        ⚠ Expected intent: ${step.expect_intent}`);
    if (!stateOk) console.log(`        ⚠ Expected state: ${step.expect_state}`);
    console.log(`     🤖 ${response}`);
    if (audioUrl) console.log(`     🔊 ${audioUrl.slice(0, 70)}...`);
  }

  console.log(`\n  ──────────────────────────────────`);
  console.log(`  Results: ${passed} passed, ${failed} failed / ${steps.length} total`);

  return { passed, failed };
}

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   Voice Assistant — E2E Pipeline Test          ║");
  console.log("╚════════════════════════════════════════════════╝");

  // Check server health
  try {
    const healthResp = await fetch(`${BASE}/health`);
    if (!healthResp.ok) throw new Error("Server not healthy");
    console.log(`\n✅ Server OK at ${BASE}`);
  } catch {
    console.error(`\n❌ Server not running at ${BASE}`);
    console.error(`   Start it first: deno run --allow-net --allow-env main.ts`);
    Deno.exit(1);
  }

  if (AUDIO_MODE && !VNPT_ACCESS_TOKEN) {
    console.error("\n❌ --audio mode requires VNPT_ACCESS_TOKEN env var");
    Deno.exit(1);
  }

  const r1 = await runConversation("🧭 Navigation Flow", NAV_FLOW);
  const r2 = await runConversation("🍜 Food Ordering Flow", FOOD_FLOW);

  const totalPassed = r1.passed + r2.passed;
  const totalFailed = r1.failed + r2.failed;
  const total = totalPassed + totalFailed;

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  TOTAL: ${totalPassed}/${total} passed${totalFailed > 0 ? ` (${totalFailed} FAILED)` : ""}`);
  console.log(`${"═".repeat(60)}\n`);

  if (totalFailed > 0) Deno.exit(1);
}

main();
