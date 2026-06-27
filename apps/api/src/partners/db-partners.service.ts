import { Injectable } from '@nestjs/common';
import { Intent, PartnerCode, PartnerQuote } from '../types';
import { PrismaService } from '../prisma/prisma.service';

/** Đọc báo giá từ bảng PartnerRate trong DB thay fixture file */
@Injectable()
export class DbPartnersService {
  constructor(private readonly prisma: PrismaService) { }

  async quoteAll(_intent: Intent): Promise<PartnerQuote[]> {
    const rates = await this.prisma.partnerRate.findMany({
      where: { available: true },
    });

    return rates.map((r) => ({
      partner: r.partner as PartnerCode,
      price: r.basePriceVnd,
      etaMinutes: r.etaMinutes,
      driverName: r.driverName ?? undefined,
      available: r.available,
    }));
  }

  async confirm(
    partner: PartnerCode,
    orderId: string,
  ): Promise<{ externalId: string; message: string }> {
    const rate = await this.prisma.partnerRate.findFirst({
      where: { partner },
    });

    // Sinh mã đơn giả - sau này thay bằng gọi API đối tác thật
    const externalId = `${partner}-${orderId.slice(-6).toUpperCase()}`;
    const driverName = rate?.driverName ?? 'Tài xế';

    return {
      externalId,
      message: `${partner} xác nhận. Tài xế ${driverName} đang đến. Mã đơn: ${externalId}`,
    };
  }
}
