import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NLU_PROVIDER } from './nlu.provider';
import { MockNluProvider } from './mock-nlu.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: NLU_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('PROVIDER_NLU', 'mock');
        // TODO: thêm case 'openai', 'claude', 'rasa' khi có provider thật
        if (provider === 'mock') return new MockNluProvider();
        throw new Error(`Unknown NLU provider: ${provider}`);
      },
      inject: [ConfigService],
    },
  ],
  exports: [NLU_PROVIDER],
})
export class NluModule {}
