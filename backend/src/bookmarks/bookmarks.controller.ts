import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Bookmark } from '@prisma/client';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

/**
 * Public bookmark API. No auth guards — these routes must never return 401/403.
 * DB failures surface as 503 via the global AllExceptionsFilter.
 */
@ApiTags('bookmarks')
@Controller('api/bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Get()
  findAll(): Promise<Bookmark[]> {
    return this.bookmarksService.findAll();
  }

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateBookmarkDto): Promise<Bookmark> {
    return this.bookmarksService.create(dto);
  }
}
