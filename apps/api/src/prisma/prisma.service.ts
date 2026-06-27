import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected');
    } catch (err) {
      // Không crash app khi DB chưa chạy — mock endpoints vẫn hoạt động
      this.logger.warn(`Database unavailable: ${(err as Error).message}. Mocked endpoints still work.`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
