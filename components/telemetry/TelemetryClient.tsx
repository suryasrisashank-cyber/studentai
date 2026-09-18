'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const SESSION_STORAGE_KEY = 'studentai:anonymous_session_id';

function getOrGenerateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = 's_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 's_fallback_' + Math.random().toString(36).slice(2, 10);
  }
}

function getCoarseDevice(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1200) return 'tablet';
  return 'desktop';
}

export function TelemetryClient() {
  const pathname = usePathname();
  const lastToolRecorded = useRef<string | null>(null);

  // Send anonymous heartbeat every 3 minutes
  useEffect(() => {
    const sessionId = getOrGenerateSessionId();
    const deviceCategory = getCoarseDevice();

    const sendHeartbeat = () => {
      try {
        fetch('/api/telemetry/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'HEARTBEAT',
            sessionId,
            deviceCategory,
          }),
        }).catch(() => {});
      } catch {}
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Track tool usage if on a tool page (slug only, never tool inputs or text)
  useEffect(() => {
    if (!pathname?.startsWith('/tools/')) return;

    const parts = pathname.split('/');
    const toolSlug = parts[2];
    if (!toolSlug || toolSlug === lastToolRecorded.current) return;

    lastToolRecorded.current = toolSlug;
    const sessionId = getOrGenerateSessionId();
    const deviceCategory = getCoarseDevice();

    try {
      fetch('/api/telemetry/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'TOOL_USED',
          toolSlug,
          sessionId,
          deviceCategory,
        }),
      }).catch(() => {});
    } catch {}
  }, [pathname]);

  return null;
}
