import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersModule } from '../orders/orders.module';
import { VoiceController } from './voice.controller';
import { VoiceEnvService } from './voice-env.service';
import { VoiceNlgService } from './voice-nlg.service';
import { VoiceNluService } from './voice-nlu.service';
import { VoiceService } from './voice.service';
import { VoiceSessionStore } from './voice-session.store';
import { VoiceSttService } from './voice-stt.service';
import { VoiceTtsService } from './voice-tts.service';

@Module({
  imports: [ConfigModule, OrdersModule],
  controllers: [VoiceController],
  providers: [
    VoiceEnvService,
    VoiceSessionStore,
    VoiceNluService,
    VoiceNlgService,
    VoiceSttService,
    VoiceTtsService,
    VoiceService,
  ],
  exports: [VoiceService],
})
export class VoiceModule {}
