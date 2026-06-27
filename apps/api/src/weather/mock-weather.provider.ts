import { Injectable } from '@nestjs/common';
import { WeatherInfo } from '../types';
import { WeatherProvider } from './weather.provider';

// TODO: team thay bằng real provider: OpenWeatherMap API hoặc WeatherAPI.com
// GET https://api.openweathermap.org/data/2.5/weather?q={location}&appid={key}
@Injectable()
export class MockWeatherProvider implements WeatherProvider {
  private readonly conditions = [
    { tempC: 32, condition: 'Nắng nhẹ', willRain: false },
    { tempC: 28, condition: 'Nhiều mây', willRain: false },
    { tempC: 26, condition: 'Mưa rào', willRain: true },
    { tempC: 30, condition: 'Nắng nóng', willRain: false },
  ];

  async getCurrent(_location: string): Promise<WeatherInfo> {
    // Xoay vòng theo giờ để test nhiều trạng thái thời tiết
    const hour = new Date().getHours();
    return this.conditions[hour % this.conditions.length];
  }
}
