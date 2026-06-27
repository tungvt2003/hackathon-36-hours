import { Injectable, Logger } from '@nestjs/common';
import type { WeatherProvider } from './weather.provider';
import type { WeatherInfo } from '../types';

@Injectable()
export class OpenMeteoProvider implements WeatherProvider {
  private readonly logger = new Logger(OpenMeteoProvider.name);

  async getCurrent(locationName: string, latParam?: number, lngParam?: number): Promise<WeatherInfo> {
    try {
      let lat = latParam;
      let lng = lngParam;

      if (lat === undefined || lng === undefined) {
        this.logger.log(`Bắt đầu tìm tọa độ cho: ${locationName} (Không có tọa độ sẵn)`);

        // BƯỚC 1: GEOCODING API → lấy tọa độ từ tên địa điểm
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationName)}&count=1&language=vi&format=json`;
        const geoRes = await fetch(geoUrl);
        if (!geoRes.ok) throw new Error('Lỗi Geocoding API');
        const geoData = await geoRes.json() as any;

        lat = 10.7626;
        lng = 106.6602;

        if (geoData.results?.length > 0) {
          lat = geoData.results[0].latitude;
          lng = geoData.results[0].longitude;
          this.logger.log(`Tọa độ tìm được từ Geocoding: ${geoData.results[0].name} lat=${lat}, lng=${lng}`);
        }
      } else {
        this.logger.log(`Sử dụng tọa độ truyền trực tiếp từ Google Maps: lat=${lat}, lng=${lng}`);
      }

      // BƯỚC 2: FORECAST API → lấy thời tiết từ tọa độ
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`;
      const weatherRes = await fetch(weatherUrl);
      if (!weatherRes.ok) throw new Error('Lỗi Forecast API');
      const weatherData = await weatherRes.json() as any;

      const weatherCode: number = weatherData.current_weather.weathercode;
      const willRain = weatherCode >= 51 && weatherCode <= 99;

      // Map weatherCode sang condition text tiếng Việt
      const condition = willRain ? 'Trời đang mưa' : weatherCode <= 3 ? 'Trời quang' : 'Nhiều mây';

      return {
        tempC: weatherData.current_weather.temperature,
        condition,
        willRain,
      };

    } catch (error) {
      this.logger.error(`Lỗi API thời tiết cho ${locationName}, fallback về mặc định`, error);
      // Fallback an toàn — không crash app
      return { tempC: 30, condition: 'Không xác định', willRain: false };
    }
  }
}
