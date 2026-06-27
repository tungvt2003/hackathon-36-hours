import type { ASRResult } from "../types.ts";
import { getEnv } from "../config/env.ts";

const GOOGLE_API_KEY = getEnv("GOOGLE_STT_API_KEY");
const VNPT_ACCESS_TOKEN = getEnv("VNPT_ACCESS_TOKEN");
const VNPT_TOKEN_ID = getEnv("VNPT_TOKEN_ID");
const VNPT_TOKEN_KEY = getEnv("VNPT_TOKEN_KEY");
const VNPT_BASE_URL = getEnv("VNPT_BASE_URL", "https://api.idg.vnpt.vn");

const STT_PROVIDER = getEnv("STT_PROVIDER", "google");
const SILENCE_PAD_MS = 1000;

const STT_MAX_RETRIES = 2;
const STT_MIN_CONFIDENCE = 0.4;

export async function transcribe(
  audioBase64: string,
  sessionId: string,
  sampleRate = 16000,
): Promise<ASRResult> {
  const paddedAudio = padSilence(audioBase64, sampleRate, SILENCE_PAD_MS);

  let best: ASRResult | null = null;
  for (let attempt = 0; attempt <= STT_MAX_RETRIES; attempt++) {
    const startMs = Date.now();
    const result = STT_PROVIDER === "vnpt" && VNPT_ACCESS_TOKEN
      ? await transcribeVNPT(paddedAudio, sessionId, sampleRate, startMs)
      : await transcribeGoogle(paddedAudio, sessionId, sampleRate, startMs);

    if (result.confidence >= STT_MIN_CONFIDENCE && result.transcript) {
      return result;
    }

    if (!best || result.confidence > best.confidence) best = result;

    if (attempt < STT_MAX_RETRIES) {
      console.log(`[STT] Low confidence (${(result.confidence * 100).toFixed(0)}%) — retry ${attempt + 1}/${STT_MAX_RETRIES}`);
    }
  }

  return best!;
}

function padSilence(audioBase64: string, sampleRate: number, durationMs: number): string {
  const audioBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));

  const isWav = audioBytes[0] === 0x52 && audioBytes[1] === 0x49 &&
                audioBytes[2] === 0x46 && audioBytes[3] === 0x46;

  const silenceSamples = Math.floor((sampleRate * durationMs) / 1000);
  const silenceBytes = new Uint8Array(silenceSamples * 2); // 16-bit PCM = 2 bytes/sample
  const totalPadBytes = silenceBytes.length * 2; // pre + post

  if (isWav && audioBytes.length > 44) {
    const headerSize = 44;
    const origPcm = audioBytes.slice(headerSize);
    const newPcmLen = silenceBytes.length + origPcm.length + silenceBytes.length;
    const newFileSize = newPcmLen + 36;

    const result = new Uint8Array(headerSize + newPcmLen);
    // Copy original header
    result.set(audioBytes.slice(0, headerSize));
    // Pre-silence + original PCM + post-silence
    result.set(silenceBytes, headerSize);
    result.set(origPcm, headerSize + silenceBytes.length);
    result.set(silenceBytes, headerSize + silenceBytes.length + origPcm.length);

    // Update RIFF chunk size (offset 4)
    writeLE32(result, 4, newFileSize);
    // Update data chunk size (offset 40)
    writeLE32(result, 40, newPcmLen);

    return uint8ToBase64(result);
  }

  // Raw PCM — pad both sides
  const result = new Uint8Array(silenceBytes.length + audioBytes.length + silenceBytes.length);
  result.set(silenceBytes, 0);
  result.set(audioBytes, silenceBytes.length);
  result.set(silenceBytes, silenceBytes.length + audioBytes.length);
  return uint8ToBase64(result);
}

function writeLE32(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xFF;
  buf[offset + 1] = (value >> 8) & 0xFF;
  buf[offset + 2] = (value >> 16) & 0xFF;
  buf[offset + 3] = (value >> 24) & 0xFF;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function transcribeGoogle(
  audioBase64: string,
  sessionId: string,
  sampleRate: number,
  startMs: number,
): Promise<ASRResult> {
  if (!GOOGLE_API_KEY) {
    console.warn("[STT Google] Missing GOOGLE_STT_API_KEY");
    return emptyASR(sessionId, Date.now() - startMs);
  }

  const url = `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`;

  const payload = {
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: sampleRate,
      languageCode: "vi-VN",
      enableAutomaticPunctuation: true,
      model: "latest_short",
    },
    audio: { content: audioBase64 },
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const elapsedMs = Date.now() - startMs;

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[STT Google] HTTP ${resp.status}: ${errText.slice(0, 200)}`);
    return emptyASR(sessionId, elapsedMs);
  }

  const data = await resp.json();
  const results = data.results ?? [];

  if (results.length === 0) {
    console.warn("[STT Google] No transcription results");
    return emptyASR(sessionId, elapsedMs);
  }

  const best = results[0].alternatives?.[0];
  const transcript = best?.transcript ?? "";
  const confidence = best?.confidence ?? 0;

  const alternatives = (results[0].alternatives ?? [])
    .slice(1)
    .map((a: { transcript?: string; confidence?: number }) => ({
      transcript: a.transcript ?? "",
      confidence: a.confidence ?? 0,
    }));

  console.log(`[STT Google] "${transcript}" (${(confidence * 100).toFixed(0)}%) ${elapsedMs}ms`);

  return {
    request_id: crypto.randomUUID(),
    session_id: sessionId,
    transcript,
    confidence,
    is_final: true,
    alternatives,
    language: "vi-VN",
    audio_duration_ms: estimateAudioDuration(audioBase64, sampleRate),
    barge_in: false,
  };
}

async function transcribeVNPT(
  audioBase64: string,
  sessionId: string,
  sampleRate: number,
  startMs: number,
): Promise<ASRResult> {
  const url = `${VNPT_BASE_URL}/stt-service/v3/standard`;
  const audioBytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VNPT_ACCESS_TOKEN}`,
      "Token-id": VNPT_TOKEN_ID,
      "Token-key": VNPT_TOKEN_KEY,
      "Sample-Rate": String(sampleRate),
      "Enable-Lm": "true",
      "domain": "general",
      "save-log": "false",
    },
    body: audioBytes,
  });

  const elapsedMs = Date.now() - startMs;

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[STT VNPT] HTTP ${resp.status}: ${errText.slice(0, 200)}`);
    return emptyASR(sessionId, elapsedMs);
  }

  const data = await resp.json();
  const obj = data.object ?? {};
  const transcript = obj.transcript ?? "";

  console.log(`[STT VNPT] "${transcript}" ${elapsedMs}ms`);

  return {
    request_id: crypto.randomUUID(),
    session_id: sessionId,
    transcript,
    confidence: transcript ? 0.85 : 0,
    is_final: true,
    alternatives: [],
    language: "vi-VN",
    audio_duration_ms: obj.audio_duration ? obj.audio_duration * 1000 : estimateAudioDuration(audioBase64, sampleRate),
    barge_in: false,
  };
}

function emptyASR(sessionId: string, _elapsedMs: number): ASRResult {
  return {
    request_id: crypto.randomUUID(),
    session_id: sessionId,
    transcript: "",
    confidence: 0,
    is_final: true,
    alternatives: [],
    language: "vi-VN",
    audio_duration_ms: 0,
    barge_in: false,
  };
}

function estimateAudioDuration(base64: string, sampleRate: number): number {
  const bytes = (base64.length * 3) / 4;
  const samples = bytes / 2; // 16-bit PCM
  return (samples / sampleRate) * 1000;
}
