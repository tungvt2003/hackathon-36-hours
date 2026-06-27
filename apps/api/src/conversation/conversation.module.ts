import { Module } from '@nestjs/common';
import { ConversationController } from './conversation.controller';
import { ConversationService } from './conversation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { OrdersModule } from '../orders/orders.module';
import { NluModule } from '../nlu/nlu.module';

@Module({
  imports: [PrismaModule, RestaurantsModule, OrdersModule, NluModule],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule {}
