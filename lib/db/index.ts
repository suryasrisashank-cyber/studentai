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
    ['ai_welcome', { key: 'ai_welcome', valueJson: JSON.stringify({ greeting: 'Ask. Learn. Understand.', subtitle: 'Your AI educational study assistant for concepts, exam prep, and problem solving.' }), updatedAt: new Date() }],
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
    eventType: 'TOOL_USED' | 'AI_REQUEST' | 'AI_SUCCESS' | 'AI_FAILURE' | 'AI_FALLBACK';
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
        registeredUsers: 0,
        successfulLogins: 0,
        activeSessions: 0,
        totalToolUses: 0,
        totalAIRequests: 0,
        todayVisits: 0,
      };
    }

    const activeThreshold = new Date(Date.now() - activeWindowMinutes * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    if (prisma && hasDatabaseUrl) {
      try {
        const [registeredUsers, successfulLogins, activeSessions, totalToolUses, totalAIRequests, todayVisits] =
          await Promise.all([
            prisma.admin.count(),
            prisma.loginEvent.count({ where: { status: 'SUCCESS' } }),
            prisma.userSession.count({ where: { lastActiveAt: { gte: activeThreshold } } }),
            prisma.usageEvent.count({ where: { eventType: 'TOOL_USED' } }),
            prisma.usageEvent.count({ where: { eventType: 'AI_REQUEST' } }),
            prisma.userSession.count({ where: { lastActiveAt: { gte: startOfToday } } }),
          ]);

        return {
          available: true,
          statusMessage: 'Live database',
          registeredUsers,
          successfulLogins,
          activeSessions,
          totalToolUses,
          totalAIRequests,
          todayVisits,
        };
      } catch (err) {
        console.warn('[Database] Failed to fetch dashboard metrics:', err instanceof Error ? err.message : String(err));
        if (isProd) {
          return {
            available: false,
            statusMessage: 'Database query failed. Analytics temporarily unavailable.',
            registeredUsers: 0,
            successfulLogins: 0,
            activeSessions: 0,
            totalToolUses: 0,
            totalAIRequests: 0,
            todayVisits: 0,
          };
        }
      }
    }

    // Development local store
    let activeSessions = 0;
    let todayVisits = 0;
    devStore.sessions.forEach((s) => {
      if (s.lastActiveAt >= activeThreshold) activeSessions++;
      if (s.lastActiveAt >= startOfToday) todayVisits++;
    });

    const successfulLogins = devStore.loginEvents.filter((l) => l.status === 'SUCCESS').length;
    const totalToolUses = devStore.usageEvents.filter((u) => u.eventType === 'TOOL_USED').length;
    const totalAIRequests = devStore.usageEvents.filter((u) => u.eventType === 'AI_REQUEST').length;

    return {
      available: true,
      statusMessage: 'Development fallback',
      registeredUsers: devStore.admins.length,
      successfulLogins,
      activeSessions,
      totalToolUses,
      totalAIRequests,
      todayVisits,
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
   * Retrieves AI Telemetry breakdown.
   */
  async getAITelemetry() {
    const status = getDatabaseStatus();
    if (!status.connected && isProd) return { available: false, providers: {} };

    if (prisma && hasDatabaseUrl) {
      try {
        const aiEvents = await prisma.usageEvent.findMany({
          where: {
            eventType: { in: ['AI_REQUEST', 'AI_SUCCESS', 'AI_FAILURE', 'AI_FALLBACK'] },
          },
        });

        const providers: Record<string, { requests: number; successes: number; failures: number; fallbacks: number; totalLatencyMs: number; avgLatencyMs: number }> = {
          google: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
          groq: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
          openrouter: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
        };

        for (const ev of aiEvents) {
          const p = ev.feature.toLowerCase();
          if (!providers[p]) {
            providers[p] = { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 };
          }
          if (ev.eventType === 'AI_REQUEST') providers[p].requests++;
          if (ev.eventType === 'AI_SUCCESS') {
            providers[p].successes++;
            if (ev.metadataJson) {
              try {
                const meta = JSON.parse(ev.metadataJson);
                if (typeof meta?.latencyMs === 'number') {
                  providers[p].totalLatencyMs += meta.latencyMs;
                }
              } catch {}
            }
          }
          if (ev.eventType === 'AI_FAILURE') providers[p].failures++;
          if (ev.eventType === 'AI_FALLBACK') providers[p].fallbacks++;
        }

        for (const p in providers) {
          if (providers[p].successes > 0) {
            providers[p].avgLatencyMs = Math.round(providers[p].totalLatencyMs / providers[p].successes);
          }
        }

        return { available: true, providers };
      } catch {
        if (isProd) return { available: false, providers: {} };
      }
    }

    return {
      available: true,
      providers: {
        google: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
        groq: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
        openrouter: { requests: 0, successes: 0, failures: 0, fallbacks: 0, totalLatencyMs: 0, avgLatencyMs: 0 },
      },
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
