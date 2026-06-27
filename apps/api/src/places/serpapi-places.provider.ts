import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PlacesProvider } from './places.provider';
import type { PlaceStatus } from '../types';

@Injectable()
export class SerpApiPlacesProvider implements PlacesProvider {
  private readonly logger = new Logger(SerpApiPlacesProvider.name);

  constructor(private readonly config: ConfigService) {}

  async getStatus(query: string): Promise<PlaceStatus> {
    try {
      this.logger.log(`Searching SerpApi Google Maps for: ${query}`);
      const apiKey = this.config.get<string>('SERPAPI_API_KEY');
      if (!apiKey) {
        this.logger.warn('SERPAPI_API_KEY is not defined. Falling back to mock open status.');
        return { name: query, isOpen: true, address: 'Mock Address (No API Key)' };
      }

      const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`SerpApi request failed with status: ${res.status}`);

      const data = await res.json() as any;
      const firstResult = data.local_results?.[0];

      if (!firstResult) {
        this.logger.warn(`No places found for query: ${query}`);
        return { name: query, isOpen: false, address: 'Not found' };
      }

      const name = firstResult.title || query;
      const address = firstResult.address || '';
      const openState = firstResult.open_state || '';

      // Check if open_state indicates open status (e.g., "Open now")
      const isOpen = openState.toLowerCase().includes('open');

      this.logger.log(`Found place: ${name}, isOpen: ${isOpen}, address: ${address}`);

      return { name, isOpen, address };
    } catch (error) {
      this.logger.error(`Error fetching place status from SerpApi: ${(error as Error).message}`, error);
      // Fallback
      return { name: query, isOpen: true, address: 'Error fallback' };
    }
  }
}
