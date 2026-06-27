import { Injectable } from '@nestjs/common';
import { Intent, PartnerCode, PartnerQuote } from '../../types';
import { RideProvider } from '../partner.provider';
import {
  GRAB_MOCK_QUOTE,
  GRAB_MOCK_CONFIRM,
  GrabRawQuote,
} from '../fixtures/grab.fixture';

@Injectable()
export class GrabAdapter implements RideProvider {
  async quote(_intent: Intent): Promise<PartnerQuote> {
    // TODO: thay bằng gọi Grab API thật:
    // POST https://partner.grab.com/grabid/v1/oauth2/token (lấy token)
    // POST https://partner.grab.com/v1/deliveries (lấy giá)
    const raw = GRAB_MOCK_QUOTE;
    return this.mapToQuote(raw);
  }

  async confirm(
    _orderId: string,
  ): Promise<{ externalId: string; message: string }> {
    // TODO: gọi Grab Booking API thật
    const raw = GRAB_MOCK_CONFIRM;
    return {
      externalId: raw.bookingCode,
      message: `Grab xác nhận. Tài xế ${raw.driverName} - biển số ${raw.vehiclePlate}. Mã OTP: ${raw.otp}`,
    };
  }

  /** Mapper: chuyển Grab raw response -> PartnerQuote nội bộ */
  private mapToQuote(raw: GrabRawQuote): PartnerQuote {
    return {
      partner: PartnerCode.GRAB,
      price: raw.estimatedFare.value,
      etaMinutes: Math.ceil(raw.eta.pickUpEta / 60),
      driverName: raw.driver?.name,
      available: raw.available,
    };
  }
}
