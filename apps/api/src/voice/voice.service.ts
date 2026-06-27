import { Injectable, NotFoundException } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { OrderType, PartnerCode, VoiceOrderResponse } from '../types';
import { VoiceNlgService } from './voice-nlg.service';
import { VoiceNluService } from './voice-nlu.service';
import { VoiceSessionStore } from './voice-session.store';
import { VoiceSttService } from './voice-stt.service';
import { VoiceTtsService } from './voice-tts.service';
import {
  VoiceNlgRequest,
  VoiceNlgResponse,
  VoiceNluResult,
  VoiceOptionEntry,
  VoiceSessionContext,
  VoiceTurnInput,
  VoiceTurnOutput,
} from './voice.types';

@Injectable()
export class VoiceService {
  constructor(
    private readonly sessions: VoiceSessionStore,
    private readonly nlu: VoiceNluService,
    private readonly nlg: VoiceNlgService,
    private readonly stt: VoiceSttService,
    private readonly tts: VoiceTtsService,
    private readonly orders: OrdersService,
  ) {}

  async start(userId?: string): Promise<{
    session_id: string;
    nlg: VoiceNlgResponse;
    tts: Awaited<ReturnType<VoiceTtsService['synthesize']>>;
  }> {
    const session = this.sessions.create(userId);
    const request: VoiceNlgRequest = {
      template: 'GREETING',
      status_line: 'Xin chao',
      body: 'Minh la tro ly giong noi. Minh co the giup ban dat xe hoac dat do an. Ban muon lam gi?',
      options: [
        { index: 1, label: 'dat xe', detail: 'goi xe toi noi ban muon' },
        { index: 2, label: 'dat do an', detail: 'tim quan va goi mon' },
      ],
      earcon_post: 'turn_cue',
    };
    const nlg = this.nlg.render(request);

    session.last_nlg_request = request;
    session.last_prompt_ssml = nlg.ssml;
    session.last_offered_options = [
      { index: 1, ref_type: 'GENERIC', ref_id: 'nav', label: 'dat xe' },
      { index: 2, ref_type: 'GENERIC', ref_id: 'food', label: 'dat do an' },
    ];
    this.sessions.save(session);

    return {
      session_id: session.session_id,
      nlg,
      tts: await this.tts.synthesize(nlg.plain_text),
    };
  }

  async turn(input: VoiceTurnInput): Promise<VoiceTurnOutput> {
    const session = this.getOrCreateSession(input);
    session.turn_index += 1;

    let transcript = input.transcript?.trim() ?? '';
    let asr = null;
    if (!transcript && input.audio_base64) {
      asr = await this.stt.transcribe(
        input.audio_base64,
        session.session_id,
        input.sample_rate ?? 16000,
      );
      transcript = asr.transcript.replace(/[.,!?]+$/g, '').trim();
    }

    if (!transcript) {
      const nlu = this.emptyNlu(session);
      return this.finishTurn(session, nlu, {
        template: 'NUDGE',
        body: 'Minh chua nghe ro. Ban noi lai giup minh nhe.',
        earcon_post: 'turn_cue',
      }, asr);
    }

    const nlu = await this.nlu.parse(transcript, session);
    const handledGlobal = await this.handleGlobal(session, nlu, asr);
    if (handledGlobal) return handledGlobal;

    const handledSelection = await this.handleSelection(session, nlu, asr);
    if (handledSelection) return handledSelection;

    if (nlu.intent === 'NAVIGATE') {
      const destination =
        (nlu.slots.destination_query as string | undefined)?.trim() ||
        (session.current_state === 'CAPTURE_DESTINATION' ? transcript : '');
      if (!destination) {
        session.current_flow = 'NAV';
        session.current_state = 'CAPTURE_DESTINATION';
        return this.finishTurn(session, nlu, {
          template: 'NUDGE',
          body: 'Ban muon di dau? Noi ten noi, vi du nha sach hoac san bay.',
          earcon_post: 'turn_cue',
        }, asr);
      }

      return this.createOrderFromVoice(
        session,
        nlu,
        asr,
        `dat xe den ${destination}`,
        input,
      );
    }

    if (
      nlu.intent === 'ORDER_FOOD' ||
      nlu.intent === 'CHOOSE_BY_DISH' ||
      nlu.intent === 'CHOOSE_BY_RESTAURANT'
    ) {
      const query =
        (nlu.slots.food_query as string | undefined) ??
        (nlu.slots.restaurant_query as string | undefined);

      if (!query && session.current_state !== 'CHOOSE_ENTRY') {
        session.current_flow = 'FOOD';
        session.current_state = 'CHOOSE_ENTRY';
        return this.finishTurn(session, nlu, {
          template: 'NUDGE',
          body: 'Ban muon an gi? Noi ten mon, ten quan, hoac noi goi y.',
          earcon_post: 'turn_cue',
        }, asr);
      }

      return this.createOrderFromVoice(
        session,
        nlu,
        asr,
        transcript,
        input,
      );
    }

    if (nlu.intent === 'REQUEST_SUGGESTIONS') {
      session.current_state = 'GREETING';
      session.current_flow = null;
      return this.finishTurn(session, nlu, {
        template: 'OFFER_OPTIONS',
        status_line: 'Ban muon lam gi',
        options: [
          { index: 1, label: 'dat do an', detail: 'tim quan va goi mon' },
          { index: 2, label: 'dat xe', detail: 'di toi mot noi' },
        ],
        earcon_post: 'turn_cue',
      }, asr, [
        { index: 1, ref_type: 'GENERIC', ref_id: 'food', label: 'dat do an' },
        { index: 2, ref_type: 'GENERIC', ref_id: 'nav', label: 'dat xe' },
      ]);
    }

    if (session.current_state === 'CAPTURE_DESTINATION') {
      return this.createOrderFromVoice(
        session,
        nlu,
        asr,
        `dat xe den ${transcript}`,
        input,
      );
    }

    session.retry_count += 1;
    return this.finishTurn(session, nlu, {
      template: 'ERROR',
      body: 'Minh chua hieu. Ban co the noi dat xe den dau, hoac dat mon gi.',
      earcon_post: 'turn_cue',
    }, asr);
  }

  getSession(sessionId: string): VoiceSessionContext {
    const session = this.sessions.get(sessionId);
    if (!session) throw new NotFoundException(`Voice session ${sessionId} not found`);
    return session;
  }

  listSessions(): string[] {
    return this.sessions.list();
  }

  private async createOrderFromVoice(
    session: VoiceSessionContext,
    nlu: VoiceNluResult,
    asr: VoiceTurnOutput['asr'],
    transcript: string,
    input: VoiceTurnInput,
  ): Promise<VoiceTurnOutput> {
    const result = await this.orders.processVoice({
      userId: input.user_id ?? session.user_id,
      transcript,
      currentLat: input.currentLat ?? session.user_location.lat,
      currentLng: input.currentLng ?? session.user_location.lng,
      accessibilityFlag: input.accessibilityFlag,
    });

    session.last_order_id = result.orderId;
    session.slots_filled.last_order_id = result.orderId;
    session.current_flow = result.intent.type === OrderType.FOOD ? 'FOOD' : 'NAV';

    const partnerOptions = this.partnerOptions(result);
    const nlgOptions = this.nlgOptions(result);

    if (partnerOptions.length > 0) {
      session.current_state = 'QUOTING';
      return this.finishTurn(
        session,
        nlu,
        {
          template: 'OFFER_OPTIONS',
          body: result.responseText,
          options: nlgOptions,
          earcon_post: 'turn_cue',
        },
        asr,
        partnerOptions,
        result,
      );
    }

    session.current_state = 'IDLE';
    return this.finishTurn(
      session,
      nlu,
      {
        template: 'INFORM',
        body: result.responseText,
        earcon_post: 'turn_cue',
      },
      asr,
      [],
      result,
    );
  }

  private async handleSelection(
    session: VoiceSessionContext,
    nlu: VoiceNluResult,
    asr: VoiceTurnOutput['asr'],
  ): Promise<VoiceTurnOutput | null> {
    if (!session.last_order_id || session.current_state !== 'QUOTING') {
      const selectedEntry = this.selectedGreetingEntry(session, nlu);
      if (selectedEntry === 'nav') {
        session.current_flow = 'NAV';
        session.current_state = 'CAPTURE_DESTINATION';
        return this.finishTurn(session, nlu, {
          template: 'NUDGE',
          body: 'Ban muon di dau? Noi ten noi, vi du nha sach hoac san bay.',
          earcon_post: 'turn_cue',
        }, asr);
      }
      if (selectedEntry === 'food') {
        session.current_flow = 'FOOD';
        session.current_state = 'CHOOSE_ENTRY';
        return this.finishTurn(session, nlu, {
          template: 'NUDGE',
          body: 'Ban muon an gi? Noi ten mon hoac ten quan.',
          earcon_post: 'turn_cue',
        }, asr);
      }
      return null;
    }

    const selectedPartner = this.selectedPartner(session, nlu);
    if (!selectedPartner && nlu.intent !== 'CONFIRM_YES') return null;

    const partner = selectedPartner ?? this.firstPartner(session);
    if (!partner) return null;

    const confirmation = await this.orders.confirmOrder(
      session.last_order_id,
      partner,
    );

    session.current_state = 'ORDER_PLACED';
    session.last_offered_options = [];

    return this.finishTurn(session, nlu, {
      template: 'INFORM',
      status_line: 'Da xac nhan',
      body: confirmation.responseText,
      earcon_post: 'success',
    }, asr);
  }

  private async handleGlobal(
    session: VoiceSessionContext,
    nlu: VoiceNluResult,
    asr: VoiceTurnOutput['asr'],
  ): Promise<VoiceTurnOutput | null> {
    switch (nlu.intent) {
      case 'GLOBAL_REPEAT':
      case 'GLOBAL_REPEAT_OPTIONS':
        return this.finishTurn(
          session,
          nlu,
          session.last_nlg_request ?? {
            template: 'INFORM',
            body: 'Minh khong co gi de lap lai.',
            earcon_post: 'turn_cue',
          },
          asr,
        );
      case 'GLOBAL_HELP':
        return this.finishTurn(session, nlu, {
          template: 'INFORM',
          body: this.helpText(session),
          earcon_post: 'turn_cue',
        }, asr);
      case 'GLOBAL_READ_ORDER':
        return this.finishTurn(session, nlu, {
          template: 'INFORM',
          body: session.last_order_id
            ? `Don gan nhat la ${session.last_order_id}.`
            : 'Chua co don nao trong phien nay.',
          earcon_post: 'turn_cue',
        }, asr);
      case 'GLOBAL_CANCEL':
      case 'GLOBAL_STOP':
        this.resetSession(session);
        return this.finishTurn(session, nlu, {
          template: 'INFORM',
          body: 'Da huy. Ban can gi nua khong?',
          earcon_post: 'turn_cue',
        }, asr);
      case 'CONFIRM_NO':
        if (session.current_state === 'QUOTING') {
          this.resetSession(session);
          return this.finishTurn(session, nlu, {
            template: 'INFORM',
            body: 'Da bo qua lua chon nay. Ban can gi nua khong?',
            earcon_post: 'turn_cue',
          }, asr);
        }
        return null;
      default:
        return null;
    }
  }

  private async finishTurn(
    session: VoiceSessionContext,
    nlu: VoiceNluResult,
    nlgRequest: VoiceNlgRequest,
    asr: VoiceTurnOutput['asr'],
    options?: VoiceOptionEntry[],
    orderResult?: VoiceOrderResponse,
  ): Promise<VoiceTurnOutput> {
    if (options) session.last_offered_options = options;

    const nlg = this.nlg.render(nlgRequest);
    session.last_nlg_request = nlgRequest;
    session.last_prompt_ssml = nlg.ssml;
    session.conversation_history.push(
      { role: 'user', content: nlu.transcript },
      { role: 'assistant', content: nlg.plain_text },
    );
    if (session.conversation_history.length > 20) {
      session.conversation_history = session.conversation_history.slice(-20);
    }
    this.sessions.save(session);

    return {
      session_id: session.session_id,
      turn_index: session.turn_index,
      asr,
      nlu,
      nlg,
      tts: await this.tts.synthesize(nlg.plain_text),
      orderId: orderResult?.orderId ?? session.last_order_id,
      quotes: orderResult?.quotes,
      foodQuotes: orderResult?.foodQuotes,
      session_state: {
        current_flow: session.current_flow,
        current_state: session.current_state,
        last_order_id: session.last_order_id,
        last_offered_options: session.last_offered_options,
      },
    };
  }

  private partnerOptions(result: VoiceOrderResponse): VoiceOptionEntry[] {
    const rideOptions =
      result.quotes?.map((quote, index) => ({
        index: index + 1,
        ref_type: 'PARTNER' as const,
        ref_id: quote.partner,
        label: this.partnerLabel(quote.partner),
      })) ?? [];

    const foodOptions =
      result.foodQuotes?.map((quote, index) => ({
        index: index + 1,
        ref_type: 'PARTNER' as const,
        ref_id: quote.partner,
        label: this.partnerLabel(quote.partner),
      })) ?? [];

    return foodOptions.length ? foodOptions : rideOptions;
  }

  private nlgOptions(result: VoiceOrderResponse) {
    const rideOptions =
      result.quotes?.map((quote, index) => ({
        index: index + 1,
        label: this.partnerLabel(quote.partner),
        detail: `${this.formatVnd(quote.price)}, khoang ${quote.etaMinutes} phut`,
      })) ?? [];

    const foodOptions =
      result.foodQuotes?.map((quote, index) => ({
        index: index + 1,
        label: this.partnerLabel(quote.partner),
        detail: `${this.formatVnd(quote.totalVnd)}, khoang ${quote.etaMinutes} phut`,
      })) ?? [];

    return foodOptions.length ? foodOptions : rideOptions;
  }

  private selectedGreetingEntry(
    session: VoiceSessionContext,
    nlu: VoiceNluResult,
  ): 'nav' | 'food' | null {
    if (nlu.intent !== 'SELECT_OPTION') return null;
    const index = nlu.slots.option_index as number | undefined;
    const option = session.last_offered_options.find((entry) => entry.index === index);
    if (option?.ref_id === 'nav' || option?.ref_id === 'food') return option.ref_id;
    return null;
  }

  private selectedPartner(
    session: VoiceSessionContext,
    nlu: VoiceNluResult,
  ): PartnerCode | null {
    if (nlu.intent !== 'SELECT_OPTION') return null;
    const index = nlu.slots.option_index as number | undefined;
    const name = String(nlu.slots.option_name ?? '').toLowerCase();
    const option =
      session.last_offered_options.find((entry) => entry.index === index) ??
      session.last_offered_options.find((entry) =>
        entry.label.toLowerCase().includes(name),
      );

    return this.toPartnerCode(option?.ref_id);
  }

  private firstPartner(session: VoiceSessionContext): PartnerCode | null {
    return this.toPartnerCode(session.last_offered_options[0]?.ref_id);
  }

  private toPartnerCode(value?: string): PartnerCode | null {
    if (!value) return null;
    if (Object.values(PartnerCode).includes(value as PartnerCode)) {
      return value as PartnerCode;
    }
    return null;
  }

  private partnerLabel(partner: PartnerCode): string {
    const labels: Record<PartnerCode, string> = {
      [PartnerCode.GRAB]: 'Grab',
      [PartnerCode.BE]: 'Be',
      [PartnerCode.XANH_SM]: 'Xanh SM',
      [PartnerCode.SHOPEE]: 'Shopee Food',
    };
    return labels[partner];
  }

  private formatVnd(value: number): string {
    return `${value.toLocaleString('vi-VN')}d`;
  }

  private getOrCreateSession(input: VoiceTurnInput): VoiceSessionContext {
    if (!input.session_id) return this.sessions.create(input.user_id);
    const session = this.sessions.get(input.session_id);
    if (!session) throw new NotFoundException(`Voice session ${input.session_id} not found`);
    return session;
  }

  private emptyNlu(session: VoiceSessionContext): VoiceNluResult {
    return {
      request_id: crypto.randomUUID(),
      session_id: session.session_id,
      transcript: '(khong nghe ro)',
      intent: 'UNKNOWN',
      intent_confidence: 0,
      is_global_command: false,
      slots: {},
      alternatives: [],
      timestamp: new Date().toISOString(),
    };
  }

  private resetSession(session: VoiceSessionContext): void {
    session.current_flow = null;
    session.current_state = 'IDLE';
    session.slots_filled = {};
    session.last_offered_options = [];
    session.retry_count = 0;
    session.last_order_id = undefined;
  }

  private helpText(session: VoiceSessionContext): string {
    if (session.current_flow === 'NAV') {
      return 'Ban dang dat xe. Noi diem den, nghe cac lua chon, roi noi so mot, so hai de chon doi tac.';
    }
    if (session.current_flow === 'FOOD') {
      return 'Ban dang dat do an. Noi mon hoac ten quan, nghe bao gia, roi noi so doi tac muon chon.';
    }
    return 'Minh giup ban dat xe hoac dat do an bang giong noi. Noi dat xe den san bay, hoac dat pho bo.';
  }
}
