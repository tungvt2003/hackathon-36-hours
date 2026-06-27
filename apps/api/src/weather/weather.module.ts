import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WEATHER_PROVIDER } from './weather.provider';
import { MockWeatherProvider } from './mock-weather.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: WEATHER_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('PROVIDER_WEATHER', 'mock');
        // TODO: thêm case 'openweathermap', 'weatherapi' khi có API key
        if (provider === 'mock') return new MockWeatherProvider();
        throw new Error(`Unknown Weather provider: ${provider}`);
      },
      inject: [ConfigService],
    },
  ],
  exports: [WEATHER_PROVIDER],
})
export class WeatherModule {}
