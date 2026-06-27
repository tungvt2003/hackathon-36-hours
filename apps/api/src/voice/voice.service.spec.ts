import { PartnerCode } from '../types';
import { VoiceNlgService } from './voice-nlg.service';
import { VoiceNluService } from './voice-nlu.service';
import { VoiceService } from './voice.service';
import { VoiceSessionStore } from './voice-session.store';

describe('VoiceService', () => {
  function createService() {
    const sessions = new VoiceSessionStore();
    const env = {
      get: (name: string, fallback = '') =>
        name === 'NLU_MODE' ? 'keyword' : fallback,
    };
    const nlu = new VoiceNluService(env as never);
    const nlg = new VoiceNlgService();
    const stt = {
      transcribe: jest.fn(),
    };
    const tts = {
      synthesize: jest.fn(async () => ({
        audio_url: null,
        audio_base64: null,
        duration_ms: 0,
        voice: 'female_north',
        error: 'disabled',
      })),
    };
    const orders = {
      processVoice: jest.fn(async () => ({
        orderId: 'order-1',
        transcript: 'dat xe den san bay',
        intent: {
          type: 'RIDE',
          destination: 'san bay',
          confidence: 0.75,
        },
        enrichment: {},
        quotes: [
          {
            partner: PartnerCode.GRAB,
            price: 100000,
            etaMinutes: 4,
            available: true,
          },
          {
            partner: PartnerCode.BE,
            price: 90000,
            etaMinutes: 6,
            available: true,
          },
        ],
        responseText: 'Co 2 lua chon. Ban muon chon doi tac nao?',
      })),
      confirmOrder: jest.fn(async () => ({
        orderId: 'order-1',
        status: 'CONFIRMED',
        partner: PartnerCode.BE,
        responseText: 'Da xac nhan Be',
      })),
    };

    const service = new VoiceService(
      sessions,
      nlu,
      nlg,
      stt as never,
      tts as never,
      orders as never,
    );

    return { service, orders };
  }

  it('starts a voice session with greeting options', async () => {
    const { service } = createService();

    const result = await service.start('user-1');

    expect(result.session_id).toBeTruthy();
    expect(result.nlg.plain_text).toContain('dat xe');
    expect(result.nlg.expected_intents).toContain('ORDER_FOOD');
  });

  it('creates quote options then confirms selected partner', async () => {
    const { service, orders } = createService();
    const start = await service.start('user-1');

    const turn = await service.turn({
      session_id: start.session_id,
      transcript: 'dat xe den san bay',
    });

    expect(orders.processVoice).toHaveBeenCalledWith(
      expect.objectContaining({ transcript: 'dat xe den san bay' }),
    );
    expect(turn.orderId).toBe('order-1');
    expect(turn.session_state.current_state).toBe('QUOTING');
    expect(turn.session_state.last_offered_options).toHaveLength(2);

    const confirm = await service.turn({
      session_id: start.session_id,
      transcript: 'so hai',
    });

    expect(orders.confirmOrder).toHaveBeenCalledWith('order-1', PartnerCode.BE);
    expect(confirm.session_state.current_state).toBe('ORDER_PLACED');
    expect(confirm.nlg.plain_text).toContain('Da xac nhan Be');
  });
});
