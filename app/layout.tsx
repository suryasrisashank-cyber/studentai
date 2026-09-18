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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeRegistry>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
