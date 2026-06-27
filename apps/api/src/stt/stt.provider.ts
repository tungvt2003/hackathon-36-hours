// Interface STT - team voice implement sau bằng provider thật (Google STT, Whisper, v.v.)
export interface SttProvider {
  /**
   * Chuyển audio base64 thành text.
   * Giai đoạn basic: nếu đã có transcript thì bỏ qua bước này.
   */
  transcribe(audioBase64: string): Promise<string>;
}

export const STT_PROVIDER = 'STT_PROVIDER';
