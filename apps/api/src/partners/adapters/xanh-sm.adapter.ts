import { Injectable } from '@nestjs/common';
import { Intent, PartnerCode, PartnerQuote } from '../../types';
import { RideProvider } from '../partner.provider';
import { XANH_SM_MOCK_QUOTE, XANH_SM_MOCK_CONFIRM, XanhSmRawQuote } from '../fixtures/xanh-sm.fixture';

@Injectable()
export class XanhSmAdapter implements RideProvider {
  async quote(_intent: Intent): Promise<PartnerQuote> {
    // TODO: thay bằng gọi Xanh SM API thật
    const raw = XANH_SM_MOCK_QUOTE;
    return this.mapToQuote(raw);
  }

  async confirm(_orderId: string): Promise<{ externalId: string; message: string }> {
    const raw = XANH_SM_MOCK_CONFIRM;
    return {
      externalId: raw.order_id,
      message: `Xanh SM xác nhận. Tài xế ${raw.driver_name} - xe ${raw.car_number}. Mã đón xe: ${raw.pickup_code}`,
    };
  }

  /** Mapper: chuyển Xanh SM raw response -> PartnerQuote nội bộ */
  private mapToQuote(raw: XanhSmRawQuote): PartnerQuote {
    return {
      partner: PartnerCode.XANH_SM,
      price: raw.quote.amount,
      etaMinutes: raw.quote.eta_minutes,
      driverName: raw.driver?.name,
      available: raw.available,
    };
  }
}
