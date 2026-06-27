import { Module } from '@nestjs/common';
import { SttModule } from '../stt/stt.module';
import { NluModule } from '../nlu/nlu.module';
import { PlacesModule } from '../places/places.module';
import { WeatherModule } from '../weather/weather.module';
import { PartnersModule } from '../partners/partners.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    SttModule,
    NluModule,
    PlacesModule,
    WeatherModule,
    PartnersModule,
    RestaurantsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
