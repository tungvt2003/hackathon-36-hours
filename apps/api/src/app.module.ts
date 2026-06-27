import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConversationModule } from './conversation/conversation.module';
import { OrdersModule } from './orders/orders.module';
import { PartnerSimModule } from './partner-sim/partner-sim.module';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantsModule } from './restaurants/restaurants.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.register({ timeout: 8000 }),
    PrismaModule,
    PartnerSimModule,
    OrdersModule,
    RestaurantsModule,
    ConversationModule,
  ],
})
export class AppModule {}
