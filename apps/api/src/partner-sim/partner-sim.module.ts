import { Module } from '@nestjs/common';
import { PartnerSimController } from './partner-sim.controller';
import { PartnerSimService } from './partner-sim.service';

@Module({
  controllers: [PartnerSimController],
  providers: [PartnerSimService],
})
export class PartnerSimModule {}
