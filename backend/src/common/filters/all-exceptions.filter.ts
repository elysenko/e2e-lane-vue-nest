import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Global exception filter.
 *
 * - HttpExceptions (400/401/403/404/409/503 thrown intentionally by controllers
 *   and guards, including ValidationPipe 400s) are passed through unchanged.
 * - Prisma / database / connection errors are mapped to a JSON `503`
 *   `{ error: 'service_unavailable' }` so a down DB degrades gracefully instead
 *   of crashing the process or surfacing a raw 500.
 * - Anything else falls back to a generic 500.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Pass intentional HttpExceptions straight through.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    if (this.isDatabaseError(exception)) {
      this.logger.error(
        `Database error mapped to 503: ${this.describe(exception)}`,
      );
      response
        .status(HttpStatus.SERVICE_UNAVAILABLE)
        .json({ error: 'service_unavailable' });
      return;
    }

    this.logger.error(`Unhandled error: ${this.describe(exception)}`);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'internal_server_error' });
  }

  private isDatabaseError(exception: unknown): boolean {
    if (!exception || typeof exception !== 'object') return false;
    const err = exception as { name?: string; code?: string; message?: string };
    const name = err.name ?? '';
    const code = err.code ?? '';
    // Prisma client error class names all start with "PrismaClient".
    if (name.startsWith('PrismaClient')) return true;
    // Prisma known-request/initialization error codes start with "P".
    if (/^P\d{4}$/.test(code)) return true;
    // Node/pg low-level connection errors.
    if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'].includes(code)) {
      return true;
    }
    return false;
  }

  private describe(exception: unknown): string {
    if (exception instanceof Error) return `${exception.name}: ${exception.message}`;
    return String(exception);
  }
}
