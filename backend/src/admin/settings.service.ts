import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceUnconfiguredError } from './service-unconfigured.error';

export const PLACEHOLDER = 'PLACEHOLDER_CONFIGURE_IN_SETTINGS';

interface KnownKey {
  key: string;
  label: string;
  kind: 'service' | 'integration';
}

/**
 * Keys surfaced in the admin settings panel. Order/labels mirror the approved
 * frontend (AdminSettingsView.vue).
 */
const KNOWN_KEYS: KnownKey[] = [
  { key: 'DATABASE_URL', label: 'PostgreSQL', kind: 'service' },
  { key: 'MINIO_ENDPOINT', label: 'MinIO', kind: 'service' },
  {
    key: 'POSTGRESQL_VIA_TYPEORM_PG_DRIVER_API_KEY',
    label: 'PostgreSQL via TypeORM (pg driver)',
    kind: 'integration',
  },
];

export interface SettingRow {
  key: string;
  label: string;
  kind: 'service' | 'integration';
  configured: boolean;
  masked: string;
  source: 'env' | 'db' | null;
}

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private static isUsable(value: string | null | undefined): value is string {
    return !!value && value !== PLACEHOLDER;
  }

  private static mask(value: string): string {
    if (value.length <= 4) return '••••••';
    return value.slice(0, 4) + '••••••';
  }

  /**
   * Resolve a config value: env var first, then SystemSetting DB row, else null.
   * A PLACEHOLDER value is treated as unconfigured (null).
   */
  async resolveConfig(key: string): Promise<string | null> {
    const envVal = process.env[key];
    if (SettingsService.isUsable(envVal)) return envVal;

    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    if (SettingsService.isUsable(row?.value)) return row!.value;

    return null;
  }

  /** Like resolveConfig, but throws a 503 when the key is unconfigured. */
  async requireConfig(key: string): Promise<string> {
    const value = await this.resolveConfig(key);
    if (value === null) throw new ServiceUnconfiguredError(key);
    return value;
  }

  /** Never returns raw secret values — only a masked hint + configured flag. */
  async list(): Promise<SettingRow[]> {
    const rows = await this.prisma.systemSetting.findMany();
    const dbMap = new Map(rows.map((r) => [r.key, r.value]));

    return KNOWN_KEYS.map(({ key, label, kind }) => {
      const envVal = process.env[key];
      const dbVal = dbMap.get(key);
      const envGood = SettingsService.isUsable(envVal);
      const dbGood = SettingsService.isUsable(dbVal);
      const value = envGood ? envVal! : dbGood ? dbVal! : null;
      const source: 'env' | 'db' | null = envGood ? 'env' : dbGood ? 'db' : null;
      return {
        key,
        label,
        kind,
        configured: value !== null,
        masked: value !== null ? SettingsService.mask(value) : '',
        source,
      };
    });
  }

  /** Upsert each key/value pair. Idempotent on the SystemSetting primary key. */
  async update(values: Record<string, string>): Promise<void> {
    const entries = Object.entries(values).filter(
      ([, v]) => typeof v === 'string' && v.length > 0,
    );
    await Promise.all(
      entries.map(([key, value]) =>
        this.prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    );
  }
}
