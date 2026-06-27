import { Injectable } from '@nestjs/common';
import { Intent, OrderType } from '../types';
import { NluProvider } from './nlu.provider';

// TODO: team AI thay bằng LLM (GPT-4o, Claude, Gemini) hoặc Rasa NLU
// Rule-based đơn giản - match từ khoá tiếng Việt
@Injectable()
export class MockNluProvider implements NluProvider {
  /** Strip diacritics → "phở" = "pho", "đặt" = "dat" — safe for regex matching */
  private plain(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[đĐ]/g, (c) => (c === 'đ' ? 'd' : 'D'));
  }

  async parse(transcript: string): Promise<Intent> {
    const text = transcript.toLowerCase().normalize('NFC');
    const p = this.plain(text); // no-diacritic version for robust matching

    // Lưu ý: match theo NHÓM động từ/danh từ chung (đặt/mua/order/gọi + đồ ăn/món/quán/...),
    // không liệt kê tên món cụ thể — món mới thêm vào menu (DB) tự nhiên vẫn nhận diện được
    // qua fallback "afterVerb" trong parseFood(), không cần sửa regex này mỗi lần.
    const isFood =
      // diacritic (NFC): verb + cụm món ăn, cho phép vài từ chen giữa; hoặc "ăn X" / "đói" / "thèm ăn" / "quán"
      /(?:đặt|mua|order|gọi|kêu|lấy)\s+(?:\S+\s+){0,3}(?:đồ\s*ăn|món|cơm|phở|bún|bánh|pizza|burger|gà\s*rán|quán|nhà\s*hàng)|(?:^|\s)ăn\s+\S|đói|thèm\s*ăn|quán\s+\w/.test(
        text,
      ) ||
      // plain (no-diacritic) — covers STT output không dấu và NFC "phở" → "pho"
      /(?:dat|order|mua|goi|keu|lay)\s+(?:\S+\s+){0,3}(?:do\s*an|mon|com|pho|bun|banh|pizza|burger|ga\s*ran|kfc|quan|nha\s*hang)|quan\s+\w|doi\s*bung|them\s*an/.test(
        p,
      ) ||
      // tên món ăn standalone (plain) — "phở"→"pho", "bún bò"→"bun bo"
      /\b(?:pho|bun\s*bo|com\s*tam|kfc|burger|pizza|ga\s*ran)\b/.test(p);

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
    // Có nhắc tới việc đặt xe nhưng chưa nói điểm đến — vẫn coi là ride hợp lệ
    const hasRideVerb =
      /đặt\s*xe|gọi\s*xe|goi\s*xe|dat\s*xe|đi\s*xe|taxi|xe\s*ôm|xe\s*om/.test(
        text,
      );
    // Không khớp gì cả — câu nói không liên quan ride hay food
    const recognized = !!originMatch || !!destMatch || hasRideVerb;

    return {
      type: OrderType.RIDE,
      origin: originMatch?.[1]?.trim(),
      destination: destMatch?.[1]?.trim(),
      confidence: recognized ? 0.75 : 0.15,
    };
  }

  private parseFood(text: string, _original: string): Intent {
    const p = this.plain(text);

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
    const foodKeywords = p.match(
      /\b(?:pho\s+bo\s+tai|pho\s+bo\s+chin|pho\s+ga|pho\s+dac\s+biet|pho\s+bo|pho|com\s+tam\s+suon|com\s+tam|com\s+ga|com\s+suon|bun\s+bo\s+hue|bun\s+bo|bun\s+gio|ga\s+ran|burger)\b/,
    );
    if (items.length === 0 && foodKeywords) {
      items.push(foodKeywords[0]);
    }

    // Vẫn không có items + không có restaurant -> parse từ sau động từ đặt
    // (bỏ qua nếu chỉ nói chung "đồ ăn"/"món" — chưa đủ cụ thể để tìm quán)
    if (items.length === 0 && !restaurantMatch?.[1] && !knownMatch) {
      const afterVerb = p.match(/(?:dat|order|mua|goi)\s+(.+)/);
      const generic = afterVerb?.[1]?.trim();
      if (generic && !/^(?:do\s*an|mon|gi)$/.test(generic)) {
        items.push(generic);
      }
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
