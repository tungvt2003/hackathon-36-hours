import { Injectable } from '@nestjs/common';
import { Intent, OrderType } from '../types';
import { NluProvider } from './nlu.provider';

// TODO: team AI thay bằng LLM (GPT-4o, Claude, Gemini) hoặc Rasa NLU
// Rule-based đơn giản - match từ khoá tiếng Việt
@Injectable()
export class MockNluProvider implements NluProvider {
  async parse(transcript: string): Promise<Intent> {
    const text = transcript.toLowerCase();

    const isFood =
      // có dấu
      /đặt\s+(?:đồ\s+ăn|món|cơm|phở|bún|bánh|pizza|burger)|mua\s+(?:đồ\s+ăn|món)|quán|ăn\s+gì|order\s+(?:đồ\s+ăn|món)/.test(
        text,
      ) ||
      // không dấu (STT output thường)
      /(?:dat|order|mua)\s+(?:mon|com|pho|bun|banh|pizza|burger|ga\s*ran|kfc)|quan\s+\w|an\s+gi/.test(
        text,
      ) ||
      // tên món ăn trực tiếp
      /\b(?:pho|bun\s*bo|com\s*tam|kfc|burger|pizza|ga\s*ran)\b/.test(text);

    if (isFood) {
      return this.parseFood(text, transcript);
    }
    return this.parseRide(text, transcript);
  }

  private parseRide(text: string, _original: string): Intent {
    // Match "từ/tu X" (origin)
    const originMatch = text.match(
      /(?:từ|tu|ở|o)\s+([^\s,]+(?:\s+[^\s,]+)*?)(?:\s+(?:đến|den|tới|toi|sang)|$)/,
    );
    // Match "đến/den/tới/toi Y" (destination)
    const destMatch = text.match(
      /(?:đến|den|tới|toi|sang)\s+(.+?)(?:\s*$|\s*,)/,
    );

    return {
      type: OrderType.RIDE,
      origin: originMatch?.[1]?.trim(),
      destination: destMatch?.[1]?.trim(),
      confidence: 0.75,
    };
  }

  private parseFood(text: string, _original: string): Intent {
    // Tên quán: có dấu hoặc không dấu
    const restaurantMatch = text.match(
      /(?:quán|quan|ở\s+quán|tai\s+quan|từ\s+quán|tu\s+quan)\s+([^\s,]+(?:\s+[^\s,]+){0,4}?)(?:\s*$|\s*,|\s+(?:món|gọi|mon|goi))/,
    );

    // Fallback: tên quán nổi tiếng trực tiếp trong text
    const knownRestaurants = [
      { pattern: /pho\s+ha\s+noi|phở\s+hà\s+nội/, name: 'Phở Hà Nội' },
      {
        pattern: /thuan\s+kieu|thuận\s+kiều|com\s+tam/,
        name: 'Cơm Tấm Thuận Kiều',
      },
      { pattern: /ba\s+my|bà\s+mỹ|bun\s+bo/, name: 'Bún Bò Huế Bà Mỹ' },
      { pattern: /kfc/, name: 'KFC Bến Thành' },
    ];
    const knownMatch = knownRestaurants.find((r) => r.pattern.test(text));

    // Items: có dấu hoặc không dấu
    const itemsRaw =
      text.match(/(?:gọi|goi|món|mon|order)\s+(.+?)(?:\s*$|\s*và|\s*va)/g) ??
      [];
    const items = itemsRaw.map((s) =>
      s.replace(/^(?:gọi|goi|món|mon|order)\s+/, '').trim(),
    );

    // Nếu không tìm thấy items explicit, dùng food keyword từ text làm item
    const foodKeywords = text.match(
      /\b(?:pho\s+bo\s+tai|pho\s+bo\s+chin|pho\s+ga|pho\s+dac\s+biet|pho\s+bo|pho|com\s+tam\s+suon|com\s+tam|com\s+ga|com\s+suon|bun\s+bo\s+hue|bun\s+bo|bun\s+gio|ga\s+ran|burger)\b/,
    );
    if (items.length === 0 && foodKeywords) {
      items.push(foodKeywords[0]);
    }

    // Vẫn không có items + không có restaurant -> parse từ sau động từ đặt
    if (items.length === 0 && !restaurantMatch?.[1] && !knownMatch) {
      const afterVerb = text.match(/(?:dat|order|mua|goi)\s+(.+)/);
      if (afterVerb?.[1]) items.push(afterVerb[1].trim());
    }

    const restaurant = restaurantMatch?.[1]?.trim() ?? knownMatch?.name;

    return {
      type: OrderType.FOOD,
      restaurant,
      items: items.length > 0 ? items : undefined,
      confidence: 0.7,
    };
  }
}
