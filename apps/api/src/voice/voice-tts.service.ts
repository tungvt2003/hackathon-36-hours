import { Injectable, Logger } from '@nestjs/common';
import { VoiceTtsResult } from './voice.types';
import { VoiceEnvService } from './voice-env.service';

@Injectable()
export class VoiceTtsService {
  private readonly logger = new Logger(VoiceTtsService.name);

  constructor(private readonly env: VoiceEnvService) {}

  async synthesize(text: string, voice?: string, speed?: number): Promise<VoiceTtsResult> {
    if (this.env.get('ENABLE_TTS', 'true') === 'false') {
      return this.empty(voice, 'disabled');
    }

    const accessToken = this.env.get('VNPT_ACCESS_TOKEN');
    const tokenId = this.env.get('VNPT_TOKEN_ID');
    const tokenKey = this.env.get('VNPT_TOKEN_KEY');
    if (!accessToken || !tokenId || !tokenKey) return this.empty(voice, 'no_token');

    const selectedVoice = voice ?? this.env.get('TTS_VOICE', 'female_north');
    const selectedSpeed = speed ?? Number.parseFloat(this.env.get('TTS_SPEED', '1.0'));
    const cleanText = this.stripSsml(text);
    if (!cleanText) return this.empty(selectedVoice, 'empty_text');

    try {
      return await this.ttsV2(cleanText, selectedVoice, selectedSpeed);
    } catch (error) {
      this.logger.warn(`VNPT TTS v2 failed: ${String(error)}`);
      try {
        return await this.ttsBasic(
          cleanText,
          this.mapToBasicVoice(selectedVoice),
          selectedSpeed,
        );
      } catch (basicError) {
        this.logger.warn(`VNPT TTS basic failed: ${String(basicError)}`);
        return this.empty(selectedVoice, String(basicError));
      }
    }
  }

  private async ttsV2(
    text: string,
    region: string,
    speed: number,
  ): Promise<VoiceTtsResult> {
    const payload = {
      text,
      model: 'news',
      region,
      speed,
      audio_format: 'wav',
      auto_silence: true,
      use_abbr_converter: true,
      domain: 'general',
    };
    const data = await this.postJson('/tts-service/v2/standard', payload);
    const obj = data.object ?? {};

    if (obj.code === 'success' && Array.isArray(obj.playlist) && obj.playlist.length) {
      return {
        audio_url: String(obj.playlist[0].audio_link ?? ''),
        audio_base64: null,
        duration_ms: this.estimateSpeechDuration(text),
        voice: region,
        error: null,
      };
    }

    if (obj.code === 'pending' && obj.text_id) {
      const audioUrl = await this.pollTtsStatus(String(obj.text_id));
      return {
        audio_url: audioUrl,
        audio_base64: null,
        duration_ms: this.estimateSpeechDuration(text),
        voice: region,
        error: audioUrl ? null : 'pending_timeout',
      };
    }

    throw new Error(`Unexpected TTS response: ${JSON.stringify(obj).slice(0, 160)}`);
  }

  private async ttsBasic(
    text: string,
    region: string,
    speed: number,
  ): Promise<VoiceTtsResult> {
    const data = await this.postJson('/tts-service/v2/grpc', {
      text,
      region,
      speed,
      audio_format: 'wav',
      text_split: false,
    });
    const obj = data.object ?? {};

    if (obj.code === 'success' && Array.isArray(obj.playlist) && obj.playlist.length) {
      return {
        audio_url: String(obj.playlist[0].audio_link ?? ''),
        audio_base64: null,
        duration_ms: this.estimateSpeechDuration(text),
        voice: region,
        error: null,
      };
    }

    throw new Error(`Unexpected basic TTS response: ${JSON.stringify(obj).slice(0, 160)}`);
  }

  private async pollTtsStatus(
    textId: string,
    maxRetries = 8,
    intervalMs = 2000,
  ): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));

      try {
        const data = await this.postJson('/tts-service/v1/check-status', {
          text_id: textId,
        });
        const obj = data.object ?? {};
        if (obj.code === 'success') {
          if (obj.r_audio_full) return String(obj.r_audio_full);
          if (Array.isArray(obj.playlist) && obj.playlist.length) {
            return String(obj.playlist[0].audio_link ?? '');
          }
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private async postJson(path: string, payload: object): Promise<Record<string, any>> {
    const baseUrl = this.env.get('VNPT_BASE_URL', 'https://api.idg.vnpt.vn');
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.env.get('VNPT_ACCESS_TOKEN')}`,
        'Token-id': this.env.get('VNPT_TOKEN_ID'),
        'Token-key': this.env.get('VNPT_TOKEN_KEY'),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 160)}`);
    }

    return (await response.json()) as Record<string, any>;
  }

  private stripSsml(text: string): string {
    return text
      .replace(/<speak>|<\/speak>/gi, '')
      .replace(/<break[^>]*\/>/gi, '. ')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private mapToBasicVoice(v2Voice: string): string {
    const map: Record<string, string> = {
      vi_fw_female_north: 'female_north',
      vi_fw_male_central: 'male_central',
      female_north_ngochoa: 'female_north',
      female_central: 'female_central',
      female_south: 'female_south',
      male_north: 'male_north',
      male_south: 'male_south',
    };
    return map[v2Voice] ?? 'female_north';
  }

  private estimateSpeechDuration(text: string): number {
    const words = text.split(/\s+/).filter(Boolean).length;
    return Math.round((words / 3.5) * 1000);
  }

  private empty(voice?: string, error: string | null = null): VoiceTtsResult {
    return {
      audio_url: null,
      audio_base64: null,
      duration_ms: 0,
      voice: voice ?? this.env.get('TTS_VOICE', 'female_north'),
      error,
    };
  }
}
