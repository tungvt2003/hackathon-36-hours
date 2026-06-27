import { Injectable } from '@nestjs/common';
import { Intent, PartnerCode, PartnerQuote } from '../../types';
import { RideProvider } from '../partner.provider';
import { BE_MOCK_QUOTE, BE_MOCK_CONFIRM, BeRawQuote } from '../fixtures/be.fixture';

@Injectable()
export class BeAdapter implements RideProvider {
  async quote(_intent: Intent): Promise<PartnerQuote> {
    // TODO: thay bằng gọi Be API thật
    const raw = BE_MOCK_QUOTE;
    return this.mapToQuote(raw);
  }

  async confirm(_orderId: string): Promise<{ externalId: string; message: string }> {
    const raw = BE_MOCK_CONFIRM;
    return {
      externalId: raw.trip_id,
      message: `Be xác nhận. Tài xế ${raw.driver_name} - biển số ${raw.plate}`,
    };
  }

  /** Mapper: chuyển Be raw response -> PartnerQuote nội bộ */
  private mapToQuote(raw: BeRawQuote): PartnerQuote {
    return {
      partner: PartnerCode.BE,
      price: raw.data.price,
      etaMinutes: Math.ceil(raw.data.pickup_eta_sec / 60),
      driverName: raw.driver_info?.full_name,
      available: raw.data.is_available,
    };
  }
}
