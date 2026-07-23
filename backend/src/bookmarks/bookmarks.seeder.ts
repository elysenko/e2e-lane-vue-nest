import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';

/**
 * Seeds the 3 example bookmarks on first boot. Wrapped in try/catch so a
 * down/unreachable DB at startup never crashes the process — the app boots and
 * serves the graceful error state instead.
 */
@Injectable()
export class BookmarksSeeder implements OnModuleInit {
  private readonly logger = new Logger('BookmarksSeeder');

  constructor(private readonly bookmarksService: BookmarksService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.bookmarksService.seed();
    } catch (err) {
      this.logger.warn(
        `Bookmark seeding skipped (DB unavailable): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
