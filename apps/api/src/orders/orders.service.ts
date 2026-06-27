import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ConfirmOrderResponse,
  Enrichment,
  Intent,
  OrderStatus,
  OrderType,
  PartnerCode,
  PartnerQuote,
  VoiceOrderResponse,
} from '../types';
import { STT_PROVIDER, SttProvider } from '../stt/stt.provider';
import { NLU_PROVIDER, NluProvider } from '../nlu/nlu.provider';
import { PLACES_PROVIDER, PlacesProvider } from '../places/places.provider';
import { WEATHER_PROVIDER, WeatherProvider } from '../weather/weather.provider';
import { PARTNERS_IMPL } from '../partners/partners.module';
import { PrismaService } from '../prisma/prisma.service';

/** Interface tối giản — cả DbPartnersService lẫn PartnersService đều implement */
interface IPartnersService {
  quoteAll(intent: Intent): Promise<PartnerQuote[]>;
  confirm(partner: PartnerCode, orderId: string): Promise<{ externalId: string; message: string }>;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(STT_PROVIDER) private readonly stt: SttProvider,
    @Inject(NLU_PROVIDER) private readonly nlu: NluProvider,
    @Inject(PLACES_PROVIDER) private readonly places: PlacesProvider,
    @Inject(WEATHER_PROVIDER) private readonly weather: WeatherProvider,
    @Inject(PARTNERS_IMPL) private readonly partners: IPartnersService,
    private readonly prisma: PrismaService,
  ) {}

  /** Pipeline chính: transcript -> NLU -> enrichment -> quotes -> lưu DB */
  async processVoice(params: {
    userId?: string;
    transcript?: string;
    audioBase64?: string;
  }): Promise<VoiceOrderResponse> {
    // 1. STT: bỏ qua nếu đã có transcript
    let transcript = params.transcript ?? '';
    if (!transcript && params.audioBase64) {
      transcript = await this.stt.transcribe(params.audioBase64);
      this.logger.log(`STT: "${transcript}"`);
    }

    // 2. NLU: phân tích ý định
    const intent: Intent = await this.nlu.parse(transcript);
    this.logger.log(`NLU: type=${intent.type}, dest=${intent.destination}`);

    // 3. Enrichment: thời tiết + trạng thái địa điểm (song song)
    const locationQuery =
      intent.type === OrderType.RIDE
        ? (intent.destination ?? intent.origin ?? 'TP.HCM')
        : (intent.restaurant ?? 'TP.HCM');

    const [placeStatus, weatherInfo] = await Promise.all([
      this.places.getStatus(locationQuery),
      this.weather.getCurrent(locationQuery),
    ]);

    const enrichment: Enrichment = { place: placeStatus, weather: weatherInfo };

    // 4. Lấy báo giá từ các đối tác (từ DB hoặc fixture tuỳ PROVIDER_PARTNER)
    const quotes = await this.partners.quoteAll(intent);

    // 5. Tạo câu trả lời tiếng Việt cho TTS đọc
    const responseText = this.buildResponseText(intent, enrichment, quotes);

    // 6. Lưu Order vào DB
    const order = await this.saveOrder({ userId: params.userId, intent, quotes, responseText });

    // 7. Ghi log từng bước
    await this.logEvents(order.id, { transcript, intent, enrichment, quotes });

    return { orderId: order.id, transcript, intent, enrichment, quotes, responseText };
  }

  /** Xác nhận chọn đối tác -> cập nhật Order */
  async confirmOrder(orderId: string, partner: PartnerCode): Promise<ConfirmOrderResponse> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const confirmation = await this.partners.confirm(partner, orderId);

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CONFIRMED, partner, responseText: confirmation.message },
    });

    await this.prisma.orderEvent.create({
      data: { orderId, step: 'CONFIRM', payload: { partner, externalId: confirmation.externalId } },
    });

    return { orderId, status: OrderStatus.CONFIRMED, partner, responseText: confirmation.message };
  }

  // ── helpers ────────────────────────────────────────────────

  private buildResponseText(
    intent: Intent,
    enrichment: Enrichment,
    quotes: PartnerQuote[],
  ): string {
    const available = quotes.filter((q) => q.available);
    if (available.length === 0) return 'Hiện không có xe nào khả dụng. Vui lòng thử lại sau.';

    const cheapest = available.reduce((a, b) => (a.price < b.price ? a : b));

    let text =
      intent.type === OrderType.RIDE
        ? `Đặt xe đến ${intent.destination ?? 'điểm đến'}.`
        : `Đặt đồ ăn từ ${intent.restaurant ?? 'quán'}.`;

    if (enrichment.weather?.willRain) {
      text += ` Lưu ý trời đang ${enrichment.weather.condition}.`;
    }
    if (enrichment.place && !enrichment.place.isOpen) {
      text += ` Địa điểm ${enrichment.place.name} có thể đã đóng cửa.`;
    }

    text += ` Giá rẻ nhất: ${cheapest.partner} — ${cheapest.price.toLocaleString('vi-VN')} đồng, khoảng ${cheapest.etaMinutes} phút.`;
    text += ` Có ${available.length} lựa chọn. Bạn muốn chọn đối tác nào?`;
    return text;
  }

  private async saveOrder(params: {
    userId?: string;
    intent: Intent;
    quotes: PartnerQuote[];
    responseText: string;
  }) {
    const cheapest = params.quotes[0];
    return this.prisma.order.create({
      data: {
        userId: params.userId,
        type: params.intent.type,
        origin: params.intent.origin,
        destination: params.intent.destination,
        restaurant: params.intent.restaurant,
        items: params.intent.items ?? [],
        status: OrderStatus.QUOTED,
        quotePrice: cheapest?.price,
        etaMinutes: cheapest?.etaMinutes,
        responseText: params.responseText,
      },
    });
  }

  private async logEvents(
    orderId: string,
    data: { transcript: string; intent: Intent; enrichment: Enrichment; quotes: unknown[] },
  ) {
    await this.prisma.orderEvent.createMany({
      data: [
        { orderId, step: 'STT', payload: { transcript: data.transcript } },
        { orderId, step: 'NLU', payload: data.intent as object },
        { orderId, step: 'ENRICHMENT', payload: data.enrichment as object },
        { orderId, step: 'PARTNER_QUOTE', payload: { quotes: data.quotes } },
      ],
    });
  }
}
