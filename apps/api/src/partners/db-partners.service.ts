/**
 * DbPartnersService — RIDE quote fan-out.
 *
 * Gửi HTTP tới 3 partner-sim ride/quote endpoints song song.
 * Giả lập: AccessAI KHÔNG query DB trực tiếp — mỗi partner có API riêng.
 */

import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { PartnerSimRideResult } from '../partner-sim/partner-sim.service';
import { Intent, PartnerCode, PartnerQuote } from '../types';

const SIM_BASE = process.env.PARTNER_SIM_URL ?? 'http://localhost:3000';

@Injectable()
export class DbPartnersService {
  private readonly logger = new Logger(DbPartnersService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * Fan-out HTTP tới 3 partner-sim ride endpoints song song.
   * Mỗi partner trả options; aggregate thành flat list PartnerQuote[].
   */
  async quoteAll(intent: Intent): Promise<PartnerQuote[]> {
    const payload = {
      origin: intent.origin,
      destination: intent.destination,
    };

    const [grabRes, beRes, xsmRes] = await Promise.allSettled([
      this.post<PartnerSimRideResult>('/partner-sim/grab/ride/quote', payload),
      this.post<PartnerSimRideResult>('/partner-sim/be/ride/quote', payload),
      this.post<PartnerSimRideResult>(
        '/partner-sim/xanhsm/ride/quote',
        payload,
      ),
    ]);

    const quotes: PartnerQuote[] = [];

    if (grabRes.status === 'fulfilled') {
      for (const o of grabRes.value.options) {
        quotes.push({
          partner: PartnerCode.GRAB,
          price: o.priceVnd,
          etaMinutes: o.etaMinutes,
          driverName: o.driverName,
          available: o.available,
        });
      }
    } else {
      this.logger.warn('Grab ride/quote failed: ' + grabRes.reason);
    }

    if (beRes.status === 'fulfilled') {
      for (const o of beRes.value.options) {
        quotes.push({
          partner: PartnerCode.BE,
          price: o.priceVnd,
          etaMinutes: o.etaMinutes,
          driverName: o.driverName,
          available: o.available,
        });
      }
    } else {
      this.logger.warn('Be ride/quote failed: ' + beRes.reason);
    }

    if (xsmRes.status === 'fulfilled') {
      for (const o of xsmRes.value.options) {
        quotes.push({
          partner: PartnerCode.XANH_SM,
          price: o.priceVnd,
          etaMinutes: o.etaMinutes,
          driverName: o.driverName,
          available: o.available,
        });
      }
    } else {
      this.logger.warn('XanhSM ride/quote failed: ' + xsmRes.reason);
    }

    return quotes;
  }

  /** Gọi partner-sim confirm endpoint; partner ghi nhận đơn + chọn tài xế */
  async confirm(
    partner: PartnerCode,
    orderId: string,
  ): Promise<{ externalId: string; message: string; driverName?: string }> {
    const endpoint = this.confirmEndpoint(partner);
    if (!endpoint) {
      const externalId = `${partner}-${orderId.slice(-6).toUpperCase()}`;
      return {
        externalId,
        message: `${partner} xác nhận. Mã đơn: ${externalId}`,
      };
    }

    const result = await this.post<{
      partnerOrderId: string;
      driverName?: string;
      message: string;
    }>(endpoint, { accessAiOrderId: orderId });

    return {
      externalId: result.partnerOrderId,
      message: result.message,
      driverName: result.driverName,
    };
  }

  private confirmEndpoint(partner: PartnerCode): string | null {
    if (partner === PartnerCode.GRAB) return '/partner-sim/grab/confirm';
    if (partner === PartnerCode.BE) return '/partner-sim/be/confirm';
    if (partner === PartnerCode.XANH_SM) return '/partner-sim/xanhsm/confirm';
    if (partner === PartnerCode.SHOPEE) return '/partner-sim/shopee/confirm';
    return null;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await firstValueFrom(
      this.http.post<T>(`${SIM_BASE}${path}`, body),
    );
    return res.data;
  }
}
