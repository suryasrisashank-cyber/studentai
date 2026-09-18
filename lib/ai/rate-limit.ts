interface ClientTracker {
  minuteTimestamps: number[];
  hourTimestamps: number[];
}

const clientMap = new Map<string, ClientTracker>();

// Clean up expired entries every 10 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function performCleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const oneHourAgo = now - 60 * 60 * 1000;
  clientMap.forEach((tracker, ip) => {
    tracker.hourTimestamps = tracker.hourTimestamps.filter((t) => t > oneHourAgo);
    if (tracker.hourTimestamps.length === 0) {
      clientMap.delete(ip);
    }
  });
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  remainingMinute: number;
}

/**
 * Checks in-memory sliding window rate limits for an IP identifier.
 */
export function checkRateLimit(identifier: string): RateLimitResult {
  performCleanup();

  const now = Date.now();
  const limitPerMinute = parseInt(process.env.AI_RATE_LIMIT_PER_MINUTE || '10', 10);
  const limitPerHour = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '60', 10);

  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  let tracker = clientMap.get(identifier);
  if (!tracker) {
    tracker = { minuteTimestamps: [], hourTimestamps: [] };
    clientMap.set(identifier, tracker);
  }

  // Filter timestamps within windows
  tracker.minuteTimestamps = tracker.minuteTimestamps.filter((t) => t > oneMinuteAgo);
  tracker.hourTimestamps = tracker.hourTimestamps.filter((t) => t > oneHourAgo);

  // Check minute limit
  if (tracker.minuteTimestamps.length >= limitPerMinute) {
    const oldestInMinute = tracker.minuteTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
      remainingMinute: 0,
    };
  }

  // Check hour limit
  if (tracker.hourTimestamps.length >= limitPerHour) {
    const oldestInHour = tracker.hourTimestamps[0];
    const retryAfterSeconds = Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, retryAfterSeconds),
      remainingMinute: 0,
    };
  }

  // Record this request
  tracker.minuteTimestamps.push(now);
  tracker.hourTimestamps.push(now);

  return {
    allowed: true,
    remainingMinute: limitPerMinute - tracker.minuteTimestamps.length,
  };
}
