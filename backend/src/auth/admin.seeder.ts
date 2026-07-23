import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  resolveAdminEmail,
  resolveAdminPassword,
} from '../common/seed-credentials';

/**
 * Idempotently seeds the admin account from ADMIN_EMAIL/ADMIN_PASSWORD env
 * (falling back to the deterministic demo credential that matches
 * prisma/seed/seed.js). Password is stored as a bcrypt hash, never plaintext.
 * Wrapped in try/catch so a down DB at boot never crashes the process.
 */
@Injectable()
export class AdminSeeder implements OnModuleInit {
  private readonly logger = new Logger('AdminSeeder');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    try {
      const email = resolveAdminEmail().trim().toLowerCase();
      const password = resolveAdminPassword(email);
      const hash = await bcrypt.hash(password, 10);

      await this.prisma.user.upsert({
        where: { email },
        update: { role: Role.ADMIN, password: hash },
        create: {
          email,
          name: 'Admin User',
          role: Role.ADMIN,
          password: hash,
        },
      });
      this.logger.log(`Admin account ensured for ${email}`);
    } catch (err) {
      this.logger.warn(
        `Admin seeding skipped (DB unavailable): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
