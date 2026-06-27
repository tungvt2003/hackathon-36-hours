import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';
import { OrdersService } from '../orders/orders.service';
import { NLU_PROVIDER } from '../nlu/nlu.provider';
import type { NluProvider } from '../nlu/nlu.provider';
import { Inject } from '@nestjs/common';
import { Intent, OrderType, PartnerCode } from '../types';

export interface ConversationInputResult {
  sessionId: string;
  state: string;
  missingField?: string;
  promptText: string;
  quotes?: unknown[];
  foodQuotes?: unknown[];
  orderId?: string;
}

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurants: RestaurantsService,
    private readonly orders: OrdersService,
    @Inject(NLU_PROVIDER) private readonly nlu: NluProvider,
  ) {}

  /** POST /conversation/start */
  async start(
    userId?: string,
  ): Promise<{ sessionId: string; promptText: string }> {
    const session = await this.prisma.conversationSession.create({
      data: {
        userId,
        state: 'COLLECTING',
        intent: {},
        missingFields: [],
      },
    });
    return {
      sessionId: session.id,
      promptText:
        'Xin chào! Tôi có thể giúp bạn đặt xe hoặc đặt đồ ăn. Bạn muốn gì?',
    };
  }

  /** POST /conversation/input */
  async input(params: {
    sessionId: string;
    transcript: string;
    userId?: string;
    userLat?: number;
    userLng?: number;
    preferredPartner?: PartnerCode;
  }): Promise<ConversationInputResult> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: params.sessionId },
    });
    if (!session)
      throw new NotFoundException(`Session ${params.sessionId} not found`);

    // Parse transcript và merge vào existing intent
    const newIntent = await this.nlu.parse(params.transcript);
    const merged = this.mergeIntent(
      session.intent as Partial<Intent>,
      newIntent,
    );

    // Detect missing fields
    const missing = this.detectMissing(merged);

    if (missing.length > 0) {
      // Còn thiếu — hỏi lại
      await this.prisma.conversationSession.update({
        where: { id: params.sessionId },
        data: {
          intent: merged as object,
          missingFields: missing,
          state: 'COLLECTING',
        },
      });
      const missingField = missing[0];
      return {
        sessionId: params.sessionId,
        state: 'COLLECTING',
        missingField,
        promptText: this.promptForField(missingField, merged),
      };
    }

    // Đủ info → chạy flow
    await this.prisma.conversationSession.update({
      where: { id: params.sessionId },
      data: {
        intent: merged as object,
        missingFields: [],
        state: 'CONFIRMING',
      },
    });

    const result = await this.orders.processVoice({
      userId: params.userId ?? session.userId ?? undefined,
      transcript: params.transcript,
      currentLat: params.userLat,
      currentLng: params.userLng,
      preferredPartner: params.preferredPartner,
    });

    await this.prisma.conversationSession.update({
      where: { id: params.sessionId },
      data: { state: 'ORDERING', orderId: result.orderId },
    });

    return {
      sessionId: params.sessionId,
      state: 'ORDERING',
      promptText: result.responseText,
      quotes: result.quotes,
      foodQuotes: result.foodQuotes,
      orderId: result.orderId,
    };
  }

  /** POST /conversation/confirm — user chọn partner sau khi nghe quotes */
  async confirm(params: {
    sessionId: string;
    partner: PartnerCode;
  }): Promise<{
    sessionId: string;
    state: string;
    promptText: string;
    orderId: string;
  }> {
    const session = await this.prisma.conversationSession.findUnique({
      where: { id: params.sessionId },
    });
    if (!session)
      throw new NotFoundException(`Session ${params.sessionId} not found`);
    if (!session.orderId)
      throw new NotFoundException('Session chưa có orderId');

    const result = await this.orders.confirmOrder(
      session.orderId,
      params.partner,
    );

    await this.prisma.conversationSession.update({
      where: { id: params.sessionId },
      data: { state: 'DONE' },
    });

    return {
      sessionId: params.sessionId,
      state: 'DONE',
      promptText: result.responseText,
      orderId: session.orderId,
    };
  }

  // ── helpers ──────────────────────────────────────────────────

  private mergeIntent(existing: Partial<Intent>, incoming: Intent): Intent {
    return {
      type: incoming.type ?? existing.type ?? OrderType.RIDE,
      origin: incoming.origin ?? existing.origin,
      destination: incoming.destination ?? existing.destination,
      restaurant: incoming.restaurant ?? existing.restaurant,
      items: incoming.items?.length ? incoming.items : existing.items,
      note: incoming.note ?? existing.note,
      confidence: incoming.confidence,
    };
  }

  private detectMissing(intent: Intent): string[] {
    const missing: string[] = [];
    if (intent.type === OrderType.FOOD) {
      if (!intent.restaurant && (!intent.items || intent.items.length === 0)) {
        missing.push('food_query'); // cần ít nhất tên quán hoặc tên món
      }
    } else {
      // confidence thấp + không có gì để bám (không origin/destination) -> NLU không hiểu câu nói,
      // đừng mặc định hỏi "đến đâu" như thể chắc chắn là ride
      const unclear =
        (intent.confidence ?? 1) < 0.5 &&
        !intent.destination &&
        !intent.origin;
      if (unclear) missing.push('unclear_intent');
      else if (!intent.destination) missing.push('destination');
    }
    return missing;
  }

  private promptForField(field: string, _intent: Intent): string {
    const prompts: Record<string, string> = {
      unclear_intent:
        'Xin lỗi, tôi chưa hiểu yêu cầu này. Bạn có thể nói rõ hơn, ví dụ "Đặt xe đến sân bay" hoặc "Đặt phở bò"?',
      food_query:
        'Bạn muốn đặt ở quán nào? Hoặc cho tôi biết bạn muốn ăn món gì?',
      items: 'Bạn muốn gọi món gì? Tôi có thể đọc menu cho bạn nghe.',
      deliveryAddress: 'Bạn muốn giao đến địa chỉ nào?',
      destination: 'Bạn muốn đến đâu?',
    };
    return prompts[field] ?? 'Bạn có thể cho tôi biết thêm thông tin không?';
  }
}
