import { Controller, Get, Param, Query } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurants: RestaurantsService) {}

  /** GET /restaurants?partner=GRAB */
  @Get()
  list(@Query('partner') partner?: string) {
    return this.restaurants.listAll(partner);
  }

  /** GET /restaurants/:id/menu?partner=GRAB */
  @Get(':id/menu')
  menu(@Param('id') id: string, @Query('partner') partner: string = 'GRAB') {
    return this.restaurants.getMenu(id, partner);
  }
}
