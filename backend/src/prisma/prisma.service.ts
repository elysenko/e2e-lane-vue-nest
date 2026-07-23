import {
  Injectable,
  Logger,
  OnModuleInit,
  INestApplication,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // Never crash boot when the database is unreachable. Prisma connects
    // lazily on the first query, so a failed initial connect is non-fatal:
    // the process stays up (so /api/health keeps returning 200 without touching
    // the DB) and later queries transparently retry the connection. Query-time
    // failures surface to callers as graceful 503s via AllExceptionsFilter.
    try {
      await this.$connect();
    } catch (error) {
      this.logger.error(
        `Initial database connection failed; continuing without a live connection. Queries will retry lazily. ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  enableShutdownHooks(app: INestApplication): void {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}
