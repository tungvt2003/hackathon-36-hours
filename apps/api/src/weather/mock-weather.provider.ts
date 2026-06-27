import { Injectable, Logger } from '@nestjs/common';
import { WeatherInfo } from '../types';
import { WeatherProvider } from './weather.provider';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MockWeatherProvider implements WeatherProvider {
  private readonly logger = new Logger(MockWeatherProvider.name);
  
  private readonly conditions = [
    { tempC: 32, condition: 'Nắng nhẹ', willRain: false },
    { tempC: 28, condition: 'Nhiều mây', willRain: false },
    { tempC: 26, condition: 'Mưa rào', willRain: true },
    { tempC: 30, condition: 'Nắng nóng', willRain: false },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(
    location: string,
    _lat?: number,
    _lng?: number,
  ): Promise<WeatherInfo> {
    try {
      const q = location.toLowerCase().trim();
      const places = await this.prisma.place.findMany();
      const match = places.find((p) => p.keywords.some((k) => q.includes(k.toLowerCase())));

      if (match && match.rainOverride) {
        this.logger.log(`[mock-weather] Rain override active for place: ${match.name}`);
        return { tempC: 25, condition: 'Trời đang mưa', willRain: true };
      }
    } catch (err) {
      this.logger.error('Lỗi khi truy vấn rainOverride:', err);
    }

    // Xoay vòng theo giờ để test nhiều trạng thái thời tiết
    const hour = new Date().getHours();
    return this.conditions[hour % this.conditions.length];
  }
}
