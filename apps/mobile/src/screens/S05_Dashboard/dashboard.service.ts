// apps/mobile/src/screens/S05_Dashboard/dashboard.service.ts
import { PartnerCode } from '../../types';
import {
  PARTNER_LABEL,
  PARTNER_VOICE_KEYWORDS,
} from '../../services/voice/voice.constants';
import { matchPlatform } from '../../services/voice/voice-nlu.service';
import { voiceNlg } from '../../services/voice/voice-nlg.service';

export { PARTNER_LABEL };

export const PLATFORM_SELECT_GREETING = voiceNlg.servicePrompt();
export const HOME_AI_GREETING = voiceNlg.servicePrompt();
export const FOOD_AI_GREETING = voiceNlg.serviceFoodSelected();
export const RIDE_AI_GREETING = voiceNlg.serviceRideSelected();

export function matchPlatformFromVoice(rawText: string): PartnerCode | null {
  return matchPlatform(rawText);
}

export { PARTNER_VOICE_KEYWORDS };
