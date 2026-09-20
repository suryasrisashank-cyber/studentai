'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { hasConsent, CONSENT_UPDATED_EVENT, ConsentPreferences } from '@/lib/privacy/consent';

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
  const [canTrack, setCanTrack] = useState<boolean>(false);

  useEffect(() => {
    // Initial consent check
    setCanTrack(hasConsent('analytics'));

    const onConsentChanged = (e: Event) => {
      const custom = e as CustomEvent<ConsentPreferences>;
      if (custom.detail) {
        setCanTrack(Boolean(custom.detail.analytics));
      } else {
        setCanTrack(hasConsent('analytics'));
      }
    };

    window.addEventListener(CONSENT_UPDATED_EVENT, onConsentChanged);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, onConsentChanged);
  }, []);

  // Send anonymous heartbeat every 3 minutes if analytics consent granted
  useEffect(() => {
    if (!canTrack) return;

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
  }, [canTrack]);

  // Track tool usage if on a tool page and analytics consent granted
  useEffect(() => {
    if (!canTrack) return;
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
  }, [pathname, canTrack]);

  return null;
}

