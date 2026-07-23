import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('api/health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness — never touches the DB, must return 200 even when Postgres is down. */
  @Get()
  live(): { status: string } {
    return { status: 'ok' };
  }

  /** Readiness — pings the DB. Unreachable DB -> 503. */
  @Get('deep')
  async deep(): Promise<{ status: string; db: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', db: 'up' };
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
  }
}
