import { getEnv } from "./config/env.ts";

/**
 * Comprehensive E2E Voice Pipeline Test
 *
 * Pre-generates all audio from TTS, caches to test_audio/, then runs all scenarios.
 *
 * Usage:
 *   # Step 1: Generate audio cache (only needed once)
 *   deno run --allow-net --allow-env --allow-write --allow-read test_full.ts --gen
 *
 *   # Step 2: Run tests with cached audio
 *   deno run --allow-net --allow-env --allow-read test_full.ts --audio
 *
 *   # Text-only mode (no audio needed)
 *   deno run --allow-net --allow-env --allow-read=.env test_full.ts
 */

const BASE = getEnv("API_BASE", "http://localhost:8000");
const VNPT_BASE = getEnv("VNPT_BASE_URL", "https://api.idg.vnpt.vn");
const VNPT_ACCESS_TOKEN = getEnv("VNPT_ACCESS_TOKEN");
const VNPT_TOKEN_ID = getEnv("VNPT_TOKEN_ID");
const VNPT_TOKEN_KEY = getEnv("VNPT_TOKEN_KEY");

const AUDIO_DIR = new URL("./test_audio/", import.meta.url).pathname;
const GEN_MODE = Deno.args.includes("--gen");
const AUDIO_MODE = Deno.args.includes("--audio");

// ── All unique phrases ─────────────────────────────────────

const ALL_PHRASES = [
  "dẫn mình tới nhà sách",
  "dẫn mình tới sân bay",
  "số một",
  "số hai",
  "đúng rồi",
  "sai rồi",
  "không phải",
  "có bắt đầu đi",
  "tiếp tục",
  "dừng lại đi",
  "mình muốn hủy",
  "lặp lại đi",
  "đặt cho mình phở",
  "đặt đồ ăn",
  "phở tái",
  "cho mình phở tái nạm",
  "cho mình hai phần",
  "cho mình một phần",
  "thanh toán đi",
  "bỏ qua đi",
  "tiền mặt",
  "ví điện tử",
  "xác nhận đặt đơn",
  "cho thêm món nữa",
  "trợ giúp mình",
  "hôm nay trời đẹp quá nhỉ",
  "quay lại đi",
  "đọc lại đơn hàng",
  "dẫn đường đi",
];

// ── Slug helper ────────────────────────────────────────────

function phraseSlug(phrase: string): string {
  const map: Record<string, string> = {
    "à":"a","á":"a","ả":"a","ã":"a","ạ":"a",
    "ă":"a","ắ":"a","ằ":"a","ẳ":"a","ẵ":"a","ặ":"a",
    "â":"a","ấ":"a","ầ":"a","ẩ":"a","ẫ":"a","ậ":"a",
    "è":"e","é":"e","ẻ":"e","ẽ":"e","ẹ":"e",
    "ê":"e","ế":"e","ề":"e","ể":"e","ễ":"e","ệ":"e",
    "ì":"i","í":"i","ỉ":"i","ĩ":"i","ị":"i",
    "ò":"o","ó":"o","ỏ":"o","õ":"o","ọ":"o",
    "ô":"o","ố":"o","ồ":"o","ổ":"o","ỗ":"o","ộ":"o",
    "ơ":"o","ớ":"o","ờ":"o","ở":"o","ỡ":"o","ợ":"o",
    "ù":"u","ú":"u","ủ":"u","ũ":"u","ụ":"u",
    "ư":"u","ứ":"u","ừ":"u","ử":"u","ữ":"u","ự":"u",
    "ỳ":"y","ý":"y","ỷ":"y","ỹ":"y","ỵ":"y",
    "đ":"d",
  };
  return phrase
    .toLowerCase()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function phraseFilePath(phrase: string): string {
  return `${AUDIO_DIR}${phraseSlug(phrase)}.wav`;
}

// ── TTS generation ─────────────────────────────────────────

async function generateTTS(text: string): Promise<string | null> {
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
  if (!resp.ok) return null;
  const data = await resp.json();
  const obj = data.object ?? {};
  if (obj.code === "success" && obj.playlist?.length > 0) {
    return obj.playlist[0].audio_link ?? null;
  }
  return null;
}

async function downloadWav(url: string): Promise<Uint8Array | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return new Uint8Array(await resp.arrayBuffer());
  } catch { return null; }
}

async function generateAllAudio() {
  console.log(`\n  Generating ${ALL_PHRASES.length} audio files to ${AUDIO_DIR}\n`);

  try { await Deno.mkdir(AUDIO_DIR, { recursive: true }); } catch { /* exists */ }

  let ok = 0, skip = 0, fail = 0;
  for (const phrase of ALL_PHRASES) {
    const path = phraseFilePath(phrase);
    try {
      await Deno.stat(path);
      console.log(`  [SKIP] "${phrase}" — already cached`);
      skip++;
      continue;
    } catch { /* not found, generate */ }

    const audioUrl = await generateTTS(phrase);
    if (!audioUrl) { console.log(`  [FAIL] "${phrase}" — TTS failed`); fail++; continue; }

    const wav = await downloadWav(audioUrl);
    if (!wav) { console.log(`  [FAIL] "${phrase}" — download failed`); fail++; continue; }

    await Deno.writeFile(path, wav);
    console.log(`  [OK]   "${phrase}" → ${phraseSlug(phrase)}.wav (${(wav.length / 1024).toFixed(0)}KB)`);
    ok++;
  }

  console.log(`\n  Done: ${ok} generated, ${skip} cached, ${fail} failed\n`);
  if (fail > 0) Deno.exit(1);
}

// ── Audio loader ───────────────────────────────────────────

async function loadAudioBase64(phrase: string): Promise<string | null> {
  const path = phraseFilePath(phrase);
  try {
    const bytes = await Deno.readFile(path);
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  } catch {
    console.log(`     ⚠ Audio not found: ${path}`);
    return null;
  }
}

// ── API calls ──────────────────────────────────────────────

async function createSession(): Promise<{ session_id: string; greeting: string }> {
  const resp = await fetch(`${BASE}/session`, { method: "POST" });
  const data = await resp.json();
  return { session_id: data.data.session_id, greeting: data.data.greeting };
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
      asr_transcript: "(error)", asr_confidence: 0, transcript: "(error)",
      intent: "ERROR", intent_confidence: 0,
      response_text: data.error ?? "Unknown error", audio_url: null,
      state: { current_state: "ERROR" },
    };
  }
  return data.data;
}

// ── Scenario definitions ───────────────────────────────────

interface Step {
  user_says: string;
  expect_intent?: string;
  expect_state?: string;
  allow_intents?: string[];
  desc?: string;
}

interface Scenario {
  name: string;
  icon: string;
  steps: Step[];
}

const SCENARIOS: Scenario[] = [
  // ─── NAV (đặt xe) ────────────────────────────────────
  {
    name: "NAV Happy Path (đặt xe)",
    icon: "🚗",
    steps: [
      { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_DESTINATION" },
      { user_says: "đúng rồi", expect_intent: "CONFIRM_YES", expect_state: "SELECT_VEHICLE" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_BOOKING", desc: "chọn xe máy" },
      { user_says: "đúng rồi", expect_intent: "CONFIRM_YES", expect_state: "BOOKING_PLACED", desc: "xác nhận đặt xe" },
    ],
  },
  {
    name: "NAV Confirm No → Reselect",
    icon: "🔄",
    steps: [
      { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_DESTINATION" },
      { user_says: "sai rồi", expect_intent: "CONFIRM_NO", expect_state: "CAPTURE_DESTINATION", desc: "reject → re-ask" },
      { user_says: "dẫn mình tới sân bay", expect_intent: "NAVIGATE", expect_state: "CONFIRM_DESTINATION", desc: "new destination" },
      { user_says: "đúng rồi", expect_intent: "CONFIRM_YES", expect_state: "SELECT_VEHICLE" },
    ],
  },
  {
    name: "NAV Cancel Mid-Booking",
    icon: "🛑",
    steps: [
      { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_DESTINATION" },
      { user_says: "đúng rồi", expect_intent: "CONFIRM_YES", expect_state: "SELECT_VEHICLE" },
      { user_says: "mình muốn hủy", expect_intent: "GLOBAL_CANCEL", expect_state: "IDLE", desc: "cancel booking" },
    ],
  },

  // ─── FOOD ────────────────────────────────────────────
  {
    name: "FOOD Happy Path (cash)",
    icon: "🍜",
    steps: [
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU" },
      { user_says: "phở tái", expect_state: "SET_QUANTITY", allow_intents: ["SELECT_OPTION", "SELECT_ITEM"] },
      { user_says: "cho mình hai phần", expect_intent: "SET_QUANTITY", expect_state: "REVIEW_CART" },
      { user_says: "thanh toán đi", expect_intent: "CHECKOUT", expect_state: "VOUCHER_OFFER" },
      { user_says: "bỏ qua đi", expect_intent: "SKIP_VOUCHER", expect_state: "SELECT_PAYMENT" },
      { user_says: "tiền mặt", expect_intent: "SELECT_PAYMENT", expect_state: "CONFIRM_ORDER" },
      { user_says: "xác nhận đặt đơn", expect_intent: "CONFIRM_YES", expect_state: "ORDER_PLACED" },
    ],
  },
  {
    name: "FOOD Pay with Wallet",
    icon: "💳",
    steps: [
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "SET_QUANTITY", desc: "select by index" },
      { user_says: "cho mình một phần", expect_intent: "SET_QUANTITY", expect_state: "REVIEW_CART" },
      { user_says: "thanh toán đi", expect_intent: "CHECKOUT", expect_state: "VOUCHER_OFFER" },
      { user_says: "bỏ qua đi", expect_intent: "SKIP_VOUCHER", expect_state: "SELECT_PAYMENT" },
      { user_says: "ví điện tử", expect_intent: "SELECT_PAYMENT", expect_state: "CONFIRM_ORDER" },
      { user_says: "đúng rồi", expect_intent: "CONFIRM_YES", expect_state: "ORDER_PLACED" },
    ],
  },
  {
    name: "FOOD Add More Items",
    icon: "➕",
    steps: [
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU" },
      { user_says: "phở tái", expect_state: "SET_QUANTITY", allow_intents: ["SELECT_OPTION", "SELECT_ITEM"] },
      { user_says: "cho mình một phần", expect_intent: "SET_QUANTITY", expect_state: "REVIEW_CART" },
      { user_says: "cho thêm món nữa", expect_state: "BROWSE_MENU", allow_intents: ["ADD_MORE_ITEM", "ORDER_FOOD", "CHOOSE_BY_DISH"], desc: "add more" },
      { user_says: "cho mình phở tái nạm", expect_state: "SET_QUANTITY", allow_intents: ["SELECT_OPTION", "SELECT_ITEM"], desc: "second item" },
      { user_says: "cho mình hai phần", expect_intent: "SET_QUANTITY", expect_state: "REVIEW_CART" },
      { user_says: "thanh toán đi", expect_intent: "CHECKOUT", expect_state: "VOUCHER_OFFER" },
    ],
  },
  {
    name: "FOOD Cancel Mid-Order",
    icon: "❌",
    steps: [
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU" },
      { user_says: "phở tái", expect_state: "SET_QUANTITY", allow_intents: ["SELECT_OPTION", "SELECT_ITEM"] },
      { user_says: "mình muốn hủy", expect_intent: "GLOBAL_CANCEL", expect_state: "IDLE", desc: "cancel order" },
    ],
  },
  {
    name: "FOOD Confirm No → Cancel Order",
    icon: "🚫",
    steps: [
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU" },
      { user_says: "phở tái", expect_state: "SET_QUANTITY", allow_intents: ["SELECT_OPTION", "SELECT_ITEM"] },
      { user_says: "cho mình hai phần", expect_intent: "SET_QUANTITY", expect_state: "REVIEW_CART" },
      { user_says: "thanh toán đi", expect_intent: "CHECKOUT", expect_state: "VOUCHER_OFFER" },
      { user_says: "bỏ qua đi", expect_intent: "SKIP_VOUCHER", expect_state: "SELECT_PAYMENT" },
      { user_says: "tiền mặt", expect_intent: "SELECT_PAYMENT", expect_state: "CONFIRM_ORDER" },
      { user_says: "không phải", expect_intent: "CONFIRM_NO", expect_state: "IDLE", desc: "reject order" },
    ],
  },
  {
    name: "FOOD Select Voucher",
    icon: "🎟️",
    steps: [
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU" },
      { user_says: "phở tái", expect_state: "SET_QUANTITY", allow_intents: ["SELECT_OPTION", "SELECT_ITEM"] },
      { user_says: "cho mình hai phần", expect_intent: "SET_QUANTITY", expect_state: "REVIEW_CART" },
      { user_says: "thanh toán đi", expect_intent: "CHECKOUT", expect_state: "VOUCHER_OFFER" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "APPLY_VOUCHER_CONFIRM", desc: "pick voucher" },
      { user_says: "đúng rồi", expect_intent: "CONFIRM_YES", expect_state: "SELECT_PAYMENT", desc: "apply voucher" },
      { user_says: "tiền mặt", expect_intent: "SELECT_PAYMENT", expect_state: "CONFIRM_ORDER" },
    ],
  },

  // ─── OUT-OF-FLOW / EDGE CASES ────────────────────────
  {
    name: "Out-of-Flow at IDLE",
    icon: "🤷",
    steps: [
      { user_says: "hôm nay trời đẹp quá nhỉ", allow_intents: ["UNKNOWN", "OUT_OF_SCOPE"], expect_state: "GREETING", desc: "irrelevant → nudge" },
      { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE", desc: "then normal flow" },
    ],
  },
  {
    name: "Out-of-Flow During NAV",
    icon: "❓",
    steps: [
      { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE" },
      { user_says: "hôm nay trời đẹp quá nhỉ", allow_intents: ["UNKNOWN", "OUT_OF_SCOPE"], expect_state: "DISAMBIGUATE", desc: "irrelevant → nudge in context" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_DESTINATION", desc: "then correct input" },
    ],
  },
  {
    name: "Out-of-Flow During FOOD",
    icon: "❓",
    steps: [
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
      { user_says: "hôm nay trời đẹp quá nhỉ", allow_intents: ["UNKNOWN", "OUT_OF_SCOPE"], expect_state: "SELECT_RESTAURANT", desc: "irrelevant → nudge" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU", desc: "then correct input" },
    ],
  },
  {
    name: "Global Help",
    icon: "❔",
    steps: [
      { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE" },
      { user_says: "trợ giúp mình", expect_intent: "GLOBAL_HELP", expect_state: "DISAMBIGUATE", desc: "help stays in same state" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_DESTINATION" },
    ],
  },
  {
    name: "Global Read Order",
    icon: "📋",
    steps: [
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "BROWSE_MENU" },
      { user_says: "phở tái", expect_state: "SET_QUANTITY", allow_intents: ["SELECT_OPTION", "SELECT_ITEM"] },
      { user_says: "cho mình hai phần", expect_intent: "SET_QUANTITY", expect_state: "REVIEW_CART" },
      { user_says: "đọc lại đơn hàng", expect_intent: "GLOBAL_READ_ORDER", expect_state: "REVIEW_CART", desc: "read cart" },
      { user_says: "thanh toán đi", expect_intent: "CHECKOUT", expect_state: "VOUCHER_OFFER" },
    ],
  },
  {
    name: "Global Back",
    icon: "⬅️",
    steps: [
      { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE" },
      { user_says: "số một", expect_intent: "SELECT_OPTION", expect_state: "CONFIRM_DESTINATION" },
      { user_says: "quay lại đi", expect_intent: "GLOBAL_BACK", desc: "go back one step" },
    ],
  },
  {
    name: "Cross-Intent NAV → FOOD",
    icon: "🔀",
    steps: [
      { user_says: "dẫn mình tới nhà sách", expect_intent: "NAVIGATE", expect_state: "DISAMBIGUATE" },
      { user_says: "mình muốn hủy", expect_intent: "GLOBAL_CANCEL", expect_state: "IDLE", desc: "cancel NAV" },
      { user_says: "đặt cho mình phở", expect_intent: "ORDER_FOOD", expect_state: "SELECT_RESTAURANT", desc: "switch to FOOD" },
    ],
  },
];

// ── Test runner ────────────────────────────────────────────

interface ScenarioResult {
  name: string;
  passed: number;
  failed: number;
  total: number;
}

async function runScenario(scenario: Scenario): Promise<ScenarioResult> {
  const label = `${scenario.icon} ${scenario.name}`;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`  Mode: ${AUDIO_MODE ? "AUDIO" : "TEXT"}`);
  console.log(`${"─".repeat(60)}`);

  const session = await createSession();
  console.log(`  Session: ${session.session_id}`);

  let passed = 0, failed = 0;

  for (const step of scenario.steps) {
    const descSuffix = step.desc ? ` (${step.desc})` : "";
    process.stdout?.write?.(`  "${step.user_says}"${descSuffix} → `);

    // deno-lint-ignore no-explicit-any
    let result: Record<string, any>;

    if (AUDIO_MODE) {
      const audioB64 = await loadAudioBase64(step.user_says);
      if (audioB64) {
        result = await sendTurn(session.session_id, { audio_base64: audioB64, sample_rate: 22050 });
      } else {
        result = await sendTurn(session.session_id, { transcript: step.user_says });
      }
    } else {
      result = await sendTurn(session.session_id, { transcript: step.user_says });
    }

    const intent = result.intent;
    const state = result.state?.current_state;
    const sttText = result.asr_transcript ? ` [STT: "${result.asr_transcript}"]` : "";

    let intentOk = true;
    if (step.expect_intent) {
      intentOk = intent === step.expect_intent;
    }
    if (!intentOk && step.allow_intents) {
      intentOk = step.allow_intents.includes(intent);
    }
    if (step.allow_intents && !step.expect_intent) {
      intentOk = step.allow_intents.includes(intent);
    }

    const stateOk = !step.expect_state || state === step.expect_state;
    const ok = intentOk && stateOk;

    if (ok) {
      passed++;
      console.log(`✅ ${intent} → [${state}]${sttText}`);
    } else {
      failed++;
      console.log(`❌ ${intent} → [${state}]${sttText}`);
      if (!intentOk) {
        const expected = step.expect_intent ?? step.allow_intents?.join("|");
        console.log(`     ⚠ Expected intent: ${expected}`);
      }
      if (!stateOk) console.log(`     ⚠ Expected state: ${step.expect_state}`);
      console.log(`     🤖 ${(result.response_text ?? "").slice(0, 80)}`);
    }
  }

  const total = passed + failed;
  const icon = failed === 0 ? "✅" : "❌";
  console.log(`  ${icon} ${passed}/${total}`);

  return { name: `${scenario.icon} ${scenario.name}`, passed, failed, total };
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   Voice Assistant — Full Test Suite             ║");
  console.log("╚════════════════════════════════════════════════╝");

  // Step 0: Generate audio if --gen
  if (GEN_MODE) {
    if (!VNPT_ACCESS_TOKEN) {
      console.error("\n❌ --gen requires VNPT_ACCESS_TOKEN");
      Deno.exit(1);
    }
    await generateAllAudio();
    if (!AUDIO_MODE) {
      console.log("Audio generated. Run with --audio to test.\n");
      Deno.exit(0);
    }
  }

  // Step 1: Check server
  try {
    const resp = await fetch(`${BASE}/health`);
    if (!resp.ok) throw new Error();
    console.log(`\n✅ Server OK at ${BASE}`);
  } catch {
    console.error(`\n❌ Server not running at ${BASE}`);
    Deno.exit(1);
  }

  // Step 2: If --audio, verify cache exists
  if (AUDIO_MODE) {
    let missing = 0;
    const needed = new Set<string>();
    for (const sc of SCENARIOS) for (const step of sc.steps) needed.add(step.user_says);
    for (const phrase of needed) {
      try { await Deno.stat(phraseFilePath(phrase)); } catch {
        console.error(`  ⚠ Missing audio: "${phrase}" → ${phraseFilePath(phrase)}`);
        missing++;
      }
    }
    if (missing > 0) {
      console.error(`\n❌ ${missing} audio files missing. Run with --gen first.`);
      Deno.exit(1);
    }
    console.log(`  📂 ${needed.size} audio files ready`);
  }

  console.log(`  📋 ${SCENARIOS.length} scenarios, mode: ${AUDIO_MODE ? "AUDIO" : "TEXT"}\n`);

  // Step 3: Run all scenarios
  const results: ScenarioResult[] = [];
  for (const scenario of SCENARIOS) {
    results.push(await runScenario(scenario));
  }

  // Step 4: Summary
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  RESULTS SUMMARY`);
  console.log(`${"═".repeat(60)}`);

  let totalPassed = 0, totalFailed = 0, totalSteps = 0;
  const failedScenarios: string[] = [];

  for (const r of results) {
    const icon = r.failed === 0 ? "✅" : "❌";
    console.log(`  ${icon} ${r.name}: ${r.passed}/${r.total}`);
    totalPassed += r.passed;
    totalFailed += r.failed;
    totalSteps += r.total;
    if (r.failed > 0) failedScenarios.push(r.name);
  }

  console.log(`\n${"─".repeat(60)}`);
  const allIcon = totalFailed === 0 ? "✅" : "❌";
  console.log(`  ${allIcon} TOTAL: ${totalPassed}/${totalSteps} steps passed across ${results.length} scenarios`);

  if (failedScenarios.length > 0) {
    console.log(`\n  Failed scenarios:`);
    for (const name of failedScenarios) console.log(`    - ${name}`);
  }

  console.log(`${"═".repeat(60)}\n`);

  if (totalFailed > 0) Deno.exit(1);
}

// Polyfill process.stdout for Deno
const process = { stdout: { write: (s: string) => { Deno.stdout.writeSync(new TextEncoder().encode(s)); } } };

main();
