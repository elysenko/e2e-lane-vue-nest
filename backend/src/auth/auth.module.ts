import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminController } from '../admin/admin.controller';
import { SettingsService } from '../admin/settings.service';
import { AdminSeeder } from './admin.seeder';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard, JwtAuthGuard } from './guards';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'dev-insecure-secret',
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ||
          process.env.JWT_EXP ||
          '1d') as unknown as number,
      },
    }),
  ],
  controllers: [AuthController, AdminController],
  providers: [
    AuthService,
    SettingsService,
    JwtAuthGuard,
    AdminGuard,
    AdminSeeder,
  ],
  exports: [AuthService, SettingsService, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
