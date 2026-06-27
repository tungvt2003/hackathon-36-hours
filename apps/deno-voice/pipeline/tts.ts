import { getEnv } from "../config/env.ts";

const VNPT_ACCESS_TOKEN = getEnv("VNPT_ACCESS_TOKEN");
const VNPT_TOKEN_ID = getEnv("VNPT_TOKEN_ID");
const VNPT_TOKEN_KEY = getEnv("VNPT_TOKEN_KEY");
const VNPT_BASE_URL = getEnv("VNPT_BASE_URL", "https://api.idg.vnpt.vn");
const TTS_VOICE = getEnv("TTS_VOICE", "female_north");
const TTS_SPEED = parseFloat(getEnv("TTS_SPEED", "1.0"));

export interface TTSResult {
  audio_url: string | null;
  audio_base64: string | null;
  duration_ms: number;
  voice: string;
  error: string | null;
}

export async function synthesize(
  text: string,
  voice?: string,
  speed?: number,
): Promise<TTSResult> {
  if (!VNPT_ACCESS_TOKEN) {
    console.warn("[TTS] No VNPT_ACCESS_TOKEN — skipping TTS");
    return { audio_url: null, audio_base64: null, duration_ms: 0, voice: voice ?? TTS_VOICE, error: "no_token" };
  }

  const cleanText = stripSSML(text);
  if (!cleanText.trim()) {
    return { audio_url: null, audio_base64: null, duration_ms: 0, voice: voice ?? TTS_VOICE, error: "empty_text" };
  }

  const selectedVoice = voice ?? TTS_VOICE;
  const selectedSpeed = speed ?? TTS_SPEED;

  try {
    return await ttsV2(cleanText, selectedVoice, selectedSpeed);
  } catch (e) {
    console.error(`[TTS] V2 failed: ${e}`);
    try {
      return await ttsBasic(cleanText, mapToBasicVoice(selectedVoice), selectedSpeed);
    } catch (e2) {
      console.error(`[TTS] Basic also failed: ${e2}`);
      return { audio_url: null, audio_base64: null, duration_ms: 0, voice: selectedVoice, error: String(e) };
    }
  }
}

async function ttsV2(text: string, region: string, speed: number): Promise<TTSResult> {
  const url = `${VNPT_BASE_URL}/tts-service/v2/standard`;
  const payload = {
    text,
    model: "news",
    region,
    speed,
    audio_format: "wav",
    auto_silence: true,
    use_abbr_converter: true,
    domain: "general",
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${VNPT_ACCESS_TOKEN}`,
      "Token-id": VNPT_TOKEN_ID,
      "Token-key": VNPT_TOKEN_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const obj = data.object ?? {};

  if (obj.code === "success") {
    const playlist = obj.playlist ?? [];
    if (playlist.length > 0) {
      const audioLink = playlist[0].audio_link ?? "";
      console.log(`[TTS V2] OK → ${audioLink.slice(0, 80)}...`);
      return {
        audio_url: audioLink,
        audio_base64: null,
        duration_ms: estimateSpeechDuration(text),
        voice: region,
        error: null,
      };
    }
  }

  if (obj.code === "pending") {
    const textId = obj.text_id ?? "";
    const audioLink = await pollTTSStatus(textId);
    return {
      audio_url: audioLink,
      audio_base64: null,
      duration_ms: estimateSpeechDuration(text),
      voice: region,
      error: audioLink ? null : "pending_timeout",
    };
  }

  throw new Error(`Unexpected TTS response: ${JSON.stringify(obj).slice(0, 200)}`);
}

async function ttsBasic(text: string, region: string, speed: number): Promise<TTSResult> {
  const url = `${VNPT_BASE_URL}/tts-service/v2/grpc`;
  const payload = {
    text,
    region,
    speed,
    audio_format: "wav",
    text_split: false,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${VNPT_ACCESS_TOKEN}`,
      "Token-id": VNPT_TOKEN_ID,
      "Token-key": VNPT_TOKEN_KEY,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const obj = data.object ?? {};

  if (obj.code === "success" && obj.playlist?.length > 0) {
    const audioLink = obj.playlist[0].audio_link ?? "";
    console.log(`[TTS Basic] OK → ${audioLink.slice(0, 80)}...`);
    return {
      audio_url: audioLink,
      audio_base64: null,
      duration_ms: estimateSpeechDuration(text),
      voice: region,
      error: null,
    };
  }

  throw new Error(`TTS Basic failed: ${JSON.stringify(obj).slice(0, 200)}`);
}

async function pollTTSStatus(textId: string, maxRetries = 8, intervalMs = 2000): Promise<string | null> {
  const url = `${VNPT_BASE_URL}/tts-service/v1/check-status`;

  for (let i = 0; i < maxRetries; i++) {
    await new Promise((r) => setTimeout(r, intervalMs));

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${VNPT_ACCESS_TOKEN}`,
        "Token-id": VNPT_TOKEN_ID,
        "Token-key": VNPT_TOKEN_KEY,
      },
      body: JSON.stringify({ text_id: textId }),
    });

    if (!resp.ok) continue;

    const data = await resp.json();
    const obj = data.object ?? {};

    if (obj.code === "success") {
      if (obj.r_audio_full) return obj.r_audio_full;
      if (obj.playlist?.length > 0) return obj.playlist[0].audio_link ?? null;
    }
  }

  console.warn(`[TTS] Polling timeout for text_id=${textId}`);
  return null;
}

function stripSSML(text: string): string {
  return text
    .replace(/<speak>|<\/speak>/gi, "")
    .replace(/<break[^>]*\/>/gi, ". ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapToBasicVoice(v2Voice: string): string {
  const map: Record<string, string> = {
    vi_fw_female_north: "female_north",
    vi_fw_male_central: "male_central",
    female_north_ngochoa: "female_north",
    female_central: "female_central",
    female_south: "female_south",
    male_north: "male_north",
    male_south: "male_south",
  };
  return map[v2Voice] ?? "female_north";
}

function estimateSpeechDuration(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.round((words / 3.5) * 1000);
}
