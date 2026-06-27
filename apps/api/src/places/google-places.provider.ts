import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PlacesProvider } from './places.provider';
import type { PlaceStatus } from '../types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GooglePlacesProvider implements PlacesProvider {
  private readonly logger = new Logger(GooglePlacesProvider.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async getStatus(query: string): Promise<PlaceStatus> {
    try {
      const q = query.toLowerCase().trim();

      // BƯỚC 1: Check trong Database Local trước
      this.logger.log(`Checking local database for place keyword matching: "${query}"`);
      const places = await this.prisma.place.findMany();
      const dbMatch = places.find((p) => p.keywords.some((k) => q.includes(k.toLowerCase())));

      if (dbMatch) {
        this.logger.log(`Found matching place in local DB: ${dbMatch.name}`);
        const hour = new Date().getHours();
        const isOpen = hour >= dbMatch.openHour && hour < dbMatch.closeHour;

        // Trả về dữ liệu từ DB (ở đây ta chưa lưu lat/lng cụ thể, nhưng có thể mock hoặc dùng tọa độ mặc định nếu DB không có.
        // Để an toàn và nhất quán, ta gán tọa độ trung tâm TP.HCM hoặc bạn có thể mock coordinates)
        return {
          name: dbMatch.name,
          isOpen,
          address: dbMatch.address,
          latitude: 10.7769, // Tọa độ fallback
          longitude: 106.7009,
        };
      }

      // BƯỚC 2: Nếu không thấy trong DB -> Call Google Places API
      this.logger.log(`Not found in DB. Searching Google Places API for: ${query}`);
      const apiKey = this.config.get<string>('GOOGLE_API_KEY');
      if (!apiKey) {
        this.logger.warn(
          'GOOGLE_API_KEY is not defined. Falling back to mock.',
        );
        return {
          name: query,
          isOpen: true,
          address: 'Mock Address (No API Key)',
          latitude: 10.7769,
          longitude: 106.7009,
        };
      }

      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}&language=vi`;
      const res = await fetch(url);
      if (!res.ok)
        throw new Error(`Google Places API failed with status: ${res.status}`);

      const data = (await res.json()) as any;

      this.logger.log(`Google API Status: ${data.status}`);
      if (data.error_message) {
        this.logger.error(`Google API Error Message: ${data.error_message}`);
      }

      const firstResult = data.results?.[0];

      if (!firstResult) {
        this.logger.warn(
          `No places found on Google Maps for: ${query}. Response Status: ${data.status}`,
        );
        return {
          name: query,
          isOpen: false,
          address: `Không tìm thấy địa điểm (Google Status: ${data.status})`,
        };
      }

      const name = firstResult.name || query;
      const address = firstResult.formatted_address || '';
      const isOpen = firstResult.opening_hours?.open_now ?? true;

      const latitude = firstResult.geometry?.location?.lat;
      const longitude = firstResult.geometry?.location?.lng;

      this.logger.log(
        `Found on Google Maps: ${name}, isOpen: ${isOpen}, address: ${address}, coords: (${latitude}, ${longitude})`,
      );

      return { name, isOpen, address, latitude, longitude };
    } catch (error) {
      this.logger.error(
        `Error fetching place status from Google Places API: ${(error as Error).message}`,
        error,
      );
      return {
        name: query,
        isOpen: true,
        address: 'Lỗi kết nối bản đồ',
        latitude: 10.7769,
        longitude: 106.7009,
      };
    }
  }
}
