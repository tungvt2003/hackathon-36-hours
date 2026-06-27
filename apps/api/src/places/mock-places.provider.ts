import { Injectable } from '@nestjs/common';
import { PlaceStatus } from '../types';
import { PlacesProvider } from './places.provider';
import { PLACE_FIXTURES } from './fixtures/places.fixture';

// TODO: team thay bằng GooglePlacesProvider khi có API key
// PLACE_FIXTURES là data mẫu - chỉnh sửa file fixtures/places.fixture.ts
@Injectable()
export class MockPlacesProvider implements PlacesProvider {
  async getStatus(query: string): Promise<PlaceStatus> {
    const q = query.toLowerCase();
    const match = PLACE_FIXTURES.find((p) =>
      p.keywords.some((k) => q.includes(k)),
    );

    if (!match) {
      return {
        name: query,
        isOpen: true,
        address: 'Địa chỉ chưa xác định',
        matched: false,
      };
    }

    // Giả lập isOpen theo giờ thực tế
    const hour = new Date().getHours();
    const isOpen = hour >= match.openHour && hour < match.closeHour;

    return {
      name: match.name,
      isOpen,
      address: match.address,
      matched: true,
    };
  }
}
