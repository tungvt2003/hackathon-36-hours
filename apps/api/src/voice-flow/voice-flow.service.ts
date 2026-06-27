import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { OrderType, OrderStatus, Intent } from '../types';
import { PLACES_PROVIDER } from '../places/places.provider';
import type { PlacesProvider } from '../places/places.provider';
import { WEATHER_PROVIDER } from '../weather/weather.provider';
import type { WeatherProvider } from '../weather/weather.provider';
import { PARTNERS_IMPL } from '../partners/partners.module';
import { SessionCacheService } from './session-cache.service';
import { ConversationService } from '../conversation/conversation.service';
import type {
  VoiceFlowRequest,
  VoiceFlowResponse,
  SearchRestaurantPayload,
  SelectRestaurantPayload,
  ConfirmOrderPayload,
  ChangeItemPayload,
  SelectDestinationPayload,
  ConfirmRidePayload,
  ChangeDestinationPayload,

  RestaurantResult,
  MenuItemResult,
  OrderedItemSummary,
  RideQuote,
} from './voice-flow.types';

interface IPartnersService {
  quoteAll(intent: Intent): Promise<{ partner: string; price: number; etaMinutes: number; driverName?: string; available: boolean }[]>;
}

@Injectable()
export class VoiceFlowService {
  private readonly logger = new Logger(VoiceFlowService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurants: RestaurantsService,
    private readonly sessionCache: SessionCacheService,
    @Inject(PLACES_PROVIDER) private readonly places: PlacesProvider,
    @Inject(WEATHER_PROVIDER) private readonly weather: WeatherProvider,
    @Inject(PARTNERS_IMPL) private readonly partners: IPartnersService,
    @Inject(forwardRef(() => ConversationService))
    private readonly conversationService: ConversationService,
  ) { }

  async handle(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    this.logger.log(`[voice-flow] step=${req.step} session=${req.session_id}`);

    switch (req.step) {
      // ── Food ──────────────────────────────────────────────────────────────
      case 'search_restaurant':
        return await this.searchRestaurant(req);
      case 'select_restaurant':
        return await this.selectRestaurant(req);
      case 'confirm_order':
        return await this.confirmOrder(req);
      case 'change_item':
        return await this.changeItem(req);

      // ── Ride ──────────────────────────────────────────────────────────────
      case 'select_destination':
        return await this.selectDestination(req);
      case 'confirm_ride':
        return await this.confirmRide(req);
      case 'change_destination':
        return await this.changeDestination(req);

      // ── Common ────────────────────────────────────────────────────────────
      case 'cancel':
        return await this.cancelFlow(req);

      default:
        return {
          session_id: req.session_id,
          step: req.step,
          status: 'error',
          message: `Step "${(req as any).step}" not recognized.`,
        };
    }
  }



  // ═══════════════════════════════════════════════════════════════════════════
  // FOOD STEPS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Step: search_restaurant
   * AI gửi: { query: "cơm" }
   * Backend query tất cả quán Grab/Be/Shopee có keyword khớp
   * Trả về: danh sách quán — AI tự build câu cho user
   */
  private async searchRestaurant(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    const payload = req.payload as unknown as SearchRestaurantPayload;
    const query = payload?.query?.trim() ?? '';

    const matches = await this.restaurants.searchRestaurants(query);

    const restaurantList: RestaurantResult[] = matches.map((m, idx) => ({
      id: m.restaurantId,
      name: m.name,
      distance_km: parseFloat((0.5 + idx * 0.4).toFixed(1)),
      estimated_delivery_min: 15 + idx * 5,
      rating: m.displayRating ?? m.rating ?? 4.5,
    }));

    this.sessionCache.set(req.session_id, {
      session_id: req.session_id,
      intent: req.intent,
      step: req.step,
      user_location: req.user_location,
      last_restaurants: restaurantList.map((r) => ({ id: r.id, name: r.name })),
    });

    return {
      session_id: req.session_id,
      step: req.step,
      status: 'success',
      data: { restaurants: restaurantList },
    };
  }

  /**
   * Step: select_restaurant
   * AI gửi: { restaurant_id: "grab-rest-com-tam" }
   * Backend trả toàn bộ menu — AI tự đọc danh sách món cho user
   */
  private async selectRestaurant(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    const payload = req.payload as unknown as SelectRestaurantPayload;
    const restaurantId = payload?.restaurant_id ?? '';

    const { name: restaurantName, items } = await this.fetchMenuItems(restaurantId);

    this.sessionCache.merge(req.session_id, {
      step: req.step,
      selected_restaurant_id: restaurantId,
    });

    return {
      session_id: req.session_id,
      step: req.step,
      status: 'success',
      data: {
        restaurant: { id: restaurantId, name: restaurantName },
        items,
      },
    };
  }

  /**
   * Step: confirm_order
   * AI gửi: { restaurant_id, items: [{ item_id, quantity }], delivery_address }
   * Backend tính tổng tiền, lưu Order vào DB
   * Trả về: order_summary (số liệu) — AI tự đọc tóm tắt
   */
  private async confirmOrder(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    const payload = req.payload as unknown as ConfirmOrderPayload;
    const { restaurant_id: restaurantId, items: orderItems = [], delivery_address } = payload;

    const { name: restaurantName, deliveryFeeVnd } = await this.fetchRestaurantMeta(restaurantId);

    const resolvedItems: OrderedItemSummary[] = [];
    let subtotal = 0;

    for (const item of orderItems) {
      const menuItem = await this.findMenuItem(restaurantId, item.item_id);
      if (menuItem) {
        const itemSubtotal = menuItem.priceVnd * item.quantity;
        subtotal += itemSubtotal;
        resolvedItems.push({ name: menuItem.name, quantity: item.quantity, subtotal: itemSubtotal });
      }
    }

    const total = subtotal + deliveryFeeVnd;

    const order = await this.prisma.order.create({
      data: {
        type: OrderType.FOOD,
        partnerRestaurantId: restaurantId,
        restaurant: restaurantName,
        items: resolvedItems as any,
        status: OrderStatus.QUOTED,
        subtotalVnd: subtotal,
        deliveryFeeVnd,
        totalVnd: total,
        etaMinutes: 20,
        deliveryAddress: delivery_address?.display ?? '',
      },
    });

    this.logger.log(`[voice-flow] Food order created: ${order.id}, total: ${total}`);

    this.sessionCache.merge(req.session_id, {
      step: req.step,
      selected_items: orderItems,
      order_id: order.id,
    });

    return {
      session_id: req.session_id,
      step: req.step,
      status: 'success',
      data: {
        order_id: order.id,
        order_summary: {
          restaurant_name: restaurantName,
          items: resolvedItems,
          subtotal,
          delivery_fee: deliveryFeeVnd,
          total,
          estimated_delivery_min: 20,
        },
        requires_confirmation: true,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RIDE STEPS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Step: select_destination
   * AI gửi: { destination: "sân bay Tân Sơn Nhất" }
   * Backend gọi Google Maps → lấy tọa độ, tính khoảng cách
   * Backend gọi Open-Meteo → check thời tiết
   * Trả về: destination info + weather — AI tự nói cho user biết
   */
  private async selectDestination(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    const payload = req.payload as unknown as SelectDestinationPayload;
    const destination = payload?.destination ?? '';
    const origin = payload?.origin;

    const placeStatus = await this.places.getStatus(destination);
    const weatherInfo = await this.weather.getCurrent(
      destination,
      placeStatus.latitude,
      placeStatus.longitude,
    );

    // Tính khoảng cách nếu có GPS của user
    let distance_km: number | undefined;
    if (
      req.user_location &&
      placeStatus.latitude !== undefined &&
      placeStatus.longitude !== undefined
    ) {
      distance_km = parseFloat(
        this.haversine(
          req.user_location.lat,
          req.user_location.lng,
          placeStatus.latitude,
          placeStatus.longitude,
        ).toFixed(1),
      );
    }

    // Lưu session để bước confirm_ride dùng lại
    this.sessionCache.set(req.session_id, {
      session_id: req.session_id,
      intent: req.intent,
      step: req.step,
      user_location: req.user_location,
      ride_destination: destination,
      ride_origin: origin,
      ride_dest_lat: placeStatus.latitude,
      ride_dest_lng: placeStatus.longitude,
      ride_distance_km: distance_km,
      ride_will_rain: weatherInfo.willRain,
    } as any);

    return {
      session_id: req.session_id,
      step: req.step,
      status: 'success',
      data: {
        destination: {
          name: placeStatus.name,
          address: placeStatus.address ?? '',
          lat: placeStatus.latitude,
          lng: placeStatus.longitude,
        },
        distance_km,
        weather: {
          temp_c: weatherInfo.tempC,
          condition: weatherInfo.condition,
          will_rain: weatherInfo.willRain,
        },
      },
    };
  }

  /**
   * Step: confirm_ride
   * AI gửi: { destination, origin? }
   * Backend lấy quotes từ Grab/Be/Xanh SM, áp giá theo khoảng cách + surge mưa
   * Tạo Order, trả về danh sách quotes — AI đọc giá cho user chọn
   */
  private async confirmRide(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    const payload = req.payload as unknown as ConfirmRidePayload;
    const destination = payload?.destination ?? '';
    const origin = payload?.origin;

    // Lấy context từ session (đã có từ select_destination)
    const session = this.sessionCache.get(req.session_id) as any;
    const distance_km: number | undefined = session?.ride_distance_km;
    const willRain: boolean = session?.ride_will_rain ?? false;

    // Tạo intent để quoteAll dùng
    const intent: Intent = {
      type: OrderType.RIDE,
      destination,
      origin,
    };

    const rawQuotes = await this.partners.quoteAll(intent);

    // Dynamic pricing: base + km×12k/km, surge +20% nếu mưa
    const quotes: RideQuote[] = rawQuotes.map((q) => {
      let price = q.price;
      if (distance_km !== undefined) {
        price = price + Math.round(distance_km * 12000);
        if (willRain) price = Math.round(price * 1.2);
      }
      return {
        partner: q.partner,
        vehicle_type: (q as any).vehicleType ?? q.partner,
        price,
        eta_minutes: q.etaMinutes,
        driver_name: q.driverName,
        available: q.available,
      };
    });

    const cheapest = quotes.filter((q) => q.available).sort((a, b) => a.price - b.price)[0];

    // Lưu order vào DB
    const order = await this.prisma.order.create({
      data: {
        type: OrderType.RIDE,
        destination,
        origin: origin ?? null,
        status: OrderStatus.QUOTED,
        totalVnd: cheapest?.price,
        etaMinutes: cheapest?.eta_minutes,
      },
    });

    this.logger.log(`[voice-flow] Ride order created: ${order.id}, cheapest: ${cheapest?.price}`);

    this.sessionCache.merge(req.session_id, {
      step: req.step,
      order_id: order.id,
    });

    return {
      session_id: req.session_id,
      step: req.step,
      status: 'success',
      data: {
        order_id: order.id,
        quotes,
        distance_km,
        surge_active: willRain,
        requires_confirmation: true,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CANCEL & CHANGE STEPS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Step: cancel  (food_order và ride_booking)
   * AI gửi: {} (payload rỗng)
   * Backend: nếu đã tạo Order → đánh dấu CANCELLED trong DB, xóa session cache
   * Trả về: order_id đã hủy (hoặc null nếu chưa tạo Order)
   */
  private async cancelFlow(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    const session = this.sessionCache.get(req.session_id) as any;
    const orderId: string | undefined = session?.order_id;

    if (orderId) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      this.logger.log(`[voice-flow] Order cancelled: ${orderId}`);
    }

    // Xóa session — user muốn bắt đầu lại từ đầu
    this.sessionCache.delete(req.session_id);

    return {
      session_id: req.session_id,
      step: req.step,
      status: 'cancelled',
      data: {
        cancelled_order_id: orderId ?? null,
      },
    };
  }

  /**
   * Step: change_item  (food_order)
   * AI gửi: { restaurant_id, items: [...], delivery_address? }
   * Giống confirm_order nhưng:
   *   - Nếu session đã có order_id → CANCEL order cũ, tạo order mới
   *   - Nếu chưa có → tạo mới luôn (giống confirm_order)
   * Trả về: order_summary mới — AI đọc lại cho user xác nhận
   */
  private async changeItem(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    const payload = req.payload as unknown as ChangeItemPayload;
    const { restaurant_id: restaurantId, items: orderItems = [], delivery_address } = payload;

    // Hủy order cũ nếu có
    const session = this.sessionCache.get(req.session_id) as any;
    if (session?.order_id) {
      await this.prisma.order.update({
        where: { id: session.order_id },
        data: { status: OrderStatus.CANCELLED },
      });
      this.logger.log(`[voice-flow] Old order cancelled on change_item: ${session.order_id}`);
    }

    const { name: restaurantName, deliveryFeeVnd } = await this.fetchRestaurantMeta(restaurantId);

    const resolvedItems: OrderedItemSummary[] = [];
    let subtotal = 0;

    for (const item of orderItems) {
      const menuItem = await this.findMenuItem(restaurantId, item.item_id);
      if (menuItem) {
        const itemSubtotal = menuItem.priceVnd * item.quantity;
        subtotal += itemSubtotal;
        resolvedItems.push({ name: menuItem.name, quantity: item.quantity, subtotal: itemSubtotal });
      }
    }

    const total = subtotal + deliveryFeeVnd;

    const order = await this.prisma.order.create({
      data: {
        type: OrderType.FOOD,
        partnerRestaurantId: restaurantId,
        restaurant: restaurantName,
        items: resolvedItems as any,
        status: OrderStatus.QUOTED,
        subtotalVnd: subtotal,
        deliveryFeeVnd,
        totalVnd: total,
        etaMinutes: 20,
        deliveryAddress: delivery_address?.display ?? '',
      },
    });

    this.logger.log(`[voice-flow] New order after change_item: ${order.id}`);

    this.sessionCache.merge(req.session_id, {
      step: req.step,
      selected_items: orderItems,
      order_id: order.id,
    });

    return {
      session_id: req.session_id,
      step: req.step,
      status: 'success',
      data: {
        order_id: order.id,
        order_summary: {
          restaurant_name: restaurantName,
          items: resolvedItems,
          subtotal,
          delivery_fee: deliveryFeeVnd,
          total,
          estimated_delivery_min: 20,
        },
        requires_confirmation: true,
      },
    };
  }

  /**
   * Step: change_destination  (ride_booking)
   * AI gửi: { destination: "Bến Thành" }
   * Backend: lấy tọa độ + thời tiết của điểm đến mới
   * Nếu session đã có order_id → CANCEL order cũ
   * Cập nhật session với thông tin mới, trả về destination + weather
   */
  private async changeDestination(req: VoiceFlowRequest): Promise<VoiceFlowResponse> {
    const payload = req.payload as unknown as ChangeDestinationPayload;
    const destination = payload?.destination ?? '';
    const origin = payload?.origin;

    // Hủy order cũ nếu đã confirm trước đó
    const session = this.sessionCache.get(req.session_id) as any;
    if (session?.order_id) {
      await this.prisma.order.update({
        where: { id: session.order_id },
        data: { status: OrderStatus.CANCELLED },
      });
      this.logger.log(`[voice-flow] Old ride cancelled on change_destination: ${session.order_id}`);
    }

    const placeStatus = await this.places.getStatus(destination);
    const weatherInfo = await this.weather.getCurrent(
      destination,
      placeStatus.latitude,
      placeStatus.longitude,
    );

    let distance_km: number | undefined;
    if (
      req.user_location &&
      placeStatus.latitude !== undefined &&
      placeStatus.longitude !== undefined
    ) {
      distance_km = parseFloat(
        this.haversine(
          req.user_location.lat,
          req.user_location.lng,
          placeStatus.latitude,
          placeStatus.longitude,
        ).toFixed(1),
      );
    }

    // Cập nhật session với điểm đến mới, clear order_id cũ
    this.sessionCache.merge(req.session_id, {
      step: req.step,
      ride_destination: destination,
      ride_origin: origin,
      ride_dest_lat: placeStatus.latitude,
      ride_dest_lng: placeStatus.longitude,
      ride_distance_km: distance_km,
      ride_will_rain: weatherInfo.willRain,
      order_id: undefined,  // reset — cần confirm_ride lại
    } as any);

    return {
      session_id: req.session_id,
      step: req.step,
      status: 'success',
      data: {
        destination: {
          name: placeStatus.name,
          address: placeStatus.address ?? '',
          lat: placeStatus.latitude,
          lng: placeStatus.longitude,
        },
        distance_km,
        weather: {
          temp_c: weatherInfo.tempC,
          condition: weatherInfo.condition,
          will_rain: weatherInfo.willRain,
        },
      },
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════


  private async fetchMenuItems(restaurantId: string): Promise<{ name: string; items: MenuItemResult[] }> {
    if (restaurantId.startsWith('grab-')) {
      const rest = await this.prisma.grabRestaurant.findUnique({ where: { id: restaurantId }, include: { items: true } });
      if (!rest) return { name: 'Quán ăn', items: [] };
      return { name: rest.name, items: rest.items.map((i) => ({ id: i.id, name: i.name, price: i.priceVnd, description: i.description ?? '' })) };
    }
    if (restaurantId.startsWith('be-')) {
      const rest = await this.prisma.beRestaurant.findUnique({ where: { id: restaurantId }, include: { items: true } });
      if (!rest) return { name: 'Quán ăn', items: [] };
      return { name: rest.name, items: rest.items.map((i) => ({ id: i.id, name: i.name, price: i.priceVnd, description: i.description ?? '' })) };
    }
    if (restaurantId.startsWith('shopee-')) {
      const rest = await this.prisma.shopeeRestaurant.findUnique({ where: { id: restaurantId }, include: { items: true } });
      if (!rest) return { name: 'Quán ăn', items: [] };
      return { name: rest.name, items: rest.items.map((i) => ({ id: i.id, name: i.name, price: i.priceVnd, description: i.description ?? '' })) };
    }
    return { name: 'Quán ăn', items: [] };
  }

  private async fetchRestaurantMeta(restaurantId: string): Promise<{ name: string; deliveryFeeVnd: number }> {
    if (restaurantId.startsWith('grab-')) {
      const rest = await this.prisma.grabRestaurant.findUnique({ where: { id: restaurantId } });
      return { name: rest?.name ?? 'Quán ăn', deliveryFeeVnd: rest?.deliveryFeeVnd ?? 15000 };
    }
    if (restaurantId.startsWith('be-')) {
      const rest = await this.prisma.beRestaurant.findUnique({ where: { id: restaurantId } });
      return { name: rest?.name ?? 'Quán ăn', deliveryFeeVnd: rest?.deliveryFeeVnd ?? 15000 };
    }
    if (restaurantId.startsWith('shopee-')) {
      const rest = await this.prisma.shopeeRestaurant.findUnique({ where: { id: restaurantId } });
      return { name: rest?.name ?? 'Quán ăn', deliveryFeeVnd: rest?.deliveryFeeVnd ?? 15000 };
    }
    return { name: 'Quán ăn', deliveryFeeVnd: 15000 };
  }

  private async findMenuItem(restaurantId: string, itemId: string): Promise<{ name: string; priceVnd: number } | null> {
    if (restaurantId.startsWith('grab-')) return this.prisma.grabMenuItem.findUnique({ where: { id: itemId } });
    if (restaurantId.startsWith('be-')) return this.prisma.beMenuItem.findUnique({ where: { id: itemId } });
    if (restaurantId.startsWith('shopee-')) return this.prisma.shopeeMenuItem.findUnique({ where: { id: itemId } });
    return null;
  }

  /** Haversine formula — tính khoảng cách đường chim bay (km) */
  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  getSession(sessionId: string) {
    return this.sessionCache.get(sessionId);
  }
}
