import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from '../auth/dto/auth.dto';
import { AdminGuard } from '../auth/guards';
import { SettingsService, SettingRow } from './settings.service';

@ApiTags('admin')
@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
  ) {}

  /** Public admin login — validates the seeded admin, returns a JWT. */
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{ token: string; role: string }> {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  @Get('settings')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  listSettings(): Promise<SettingRow[]> {
    return this.settingsService.list();
  }

  @Patch('settings')
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async updateSettings(
    @Body() body: unknown,
  ): Promise<{ ok: true; settings: SettingRow[] }> {
    if (
      body === null ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.values(body as Record<string, unknown>).some(
        (v) => typeof v !== 'string',
      )
    ) {
      throw new BadRequestException(
        'Body must be an object of string key/value pairs',
      );
    }
    await this.settingsService.update(body as Record<string, string>);
    return { ok: true, settings: await this.settingsService.list() };
  }
}
