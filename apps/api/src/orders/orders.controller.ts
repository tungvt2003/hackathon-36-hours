import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OrdersService } from './orders.service';
import { VoiceOrderDto } from './dto/voice-order.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';

class ReviewDto {
  @IsInt() @Min(1) @Max(5) restaurantRating!: number;
  @IsInt() @Min(1) @Max(5) driverRating!: number;
  @IsOptional() @IsString() voiceText?: string;
}
import { Inject } from '@nestjs/common';
import { STT_PROVIDER } from '../stt/stt.provider';
import type { SttProvider } from '../stt/stt.provider';
import { NLU_PROVIDER } from '../nlu/nlu.provider';
import type { NluProvider } from '../nlu/nlu.provider';
import { PLACES_PROVIDER } from '../places/places.provider';
import type { PlacesProvider } from '../places/places.provider';
import { WEATHER_PROVIDER } from '../weather/weather.provider';
import type { WeatherProvider } from '../weather/weather.provider';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    @Inject(STT_PROVIDER) private readonly stt: SttProvider,
    @Inject(NLU_PROVIDER) private readonly nlu: NluProvider,
    @Inject(PLACES_PROVIDER) private readonly places: PlacesProvider,
    @Inject(WEATHER_PROVIDER) private readonly weather: WeatherProvider,
  ) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  /** Endpoint chính: nhận transcript -> trả quotes + responseText */
  @Post('orders/voice')
  async voiceOrder(@Body() dto: VoiceOrderDto) {
    return this.ordersService.processVoice(dto);
  }

  /** Xác nhận chọn đối tác */
  @Post('orders/confirm')
  async confirmOrder(@Body() dto: ConfirmOrderDto) {
    return this.ordersService.confirmOrder(dto.orderId, dto.partner);
  }

  /** Lấy trạng thái đơn hàng + responseText để TTS đọc */
  @Get('orders/:id/status')
  orderStatus(@Param('id') id: string) {
    return this.ordersService.getOrderStatus(id);
  }

  /** Phase 6 — review sau khi giao */
  @Post('orders/:id/review')
  submitReview(@Param('id') id: string, @Body() body: ReviewDto) {
    return this.ordersService.submitReview(id, body);
  }

  // ---- Endpoint test riêng từng bước ----

  /** Test STT: POST /stt body { audioBase64: "..." } */
  @Post('stt')
  async testStt(@Body() body: { audioBase64: string }) {
    const transcript = await this.stt.transcribe(body.audioBase64 ?? '');
    return { transcript };
  }

  /** Test NLU: POST /nlu body { transcript: "..." } */
  @Post('nlu')
  async testNlu(@Body() body: { transcript: string }) {
    const intent = await this.nlu.parse(body.transcript ?? '');
    return { intent };
  }

  /** Test Places: GET /places/status?q=tên+địa+điểm */
  @Get('places/status')
  async testPlaces(@Query('q') q: string) {
    const status = await this.places.getStatus(q ?? 'TP.HCM');
    return { status };
  }

  /** Test Weather: GET /weather?location=tên+địa+điểm */
  @Get('weather')
  async testWeather(@Query('location') location: string) {
    const info = await this.weather.getCurrent(location ?? 'TP.HCM');
    return { weather: info };
  }
}
