const { loadEnvConfig } = require('@next/env');
const { execSync } = require('child_process');

loadEnvConfig(process.cwd());

const rawDbUrl = (process.env.DATABASE_URL || '').trim();

const isPlaceholder =
  !rawDbUrl ||
  rawDbUrl.includes('[YOUR-PASSWORD]') ||
  rawDbUrl.includes('YOUR-PASSWORD') ||
  rawDbUrl.includes('YOUR_PASSWORD') ||
  rawDbUrl.includes('<password>') ||
  rawDbUrl.includes('[password]') ||
  rawDbUrl.includes('placeholder');

if (!isPlaceholder) {
  console.log('[Prisma Migration] DATABASE_URL detected. Attempting safe migration: npx prisma migrate deploy...');
  const cmd = process.platform === 'win32' ? 'npx.cmd prisma migrate deploy' : 'npx prisma migrate deploy';
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env, timeout: 20000 });
    console.log('[Prisma Migration] All pending migrations successfully deployed.');
  } catch (err) {
    console.warn('[Prisma Migration Warning] Database migration could not be deployed during build.');
    console.warn('[Prisma Migration Warning] Continuing build so web application deployment succeeds without interruption.');
  }
} else {
  console.log('[Prisma Migration] DATABASE_URL not detected or contains placeholder credentials. Skipping migrate deploy.');
}
