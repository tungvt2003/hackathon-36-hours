import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OrdersService } from './orders.service';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { Inject } from '@nestjs/common';
import { PLACES_PROVIDER } from '../places/places.provider';
import type { PlacesProvider } from '../places/places.provider';
import { WEATHER_PROVIDER } from '../weather/weather.provider';
import type { WeatherProvider } from '../weather/weather.provider';
import { STT_PROVIDER } from '../stt/stt.provider';
import type { SttProvider } from '../stt/stt.provider';
import { NLU_PROVIDER } from '../nlu/nlu.provider';
import type { NluProvider } from '../nlu/nlu.provider';

class ReviewDto {
  @IsInt() @Min(1) @Max(5) restaurantRating!: number;
  @IsInt() @Min(1) @Max(5) driverRating!: number;
  @IsOptional() @IsString() voiceText?: string;
}

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(STT_PROVIDER) private readonly stt: SttProvider,
    @Inject(NLU_PROVIDER) private readonly nlu: NluProvider,
    @Inject(PLACES_PROVIDER) private readonly places: PlacesProvider,
    @Inject(WEATHER_PROVIDER) private readonly weather: WeatherProvider,
  ) { }

  @Get('health')
  health() {
    return { ok: true };
  }

  /**
   * Lịch sử đơn hàng thành công — loại trừ QUOTED và CANCELLED.
   * Query params:
   *   - userId: lọc theo user (optional)
   *   - type:   FOOD | RIDE (optional)
   *   - limit:  số lượng tối đa (default 20)
   *
   * Ví dụ:
   *   GET /orders/history
   *   GET /orders/history?type=FOOD&limit=5
   *   GET /orders/history?userId=user-001
   */
  @Get('orders/history')
  getOrderHistory(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.getOrderHistory({
      userId,
      type,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /** Xác nhận chọn đối tác sau khi AI Service đọc quotes cho user */
  @Post('orders/confirm')
  async confirmOrder(@Body() dto: ConfirmOrderDto) {
    return this.ordersService.confirmOrder(dto.orderId, dto.partner);
  }

  /** Lấy trạng thái đơn hàng (poll sau khi confirm) */
  @Get('orders/:id/status')
  orderStatus(@Param('id') id: string) {
    return this.ordersService.getOrderStatus(id);
  }

  /** Review sau khi giao hàng / kết thúc chuyến */
  @Post('orders/:id/review')
  submitReview(@Param('id') id: string, @Body() body: ReviewDto) {
    return this.ordersService.submitReview(id, body);
  }

  // ---- Debug endpoints (dev only) ----

  /** Test STT riêng: POST /stt { audioBase64: "..." } */
  @Post('stt')
  async testStt(@Body() body: { audioBase64: string }) {
    const transcript = await this.stt.transcribe(body.audioBase64 ?? '');
    return { transcript };
  }

  /** Test NLU riêng: POST /nlu { transcript: "..." } */
  @Post('nlu')
  async testNlu(@Body() body: { transcript: string }) {
    const intent = await this.nlu.parse(body.transcript ?? '');
    return { intent };
  }

  /** Test Places/Google Maps: GET /places/status?q=tên+địa+điểm */
  @Get('places/status')
  async testPlaces(@Query('q') q: string) {
    const status = await this.places.getStatus(q ?? 'TP.HCM');
    return { status };
  }

  /** Test Weather/Open-Meteo: GET /weather?location=tên+địa+điểm */
  @Get('weather')
  async testWeather(@Query('location') location: string) {
    const info = await this.weather.getCurrent(location ?? 'TP.HCM');
    return { weather: info };
  }
}
