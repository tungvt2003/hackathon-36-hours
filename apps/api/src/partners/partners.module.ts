import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GrabAdapter } from './adapters/grab.adapter';
import { BeAdapter } from './adapters/be.adapter';
import { XanhSmAdapter } from './adapters/xanh-sm.adapter';
import { PartnersService } from './partners.service';
import { DbPartnersService } from './db-partners.service';
import { PrismaService } from '../prisma/prisma.service';

export const PARTNERS_IMPL = 'PARTNERS_IMPL';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [
    PrismaService,
    GrabAdapter,
    BeAdapter,
    XanhSmAdapter,
    PartnersService,
    DbPartnersService,
    {
      provide: PARTNERS_IMPL,
      useFactory: (
        config: ConfigService,
        db: DbPartnersService,
        fixture: PartnersService,
      ) => {
        const provider = config.get<string>('PROVIDER_PARTNER', 'db');
        if (provider === 'db') return db;
        if (provider === 'mock') return fixture;
        throw new Error(`Unknown Partner provider: ${provider}`);
      },
      inject: [ConfigService, DbPartnersService, PartnersService],
    },
  ],
  exports: [PARTNERS_IMPL, PartnersService, DbPartnersService],
})
export class PartnersModule {}
