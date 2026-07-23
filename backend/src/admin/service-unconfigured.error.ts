import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Thrown when an integration credential is required but resolves to null/placeholder.
 * Maps to 503 so callers degrade gracefully instead of crashing.
 */
export class ServiceUnconfiguredError extends HttpException {
  constructor(key: string) {
    super(
      { error: 'service_unavailable', reason: `${key} is not configured` },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
