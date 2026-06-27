import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STT_PROVIDER } from './stt.provider';
import { MockSttProvider } from './mock-stt.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: STT_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('PROVIDER_STT', 'mock');
        // TODO: thêm case 'google', 'whisper', v.v. khi có provider thật
        if (provider === 'mock') return new MockSttProvider();
        throw new Error(`Unknown STT provider: ${provider}`);
      },
      inject: [ConfigService],
    },
  ],
  exports: [STT_PROVIDER],
})
export class SttModule {}
