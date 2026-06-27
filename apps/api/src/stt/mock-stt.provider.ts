import { Injectable } from '@nestjs/common';
import { SttProvider } from './stt.provider';

// TODO: team voice thay bằng provider thật (Google Cloud STT hoặc Whisper)
// Cài: npx expo install expo-audio (mobile) + gọi API STT trên BE
@Injectable()
export class MockSttProvider implements SttProvider {
  async transcribe(_audioBase64: string): Promise<string> {
    // Trả text mẫu cố định để test pipeline
    return 'đặt xe từ nhà đến sân bay Tân Sơn Nhất';
  }
}
