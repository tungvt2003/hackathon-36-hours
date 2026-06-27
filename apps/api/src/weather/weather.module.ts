import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WEATHER_PROVIDER } from './weather.provider';
import { MockWeatherProvider } from './mock-weather.provider';
import { OpenMeteoProvider } from './open-meteo.provider';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    {
      provide: WEATHER_PROVIDER,
      useFactory: (config: ConfigService, prisma: PrismaService) => {
        const provider = config.get<string>('PROVIDER_WEATHER', 'mock');
        if (provider === 'mock') return new MockWeatherProvider(prisma);
        if (provider === 'open-meteo') return new OpenMeteoProvider(prisma);
        throw new Error(`Unknown Weather provider: ${provider}`);
      },
      inject: [ConfigService, PrismaService],
    },
  ],
  exports: [WEATHER_PROVIDER],
})
export class WeatherModule {}
