import { Injectable } from '@nestjs/common';
import { Intent, PartnerCode, PartnerQuote } from '../types';
import { GrabAdapter } from './adapters/grab.adapter';
import { BeAdapter } from './adapters/be.adapter';
import { XanhSmAdapter } from './adapters/xanh-sm.adapter';

/** Orchestrate gọi tất cả đối tác song song, trả danh sách quote */
@Injectable()
export class PartnersService {
  constructor(
    private readonly grab: GrabAdapter,
    private readonly be: BeAdapter,
    private readonly xanhSm: XanhSmAdapter,
  ) {}

  async quoteAll(intent: Intent): Promise<PartnerQuote[]> {
    // Gọi song song 3 đối tác, không để 1 fail block cả 3
    const results = await Promise.allSettled([
      this.grab.quote(intent),
      this.be.quote(intent),
      this.xanhSm.quote(intent),
    ]);

    return results
      .filter(
        (r): r is PromiseFulfilledResult<PartnerQuote> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value);
  }

  async confirm(
    partner: PartnerCode,
    orderId: string,
  ): Promise<{ externalId: string; message: string }> {
    const adapter =
      partner === PartnerCode.GRAB
        ? this.grab
        : partner === PartnerCode.BE
          ? this.be
          : this.xanhSm;

    return adapter.confirm(orderId);
  }
}
