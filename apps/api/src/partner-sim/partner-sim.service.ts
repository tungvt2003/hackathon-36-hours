/**
 * PartnerSimService — giả lập backend của từng đối tác.
 * Mỗi method = 1 "API" độc lập của Grab/Be/XanhSM/Shopee.
 * Logic nằm đây; AccessAI gọi qua HTTP (không import service này trực tiếp).
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PartnerSimRideResult {
  options: Array<{
    serviceType: string;
    priceVnd: number;
    etaMinutes: number;
    driverName?: string;
    available: boolean;
  }>;
}

export interface PartnerSimFoodSearchResult {
  restaurantId: string;
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
}

export interface PartnerSimFoodQuoteResult {
  subtotalVnd: number;
  deliveryFeeVnd: number;
  discountVnd: number;
  totalVnd: number;
  promoDescription?: string;
  etaMinutes: number;
  driverName?: string;
  available: boolean;
}

type PromoRow = {
  discountType: string;
  discountValue: number;
  minOrderVnd: number;
  maxDiscountVnd: number | null;
};

@Injectable()
export class PartnerSimService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GRAB RIDE ────────────────────────────────────────────────

  async grabRideQuote(_body: {
    origin?: string;
    destination?: string;
    serviceType?: string;
  }): Promise<PartnerSimRideResult> {
    const opts = await this.prisma.grabRideOption.findMany({
      where: { available: true },
    });
    const driver = await this.prisma.grabDriver.findFirst({
      where: { available: true, vehicleType: { contains: 'Car' } },
    });
    return {
      options: opts.map((o) => ({
        serviceType: o.serviceType,
        priceVnd: o.basePriceVnd,
        etaMinutes: o.etaMinutes,
        driverName: driver?.name,
        available: o.available,
      })),
    };
  }

  // ── BE RIDE ──────────────────────────────────────────────────

  async beRideQuote(_body: {
    origin?: string;
    destination?: string;
    serviceType?: string;
  }): Promise<PartnerSimRideResult> {
    const opts = await this.prisma.beRideOption.findMany({
      where: { available: true },
    });
    const driver = await this.prisma.beDriver.findFirst({
      where: { available: true, vehicleType: { contains: 'Car' } },
    });
    return {
      options: opts.map((o) => ({
        serviceType: o.serviceType,
        priceVnd: o.basePriceVnd,
        etaMinutes: o.etaMinutes,
        driverName: driver?.name,
        available: o.available,
      })),
    };
  }

  // ── XANH SM RIDE ─────────────────────────────────────────────

  async xanhSmRideQuote(_body: {
    origin?: string;
    destination?: string;
    serviceType?: string;
  }): Promise<PartnerSimRideResult> {
    const opts = await this.prisma.xanhSmRideOption.findMany({
      where: { available: true },
    });
    const driver = await this.prisma.xanhSmDriver.findFirst({
      where: { available: true },
    });
    return {
      options: opts.map((o) => ({
        serviceType: o.serviceType,
        priceVnd: o.basePriceVnd,
        etaMinutes: o.etaMinutes,
        driverName: driver?.name,
        available: o.available,
      })),
    };
  }

  // ── GRAB FOOD SEARCH ─────────────────────────────────────────

  async grabFoodSearch(query: string): Promise<PartnerSimFoodSearchResult[]> {
    const list = await this.prisma.grabRestaurant.findMany({
      where: { available: true },
    });
    return this.filterByQuery(list, query);
  }

  // ── BE FOOD SEARCH ───────────────────────────────────────────

  async beFoodSearch(query: string): Promise<PartnerSimFoodSearchResult[]> {
    const list = await this.prisma.beRestaurant.findMany({
      where: { available: true },
    });
    return this.filterByQuery(list, query);
  }

  // ── SHOPEE FOOD SEARCH ───────────────────────────────────────

  async shopeeFoodSearch(query: string): Promise<PartnerSimFoodSearchResult[]> {
    const list = await this.prisma.shopeeRestaurant.findMany({
      where: { available: true },
    });
    return this.filterByQuery(list, query);
  }

  // ── GRAB FOOD QUOTE ──────────────────────────────────────────

  async grabFoodQuote(body: {
    restaurantId: string;
    items: { name: string; qty: number; priceVnd: number }[];
  }): Promise<PartnerSimFoodQuoteResult> {
    const rest = await this.prisma.grabRestaurant.findUniqueOrThrow({
      where: { id: body.restaurantId },
    });
    const subtotal = body.items.reduce((s, i) => s + i.priceVnd * i.qty, 0);
    const promos = await this.prisma.grabPromotion.findMany({
      where: {
        active: true,
        minOrderVnd: { lte: subtotal },
        OR: [
          { grabRestaurantId: body.restaurantId },
          { grabRestaurantId: null },
        ],
      },
    });
    const promo = this.bestPromo(promos, subtotal, rest.deliveryFeeVnd);
    const discountVnd = this.calcDiscount(promo, subtotal, rest.deliveryFeeVnd);
    const driver = await this.prisma.grabDriver.findFirst({
      where: { available: true },
    });
    return {
      subtotalVnd: subtotal,
      deliveryFeeVnd: rest.deliveryFeeVnd,
      discountVnd,
      totalVnd: subtotal + rest.deliveryFeeVnd - discountVnd,
      promoDescription: promo ? this.describePromo(promo) : undefined,
      etaMinutes: 20 + Math.floor(Math.random() * 15),
      driverName: driver?.name,
      available: subtotal >= rest.minOrderVnd,
    };
  }

  // ── BE FOOD QUOTE ────────────────────────────────────────────

  async beFoodQuote(body: {
    restaurantId: string;
    items: { name: string; qty: number; priceVnd: number }[];
  }): Promise<PartnerSimFoodQuoteResult> {
    const rest = await this.prisma.beRestaurant.findUniqueOrThrow({
      where: { id: body.restaurantId },
    });
    const subtotal = body.items.reduce((s, i) => s + i.priceVnd * i.qty, 0);
    const promos = await this.prisma.bePromotion.findMany({
      where: {
        active: true,
        minOrderVnd: { lte: subtotal },
        OR: [{ beRestaurantId: body.restaurantId }, { beRestaurantId: null }],
      },
    });
    const promo = this.bestPromo(promos, subtotal, rest.deliveryFeeVnd);
    const discountVnd = this.calcDiscount(promo, subtotal, rest.deliveryFeeVnd);
    const driver = await this.prisma.beDriver.findFirst({
      where: { available: true },
    });
    return {
      subtotalVnd: subtotal,
      deliveryFeeVnd: rest.deliveryFeeVnd,
      discountVnd,
      totalVnd: subtotal + rest.deliveryFeeVnd - discountVnd,
      promoDescription: promo ? this.describePromo(promo) : undefined,
      etaMinutes: 20 + Math.floor(Math.random() * 15),
      driverName: driver?.name,
      available: subtotal >= rest.minOrderVnd,
    };
  }

  // ── SHOPEE FOOD QUOTE ────────────────────────────────────────

  async shopeeFoodQuote(body: {
    restaurantId: string;
    items: { name: string; qty: number; priceVnd: number }[];
  }): Promise<PartnerSimFoodQuoteResult> {
    const rest = await this.prisma.shopeeRestaurant.findUniqueOrThrow({
      where: { id: body.restaurantId },
    });
    const subtotal = body.items.reduce((s, i) => s + i.priceVnd * i.qty, 0);
    const promos = await this.prisma.shopeePromotion.findMany({
      where: {
        active: true,
        minOrderVnd: { lte: subtotal },
        OR: [
          { shopeeRestaurantId: body.restaurantId },
          { shopeeRestaurantId: null },
        ],
      },
    });
    const promo = this.bestPromo(promos, subtotal, rest.deliveryFeeVnd);
    const discountVnd = this.calcDiscount(promo, subtotal, rest.deliveryFeeVnd);
    const driver = await this.prisma.shopeeDriver.findFirst({
      where: { available: true },
    });
    return {
      subtotalVnd: subtotal,
      deliveryFeeVnd: rest.deliveryFeeVnd,
      discountVnd,
      totalVnd: subtotal + rest.deliveryFeeVnd - discountVnd,
      promoDescription: promo ? this.describePromo(promo) : undefined,
      etaMinutes: 20 + Math.floor(Math.random() * 15),
      driverName: driver?.name,
      available: subtotal >= rest.minOrderVnd,
    };
  }

  // ── CONFIRM (partner ghi nhận đơn, sinh mã đơn nội bộ) ───────

  async grabConfirm(accessAiOrderId: string) {
    const driver = await this.prisma.grabDriver.findFirst({
      where: { available: true },
    });
    return {
      partnerOrderId: `GRAB-${accessAiOrderId.slice(-6).toUpperCase()}`,
      driverName: driver?.name ?? 'Tài xế Grab',
      message: `Grab xác nhận đơn. Tài xế ${driver?.name ?? 'Grab'} đang đến.`,
    };
  }

  async beConfirm(accessAiOrderId: string) {
    const driver = await this.prisma.beDriver.findFirst({
      where: { available: true },
    });
    return {
      partnerOrderId: `BE-${accessAiOrderId.slice(-6).toUpperCase()}`,
      driverName: driver?.name ?? 'Tài xế Be',
      message: `Be xác nhận đơn. Tài xế ${driver?.name ?? 'Be'} đang đến.`,
    };
  }

  async xanhSmConfirm(accessAiOrderId: string) {
    const driver = await this.prisma.xanhSmDriver.findFirst({
      where: { available: true },
    });
    return {
      partnerOrderId: `XSMSM-${accessAiOrderId.slice(-6).toUpperCase()}`,
      driverName: driver?.name ?? 'Tài xế Xanh SM',
      message: `Xanh SM xác nhận đơn. Tài xế ${driver?.name ?? 'Xanh SM'} đang đến.`,
    };
  }

  async shopeeConfirm(accessAiOrderId: string) {
    const driver = await this.prisma.shopeeDriver.findFirst({
      where: { available: true },
    });
    return {
      partnerOrderId: `SPF-${accessAiOrderId.slice(-6).toUpperCase()}`,
      driverName: driver?.name ?? 'Shipper Shopee',
      message: `Shopee Food xác nhận đơn. Shipper ${driver?.name ?? 'Shopee'} đang lấy hàng.`,
    };
  }

  // ── private helpers ──────────────────────────────────────────

  private filterByQuery<
    T extends {
      id: string;
      name: string;
      keywords: string[];
      available: boolean;
      address: string;
      rating: number;
      reviewCount: number;
      deliveryFeeVnd: number;
      minOrderVnd: number;
      cuisineType: string;
      openHour: number;
      closeHour: number;
    },
  >(list: T[], query: string): PartnerSimFoodSearchResult[] {
    const q = query.toLowerCase();
    return list
      .filter(
        (r) =>
          r.available &&
          (r.keywords.some((k) => q.includes(k) || k.includes(q)) ||
            q.includes(r.name.toLowerCase()) ||
            r.name.toLowerCase().includes(q)),
      )
      .map((r) => ({
        restaurantId: r.id,
        name: r.name,
        address: r.address,
        rating: r.rating,
        reviewCount: r.reviewCount,
        deliveryFeeVnd: r.deliveryFeeVnd,
        minOrderVnd: r.minOrderVnd,
        cuisineType: r.cuisineType,
        keywords: r.keywords,
        available: r.available,
        openHour: r.openHour,
        closeHour: r.closeHour,
      }));
  }

  private bestPromo(
    promos: PromoRow[],
    subtotal: number,
    deliveryFee: number,
  ): PromoRow | null {
    if (promos.length === 0) return null;
    return promos.reduce((best, p) =>
      this.calcDiscount(p, subtotal, deliveryFee) >
      this.calcDiscount(best, subtotal, deliveryFee)
        ? p
        : best,
    );
  }

  private calcDiscount(
    promo: PromoRow | null,
    subtotal: number,
    deliveryFee: number,
  ): number {
    if (!promo) return 0;
    if (promo.discountType === 'PERCENT') {
      const raw = Math.round((subtotal * promo.discountValue) / 100);
      return promo.maxDiscountVnd ? Math.min(raw, promo.maxDiscountVnd) : raw;
    }
    if (promo.discountType === 'FIXED')
      return Math.min(promo.discountValue, subtotal);
    if (promo.discountType === 'FREE_DELIVERY') return deliveryFee;
    return 0;
  }

  private describePromo(promo: PromoRow): string {
    if (promo.discountType === 'PERCENT') return `Giảm ${promo.discountValue}%`;
    if (promo.discountType === 'FIXED')
      return `Giảm ${promo.discountValue.toLocaleString('vi-VN')}đ`;
    if (promo.discountType === 'FREE_DELIVERY') return 'Miễn phí ship';
    return '';
  }
}
