import { Injectable } from '@nestjs/common';
import { PlaceStatus } from '../types';
import { PlacesProvider } from './places.provider';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DbPlacesProvider implements PlacesProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(query: string): Promise<PlaceStatus> {
    const q = query.toLowerCase();

    // Tìm place có keyword match với query
    const places = await this.prisma.place.findMany();
    const match = places.find((p) => p.keywords.some((k) => q.includes(k)));

    if (!match) {
      return { name: query, isOpen: true, address: 'Địa chỉ chưa xác định' };
    }

    const hour = new Date().getHours();
    const isOpen = hour >= match.openHour && hour < match.closeHour;

    return {
      name: match.name,
      isOpen,
      address: match.address,
    };
  }
}
