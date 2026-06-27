import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { VoiceAsrResult } from './voice.types';
import { VoiceEnvService } from './voice-env.service';

const SILENCE_PAD_MS = 1000;
const STT_MAX_RETRIES = 2;
const STT_MIN_CONFIDENCE = 0.4;

@Injectable()
export class VoiceSttService {
  private readonly logger = new Logger(VoiceSttService.name);

  constructor(private readonly env: VoiceEnvService) {}

  async transcribe(
    audioBase64: string,
    sessionId: string,
    sampleRate = 16000,
  ): Promise<VoiceAsrResult> {
    const provider = this.env.getFirst(['STT_PROVIDER', 'PROVIDER_STT'], 'google');
    if (provider === 'mock') {
      return this.mockAsr(sessionId);
    }

    const cleanAudio = this.stripDataUrl(audioBase64);
    const effectiveSampleRate = this.readWavSampleRate(cleanAudio) ?? sampleRate;
    const paddedAudio = this.padSilence(
      cleanAudio,
      effectiveSampleRate,
      SILENCE_PAD_MS,
    );

    let best: VoiceAsrResult | null = null;
    for (let attempt = 0; attempt <= STT_MAX_RETRIES; attempt++) {
      const startMs = Date.now();
      const result =
        provider === 'vnpt'
          ? await this.transcribeVnpt(paddedAudio, sessionId, effectiveSampleRate, startMs)
          : await this.transcribeGoogle(paddedAudio, sessionId, effectiveSampleRate, startMs);

      if (result.confidence >= STT_MIN_CONFIDENCE && result.transcript) {
        return result;
      }

      if (!best || result.confidence > best.confidence) best = result;
    }

    return best ?? this.emptyAsr(sessionId);
  }

  private async transcribeGoogle(
    audioBase64: string,
    sessionId: string,
    sampleRate: number,
    startMs: number,
  ): Promise<VoiceAsrResult> {
    const apiKey = this.env.get('GOOGLE_STT_API_KEY');
    if (!apiKey) return this.emptyAsr(sessionId);

    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            encoding: 'LINEAR16',
            sampleRateHertz: sampleRate,
            languageCode: 'vi-VN',
            enableAutomaticPunctuation: true,
            model: 'latest_short',
          },
          audio: { content: audioBase64 },
        }),
      },
    );

    if (!response.ok) {
      this.logger.warn(`Google STT HTTP ${response.status}: ${(await response.text()).slice(0, 160)}`);
      return this.emptyAsr(sessionId);
    }

    const data = (await response.json()) as {
      results?: {
        alternatives?: { transcript?: string; confidence?: number }[];
      }[];
    };
    const alternatives = data.results?.[0]?.alternatives ?? [];
    const best = alternatives[0];

    return {
      request_id: randomUUID(),
      session_id: sessionId,
      transcript: best?.transcript ?? '',
      confidence: best?.confidence ?? 0,
      is_final: true,
      alternatives: alternatives.slice(1).map((alt) => ({
        transcript: alt.transcript ?? '',
        confidence: alt.confidence ?? 0,
      })),
      language: 'vi-VN',
      audio_duration_ms: this.estimateAudioDuration(audioBase64, sampleRate),
      barge_in: false,
    };
  }

  private async transcribeVnpt(
    audioBase64: string,
    sessionId: string,
    sampleRate: number,
    startMs: number,
  ): Promise<VoiceAsrResult> {
    const accessToken = this.env.get('VNPT_ACCESS_TOKEN');
    const tokenId = this.env.get('VNPT_TOKEN_ID');
    const tokenKey = this.env.get('VNPT_TOKEN_KEY');
    const baseUrl = this.env.get('VNPT_BASE_URL', 'https://api.idg.vnpt.vn');
    if (!accessToken || !tokenId || !tokenKey) return this.emptyAsr(sessionId);

    const response = await fetch(`${baseUrl}/stt-service/v3/standard`, {
      method: 'POST',
      headers: {
        Authorization: this.authorizationHeader(accessToken),
        'Token-id': tokenId,
        'Token-key': tokenKey,
        'Sample-Rate': String(sampleRate),
        'Enable-Lm': 'true',
        domain: 'general',
        'save-log': 'false',
      },
      body: Buffer.from(audioBase64, 'base64'),
    });

    if (!response.ok) {
      this.logger.warn(`VNPT STT HTTP ${response.status}: ${(await response.text()).slice(0, 160)}`);
      return this.emptyAsr(sessionId);
    }

    const data = (await response.json()) as {
      object?: { transcript?: string; audio_duration?: number };
    };
    const transcript = data.object?.transcript ?? '';

    return {
      request_id: randomUUID(),
      session_id: sessionId,
      transcript,
      confidence: transcript ? 0.85 : 0,
      is_final: true,
      alternatives: [],
      language: 'vi-VN',
      audio_duration_ms:
        data.object?.audio_duration !== undefined
          ? data.object.audio_duration * 1000
          : Date.now() - startMs,
      barge_in: false,
    };
  }

  private mockAsr(sessionId: string): VoiceAsrResult {
    return {
      request_id: randomUUID(),
      session_id: sessionId,
      transcript: 'dat xe den san bay Tan Son Nhat',
      confidence: 0.99,
      is_final: true,
      alternatives: [],
      language: 'vi-VN',
      audio_duration_ms: 0,
      barge_in: false,
    };
  }

  private emptyAsr(sessionId: string): VoiceAsrResult {
    return {
      request_id: randomUUID(),
      session_id: sessionId,
      transcript: '',
      confidence: 0,
      is_final: true,
      alternatives: [],
      language: 'vi-VN',
      audio_duration_ms: 0,
      barge_in: false,
    };
  }

  private padSilence(
    audioBase64: string,
    sampleRate: number,
    durationMs: number,
  ): string {
    const audioBytes = Buffer.from(audioBase64, 'base64');
    const isWav =
      audioBytes[0] === 0x52 &&
      audioBytes[1] === 0x49 &&
      audioBytes[2] === 0x46 &&
      audioBytes[3] === 0x46;
    const silence = Buffer.alloc(Math.floor((sampleRate * durationMs) / 1000) * 2);

    if (isWav && audioBytes.length > 44) {
      const header = Buffer.from(audioBytes.subarray(0, 44));
      const pcm = audioBytes.subarray(44);
      const result = Buffer.concat([header, silence, pcm, silence]);
      result.writeUInt32LE(result.length - 8, 4);
      result.writeUInt32LE(result.length - 44, 40);
      return result.toString('base64');
    }

    return Buffer.concat([silence, audioBytes, silence]).toString('base64');
  }

  private stripDataUrl(audioBase64: string): string {
    const comma = audioBase64.indexOf(',');
    return audioBase64.startsWith('data:') && comma >= 0
      ? audioBase64.slice(comma + 1)
      : audioBase64;
  }

  private readWavSampleRate(audioBase64: string): number | null {
    const audioBytes = Buffer.from(audioBase64, 'base64');
    const isWav =
      audioBytes.length > 28 &&
      audioBytes[0] === 0x52 &&
      audioBytes[1] === 0x49 &&
      audioBytes[2] === 0x46 &&
      audioBytes[3] === 0x46;
    return isWav ? audioBytes.readUInt32LE(24) : null;
  }

  private estimateAudioDuration(base64: string, sampleRate: number): number {
    const bytes = (base64.length * 3) / 4;
    const samples = bytes / 2;
    return Math.round((samples / sampleRate) * 1000);
  }

  private authorizationHeader(accessToken: string): string {
    return /^bearer\s+/i.test(accessToken)
      ? accessToken.replace(/^bearer/i, 'Bearer')
      : `Bearer ${accessToken}`;
  }
}
