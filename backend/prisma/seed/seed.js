'use strict';
/**
 * Production seed — runs with plain `node`, no TypeScript toolchain needed.
 * Uses @prisma/client (generated into node_modules at build time via `npx prisma generate`).
 *
 * Usage:  node prisma/seed/seed.js
 * Called by: npx prisma db seed  (via package.json "prisma.seed" field)
 *
 * Seeds:
 *   - Demo users WITH bcrypt password hashes (admin + regular user). The derived
 *     password is echoed on the SEED_CRED / SEED_CREDS_JSON lines the deploy
 *     pipeline parses, and matches what `POST /api/admin/login` accepts.
 *   - The 3 example bookmarks (idempotent — only when the table is empty).
 */
const { PrismaClient } = require('@prisma/client');
const { createHash } = require('crypto');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function derivePassword(email) {
  return createHash('sha256')
    .update(email + (process.env.SEED_SECRET || 'colossus-seed'))
    .digest('hex')
    .slice(0, 16);
}

const SEED_USERS = [
  { email: 'admin@example.com', name: 'Admin User',   role: 'ADMIN' },
  { email: 'user@example.com',  name: 'Regular User', role: 'USER'  },
];

const SEED_BOOKMARKS = [
  { title: 'Vue.js Documentation', url: 'https://vuejs.org/guide/introduction.html' },
  { title: 'NestJS Documentation', url: 'https://docs.nestjs.com/' },
  { title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/' },
];

async function main() {
  const creds = [];
  for (const u of SEED_USERS) {
    const password =
      u.role === 'ADMIN' && process.env.ADMIN_PASSWORD
        ? process.env.ADMIN_PASSWORD
        : derivePassword(u.email);
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role, password: hash },
      create: { email: u.email, name: u.name, role: u.role, password: hash },
    });
    console.log(`SEED_CRED ${u.role} ${u.email} ${password}`);
    creds.push({ role: u.role, email: u.email, password });
  }

  const bookmarkCount = await prisma.bookmark.count();
  if (bookmarkCount === 0) {
    await prisma.bookmark.createMany({ data: SEED_BOOKMARKS });
    console.log(`Seeded ${SEED_BOOKMARKS.length} example bookmarks`);
  }

  // Platform contract: deploy parses this line into demo credentials.
  console.log(`SEED_CREDS_JSON ${JSON.stringify(creds)}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
