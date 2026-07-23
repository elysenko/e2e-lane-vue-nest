import { createHash } from 'crypto';

/**
 * Deterministic demo-password derivation. MUST stay byte-for-byte identical to
 * `prisma/seed/seed.js` so the credentials the deploy pipeline parses from
 * `SEED_CREDS_JSON` actually work against the in-app seeded admin.
 */
export function derivePassword(email: string): string {
  return createHash('sha256')
    .update(email + (process.env.SEED_SECRET || 'colossus-seed'))
    .digest('hex')
    .slice(0, 16);
}

export const DEFAULT_ADMIN_EMAIL = 'admin@example.com';

export function resolveAdminEmail(): string {
  return process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
}

export function resolveAdminPassword(email: string): string {
  return process.env.ADMIN_PASSWORD || derivePassword(email);
}
