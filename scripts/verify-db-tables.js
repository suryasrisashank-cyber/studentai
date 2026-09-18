const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { PrismaClient } = require('@prisma/client');

async function verifyTables() {
  const hasDbUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
  if (!hasDbUrl) {
    console.log('[Database Verification] DATABASE_URL is not set in local environment.');
    console.log('[Database Verification] In-memory development store active. Production uses Neon via Vercel.');
    return;
  }

  const prisma = new PrismaClient();
  try {
    console.log('[Database Verification] Connecting to database to verify tables...');
    const [admins, sessions, logins, usages, tools, sites] = await Promise.all([
      prisma.admin.count(),
      prisma.userSession.count(),
      prisma.loginEvent.count(),
      prisma.usageEvent.count(),
      prisma.toolSetting.count(),
      prisma.siteSetting.count(),
    ]);

    console.log('✔ All 6 expected StudentAI tables exist and are reachable:');
    console.log(`  • admins (${admins} records)`);
    console.log(`  • user_sessions (${sessions} records)`);
    console.log(`  • login_events (${logins} records)`);
    console.log(`  • usage_events (${usages} records)`);
    console.log(`  • tool_settings (${tools} records)`);
    console.log(`  • site_settings (${sites} records)`);
    console.log('[Database Verification] Status: PASS');
  } catch (err) {
    console.error('[Database Verification] Table verification failed:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
