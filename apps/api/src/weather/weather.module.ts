import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WEATHER_PROVIDER } from './weather.provider';
import { MockWeatherProvider } from './mock-weather.provider';
import { OpenMeteoProvider } from './open-meteo.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: WEATHER_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('PROVIDER_WEATHER', 'mock');
        if (provider === 'mock') return new MockWeatherProvider();
        if (provider === 'open-meteo') return new OpenMeteoProvider();
        throw new Error(`Unknown Weather provider: ${provider}`);
      },
      inject: [ConfigService],
    },
  ],
  exports: [WEATHER_PROVIDER],
})
export class WeatherModule {}
