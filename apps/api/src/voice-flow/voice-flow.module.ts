import { Module, forwardRef } from '@nestjs/common';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { PlacesModule } from '../places/places.module';
import { WeatherModule } from '../weather/weather.module';
import { PartnersModule } from '../partners/partners.module';
import { ConversationModule } from '../conversation/conversation.module';
import { VoiceFlowController } from './voice-flow.controller';
import { VoiceFlowService } from './voice-flow.service';
import { SessionCacheService } from './session-cache.service';

@Module({
  imports: [
    RestaurantsModule,
    PlacesModule,
    WeatherModule,
    PartnersModule,
    forwardRef(() => ConversationModule),
  ],
  controllers: [VoiceFlowController],
  providers: [VoiceFlowService, SessionCacheService],
  exports: [VoiceFlowService, SessionCacheService],
})
export class VoiceFlowModule { }

