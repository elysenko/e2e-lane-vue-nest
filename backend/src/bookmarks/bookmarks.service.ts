import { Injectable, Logger } from '@nestjs/common';
import { Bookmark } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

const SEED_BOOKMARKS: Array<{ title: string; url: string }> = [
  { title: 'Vue.js Documentation', url: 'https://vuejs.org/guide/introduction.html' },
  { title: 'NestJS Documentation', url: 'https://docs.nestjs.com/' },
  { title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/' },
];

@Injectable()
export class BookmarksService {
  private readonly logger = new Logger('BookmarksService');

  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Bookmark[]> {
    return this.prisma.bookmark.findMany({ orderBy: { createdAt: 'asc' } });
  }

  create(dto: CreateBookmarkDto): Promise<Bookmark> {
    return this.prisma.bookmark.create({
      data: { title: dto.title, url: dto.url },
    });
  }

  /**
   * Idempotent first-load seeding. Inserts the 3 example bookmarks only when the
   * table is empty. Wrapped so a down DB never crashes boot (caller also guards).
   */
  async seed(): Promise<void> {
    const existing = await this.prisma.bookmark.count();
    if (existing > 0) {
      return;
    }
    await this.prisma.bookmark.createMany({ data: SEED_BOOKMARKS });
    this.logger.log(`Seeded ${SEED_BOOKMARKS.length} example bookmarks`);
  }
}
