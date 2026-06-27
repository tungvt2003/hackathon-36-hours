import { VoiceEnvService } from './voice-env.service';
import { VoiceNluService } from './voice-nlu.service';
import { VoiceSessionContext } from './voice.types';

function createSession(
  overrides: Partial<VoiceSessionContext> = {},
): VoiceSessionContext {
  return {
    session_id: 'session-1',
    user_id: 'user-1',
    locale: 'vi-VN',
    user_location: { lat: 10.7769, lng: 106.7009, accuracy_m: 12 },
    saved_address: '12 Nguyen Hue',
    current_flow: null,
    current_state: 'GREETING',
    slots_filled: {},
    last_offered_options: [],
    retry_count: 0,
    last_prompt_ssml: '',
    last_nlg_request: null,
    turn_index: 0,
    updated_at: new Date().toISOString(),
    conversation_history: [],
    ...overrides,
  };
}

describe('VoiceNluService', () => {
  const keywordEnv = {
    get: (name: string, fallback = '') =>
      name === 'NLU_MODE' ? 'keyword' : fallback,
  } as VoiceEnvService;

  it('parses Vietnamese ride requests with keyword fallback', async () => {
    const service = new VoiceNluService(keywordEnv);
    const result = await service.parse(
      'dat xe den san bay Tan Son Nhat',
      createSession(),
    );

    expect(result.intent).toBe('NAVIGATE');
    expect(result.slots.destination_query).toContain('san bay');
  });

  it('parses option numbers from current options', async () => {
    const service = new VoiceNluService(keywordEnv);
    const result = await service.parse(
      'so hai',
      createSession({
        current_flow: 'NAV',
        current_state: 'QUOTING',
        last_offered_options: [
          { index: 1, ref_type: 'PARTNER', ref_id: 'GRAB', label: 'Grab' },
          { index: 2, ref_type: 'PARTNER', ref_id: 'BE', label: 'Be' },
        ],
      }),
    );

    expect(result.intent).toBe('SELECT_OPTION');
    expect(result.slots.option_index).toBe(2);
    expect(result.slots.option_name).toBe('Be');
  });

  it('uses LLM first when NLU_MODE is not keyword', async () => {
    const env = {
      get: (name: string, fallback = '') => {
        const values: Record<string, string> = {
          NLU_MODE: 'llm',
          LLM_BASE_URL: 'http://llm.test/v1',
          LLM_MODEL: 'test-model',
          LLM_TIMEOUT_MS: '1000',
        };
        return values[name] ?? fallback;
      },
    } as VoiceEnvService;
    const service = new VoiceNluService(env);
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content:
                '{"intent":"ORDER_FOOD","confidence":0.91,"slots":{"food_query":"pho bo"}}',
            },
          },
        ],
      }),
    } as Response);

    const result = await service.parse('toi muon an pho bo', createSession());

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://llm.test/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.intent).toBe('ORDER_FOOD');
    expect(result.slots.food_query).toBe('pho bo');

    fetchSpy.mockRestore();
  });
});
