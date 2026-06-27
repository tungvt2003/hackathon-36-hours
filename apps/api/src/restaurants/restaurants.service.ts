import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  FoodQuote,
  OrderedItem,
  PartnerCode,
  PartnerRestaurant,
} from '../types';
import {
  PartnerSimFoodQuoteResult,
  PartnerSimFoodSearchResult,
} from '../partner-sim/partner-sim.service';

// Base URL cho partner-sim (chạy cùng process, nhưng qua HTTP để simulate fan-out)
const SIM_BASE = process.env.PARTNER_SIM_URL ?? 'http://localhost:3000';

@Injectable()
export class RestaurantsService {
  private readonly logger = new Logger(RestaurantsService.name);

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Fan-out HTTP tới 3 partner-sim search endpoints song song.
   * Giả lập: Suara gửi 3 request đồng thời → chờ cả 3 → aggregate.
   */
  async searchRestaurants(query: string, userLat?: number, userLng?: number): Promise<PartnerRestaurant[]> {
    if (!query || query.trim().length < 2) return [];

    const payload = { query, userLat, userLng };
    const [grabRes, beRes, shopeeRes] = await Promise.allSettled([
      this.post<PartnerSimFoodSearchResult[]>(
        '/partner-sim/grab/food/search',
        payload,
      ),
      this.post<PartnerSimFoodSearchResult[]>(
        '/partner-sim/be/food/search',
        payload,
      ),
      this.post<PartnerSimFoodSearchResult[]>(
        '/partner-sim/shopee/food/search',
        payload,
      ),
    ]);

    const raw: PartnerRestaurant[] = [];
    if (grabRes.status === 'fulfilled') {
      raw.push(
        ...grabRes.value.map((r) => this.toPartnerRest(PartnerCode.GRAB, r)),
      );
    } else {
      this.logger.warn('Grab food/search failed: ' + grabRes.reason);
    }
    if (beRes.status === 'fulfilled') {
      raw.push(
        ...beRes.value.map((r) => this.toPartnerRest(PartnerCode.BE, r)),
      );
    } else {
      this.logger.warn('Be food/search failed: ' + beRes.reason);
    }
    if (shopeeRes.status === 'fulfilled') {
      raw.push(
        ...shopeeRes.value.map((r) =>
          this.toPartnerRest(PartnerCode.SHOPEE, r),
        ),
      );
    } else {
      this.logger.warn('Shopee food/search failed: ' + shopeeRes.reason);
    }

    const enriched = await Promise.all(raw.map((r) => this.enrichRating(r)));
    return enriched.sort((a, b) => b.displayRating - a.displayRating);
  }

  /** Resolve voice items sang MenuItem cho đúng partner table */
  async resolveItems(
    restaurantId: string,
    partner: PartnerCode,
    itemQueries: string[],
  ): Promise<OrderedItem[]> {
    let items: {
      id: string;
      name: string;
      priceVnd: number;
      keywords: string[];
      available: boolean;
    }[] = [];

    if (partner === PartnerCode.GRAB) {
      items = await this.prisma.grabMenuItem.findMany({
        where: { grabRestaurantId: restaurantId, available: true },
      });
    } else if (partner === PartnerCode.BE) {
      items = await this.prisma.beMenuItem.findMany({
        where: { beRestaurantId: restaurantId, available: true },
      });
    } else if (partner === PartnerCode.SHOPEE) {
      items = await this.prisma.shopeeMenuItem.findMany({
        where: { shopeeRestaurantId: restaurantId, available: true },
      });
    }

    const resolved: OrderedItem[] = [];
    for (const query of itemQueries) {
      const q = query.toLowerCase();
      const match = items.find(
        (i) =>
          i.keywords.some((k) => q.includes(k) || k.includes(q)) ||
          q.includes(i.name.toLowerCase()),
      );
      if (match) {
        const existing = resolved.find((r) => r.menuItemId === match.id);
        if (existing) {
          existing.qty += 1;
        } else {
          resolved.push({
            menuItemId: match.id,
            name: match.name,
            qty: 1,
            priceVnd: match.priceVnd,
          });
        }
      }
    }
    return resolved;
  }

  /**
   * Gửi HTTP tới đúng partner-sim food/quote endpoint.
   * Giả lập: Suara gửi 1 request tới partner với giỏ hàng → partner tính giá + promo.
   */
  async calcQuote(
    restaurant: PartnerRestaurant,
    items: OrderedItem[],
  ): Promise<FoodQuote> {
    const payload = {
      restaurantId: restaurant.restaurantId,
      items: items.map((i) => ({
        name: i.name,
        qty: i.qty,
        priceVnd: i.priceVnd,
      })),
    };

    const endpoint = this.foodQuoteEndpoint(restaurant.partner);
    const result = await this.post<PartnerSimFoodQuoteResult>(
      endpoint,
      payload,
    );

    return {
      partner: restaurant.partner,
      subtotalVnd: result.subtotalVnd,
      deliveryFeeVnd: result.deliveryFeeVnd,
      discountVnd: result.discountVnd,
      totalVnd: result.totalVnd,
      promoDescription: result.promoDescription,
      etaMinutes: result.etaMinutes,
      driverName: result.driverName,
      available: result.available,
    };
  }

  /** GET /restaurants — list theo partner hoặc tất cả */
  async listAll(partner?: string): Promise<PartnerRestaurant[]> {
    const p = partner?.toUpperCase();
    const raw: PartnerRestaurant[] = [];

    if (!p || p === 'GRAB') {
      const list = await this.prisma.grabRestaurant.findMany({
        where: { available: true },
      });
      raw.push(...list.map((r) => this.toPartnerRest(PartnerCode.GRAB, r)));
    }
    if (!p || p === 'BE') {
      const list = await this.prisma.beRestaurant.findMany({
        where: { available: true },
      });
      raw.push(...list.map((r) => this.toPartnerRest(PartnerCode.BE, r)));
    }
    if (!p || p === 'SHOPEE') {
      const list = await this.prisma.shopeeRestaurant.findMany({
        where: { available: true },
      });
      raw.push(...list.map((r) => this.toPartnerRest(PartnerCode.SHOPEE, r)));
    }

    const enriched = await Promise.all(raw.map((r) => this.enrichRating(r)));
    return enriched.sort((a, b) => b.displayRating - a.displayRating);
  }

  /** GET /restaurants/:id/menu — cần partner param để biết query bảng nào */
  async getMenu(restaurantId: string, partner: string) {
    const p = partner.toUpperCase() as PartnerCode;

    if (p === PartnerCode.GRAB) {
      const rest = await this.prisma.grabRestaurant.findUniqueOrThrow({
        where: { id: restaurantId },
        include: { items: { where: { available: true } } },
      });
      return {
        restaurantId,
        partner: p,
        name: rest.name,
        categories: this.groupByCategory(rest.items),
      };
    }
    if (p === PartnerCode.BE) {
      const rest = await this.prisma.beRestaurant.findUniqueOrThrow({
        where: { id: restaurantId },
        include: { items: { where: { available: true } } },
      });
      return {
        restaurantId,
        partner: p,
        name: rest.name,
        categories: this.groupByCategory(rest.items),
      };
    }
    if (p === PartnerCode.SHOPEE) {
      const rest = await this.prisma.shopeeRestaurant.findUniqueOrThrow({
        where: { id: restaurantId },
        include: { items: { where: { available: true } } },
      });
      return {
        restaurantId,
        partner: p,
        name: rest.name,
        categories: this.groupByCategory(rest.items),
      };
    }

    throw new Error(`Partner ${partner} không hỗ trợ food`);
  }

  // ── private helpers ──────────────────────────────────────────

  private toPartnerRest(
    partner: PartnerCode,
    r:
      | PartnerSimFoodSearchResult
      | {
          id: string;
          name: string;
          address: string;
          rating: number;
          reviewCount: number;
          deliveryFeeVnd: number;
          minOrderVnd: number;
          cuisineType: string;
          keywords: string[];
          available: boolean;
          openHour: number;
          closeHour: number;
        },
  ): PartnerRestaurant {
    const id = 'restaurantId' in r ? r.restaurantId : r.id;
    return {
      partner,
      restaurantId: id,
      name: r.name,
      address: r.address,
      rating: r.rating,
      displayRating: r.rating,
      reviewCount: r.reviewCount,
      deliveryFeeVnd: r.deliveryFeeVnd,
      minOrderVnd: r.minOrderVnd,
      cuisineType: r.cuisineType,
      keywords: r.keywords,
      available: r.available,
      openHour: r.openHour,
      closeHour: r.closeHour,
    };
  }

  private async enrichRating(r: PartnerRestaurant): Promise<PartnerRestaurant> {
    const agg = await this.prisma.orderReview.aggregate({
      _avg: { restaurantRating: true },
      _count: { restaurantRating: true },
      where: {
        order: { partnerRestaurantId: r.restaurantId, partner: r.partner },
      },
    });
    const SuaraAvg = agg._avg.restaurantRating;
    return {
      ...r,
      displayRating:
        SuaraAvg !== null ? Math.round(SuaraAvg * 10) / 10 : r.rating,
      reviewCount: r.reviewCount + (agg._count.restaurantRating ?? 0),
    };
  }

  private groupByCategory(
    items: {
      categoryName: string;
      id: string;
      name: string;
      priceVnd: number;
      description?: string | null;
      available: boolean;
    }[],
  ) {
    const map = new Map<string, typeof items>();
    for (const item of items) {
      if (!map.has(item.categoryName)) map.set(item.categoryName, []);
      map.get(item.categoryName)!.push(item);
    }
    return Array.from(map.entries()).map(([name, catItems]) => ({
      name,
      items: catItems,
    }));
  }

  private foodQuoteEndpoint(partner: PartnerCode): string {
    if (partner === PartnerCode.GRAB) return '/partner-sim/grab/food/quote';
    if (partner === PartnerCode.BE) return '/partner-sim/be/food/quote';
    if (partner === PartnerCode.SHOPEE) return '/partner-sim/shopee/food/quote';
    throw new Error(`Partner ${partner} không hỗ trợ food quote`);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await firstValueFrom(
      this.http.post<T>(`${SIM_BASE}${path}`, body),
    );
    return res.data;
  }
}
