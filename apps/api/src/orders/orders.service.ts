import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ConfirmOrderResponse,
  Enrichment,
  FoodQuote,
  Intent,
  OrderedItem,
  OrderStatus,
  OrderType,
  PartnerCode,
  PartnerQuote,
  VoiceOrderResponse,
} from '../types';
import { STT_PROVIDER } from '../stt/stt.provider';
import type { SttProvider } from '../stt/stt.provider';
import { NLU_PROVIDER } from '../nlu/nlu.provider';
import type { NluProvider } from '../nlu/nlu.provider';
import { PLACES_PROVIDER } from '../places/places.provider';
import type { PlacesProvider } from '../places/places.provider';
import { WEATHER_PROVIDER } from '../weather/weather.provider';
import type { WeatherProvider } from '../weather/weather.provider';
import { PARTNERS_IMPL } from '../partners/partners.module';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';

/** Interface tối giản — cả DbPartnersService lẫn PartnersService đều implement */
interface IPartnersService {
  quoteAll(intent: Intent): Promise<PartnerQuote[]>;
  confirm(
    partner: PartnerCode,
    orderId: string,
  ): Promise<{ externalId: string; message: string }>;
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
    private readonly restaurantsService: RestaurantsService,
  ) {}

  /** Pipeline chính: transcript -> NLU -> enrichment -> quotes -> lưu DB */
  async processVoice(params: {
    userId?: string;
    transcript?: string;
    audioBase64?: string;
    currentLat?: number;
    currentLng?: number;
    accessibilityFlag?: boolean;
  }): Promise<VoiceOrderResponse> {
    // 1. STT
    let transcript = params.transcript ?? '';
    if (!transcript && params.audioBase64) {
      transcript = await this.stt.transcribe(params.audioBase64);
      this.logger.log(`STT: "${transcript}"`);
    }

    // 2. NLU
    const intent: Intent = await this.nlu.parse(transcript);
    this.logger.log(
      `NLU: type=${intent.type}, dest=${intent.destination}, restaurant=${intent.restaurant}`,
    );

    // 3. Branch FOOD vs RIDE
    if (intent.type === OrderType.FOOD) {
      return this.processFoodOrder({
        userId: params.userId,
        transcript,
        intent,
        accessibilityFlag: params.accessibilityFlag,
      });
    }
    return this.processRideOrder({
      userId: params.userId,
      transcript,
      intent,
      currentLat: params.currentLat,
      currentLng: params.currentLng,
      accessibilityFlag: params.accessibilityFlag,
    });
  }

  /** FOOD flow: fan-out tìm quán + món -> tính quote theo từng partner */
  private async processFoodOrder(params: {
    userId?: string;
    transcript: string;
    intent: Intent;
    accessibilityFlag?: boolean;
  }): Promise<VoiceOrderResponse> {
    const { intent, transcript } = params;

    const restaurantQuery = [intent.restaurant, ...(intent.items ?? [])]
      .filter(Boolean)
      .join(' ');
    const matches =
      await this.restaurantsService.searchRestaurants(restaurantQuery);

    if (matches.length === 0) {
      const responseText = `Tôi không tìm thấy quán nào phù hợp với "${restaurantQuery}". Bạn có thể nói rõ hơn tên quán không?`;
      const order = await this.prisma.order.create({
        data: {
          userId: params.userId,
          type: OrderType.FOOD,
          restaurant: restaurantQuery,
          status: OrderStatus.QUOTED,
          responseText,
          accessibilityFlag: params.accessibilityFlag ?? false,
        },
      });
      return {
        orderId: order.id,
        transcript,
        intent,
        enrichment: {},
        quotes: [],
        responseText,
      };
    }

    const hour = new Date().getHours();

    type QuoteWithMeta = FoodQuote & {
      restaurant: (typeof matches)[0];
      items: OrderedItem[];
    };

    // Fan-out song song sang tất cả matches
    const rawQuotes = (
      await Promise.all(
        matches.map(async (match): Promise<QuoteWithMeta | null> => {
          const isOpen = hour >= match.openHour && hour < match.closeHour;
          if (!isOpen) return null;
          const items = await this.restaurantsService.resolveItems(
            match.restaurantId,
            match.partner,
            intent.items ?? [],
          );
          if (items.length === 0) return null;
          const quote = await this.restaurantsService.calcQuote(match, items);
          return quote.available
            ? { ...quote, restaurant: match, items }
            : null;
        }),
      )
    )
      .filter((q): q is QuoteWithMeta => q !== null)
      .sort((a, b) => a.totalVnd - b.totalVnd);

    const best = rawQuotes[0] as QuoteWithMeta | undefined;
    const primaryRestaurant = best?.restaurant ?? matches[0];
    const resolvedItems: OrderedItem[] = best?.items ?? [];

    const isOpen =
      hour >= primaryRestaurant.openHour && hour < primaryRestaurant.closeHour;
    const enrichment: Enrichment = {
      place: {
        name: primaryRestaurant.name,
        isOpen,
        address: primaryRestaurant.address,
      },
    };

    // Strip meta fields trước khi trả response
    const cleanQuotes: FoodQuote[] = rawQuotes.map(
      ({ restaurant: _r, items: _i, ...q }) => q,
    );

    const responseText = this.buildFoodResponseText(
      primaryRestaurant,
      isOpen,
      resolvedItems,
      cleanQuotes,
      matches.length > 1,
    );

    const order = await this.prisma.order.create({
      data: {
        userId: params.userId,
        type: OrderType.FOOD,
        partnerRestaurantId: primaryRestaurant.restaurantId,
        partner: best?.partner,
        restaurant: primaryRestaurant.name,
        items: resolvedItems as object[],
        status: OrderStatus.QUOTED,
        subtotalVnd: best?.subtotalVnd,
        deliveryFeeVnd: best?.deliveryFeeVnd,
        discountVnd: best?.discountVnd,
        totalVnd: best?.totalVnd,
        etaMinutes: best?.etaMinutes,
        responseText,
        accessibilityFlag: params.accessibilityFlag ?? false,
      },
    });

    await this.logEvents(order.id, {
      transcript,
      intent,
      enrichment,
      quotes: cleanQuotes,
    });

    return {
      orderId: order.id,
      transcript,
      intent,
      enrichment,
      quotes: [],
      foodQuotes: cleanQuotes,
      resolvedRestaurant: {
        id: primaryRestaurant.restaurantId,
        partner: primaryRestaurant.partner,
        name: primaryRestaurant.name,
        address: primaryRestaurant.address,
        isOpen,
      },
      resolvedItems,
      responseText,
    };
  }

  /** RIDE flow: lấy quote từ tất cả partner, tính giá theo khoảng cách + thời tiết */
  private async processRideOrder(params: {
    userId?: string;
    transcript: string;
    intent: Intent;
    currentLat?: number;
    currentLng?: number;
    accessibilityFlag?: boolean;
  }): Promise<VoiceOrderResponse> {
    const { intent, transcript } = params;

    const locationQuery = intent.destination ?? intent.origin ?? 'TP.HCM';
    const [placeStatus, weatherInfo] = await Promise.all([
      this.places.getStatus(locationQuery),
      this.weather.getCurrent(locationQuery),
    ]);

    const enrichment: Enrichment = { place: placeStatus, weather: weatherInfo };

    // Tính khoảng cách địa lý (đường chim bay) nếu có GPS từ client
    let distance: number | undefined;
    if (
      params.currentLat !== undefined &&
      params.currentLng !== undefined &&
      placeStatus.latitude !== undefined &&
      placeStatus.longitude !== undefined
    ) {
      distance = this.calculateDistance(
        params.currentLat,
        params.currentLng,
        placeStatus.latitude,
        placeStatus.longitude,
      );
      this.logger.log(
        `Calculated distance to ${placeStatus.name}: ${distance.toFixed(2)} km`,
      );
    }

    const quotes = await this.partners.quoteAll(intent);

    // Dynamic pricing: giá cơ bản + khoảng cách * 12k/km, surge +20% nếu mưa
    if (distance !== undefined) {
      quotes.forEach((q) => {
        let computedPrice = q.price + Math.round(distance! * 12000);
        if (weatherInfo.willRain) {
          computedPrice = Math.round(computedPrice * 1.2);
        }
        q.price = computedPrice;
      });
    }

    const responseText = this.buildRideResponseText(
      intent,
      enrichment,
      quotes,
      distance,
    );

    const order = await this.saveRideOrder({
      userId: params.userId,
      intent,
      quotes,
      responseText,
      accessibilityFlag: params.accessibilityFlag ?? false,
    });

    await this.logEvents(order.id, { transcript, intent, enrichment, quotes });

    return {
      orderId: order.id,
      transcript,
      intent,
      enrichment,
      quotes,
      responseText,
    };
  }

  /** Lấy trạng thái đơn + responseText cho TTS */
  async getOrderStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const statusText: Record<string, string> = {
      [OrderStatus.QUOTED]: 'Đang chờ bạn chọn đối tác.',
      [OrderStatus.CONFIRMED]: 'Đơn đã xác nhận. Đang tìm tài xế.',
      [OrderStatus.DRIVER_ASSIGNED]: `Tài xế đã nhận đơn. Đang trên đường đến.`,
      [OrderStatus.IN_TRANSIT]: 'Tài xế đang trên đường giao hàng đến bạn.',
      [OrderStatus.DELIVERED]:
        'Đơn hàng đã giao thành công. Bạn có muốn đánh giá không?',
      [OrderStatus.CANCELLED]: 'Đơn hàng đã bị huỷ.',
    };

    return {
      orderId,
      status: order.status,
      partner: order.partner,
      responseText: statusText[order.status] ?? order.responseText,
      etaMinutes: order.etaMinutes,
      partnerDriverId: order.partnerDriverId,
      driverName: order.driverName,
    };
  }

  /** Xác nhận chọn đối tác -> cập nhật Order + kick state machine */
  async confirmOrder(
    orderId: string,
    partner: PartnerCode,
  ): Promise<ConfirmOrderResponse & { driverNotification?: object }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const confirmation = await this.partners.confirm(partner, orderId);

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CONFIRMED,
        partner,
        responseText: confirmation.message,
      },
    });
    await this.prisma.orderEvent.create({
      data: {
        orderId,
        step: 'CONFIRM',
        payload: { partner, externalId: confirmation.externalId },
      },
    });

    // Phase 5 — kick auto-advance state machine (fire-and-forget)
    this.runStateMachine(orderId, partner).catch((e) =>
      this.logger.error(`StateMachine error for ${orderId}: ${e}`),
    );

    const response: ConfirmOrderResponse & { driverNotification?: object } = {
      orderId,
      status: OrderStatus.CONFIRMED,
      partner,
      responseText: confirmation.message,
    };

    // Phase 7 — disability notification
    if (order.accessibilityFlag) {
      response.driverNotification = {
        message: `Hành khách cần hỗ trợ đặc biệt. Vui lòng hỗ trợ người khiếm thị lên/xuống xe.`,
        bonusPoints: 50,
      };
    }

    return response;
  }

  /** Phase 6 — lưu đánh giá sau khi giao hàng */
  async submitReview(
    orderId: string,
    body: {
      restaurantRating: number;
      driverRating: number;
      voiceText?: string;
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const review = await this.prisma.orderReview.upsert({
      where: { orderId },
      update: {
        restaurantRating: body.restaurantRating,
        driverRating: body.driverRating,
        voiceText: body.voiceText,
      },
      create: {
        orderId,
        restaurantRating: body.restaurantRating,
        driverRating: body.driverRating,
        voiceText: body.voiceText,
      },
    });

    const earnedPoints = body.driverRating >= 4 ? 50 : 0;
    return {
      reviewId: review.id,
      responseText: earnedPoints
        ? `Cảm ơn bạn đã đánh giá! Tài xế nhận được ${earnedPoints} AccessPoints.`
        : 'Cảm ơn bạn đã đánh giá!',
      earnedPoints,
    };
  }

  /** Phase 5 — auto-advance: CONFIRMED→DRIVER_ASSIGNED(5s)→IN_TRANSIT(30s)→DELIVERED(120s) */
  private async runStateMachine(orderId: string, partner: PartnerCode) {
    await this.delay(5000);
    const driver = await this.pickPartnerDriver(partner);
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DRIVER_ASSIGNED,
        partnerDriverId: driver?.id,
        driverName: driver?.name,
        responseText: `Tài xế ${driver?.name ?? 'đang đến'} đã nhận đơn. Đang trên đường.`,
      },
    });
    await this.prisma.orderEvent.create({
      data: { orderId, step: OrderStatus.DRIVER_ASSIGNED, payload: { driver } },
    });

    await this.delay(25000);
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.IN_TRANSIT,
        responseText: 'Đơn hàng đang trên đường đến bạn.',
      },
    });
    await this.prisma.orderEvent.create({
      data: { orderId, step: OrderStatus.IN_TRANSIT, payload: {} },
    });

    await this.delay(90000);
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.DELIVERED,
        responseText:
          'Đơn hàng đã giao thành công. Bạn thấy thế nào? Nói "tốt", "bình thường", hoặc "kém".',
      },
    });
    await this.prisma.orderEvent.create({
      data: { orderId, step: OrderStatus.DELIVERED, payload: {} },
    });
  }

  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private async pickPartnerDriver(partner: PartnerCode) {
    if (partner === PartnerCode.GRAB) {
      return this.prisma.grabDriver.findFirst({ where: { available: true } });
    }
    if (partner === PartnerCode.BE) {
      return this.prisma.beDriver.findFirst({ where: { available: true } });
    }
    if (partner === PartnerCode.XANH_SM) {
      return this.prisma.xanhSmDriver.findFirst({ where: { available: true } });
    }
    if (partner === PartnerCode.SHOPEE) {
      return this.prisma.shopeeDriver.findFirst({ where: { available: true } });
    }
    return null;
  }

  // ── helpers ────────────────────────────────────────────────

  private buildFoodResponseText(
    restaurant: { name: string },
    isOpen: boolean,
    items: { name: string; qty: number; priceVnd: number }[],
    quotes: FoodQuote[],
    multiMatch = false,
  ): string {
    if (!isOpen) {
      return `${restaurant.name} hiện đã đóng cửa. Bạn có muốn chọn quán khác không?`;
    }
    if (items.length === 0) {
      return `Tôi tìm thấy ${restaurant.name}. Bạn muốn đặt món gì? Tôi có thể đọc menu cho bạn nghe.`;
    }
    if (quotes.length === 0) {
      return `${restaurant.name} hiện không có đối tác giao hàng nào khả dụng.`;
    }

    const itemList = items.map((i) => `${i.qty} ${i.name}`).join(', ');
    const prefix = multiMatch
      ? `Tôi tìm thấy ${quotes.length} lựa chọn cho ${itemList}. `
      : `Đặt ${itemList} từ ${restaurant.name}. `;

    let text = prefix;
    quotes.forEach((q, idx) => {
      const promoNote = q.promoDescription ? ` (${q.promoDescription})` : '';
      text += `${idx + 1}. ${q.partner}: ${q.totalVnd.toLocaleString('vi-VN')}đ${promoNote}, khoảng ${q.etaMinutes} phút. `;
    });
    text += `Bạn muốn chọn đối tác nào?`;
    return text;
  }

  private buildRideResponseText(
    intent: Intent,
    enrichment: Enrichment,
    quotes: PartnerQuote[],
    distance?: number,
  ): string {
    const available = quotes.filter((q) => q.available);
    if (available.length === 0)
      return 'Hiện không có xe nào khả dụng. Vui lòng thử lại sau.';

    const cheapest = available.reduce((a, b) => (a.price < b.price ? a : b));
    let text = `Đặt xe đến ${intent.destination ?? 'điểm đến'}.`;

    if (distance !== undefined) {
      text += ` Quãng đường dài khoảng ${distance.toFixed(1)} km.`;
    }

    if (enrichment.weather?.willRain) {
      text += ` Lưu ý trời đang ${enrichment.weather.condition}.`;
    }
    if (enrichment.place && !enrichment.place.isOpen) {
      text += ` Lưu ý: ${enrichment.place.name} có thể đã đóng cửa.`;
    }

    text += ` Giá rẻ nhất: ${cheapest.partner} — ${cheapest.price.toLocaleString('vi-VN')}đ, khoảng ${cheapest.etaMinutes} phút.`;
    text += ` Có ${available.length} lựa chọn. Bạn muốn chọn đối tác nào?`;
    return text;
  }

  /** Tính khoảng cách đường chim bay (Haversine formula) */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async saveRideOrder(params: {
    userId?: string;
    intent: Intent;
    quotes: PartnerQuote[];
    responseText: string;
    accessibilityFlag: boolean;
  }) {
    const cheapest = params.quotes[0];
    return this.prisma.order.create({
      data: {
        userId: params.userId,
        type: params.intent.type,
        origin: params.intent.origin,
        destination: params.intent.destination,
        status: OrderStatus.QUOTED,
        totalVnd: cheapest?.price,
        etaMinutes: cheapest?.etaMinutes,
        responseText: params.responseText,
        accessibilityFlag: params.accessibilityFlag,
      },
    });
  }

  private async logEvents(
    orderId: string,
    data: {
      transcript: string;
      intent: Intent;
      enrichment: Enrichment;
      quotes: unknown[];
    },
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
