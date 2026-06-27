import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PlacesProvider } from './places.provider';
import type { PlaceStatus } from '../types';

@Injectable()
export class GooglePlacesProvider implements PlacesProvider {
  private readonly logger = new Logger(GooglePlacesProvider.name);

  constructor(private readonly config: ConfigService) {}

  async getStatus(query: string): Promise<PlaceStatus> {
    try {
      this.logger.log(`Searching Google Places API for: ${query}`);
      const apiKey = this.config.get<string>('GOOGLE_API_KEY');
      if (!apiKey) {
        this.logger.warn('GOOGLE_API_KEY is not defined. Falling back to mock.');
        return { name: query, isOpen: true, address: 'Mock Address (No API Key)' };
      }

      // Gọi API Place Text Search của Google Maps
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=vi`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Google Places API failed with status: ${res.status}`);

      const data = await res.json() as any;
      
      // Log trạng thái phản hồi từ Google để debug
      this.logger.log(`Google API Status: ${data.status}`);
      if (data.error_message) {
        this.logger.error(`Google API Error Message: ${data.error_message}`);
      }

      const firstResult = data.results?.[0];

      if (!firstResult) {
        this.logger.warn(`No places found on Google Maps for: ${query}. Response Status: ${data.status}`);
        return { name: query, isOpen: false, address: `Không tìm thấy địa điểm (Google Status: ${data.status})` };
      }

      const name = firstResult.name || query;
      const address = firstResult.formatted_address || '';
      // Google trả về field opening_hours.open_now để biết trạng thái đóng/mở
      const isOpen = firstResult.opening_hours?.open_now ?? true;

      const latitude = firstResult.geometry?.location?.lat;
      const longitude = firstResult.geometry?.location?.lng;

      this.logger.log(`Found on Google Maps: ${name}, isOpen: ${isOpen}, address: ${address}, coords: (${latitude}, ${longitude})`);

      return { name, isOpen, address, latitude, longitude };
    } catch (error) {
      this.logger.error(`Error fetching place status from Google Places API: ${(error as Error).message}`, error);
      // Fallback an toàn
      return { name: query, isOpen: true, address: 'Lỗi kết nối bản đồ' };
    }
  }
}
