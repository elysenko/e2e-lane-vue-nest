import { Module } from '@nestjs/common';
import { BookmarksController } from './bookmarks.controller';
import { BookmarksService } from './bookmarks.service';
import { BookmarksSeeder } from './bookmarks.seeder';

@Module({
  controllers: [BookmarksController],
  providers: [BookmarksService, BookmarksSeeder],
  exports: [BookmarksService],
})
export class BookmarksModule {}
