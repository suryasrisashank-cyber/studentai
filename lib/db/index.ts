import { PrismaClient } from '@prisma/client';

// Global singleton Prisma client to prevent connection exhaustion in Next.js dev server
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const isProd = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);

export const prisma =
  globalForPrisma.prisma ??
  (hasDatabaseUrl
    ? new PrismaClient({
        log: isProd ? ['error'] : ['warn', 'error'],
      })
    : undefined);

if (!isProd && prisma) globalForPrisma.prisma = prisma;

/**
 * In-Memory Development/Test Store.
 * STRICT POLICY: Only active in development or test environments when DATABASE_URL is not set.
 * In production, this is explicitly marked as unavailable to prevent silent data loss or fake persistence.
 */
interface DevStore {
  admins: { id: string; email: string; passwordHash: string; createdAt: Date; lastLoginAt: Date | null }[];
  sessions: Map<string, { id: string; anonymousId: string; deviceCategory: string | null; firstSeen: Date; lastActiveAt: Date }>;
  loginEvents: { id: string; email: string; status: string; deviceCategory: string | null; createdAt: Date }[];
  usageEvents: { id: string; eventType: string; feature: string; metadataJson: string | null; sessionId: string | null; createdAt: Date }[];
  toolSettings: Map<string, { slug: string; isEnabled: boolean; isFeatured: boolean; usageCount: number; updatedAt: Date }>;
  siteSettings: Map<string, { key: string; valueJson: string; updatedAt: Date }>;
}

const devStore: DevStore = {
  admins: [],
  sessions: new Map(),
  loginEvents: [],
  usageEvents: [],
  toolSettings: new Map(),
  siteSettings: new Map([
    ['maintenance_mode', { key: 'maintenance_mode', valueJson: JSON.stringify({ enabled: false, message: 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.' }), updatedAt: new Date() }],
    ['announcement', { key: 'announcement', valueJson: JSON.stringify({ enabled: false, text: '', type: 'info' }), updatedAt: new Date() }],
    ['ai_welcome', { key: 'ai_welcome', valueJson: JSON.stringify({ greeting: 'Ask. Learn. Understand.', subtitle: 'Your free educational assistant for conceptual clarity and exam prep.' }), updatedAt: new Date() }],
    ['ai_settings', { key: 'ai_settings', valueJson: JSON.stringify({ enabled: true }), updatedAt: new Date() }],
  ]),
};

export interface DatabaseStatus {
  connected: boolean;
  isDevelopmentFallback: boolean;
  provider: 'neon-postgresql' | 'development-fallback' | 'unconfigured';
  message: string;
}

export function getDatabaseStatus(): DatabaseStatus {
  if (hasDatabaseUrl && prisma) {
    return {
      connected: true,
      isDevelopmentFallback: false,
      provider: 'neon-postgresql',
      message: 'Connected to persistent PostgreSQL database',
    };
  }

  if (isProd) {
    return {
      connected: false,
      isDevelopmentFallback: false,
      provider: 'unconfigured',
      message: 'DATABASE_URL is not configured in production. Analytics temporarily unavailable.',
    };
  }

  return {
    connected: true,
    isDevelopmentFallback: true,
    provider: 'development-fallback',
    message: 'Development/Test local memory store active (DATABASE_URL not set).',
  };
}

export const db = {
  /**
   * Records a feature usage event (tool usage, AI telemetry).
   * Privacy note: Never records input data, grades, or personal student text.
   */
  async recordUsageEvent(data: {
    eventType: 'TOOL_USED' | 'AI_REQUEST' | 'AI_SUCCESS' | 'AI_FAILURE' | 'AI_FALLBACK' | 'ADMIN_ACTION' | string;
    feature: string;
    metadataJson?: Record<string, unknown>;
    sessionId?: string;
  }) {
    const metaString = data.metadataJson ? JSON.stringify(data.metadataJson) : null;

    if (prisma && hasDatabaseUrl) {
      try {
        await prisma.usageEvent.create({
          data: {
            eventType: data.eventType,
            feature: data.feature,
            metadataJson: metaString,
            sessionId: data.sessionId || null,
          },
        });

        // Increment tool usage count if tool
        if (data.eventType === 'TOOL_USED') {
          await prisma.toolSetting.upsert({
            where: { slug: data.feature },
            create: { slug: data.feature, isEnabled: true, isFeatured: false, usageCount: 1 },
            update: { usageCount: { increment: 1 } },
          });
        }
        return;
      } catch (err) {
        console.warn('[Database] Failed to record usage event:', err instanceof Error ? err.message : String(err));
        if (isProd) return; // In production, don't silently fallback to memory
      }
    }

    if (!isProd) {
      devStore.usageEvents.push({
        id: 'evt_' + Math.random().toString(36).slice(2, 9),
        eventType: data.eventType,
        feature: data.feature,
        metadataJson: metaString,
        sessionId: data.sessionId || null,
        createdAt: new Date(),
      });

      if (data.eventType === 'TOOL_USED') {
        const existing = devStore.toolSettings.get(data.feature);
        if (existing) {
          existing.usageCount += 1;
          existing.updatedAt = new Date();
        } else {
          devStore.toolSettings.set(data.feature, {
            slug: data.feature,
            isEnabled: true,
            isFeatured: false,
            usageCount: 1,
            updatedAt: new Date(),
          });
        }
      }
    }
  },

  /**
   * Helper to write an administrative mutation audit record to usage_events.
   */
  async auditAdminAction(action: string, metadata?: Record<string, unknown>, sessionId = 'admin_console') {
    await this.recordUsageEvent({
      eventType: 'ADMIN_ACTION',
      feature: action,
      metadataJson: metadata,
      sessionId,
    });
  },

  /**
   * Updates or registers an anonymous session and tracks last active heartbeat.
   */
  async touchSession(anonymousId: string, deviceCategory?: string) {
    if (!anonymousId) return;

    if (prisma && hasDatabaseUrl) {
      try {
        await prisma.userSession.upsert({
          where: { anonymousId },
          create: {
            anonymousId,
            deviceCategory: deviceCategory || 'unknown',
            firstSeen: new Date(),
            lastActiveAt: new Date(),
          },
          update: {
            lastActiveAt: new Date(),
            deviceCategory: deviceCategory || undefined,
          },
        });
        return;
      } catch (err) {
        console.warn('[Database] Failed to update session:', err instanceof Error ? err.message : String(err));
        if (isProd) return;
      }
    }

    if (!isProd) {
      const now = new Date();
      const existing = devStore.sessions.get(anonymousId);
      if (existing) {
        existing.lastActiveAt = now;
        if (deviceCategory) existing.deviceCategory = deviceCategory;
      } else {
        devStore.sessions.set(anonymousId, {
          id: 'sess_' + Math.random().toString(36).slice(2, 9),
          anonymousId,
          deviceCategory: deviceCategory || 'unknown',
          firstSeen: now,
          lastActiveAt: now,
        });
      }
    }
  },

  /**
   * Records a login event (SUCCESS or FAILURE).
   * Strictly avoids storing passwords, hashes as analytics, or tokens.
   */
  async recordLoginEvent(data: { email: string; status: 'SUCCESS' | 'FAILURE'; deviceCategory?: string }) {
    if (prisma && hasDatabaseUrl) {
      try {
        await prisma.loginEvent.create({
          data: {
            email: data.email,
            status: data.status,
            deviceCategory: data.deviceCategory || 'unknown',
          },
        });
        return;
      } catch (err) {
        console.warn('[Database] Failed to record login event:', err instanceof Error ? err.message : String(err));
        if (isProd) return;
      }
    }

    if (!isProd) {
      devStore.loginEvents.push({
        id: 'log_' + Math.random().toString(36).slice(2, 9),
        email: data.email,
        status: data.status,
        deviceCategory: data.deviceCategory || 'unknown',
        createdAt: new Date(),
      });
    }
  },

  /**
   * Retrieves high-level Dashboard metrics.
   * Defined with zero fake data.
   */
  async getDashboardMetrics(activeWindowMinutes = 5) {
    const status = getDatabaseStatus();
    if (!status.connected && isProd) {
      return {
        available: false,
        statusMessage: status.message,
        totalAnonymousSessions: 0,
        activeSessions: 0,
        sessionsToday: 0,
        sessionsThisWeek: 0,
        sessionsThisMonth: 0,
        totalToolUses: 0,
        totalAIRequests: 0,
        successfulAIRequests: 0,
        failedAIRequests: 0,
        registeredUsers: 0,
        successfulLogins: 0,
      };
    }

    const activeThreshold = new Date(Date.now() - activeWindowMinutes * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);
    startOfMonth.setHours(0, 0, 0, 0);

    if (prisma && hasDatabaseUrl) {
      try {
        const [
          totalAnonymousSessions,
          activeSessions,
          sessionsToday,
          sessionsThisWeek,
          sessionsThisMonth,
          totalToolUses,
          totalAIRequests,
          successfulAIRequests,
          failedAIRequests,
          registeredUsers,
          successfulLogins,
        ] = await Promise.all([
          prisma.userSession.count(),
          prisma.userSession.count({ where: { lastActiveAt: { gte: activeThreshold } } }),
          prisma.userSession.count({ where: { lastActiveAt: { gte: startOfToday } } }),
          prisma.userSession.count({ where: { lastActiveAt: { gte: startOfWeek } } }),
          prisma.userSession.count({ where: { lastActiveAt: { gte: startOfMonth } } }),
          prisma.usageEvent.count({ where: { eventType: 'TOOL_USED' } }),
          prisma.usageEvent.count({ where: { eventType: 'AI_REQUEST' } }),
          prisma.usageEvent.count({ where: { eventType: 'AI_SUCCESS' } }),
          prisma.usageEvent.count({ where: { eventType: 'AI_FAILURE' } }),
          prisma.admin.count(),
          prisma.loginEvent.count({ where: { status: 'SUCCESS' } }),
        ]);

        return {
          available: true,
          statusMessage: 'Live database',
          totalAnonymousSessions,
          activeSessions,
          sessionsToday,
          sessionsThisWeek,
          sessionsThisMonth,
          totalToolUses,
          totalAIRequests,
          successfulAIRequests,
          failedAIRequests,
          registeredUsers,
          successfulLogins,
        };
      } catch (err) {
        console.warn('[Database] Failed to fetch dashboard metrics:', err instanceof Error ? err.message : String(err));
        if (isProd) {
          return {
            available: false,
            statusMessage: 'Database query failed. Analytics temporarily unavailable.',
            totalAnonymousSessions: 0,
            activeSessions: 0,
            sessionsToday: 0,
            sessionsThisWeek: 0,
            sessionsThisMonth: 0,
            totalToolUses: 0,
            totalAIRequests: 0,
            successfulAIRequests: 0,
            failedAIRequests: 0,
            registeredUsers: 0,
            successfulLogins: 0,
          };
        }
      }
    }

    // Development local store
    let activeSessions = 0;
    let sessionsToday = 0;
    let sessionsThisWeek = 0;
    let sessionsThisMonth = 0;

    devStore.sessions.forEach((s) => {
      if (s.lastActiveAt >= activeThreshold) activeSessions++;
      if (s.lastActiveAt >= startOfToday) sessionsToday++;
      if (s.lastActiveAt >= startOfWeek) sessionsThisWeek++;
      if (s.lastActiveAt >= startOfMonth) sessionsThisMonth++;
    });

    const successfulLogins = devStore.loginEvents.filter((l) => l.status === 'SUCCESS').length;
    const totalToolUses = devStore.usageEvents.filter((u) => u.eventType === 'TOOL_USED').length;
    const totalAIRequests = devStore.usageEvents.filter((u) => u.eventType === 'AI_REQUEST').length;
    const successfulAIRequests = devStore.usageEvents.filter((u) => u.eventType === 'AI_SUCCESS').length;
    const failedAIRequests = devStore.usageEvents.filter((u) => u.eventType === 'AI_FAILURE').length;

    return {
      available: true,
      statusMessage: 'Development fallback',
      totalAnonymousSessions: devStore.sessions.size,
      activeSessions,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
      totalToolUses,
      totalAIRequests,
      successfulAIRequests,
      failedAIRequests,
      registeredUsers: devStore.admins.length,
      successfulLogins,
    };
  },

  /**
   * Retrieves paginated activity logs.
   */
  async getActivityLogs(page = 1, pageSize = 20, eventFilter?: string) {
    const status = getDatabaseStatus();
    if (!status.connected && isProd) return { logs: [], total: 0, page, pageSize, available: false };

    const skip = (page - 1) * pageSize;

    if (prisma && hasDatabaseUrl) {
      try {
        const where = eventFilter && eventFilter !== 'ALL' ? { eventType: eventFilter } : {};
        const [total, events] = await Promise.all([
          prisma.usageEvent.count({ where }),
          prisma.usageEvent.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: pageSize,
          }),
        ]);

        return {
          logs: events.map((e) => ({
            id: e.id,
            timestamp: e.createdAt.toISOString(),
            eventType: e.eventType,
            feature: e.feature,
            sessionId: e.sessionId ? e.sessionId.slice(0, 10) + '...' : 'anonymous',
            metadata: e.metadataJson ? JSON.parse(e.metadataJson) : null,
          })),
          total,
          page,
          pageSize,
          available: true,
        };
      } catch {
        if (isProd) return { logs: [], total: 0, page, pageSize, available: false };
      }
    }

    let filtered = devStore.usageEvents;
    if (eventFilter && eventFilter !== 'ALL') {
      filtered = filtered.filter((e) => e.eventType === eventFilter);
    }
    const total = filtered.length;
    const sliced = filtered.slice().reverse().slice(skip, skip + pageSize);

    return {
      logs: sliced.map((e) => ({
        id: e.id,
        timestamp: e.createdAt.toISOString(),
        eventType: e.eventType,
        feature: e.feature,
        sessionId: e.sessionId ? e.sessionId.slice(0, 10) + '...' : 'anonymous',
        metadata: e.metadataJson ? JSON.parse(e.metadataJson) : null,
      })),
      total,
      page,
      pageSize,
      available: true,
    };
  },

  /**
   * Retrieves anonymous user session monitoring records.
   */
  async getUsersList(page = 1, pageSize = 20) {
    const status = getDatabaseStatus();
    const skip = (page - 1) * pageSize;
    const activeThreshold = new Date(Date.now() - 5 * 60 * 1000);

    if (prisma && hasDatabaseUrl && !status.isDevelopmentFallback) {
      try {
        const [total, sessions] = await Promise.all([
          prisma.userSession.count(),
          prisma.userSession.findMany({
            orderBy: { lastActiveAt: 'desc' },
            skip,
            take: pageSize,
          }),
        ]);

        const sessionIds = sessions.map((s) => s.id);
        const anonymousIds = sessions.map((s) => s.anonymousId);
        const relatedEvents =
          sessionIds.length > 0
            ? await prisma.usageEvent.findMany({
                where: {
                  sessionId: { in: [...sessionIds, ...anonymousIds] },
                },
                select: { sessionId: true, eventType: true },
              })
            : [];

        const items = sessions.map((s) => {
          const events = relatedEvents.filter(
            (e) => e.sessionId === s.id || e.sessionId === s.anonymousId
          );
          const toolsUsed = events.filter((e) => e.eventType === 'TOOL_USED').length;
          const aiRequests = events.filter((e) => e.eventType === 'AI_REQUEST').length;
          const isActive = s.lastActiveAt >= activeThreshold;
          return {
            id: s.id,
            anonymousId: s.anonymousId.length > 14 ? (s.anonymousId.slice(0, 8) + '...' + s.anonymousId.slice(-4)) : s.anonymousId,
            deviceCategory: s.deviceCategory || 'Desktop',
            firstSeen: s.firstSeen.toISOString(),
            lastActiveAt: s.lastActiveAt.toISOString(),
            toolsUsed,
            aiRequests,
            isActiveNow: isActive,
            sessionStatus: isActive ? 'Active' : 'Idle',
          };
        });

        return { items, total, page, pageSize, available: true };
      } catch (err) {
        console.warn('[Database] Failed to fetch users list:', err instanceof Error ? err.message : String(err));
        if (isProd) return { items: [], total: 0, page, pageSize, available: false };
      }
    }

    // Dev local fallback
    const allSessions = Array.from(devStore.sessions.values()).sort(
      (a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime()
    );
    const total = allSessions.length;
    const paged = allSessions.slice(skip, skip + pageSize);
    const items = paged.map((s) => {
      const toolsUsed = devStore.usageEvents.filter((e) => e.sessionId === s.anonymousId && e.eventType === 'TOOL_USED').length;
      const aiRequests = devStore.usageEvents.filter((e) => e.sessionId === s.anonymousId && e.eventType === 'AI_REQUEST').length;
      const isActive = s.lastActiveAt >= activeThreshold;
      return {
        id: s.id,
        anonymousId: s.anonymousId.length > 14 ? (s.anonymousId.slice(0, 8) + '...' + s.anonymousId.slice(-4)) : s.anonymousId,
        deviceCategory: s.deviceCategory || 'Desktop',
        firstSeen: s.firstSeen.toISOString(),
        lastActiveAt: s.lastActiveAt.toISOString(),
        toolsUsed,
        aiRequests,
        isActiveNow: isActive,
        sessionStatus: isActive ? 'Active' : 'Idle',
      };
    });

    return { items, total, page, pageSize, available: true };
  },

  /**
   * Retrieves detailed per-tool analytics with usage count, unique sessions, and last used time.
   */
  async getToolAnalytics(range = '7d') {
    const status = getDatabaseStatus();
    const now = new Date();
    let since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === 'today') {
      since = new Date();
      since.setHours(0, 0, 0, 0);
    } else if (range === '30d') {
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (range === 'all') {
      since = new Date(0);
    }

    if (prisma && hasDatabaseUrl && !status.isDevelopmentFallback) {
      try {
        const [toolEvents, aiEvents, loginEvents] = await Promise.all([
          prisma.usageEvent.findMany({
            where: { eventType: 'TOOL_USED', createdAt: { gte: since } },
            select: { feature: true, sessionId: true, createdAt: true },
          }),
          prisma.usageEvent.findMany({
            where: { eventType: { in: ['AI_REQUEST', 'AI_SUCCESS'] }, createdAt: { gte: since } },
            select: { eventType: true, feature: true, createdAt: true },
          }),
          prisma.loginEvent.findMany({
            where: { createdAt: { gte: since } },
            select: { status: true, createdAt: true },
          }),
        ]);

        const toolStatsMap: Record<string, { slug: string; uses: number; sessions: Set<string>; lastUsed: Date }> = {};
        for (const t of toolEvents) {
          if (!toolStatsMap[t.feature]) {
            toolStatsMap[t.feature] = { slug: t.feature, uses: 0, sessions: new Set(), lastUsed: t.createdAt };
          }
          toolStatsMap[t.feature].uses++;
          if (t.sessionId) toolStatsMap[t.feature].sessions.add(t.sessionId);
          if (t.createdAt > toolStatsMap[t.feature].lastUsed) {
            toolStatsMap[t.feature].lastUsed = t.createdAt;
          }
        }

        const tools = Object.values(toolStatsMap)
          .sort((a, b) => b.uses - a.uses)
          .map((item) => ({
            slug: item.slug,
            uses: item.uses,
            uniqueSessions: item.sessions.size,
            lastUsed: item.lastUsed.toISOString(),
          }));

        const toolBreakdown: Record<string, number> = {};
        for (const item of tools) {
          toolBreakdown[item.slug] = item.uses;
        }

        return {
          available: true,
          totalToolUses: toolEvents.length,
          totalAIRequests: aiEvents.length,
          totalLogins: loginEvents.filter((l) => l.status === 'SUCCESS').length,
          tools,
          toolBreakdown,
          range,
        };
      } catch (err) {
        if (isProd) return { available: false, totalToolUses: 0, totalAIRequests: 0, totalLogins: 0, tools: [], toolBreakdown: {}, range };
      }
    }

    // Dev local fallback
    const devEvents = devStore.usageEvents.filter((e) => e.eventType === 'TOOL_USED' && e.createdAt >= since);
    const devAiEvents = devStore.usageEvents.filter((e) => (e.eventType === 'AI_REQUEST' || e.eventType === 'AI_SUCCESS') && e.createdAt >= since);
    const devLogins = devStore.loginEvents.filter((l) => l.status === 'SUCCESS' && l.createdAt >= since);

    const devToolStatsMap: Record<string, { slug: string; uses: number; sessions: Set<string>; lastUsed: Date }> = {};
    for (const t of devEvents) {
      if (!devToolStatsMap[t.feature]) {
        devToolStatsMap[t.feature] = { slug: t.feature, uses: 0, sessions: new Set(), lastUsed: t.createdAt };
      }
      devToolStatsMap[t.feature].uses++;
      if (t.sessionId) devToolStatsMap[t.feature].sessions.add(t.sessionId);
      if (t.createdAt > devToolStatsMap[t.feature].lastUsed) {
        devToolStatsMap[t.feature].lastUsed = t.createdAt;
      }
    }

    const tools = Object.values(devToolStatsMap)
      .sort((a, b) => b.uses - a.uses)
      .map((item) => ({
        slug: item.slug,
        uses: item.uses,
        uniqueSessions: item.sessions.size,
        lastUsed: item.lastUsed.toISOString(),
      }));

    const devToolBreakdown: Record<string, number> = {};
    for (const item of tools) {
      devToolBreakdown[item.slug] = item.uses;
    }

    return {
      available: true,
      totalToolUses: devEvents.length,
      totalAIRequests: devAiEvents.length,
      totalLogins: devLogins.length,
      tools,
      toolBreakdown: devToolBreakdown,
      range,
    };
  },

  /**
   * Retrieves AI Telemetry breakdown.
   */
  async getAITelemetry() {
    const status = getDatabaseStatus();
    if (!status.connected && isProd) return { available: false, providers: {} };

    const aiEventTypes = [
      'AI_REQUEST',
      'AI_SUCCESS',
      'AI_FAILURE',
      'AI_FALLBACK',
      'AI_CHAT_SUCCESS',
      'AI_CHAT_STREAM_SUCCESS',
      'AI_CHAT_FAILURE',
    ];

    const initProviders = () => ({
      google: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
      groq: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
      openrouter: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
      bytez: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
      atria: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
      claude: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
    });

    const processEvents = (events: any[]) => {
      const providers: Record<string, { requests: number; successes: number; failures: number; fallbacks: number; totalLatencyMs: number; avgLatencyMs: number }> = initProviders();

      for (const ev of events) {
        let p = (ev.feature || '').toLowerCase();
        let latencyMs = 0;
        let isFallback = false;

        if (ev.metadataJson) {
          try {
            const meta = typeof ev.metadataJson === 'string' ? JSON.parse(ev.metadataJson) : ev.metadataJson;
            if (meta?.provider) {
              p = String(meta.provider).toLowerCase();
            }
            if (typeof meta?.latencyMs === 'number') {
              latencyMs = meta.latencyMs;
            }
            if (Boolean(meta?.fallbackUsed)) {
              isFallback = true;
            }
          } catch {}
        }

        if (!providers[p]) {
          providers[p] = { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 };
        }

        if (['AI_REQUEST'].includes(ev.eventType)) {
          providers[p].requests++;
        } else if (['AI_SUCCESS', 'AI_CHAT_SUCCESS', 'AI_CHAT_STREAM_SUCCESS'].includes(ev.eventType)) {
          providers[p].requests++;
          providers[p].successes++;
          if (latencyMs > 0) {
            providers[p].totalLatencyMs += latencyMs;
          }
          if (isFallback) {
            providers[p].fallbacks++;
          }
        } else if (['AI_FAILURE', 'AI_CHAT_FAILURE'].includes(ev.eventType)) {
          providers[p].requests++;
          providers[p].failures++;
        } else if (ev.eventType === 'AI_FALLBACK') {
          providers[p].fallbacks++;
        }
      }

      for (const p in providers) {
        if (providers[p].successes > 0) {
          providers[p].avgLatencyMs = Math.round(providers[p].totalLatencyMs / providers[p].successes);
        }
      }

      return providers;
    };

    if (prisma && hasDatabaseUrl) {
      try {
        const aiEvents = await prisma.usageEvent.findMany({
          where: {
            eventType: { in: aiEventTypes },
          },
        });

        return { available: true, providers: processEvents(aiEvents) };
      } catch {
        if (isProd) return { available: false, providers: {} };
      }
    }

    // Dev store fallback
    const devAiEvents = devStore.usageEvents.filter((e) => aiEventTypes.includes(e.eventType));
    return {
      available: true,
      providers: processEvents(devAiEvents),
    };
  },

  /**
   * Tool management: Get and update tool status (enabled/disabled, featured).
   */
  async getToolSettings(): Promise<Map<string, { isEnabled: boolean; isFeatured: boolean; usageCount: number }>> {
    const map = new Map<string, { isEnabled: boolean; isFeatured: boolean; usageCount: number }>();

    if (prisma && hasDatabaseUrl) {
      try {
        const rows = await prisma.toolSetting.findMany();
        for (const r of rows) {
          map.set(r.slug, { isEnabled: r.isEnabled, isFeatured: r.isFeatured, usageCount: r.usageCount });
        }
        return map;
      } catch {
        // Fall through
      }
    }

    devStore.toolSettings.forEach((val, slug) => {
      map.set(slug, { isEnabled: val.isEnabled, isFeatured: val.isFeatured, usageCount: val.usageCount });
    });
    return map;
  },

  async updateToolSetting(slug: string, isEnabled?: boolean, isFeatured?: boolean) {
    if (prisma && hasDatabaseUrl) {
      try {
        await prisma.toolSetting.upsert({
          where: { slug },
          create: {
            slug,
            isEnabled: isEnabled ?? true,
            isFeatured: isFeatured ?? false,
            usageCount: 0,
          },
          update: {
            ...(isEnabled !== undefined && { isEnabled }),
            ...(isFeatured !== undefined && { isFeatured }),
          },
        });
        return;
      } catch (err) {
        console.warn('[Database] Failed to update tool setting:', err);
      }
    }

    const current = devStore.toolSettings.get(slug) || {
      slug,
      isEnabled: true,
      isFeatured: false,
      usageCount: 0,
      updatedAt: new Date(),
    };
    if (isEnabled !== undefined) current.isEnabled = isEnabled;
    if (isFeatured !== undefined) current.isFeatured = isFeatured;
    current.updatedAt = new Date();
    devStore.toolSettings.set(slug, current);
  },

  /**
   * Site Settings (Maintenance mode, announcements, AI welcome text).
   */
  async getSiteSetting<T>(key: string, defaultValue: T): Promise<T> {
    if (prisma && hasDatabaseUrl) {
      try {
        const row = await prisma.siteSetting.findUnique({ where: { key } });
        if (row?.valueJson) {
          return JSON.parse(row.valueJson) as T;
        }
      } catch {
        // Fall through
      }
    }

    const devRow = devStore.siteSettings.get(key);
    if (devRow?.valueJson) {
      try {
        return JSON.parse(devRow.valueJson) as T;
      } catch {}
    }
    return defaultValue;
  },

  async setSiteSetting<T>(key: string, value: T) {
    const valueJson = JSON.stringify(value);
    if (prisma && hasDatabaseUrl) {
      try {
        await prisma.siteSetting.upsert({
          where: { key },
          create: { key, valueJson },
          update: { valueJson },
        });
        return;
      } catch (err) {
        console.warn('[Database] Failed to set site setting:', err);
      }
    }

    devStore.siteSettings.set(key, { key, valueJson, updatedAt: new Date() });
  },
};
