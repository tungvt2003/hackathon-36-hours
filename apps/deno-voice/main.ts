import { processGreeting, processTurn } from "./pipeline/orchestrator.ts";
import {
  conversationConfirm,
  conversationInput,
  conversationStart,
  orderStatus,
  reviewOrder,
} from "./api/compat.ts";
import { getSession, listSessions } from "./store/session.ts";
import { getEnv } from "./config/env.ts";

const PORT = parseInt(getEnv("PORT", "8000"));

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Content-Type",
    },
  });
}

function err(message: string, status = 400): Response {
  return json({ ok: false, error: message }, status);
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method === "OPTIONS") {
    return json({ ok: true });
  }

  if (path === "/health" && req.method === "GET") {
    return json({ ok: true, service: "voice-assistant", version: "0.2" });
  }

  // AccessAI mobile-compatible contract from docs/PLAN.md
  if (path === "/conversation/start" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body) return err("Request body required");
    try {
      return json(await conversationStart(body));
    } catch (e) {
      return err(errorMessage(e), 500);
    }
  }

  if (path === "/conversation/input" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body) return err("Request body required");
    try {
      return json(await conversationInput(body));
    } catch (e) {
      return err(errorMessage(e), 500);
    }
  }

  if (path === "/conversation/confirm" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body) return err("Request body required");
    try {
      return json(await conversationConfirm(body));
    } catch (e) {
      return err(errorMessage(e), 500);
    }
  }

  const orderStatusMatch = path.match(/^\/orders\/([^/]+)\/status$/);
  if (orderStatusMatch && req.method === "GET") {
    try {
      return json(orderStatus(orderStatusMatch[1]));
    } catch (e) {
      return err(errorMessage(e), 404);
    }
  }

  const reviewMatch = path.match(/^\/orders\/([^/]+)\/review$/);
  if (reviewMatch && req.method === "POST") {
    const body = await parseBody(req);
    if (!body) return err("Request body required");
    try {
      return json(reviewOrder(reviewMatch[1], body));
    } catch (e) {
      return err(errorMessage(e), 404);
    }
  }

  // POST /session — start new session, get greeting + TTS
  if (path === "/session" && req.method === "POST") {
    const body = await parseBody(req);
    const result = await processGreeting(undefined, body?.user_id);
    return json({
      ok: true,
      data: {
        session_id: result.session_id,
        greeting: result.nlg.plain_text,
        ssml: result.nlg.ssml,
        audio_url: result.tts?.audio_url ?? null,
        expects_input: result.nlg.expects_input,
        expected_intents: result.nlg.expected_intents,
      },
    });
  }

  // POST /turn — process a conversation turn (text or audio)
  if (path === "/turn" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body) return err("Request body required");

    if (!body.session_id && !body.transcript && !body.audio_base64) {
      return err("session_id + (transcript or audio_base64) required");
    }

    try {
      const result = await processTurn({
        session_id: body.session_id,
        transcript: body.transcript,
        audio_base64: body.audio_base64,
        sample_rate: body.sample_rate,
        user_id: body.user_id,
      });

      return json({
        ok: true,
        data: {
          session_id: result.session_id,
          turn_index: result.turn_index,
          // ASR
          asr_transcript: result.asr?.transcript ?? result.nlu.transcript,
          asr_confidence: result.asr?.confidence ?? null,
          // NLU
          transcript: result.nlu.transcript,
          intent: result.nlu.intent,
          intent_confidence: result.nlu.intent_confidence,
          slots: result.nlu.slots,
          // NLG
          response_text: result.nlg.plain_text,
          ssml: result.nlg.ssml,
          expects_input: result.nlg.expects_input,
          expected_intents: result.nlg.expected_intents,
          // TTS
          audio_url: result.tts?.audio_url ?? null,
          // State
          state: result.session_state,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      return err(message, 500);
    }
  }

  // GET /session/:id
  if (path.startsWith("/session/") && req.method === "GET") {
    const sessionId = path.split("/session/")[1];
    const session = getSession(sessionId);
    if (!session) return err("Session not found", 404);
    return json({
      ok: true,
      data: {
        session_id: session.session_id,
        current_flow: session.current_flow,
        current_state: session.current_state,
        turn_index: session.turn_index,
        active_cart: session.active_cart,
        active_booking: session.active_booking,
        pending_confirmation: session.pending_confirmation,
        slots_filled: session.slots_filled,
        last_offered_options: session.last_offered_options,
      },
    });
  }

  // GET /sessions
  if (path === "/sessions" && req.method === "GET") {
    return json({ ok: true, data: { sessions: listSessions() } });
  }

  // POST /conversation — convenience: auto-session + turn
  if (path === "/conversation" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body) return err("Request body required");

    let sessionId = body.session_id as string | undefined;
    let greeting: string | undefined;
    let greetAudio: string | null = null;

    if (!sessionId) {
      const greetResult = await processGreeting(undefined, body.user_id);
      sessionId = greetResult.session_id;
      greeting = greetResult.nlg.plain_text;
      greetAudio = greetResult.tts?.audio_url ?? null;
    }

    if (!body.transcript && !body.audio_base64) {
      return json({
        ok: true,
        data: {
          session_id: sessionId,
          greeting,
          audio_url: greetAudio,
          response_text: greeting ?? "Session active",
        },
      });
    }

    try {
      const result = await processTurn({
        session_id: sessionId,
        transcript: body.transcript,
        audio_base64: body.audio_base64,
        sample_rate: body.sample_rate,
      });

      return json({
        ok: true,
        data: {
          session_id: result.session_id,
          turn_index: result.turn_index,
          you_said: result.nlu.transcript,
          intent: result.nlu.intent,
          slots: result.nlu.slots,
          response: result.nlg.plain_text,
          audio_url: result.tts?.audio_url ?? null,
          state: result.session_state.current_state,
          flow: result.session_state.current_flow,
        },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      return err(message, 500);
    }
  }

  // GET / or /demo — serve web demo
  if ((path === "/" || path === "/demo") && req.method === "GET") {
    try {
      const html = await Deno.readTextFile(new URL("./web/demo.html", import.meta.url).pathname);
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch {
      return err("Demo page not found", 404);
    }
  }

  return err("Not found", 404);
}

// deno-lint-ignore no-explicit-any
async function parseBody(req: Request): Promise<Record<string, any> | null> {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : "Unknown error";
}

console.log(`Voice Assistant API running on http://localhost:${PORT}`);
console.log(`Pipeline: Audio → STT → NLU → Dialog → NLG → TTS`);
console.log(`Config:`);
console.log(`  NLU_MODE    = ${getEnv("NLU_MODE", "llm (default)")}`);
console.log(`  STT_PROVIDER= ${getEnv("STT_PROVIDER", "google (default)")}`);
console.log(`  ENABLE_TTS  = ${getEnv("ENABLE_TTS", "true (default)")}`);
console.log(`Endpoints:`);
console.log(`  POST /conversation/start — mobile-compatible session start`);
console.log(`  POST /conversation/input — mobile-compatible text/audio turn`);
console.log(`  POST /conversation/confirm — mobile-compatible confirmation`);
console.log(`  GET  /orders/:id/status  — mobile-compatible order status`);
console.log(`  POST /orders/:id/review  — mobile-compatible review`);
console.log(`  POST /session          — greeting + TTS audio`);
console.log(`  POST /turn             — text or audio → full pipeline`);
console.log(`  POST /conversation     — convenience: auto-session`);
console.log(`  GET  /session/:id      — session state`);
console.log(`  GET  /sessions         — list sessions`);
console.log(`  GET  /health           — health check`);
console.log(`  GET  /                 — web demo`);

Deno.serve({ port: PORT }, handler);
