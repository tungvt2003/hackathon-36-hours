import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PLACES_PROVIDER } from './places.provider';
import { MockPlacesProvider } from './mock-places.provider';
import { DbPlacesProvider } from './db-places.provider';
import { SerpApiPlacesProvider } from './serpapi-places.provider';
import { GooglePlacesProvider } from './google-places.provider';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [
    PrismaService,
    {
      provide: PLACES_PROVIDER,
      useFactory: (config: ConfigService, prisma: PrismaService) => {
        const provider = config.get<string>('PROVIDER_PLACES', 'db');
        if (provider === 'db') return new DbPlacesProvider(prisma);
        if (provider === 'mock') return new MockPlacesProvider();
        if (provider === 'serpapi') return new SerpApiPlacesProvider(config);
        if (provider === 'google') return new GooglePlacesProvider(config);
        throw new Error(`Unknown Places provider: ${provider}`);
      },
      inject: [ConfigService, PrismaService],
    },
  ],
  exports: [PLACES_PROVIDER],
})
export class PlacesModule {}
