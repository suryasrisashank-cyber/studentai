import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ThemeRegistry } from '@/components/providers/ThemeRegistry';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    default: 'StudentAI — Study Smarter. Prepare Better. Get Things Done.',
    template: '%s | StudentAI',
  },
  description:
    'Free browser-based tools for students, study, career preparation, and everyday productivity. Processed locally in your browser with ₹0 cost.',
  keywords: [
    'student tools',
    'study tools',
    'cgpa calculator',
    'attendance calculator',
    'pomodoro timer',
    'study planner',
    'resume keyword checker',
    'interview questions',
    'free student utilities',
  ],
  authors: [{ name: 'StudentAI Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
  openGraph: {
    title: 'StudentAI — Study Smarter. Prepare Better. Get Things Done.',
    description:
      'Free browser-based tools for students, study, career preparation, and everyday productivity.',
    siteName: 'StudentAI',
    locale: 'en_US',
    type: 'website',
  },
  verification: {
    google: 'FR5odiZfCSE4c7cU7FpEkQisWYbrzFWkf7dnAWnyR4Q',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#090d16' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

import { cookies, headers } from 'next/headers';
import { db } from '@/lib/db';
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { MaintenanceScreen } from '@/components/layout/MaintenanceScreen';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminOrApiPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml');

  // Check Maintenance Mode from persistent store
  const maintenance = await db.getSiteSetting('maintenance_mode', {
    enabled: false,
    message: 'StudentAI is currently undergoing scheduled maintenance. We will be back shortly.',
  });

  // Verify Admin session
  const cookieStore = cookies();
  const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = adminCookie ? verifySessionToken(adminCookie) : false;

  // If maintenance is active and visitor is not an admin, and not accessing admin routes:
  // Render server-side MaintenanceScreen directly
  const showMaintenance = maintenance.enabled && !isAdmin && !isAdminOrApiPath;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeRegistry>
          <ThemeProvider>
            {showMaintenance ? (
              <MaintenanceScreen message={maintenance.message} />
            ) : (
              <>
                {maintenance.enabled && isAdmin && !pathname.startsWith('/admin') && (
                  <div className="bg-amber-600 text-white text-xs font-bold py-2 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-3 shadow-md">
                    <span>🛠️ Maintenance Mode is ACTIVE — Public visitors see the maintenance screen. (Admin Preview)</span>
                    <a
                      href="/admin/settings"
                      className="underline bg-amber-700 hover:bg-amber-800 px-2 py-0.5 rounded text-[11px]"
                    >
                      Admin Controls
                    </a>
                  </div>
                )}
                <AppShell>{children}</AppShell>
              </>
            )}
          </ThemeProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
