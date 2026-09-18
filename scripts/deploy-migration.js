const { loadEnvConfig } = require('@next/env');
const { execSync } = require('child_process');

loadEnvConfig(process.cwd());

const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

if (hasDbUrl) {
  console.log('[Prisma Migration] DATABASE_URL detected. Executing safe migration: npx prisma migrate deploy...');
  const cmd = process.platform === 'win32' ? 'npx.cmd prisma migrate deploy' : 'npx prisma migrate deploy';
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env });
    console.log('[Prisma Migration] All pending migrations successfully deployed to Neon PostgreSQL.');
  } catch (err) {
    console.error('[Prisma Migration] Error deploying migration to database.');
    process.exit(1);
  }
} else {
  console.log('[Prisma Migration] DATABASE_URL not detected in current environment. Skipping migrate deploy.');
}
