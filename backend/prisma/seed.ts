import { PrismaClient, Role } from '@prisma/client';
import { createHash } from 'crypto';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function derivePassword(email: string): string {
  return createHash('sha256')
    .update(email + (process.env.SEED_SECRET || 'colossus-seed'))
    .digest('hex')
    .slice(0, 16);
}

const SEED_USERS: Array<{ email: string; name: string; role: Role }> = [
  { email: 'admin@example.com',   name: 'Admin User',   role: Role.ADMIN },
  { email: 'user@example.com',    name: 'Regular User', role: Role.USER  },
];

const SEED_BOOKMARKS: Array<{ title: string; url: string }> = [
  { title: 'Vue.js Documentation', url: 'https://vuejs.org/guide/introduction.html' },
  { title: 'NestJS Documentation', url: 'https://docs.nestjs.com/' },
  { title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/' },
];

async function main(): Promise<void> {
  const creds: Array<{ role: string; email: string; password: string }> = [];
  for (const u of SEED_USERS) {
    const password =
      u.role === Role.ADMIN && process.env.ADMIN_PASSWORD
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
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
