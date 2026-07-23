import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('api/v1/health')
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    // A real check, not just "the process is running" — confirms the database connection
    // this whole product depends on is actually alive.
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', db: 'connected', timestamp: new Date().toISOString() };
  }
}
