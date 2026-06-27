import type { ASRResult, NLGResponse, NLUResult, SessionContext } from "../types.ts";
import { parseNLU } from "./nlu.ts";
import { parseLLM } from "./llm_nlu.ts";
import { processDialog } from "./dialog_manager.ts";
import { renderNLG } from "./nlg.ts";
import { transcribe } from "./stt.ts";
import { synthesize, type TTSResult } from "./tts.ts";
import { getSession, saveSession, createSession } from "../store/session.ts";
import { getEnv } from "../config/env.ts";

const USE_LLM = getEnv("NLU_MODE") !== "keyword";
const ENABLE_TTS = getEnv("ENABLE_TTS") !== "false";

export interface TurnInput {
  session_id?: string;
  transcript?: string;
  audio_base64?: string;
  sample_rate?: number;
  user_id?: string;
}

export interface TurnOutput {
  session_id: string;
  turn_index: number;
  asr: ASRResult | null;
  nlu: NLUResult;
  nlg: NLGResponse;
  tts: TTSResult | null;
  session_state: {
    current_flow: string | null;
    current_state: string;
    active_cart: SessionContext["active_cart"];
    active_booking: SessionContext["active_booking"];
    pending_confirmation: SessionContext["pending_confirmation"];
  };
}

export async function processGreeting(sessionId?: string, userId?: string): Promise<{
  session_id: string;
  nlg: NLGResponse;
  tts: TTSResult | null;
}> {
  const session = sessionId
    ? getSession(sessionId) ?? createSession(userId)
    : createSession(userId);

  const nlg = renderNLG({
    template: "GREETING",
    status_line: "Xin chào!",
    body: "Mình là trợ lý giọng nói. Mình có thể giúp bạn đặt xe hoặc đặt đồ ăn. Bạn muốn làm gì?",
    options: [
      { index: 1, label: "đặt xe", detail: "gọi xe tới nơi bạn muốn" },
      { index: 2, label: "đặt đồ ăn", detail: "tìm quán và gọi món" },
    ],
    earcon_post: "turn_cue",
  });

  session.last_nlg_request = {
    template: "GREETING",
    body: nlg.plain_text,
  };
  session.last_prompt_ssml = nlg.ssml;
  session.last_offered_options = [
    { index: 1, ref_type: "GENERIC", ref_id: "nav", label: "đặt xe" },
    { index: 2, ref_type: "GENERIC", ref_id: "food", label: "đặt đồ ăn" },
  ];
  saveSession(session);

  let tts: TTSResult | null = null;
  if (ENABLE_TTS) {
    tts = await synthesize(nlg.plain_text);
  }

  return { session_id: session.session_id, nlg, tts };
}

export async function processTurn(input: TurnInput): Promise<TurnOutput> {
  // 1. Get or create session
  let session: SessionContext;
  if (input.session_id) {
    const existing = getSession(input.session_id);
    if (!existing) {
      throw new Error(`Session ${input.session_id} not found`);
    }
    session = existing;
  } else {
    session = createSession(input.user_id);
  }

  // 2. ASR — real STT when audio provided (retry handled in stt.ts)
  let transcript = input.transcript ?? "";
  let asrResult: ASRResult | null = null;

  if (!transcript && input.audio_base64) {
    asrResult = await transcribe(
      input.audio_base64,
      session.session_id,
      input.sample_rate ?? 16000,
    );
    transcript = asrResult.transcript.replace(/[.,!?]+$/g, "").trim();
  }

  if (!transcript) {
    if (input.audio_base64) {
      // STT returned empty or low confidence — ask user to repeat
      const nluResult: NLUResult = {
        request_id: crypto.randomUUID(),
        session_id: session.session_id,
        transcript: "(không nghe rõ)",
        intent: "UNKNOWN",
        intent_confidence: 0,
        is_global_command: false,
        slots: {},
        alternatives: [],
        timestamp: new Date().toISOString(),
      };
      const { action, session: updatedSession } = processDialog(nluResult, session);
      const nlgResponse = renderNLG(action.nlg_request);
      let tts: TTSResult | null = null;
      if (ENABLE_TTS) tts = await synthesize(nlgResponse.plain_text);
      updatedSession.last_prompt_ssml = nlgResponse.ssml;
      saveSession(updatedSession);
      return {
        session_id: updatedSession.session_id,
        turn_index: updatedSession.turn_index,
        asr: asrResult,
        nlu: nluResult,
        nlg: nlgResponse,
        tts,
        session_state: {
          current_flow: updatedSession.current_flow,
          current_state: updatedSession.current_state,
          active_cart: updatedSession.active_cart,
          active_booking: updatedSession.active_booking,
          pending_confirmation: updatedSession.pending_confirmation,
        },
      };
    }
    throw new Error("No transcript or audio provided");
  }

  // 3. NLU (LLM with keyword fallback, or keyword-only)
  const nluResult = USE_LLM
    ? await parseLLM(transcript, session)
    : parseNLU(transcript, session);

  // 4. Dialog Manager
  const { action, session: updatedSession } = processDialog(nluResult, session);

  // 5. NLG
  const nlgResponse = renderNLG(action.nlg_request);

  // 6. TTS — synthesize response
  let tts: TTSResult | null = null;
  if (ENABLE_TTS) {
    tts = await synthesize(nlgResponse.plain_text);
  }

  // 7. Update session + conversation history
  updatedSession.last_prompt_ssml = nlgResponse.ssml;
  updatedSession.conversation_history.push(
    { role: "user", content: transcript },
    { role: "assistant", content: nlgResponse.plain_text },
  );
  // Keep last 10 turns (20 messages) to avoid bloating
  if (updatedSession.conversation_history.length > 20) {
    updatedSession.conversation_history = updatedSession.conversation_history.slice(-20);
  }
  saveSession(updatedSession);

  return {
    session_id: updatedSession.session_id,
    turn_index: updatedSession.turn_index,
    asr: asrResult,
    nlu: nluResult,
    nlg: nlgResponse,
    tts,
    session_state: {
      current_flow: updatedSession.current_flow,
      current_state: updatedSession.current_state,
      active_cart: updatedSession.active_cart,
      active_booking: updatedSession.active_booking,
      pending_confirmation: updatedSession.pending_confirmation,
    },
  };
}
