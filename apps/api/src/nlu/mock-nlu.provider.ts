import { Injectable } from '@nestjs/common';
import { Intent, OrderType } from '../types';
import { NluProvider } from './nlu.provider';

// TODO: team AI thay bằng LLM (GPT-4o, Claude, Gemini) hoặc Rasa NLU
// Rule-based đơn giản — match từ khoá tiếng Việt
@Injectable()
export class MockNluProvider implements NluProvider {
  async parse(transcript: string): Promise<Intent> {
    const text = transcript.toLowerCase();

    const isFood =
      /đặt\s+(?:đồ\s+ăn|món|cơm|phở|bún|bánh|pizza|burger)|mua\s+(?:đồ\s+ăn|món)|quán|ăn\s+gì|order\s+(?:đồ\s+ăn|món)/.test(text);

    if (isFood) {
      return this.parseFood(text, transcript);
    }
    return this.parseRide(text, transcript);
  }

  private parseRide(text: string, _original: string): Intent {
    // Tách "từ X" và "đến/tới Y"
    const originMatch = text.match(/(?:từ|ở)\s+([^\s,đến]+(?:\s+[^\s,đến]+)*?)(?:\s+(?:đến|tới|sang)|$)/);
    const destMatch = text.match(/(?:đến|tới|sang)\s+(.+?)(?:\s*$|\s*,)/);

    return {
      type: OrderType.RIDE,
      origin: originMatch?.[1]?.trim(),
      destination: destMatch?.[1]?.trim(),
      confidence: 0.75,
    };
  }

  private parseFood(text: string, _original: string): Intent {
    // Tách tên quán sau "quán" hoặc "ở"
    const restaurantMatch = text.match(/(?:quán|ở\s+quán|tại\s+quán)\s+([^\s,]+(?:\s+[^\s,]+)*?)(?:\s*$|\s*,|\s+(?:món|gọi))/);

    // Tách tên món: "gọi X", "món X", "order X"
    const itemsRaw = text.match(/(?:gọi|món|order)\s+(.+?)(?:\s*$|\s*và)/g) ?? [];
    const items = itemsRaw.map((s) =>
      s.replace(/^(?:gọi|món|order)\s+/, '').trim(),
    );

    return {
      type: OrderType.FOOD,
      restaurant: restaurantMatch?.[1]?.trim(),
      items: items.length > 0 ? items : undefined,
      confidence: 0.7,
    };
  }
}
