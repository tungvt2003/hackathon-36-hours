import { PartnerCode } from '../../types';
import {
  FOOD_MENU_CATALOG,
  FOOD_SERVICE_PATTERN,
  GLOBAL_PATTERNS,
  NO_PATTERN,
  PARTNER_VOICE_KEYWORDS,
  RIDE_SERVICE_PATTERN,
  STAR_KEYWORDS,
  SUPPORTED_PLATFORMS,
  UNSUPPORTED_FOOD_KEYWORDS,
  VALID_PLACES,
  YES_PATTERN,
} from './voice.constants';

export type VoiceNluContext =
  | 'platform_select'
  | 'home'
  | 'food'
  | 'ride'
  | 'restaurant_select'
  | 'confirm_order'
  | 'confirm_ride'
  | 'rating'
  | 'tracking';

export type VoiceNluIntent =
  | 'SELECT_PLATFORM'
  | 'PLATFORM_UNSUPPORTED'
  | 'SELECT_SERVICE_FOOD'
  | 'SELECT_SERVICE_RIDE'
  | 'SELECT_FOOD_DISH'
  | 'FOOD_NOT_FOUND'
  | 'SELECT_RESTAURANT'
  | 'SELECT_DESTINATION'
  | 'DESTINATION_INVALID'
  | 'CONFIRM_YES'
  | 'CONFIRM_NO'
  | 'SELECT_STAR'
  | 'GLOBAL_CANCEL'
  | 'GLOBAL_BACK'
  | 'GLOBAL_REPEAT'
  | 'GLOBAL_REPEAT_OPTIONS'
  | 'GLOBAL_HELP'
  | 'GLOBAL_READ_ORDER'
  | 'GLOBAL_STOP'
  | 'GLOBAL_RESUME'
  | 'UNKNOWN';

export interface VoiceNluResult {
  intent: VoiceNluIntent;
  confidence: number;
  slots: Record<string, string | number>;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[.!?,;:]+$/g, '')
    .trim();
}

export function isYes(text: string): boolean {
  return YES_PATTERN.test(normalize(text));
}

export function isNo(text: string): boolean {
  return NO_PATTERN.test(normalize(text));
}

export function matchPlatform(text: string): PartnerCode | null {
  const n = normalize(text);
  for (const { code, words } of PARTNER_VOICE_KEYWORDS) {
    if (words.some((w) => n.includes(normalize(w)))) return code;
  }
  return null;
}

export function isPlatformSupported(code: PartnerCode): boolean {
  return SUPPORTED_PLATFORMS.includes(code);
}

export function matchService(text: string): 'food' | 'ride' | null {
  const raw = text.toLowerCase();
  const n = normalize(text);
  if (RIDE_SERVICE_PATTERN.test(raw) || RIDE_SERVICE_PATTERN.test(n)) return 'ride';
  if (FOOD_SERVICE_PATTERN.test(raw) || FOOD_SERVICE_PATTERN.test(n)) return 'food';
  return null;
}

export function matchFoodDish(text: string) {
  const n = normalize(text);
  const matches = FOOD_MENU_CATALOG.filter((item) =>
    item.keywords.some((kw) => n.includes(normalize(kw))),
  );
  if (matches.length === 0) return null;

  const byRestaurant = new Map<string, typeof matches>();
  for (const m of matches) {
    const list = byRestaurant.get(m.restaurantId) ?? [];
    list.push(m);
    byRestaurant.set(m.restaurantId, list);
  }

  return {
    items: matches,
    restaurants: [...byRestaurant.values()].map((items) => items[0]),
    single: matches.length === 1 ? matches[0] : null,
  };
}

export function matchPlace(text: string) {
  const n = normalize(text);
  for (const place of VALID_PLACES) {
    if (place.keywords.some((kw) => n.includes(normalize(kw)))) {
      return place;
    }
  }
  return null;
}

export function matchRestaurantIndex(text: string, count: number): number | null {
  const n = normalize(text);
  if (/re\s*nhat|gia\s*thap|gia\s*tot|tiet\s*kiem/.test(n)) {
    return count > 0 ? count - 1 : null;
  }
  if (/gan\s*nhat|gan\s*day/.test(n)) return 0;
  if (/nhanh\s*nhat|giao\s*nhanh/.test(n)) return 0;

  const ordinals: [RegExp, number][] = [
    [/^(1)$|so\s*1|thu\s*nhat|dau\s*tien|^mot$/, 0],
    [/^(2)$|so\s*2|thu\s*hai|^hai$/, 1],
    [/^(3)$|so\s*3|thu\s*ba|^ba$/, 2],
  ];
  for (const [pattern, idx] of ordinals) {
    if (pattern.test(n) && idx < count) return idx;
  }
  return null;
}

function isUnsupportedFoodQuery(text: string): boolean {
  const n = normalize(text);
  return UNSUPPORTED_FOOD_KEYWORDS.some((kw) => n.includes(normalize(kw)));
}

export function matchStarRating(text: string): number | null {
  const n = normalize(text);
  for (const { stars, words } of STAR_KEYWORDS) {
    if (words.some((w) => n.includes(normalize(w)))) return stars;
  }
  return null;
}

function parseGlobal(text: string): VoiceNluResult | null {
  for (const { pattern, intent } of GLOBAL_PATTERNS) {
    if (pattern.test(text)) {
      return { intent: intent as VoiceNluIntent, confidence: 0.92, slots: {} };
    }
  }
  return null;
}

export function parseVoiceInput(
  transcript: string,
  context: VoiceNluContext,
): VoiceNluResult {
  const text = transcript.trim();
  const global = parseGlobal(text);
  if (global) return global;

  // 'grab' matches YES_PATTERN, so under platform_select we must check platform match first
  if (context === 'platform_select') {
    const platform = matchPlatform(text);
    if (platform) {
      if (!isPlatformSupported(platform)) {
        return {
          intent: 'PLATFORM_UNSUPPORTED',
          confidence: 0.9,
          slots: { platform },
        };
      }
      return {
        intent: 'SELECT_PLATFORM',
        confidence: 0.92,
        slots: { platform },
      };
    }
  }

  if (isYes(text)) {
    return { intent: 'CONFIRM_YES', confidence: 0.95, slots: {} };
  }
  if (isNo(text)) {
    return { intent: 'CONFIRM_NO', confidence: 0.95, slots: {} };
  }

  switch (context) {
    case 'platform_select': {
      const platform = matchPlatform(text);
      if (!platform) {
        return { intent: 'UNKNOWN', confidence: 0.3, slots: {} };
      }
      if (!isPlatformSupported(platform)) {
        return {
          intent: 'PLATFORM_UNSUPPORTED',
          confidence: 0.9,
          slots: { platform },
        };
      }
      return {
        intent: 'SELECT_PLATFORM',
        confidence: 0.92,
        slots: { platform },
      };
    }

    case 'home': {
      const service = matchService(text);
      if (service === 'food') {
        return { intent: 'SELECT_SERVICE_FOOD', confidence: 0.9, slots: {} };
      }
      if (service === 'ride') {
        return { intent: 'SELECT_SERVICE_RIDE', confidence: 0.9, slots: {} };
      }
      return { intent: 'UNKNOWN', confidence: 0.3, slots: {} };
    }

    case 'food': {
      const food = matchFoodDish(text);
      if (!food) {
        if (isUnsupportedFoodQuery(text)) {
          return { intent: 'FOOD_NOT_FOUND', confidence: 0.75, slots: {} };
        }
        return { intent: 'UNKNOWN', confidence: 0.3, slots: {} };
      }
      return {
        intent: 'SELECT_FOOD_DISH',
        confidence: 0.88,
        slots: {
          dishCount: food.items.length,
          restaurantCount: food.restaurants.length,
          dishName: food.single?.dishName ?? food.items[0].dishName,
          restaurantName: food.single?.restaurantName ?? food.restaurants[0].restaurantName,
          restaurantId: food.single?.restaurantId ?? food.restaurants[0].restaurantId,
          priceVnd: food.single?.priceVnd ?? food.items[0].priceVnd,
          distanceKm: food.single?.distanceKm ?? food.restaurants[0].distanceKm,
          etaMin: food.single?.etaMin ?? food.restaurants[0].etaMin,
        },
      };
    }

    case 'ride': {
      const place = matchPlace(text);
      if (place) {
        return {
          intent: 'SELECT_DESTINATION',
          confidence: 0.9,
          slots: { placeId: place.id, placeName: place.name },
        };
      }
      if (text.length >= 3) {
        return { intent: 'DESTINATION_INVALID', confidence: 0.7, slots: { query: text } };
      }
      return { intent: 'UNKNOWN', confidence: 0.3, slots: {} };
    }

    case 'restaurant_select': {
      const idx = matchRestaurantIndex(text, 3);
      if (idx !== null) {
        return { intent: 'SELECT_RESTAURANT', confidence: 0.9, slots: { index: idx } };
      }
      return { intent: 'UNKNOWN', confidence: 0.3, slots: {} };
    }

    case 'rating': {
      const stars = matchStarRating(text);
      if (stars) {
        return { intent: 'SELECT_STAR', confidence: 0.9, slots: { stars } };
      }
      return { intent: 'UNKNOWN', confidence: 0.3, slots: {} };
    }

    default:
      return { intent: 'UNKNOWN', confidence: 0.2, slots: {} };
  }
}
