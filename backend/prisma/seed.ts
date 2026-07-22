import { PrismaClient, Role } from '@prisma/client';
import { createHash } from 'crypto';

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

async function main(): Promise<void> {
  const creds: Array<{ role: string; email: string; password: string }> = [];
  for (const u of SEED_USERS) {
    const password = derivePassword(u.email);
    await prisma.user.upsert({
      where:  { email: u.email },
      update: { name: u.name, role: u.role },
      create: { email: u.email, name: u.name, role: u.role },
    });
    console.log(`SEED_CRED ${u.role} ${u.email} ${password}`);
    creds.push({ role: u.role, email: u.email, password });
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
