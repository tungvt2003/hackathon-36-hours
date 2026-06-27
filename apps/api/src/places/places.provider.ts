import { PlaceStatus } from '../types';

// Interface Places - team thay bằng Google Places API sau
export interface PlacesProvider {
  getStatus(query: string): Promise<PlaceStatus>;
}

export const PLACES_PROVIDER = 'PLACES_PROVIDER';
