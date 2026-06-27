/**
 * Partner Simulator — giả lập API của từng đối tác.
 *
 * Trong production, thay các endpoint này bằng HTTP call thật tới:
 *   Grab:    https://api.grab.com/v1/quote
 *   Be:      https://api.be.com.vn/v1/quote
 *   Xanh SM: https://api.xanhsm.vn/v1/quote
 *   Shopee:  https://api.shopee.vn/food/v1/quote
 *
 * AccessAI gửi payload chuẩn → partner xử lý theo DB/logic riêng → trả PartnerQuoteResponse.
 */

import { Body, Controller, Post } from '@nestjs/common';
import { PartnerSimService } from './partner-sim.service';

export interface PartnerRideQuoteRequest {
  origin?: string;
  destination?: string;
  serviceType?: string;
}

export interface PartnerFoodSearchRequest {
  query: string;
  userLat?: number;
  userLng?: number;
}

export interface PartnerFoodQuoteRequest {
  restaurantId: string;
  items: { name: string; qty: number; priceVnd: number }[];
}

@Controller('partner-sim')
export class PartnerSimController {
  constructor(private readonly svc: PartnerSimService) {}

  // ── GRAB ──────────────────────────────────────────────────────

  @Post('grab/ride/quote')
  grabRideQuote(@Body() body: PartnerRideQuoteRequest) {
    return this.svc.grabRideQuote(body);
  }

  @Post('grab/food/search')
  grabFoodSearch(@Body() body: PartnerFoodSearchRequest) {
    return this.svc.grabFoodSearch(body.query, body.userLat, body.userLng);
  }

  @Post('grab/food/quote')
  grabFoodQuote(@Body() body: PartnerFoodQuoteRequest) {
    return this.svc.grabFoodQuote(body);
  }

  // ── BE ────────────────────────────────────────────────────────

  @Post('be/ride/quote')
  beRideQuote(@Body() body: PartnerRideQuoteRequest) {
    return this.svc.beRideQuote(body);
  }

  @Post('be/food/search')
  beFoodSearch(@Body() body: PartnerFoodSearchRequest) {
    return this.svc.beFoodSearch(body.query, body.userLat, body.userLng);
  }

  @Post('be/food/quote')
  beFoodQuote(@Body() body: PartnerFoodQuoteRequest) {
    return this.svc.beFoodQuote(body);
  }

  // ── XANH SM (ride only) ───────────────────────────────────────

  @Post('xanhsm/ride/quote')
  xanhSmRideQuote(@Body() body: PartnerRideQuoteRequest) {
    return this.svc.xanhSmRideQuote(body);
  }

  // ── SHOPEE (food only) ────────────────────────────────────────

  @Post('shopee/food/search')
  shopeeFoodSearch(@Body() body: PartnerFoodSearchRequest) {
    return this.svc.shopeeFoodSearch(body.query, body.userLat, body.userLng);
  }

  @Post('shopee/food/quote')
  shopeeFoodQuote(@Body() body: PartnerFoodQuoteRequest) {
    return this.svc.shopeeFoodQuote(body);
  }

  // ── Confirm (partner ghi nhận đơn, trả mã đơn nội bộ) ────────

  @Post('grab/confirm')
  grabConfirm(@Body() body: { accessAiOrderId: string }) {
    return this.svc.grabConfirm(body.accessAiOrderId);
  }

  @Post('be/confirm')
  beConfirm(@Body() body: { accessAiOrderId: string }) {
    return this.svc.beConfirm(body.accessAiOrderId);
  }

  @Post('xanhsm/confirm')
  xanhSmConfirm(@Body() body: { accessAiOrderId: string }) {
    return this.svc.xanhSmConfirm(body.accessAiOrderId);
  }

  @Post('shopee/confirm')
  shopeeConfirm(@Body() body: { accessAiOrderId: string }) {
    return this.svc.shopeeConfirm(body.accessAiOrderId);
  }
}
