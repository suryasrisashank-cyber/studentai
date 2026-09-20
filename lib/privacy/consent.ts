export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export interface ConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: number;
}

export const CONSENT_STORAGE_KEY = 'studentai_cookie_consent_v1';
export const CONSENT_COOKIE_NAME = 'studentai_consent';
export const CURRENT_CONSENT_VERSION = 1;
export const CONSENT_UPDATED_EVENT = 'studentai:consent-updated';
export const OPEN_CONSENT_MODAL_EVENT = 'studentai:open-consent-modal';

const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  functional: false,
  analytics: false,
  marketing: false,
  timestamp: '',
  version: CURRENT_CONSENT_VERSION,
};

export function getConsentPreferences(): ConsentPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    if (typeof parsed === 'object' && parsed !== null && parsed.version === CURRENT_CONSENT_VERSION) {
      return {
        necessary: true, // always strictly true
        functional: Boolean(parsed.functional),
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
        timestamp: parsed.timestamp || new Date().toISOString(),
        version: CURRENT_CONSENT_VERSION,
      };
    }
  } catch {
    // Fall back to cookie check if localStorage is blocked
  }

  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [k, v] = cookie.trim().split('=');
      if (k === CONSENT_COOKIE_NAME && v) {
        const parsed = JSON.parse(decodeURIComponent(v));
        return {
          necessary: true,
          functional: Boolean(parsed.functional),
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
          timestamp: parsed.timestamp || new Date().toISOString(),
          version: CURRENT_CONSENT_VERSION,
        };
      }
    }
  } catch {}

  return null;
}

export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'necessary') return true;
  const prefs = getConsentPreferences();
  if (!prefs) return false; // Strict opt-in by default
  return Boolean(prefs[category]);
}

export function saveConsentPreferences(prefs: {
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}): ConsentPreferences {
  const fullPrefs: ConsentPreferences = {
    necessary: true,
    functional: prefs.functional,
    analytics: prefs.analytics,
    marketing: prefs.marketing,
    timestamp: new Date().toISOString(),
    version: CURRENT_CONSENT_VERSION,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(fullPrefs));
    } catch {}

    try {
      const serialized = encodeURIComponent(JSON.stringify(fullPrefs));
      // Set cookie for 365 days, SameSite=Lax, Path=/
      document.cookie = `${CONSENT_COOKIE_NAME}=${serialized}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    } catch {}

    window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: fullPrefs }));
  }

  return fullPrefs;
}

export function acceptAllCookies(): ConsentPreferences {
  return saveConsentPreferences({
    functional: true,
    analytics: true,
    marketing: true,
  });
}

export function rejectAllCookies(): ConsentPreferences {
  return saveConsentPreferences({
    functional: false,
    analytics: false,
    marketing: false,
  });
}

export function triggerOpenConsentModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_CONSENT_MODAL_EVENT));
  }
}
