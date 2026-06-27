import { WeatherInfo } from '../types';

// Interface Weather - team thay bằng OpenWeatherMap hoặc WeatherAPI sau
export interface WeatherProvider {
  getCurrent(location: string): Promise<WeatherInfo>;
}

export const WEATHER_PROVIDER = 'WEATHER_PROVIDER';
