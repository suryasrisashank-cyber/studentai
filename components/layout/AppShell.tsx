'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { ToolsSidebar } from './ToolsSidebar';
import { MobileToolsDrawer } from './MobileToolsDrawer';
import { FloatingAIChat } from '../ai/FloatingAIChat';
import { TelemetryClient } from '../telemetry/TelemetryClient';
import { Footer } from './Footer';
import { CookieConsentBanner } from '../privacy/CookieConsentBanner';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // If navigating admin routes, the Admin layout handles sidebar and structure
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
  }

  // If navigating /ai, isolate into dedicated full-viewport educational AI workspace
  const isAiRoute = pathname === '/ai' || pathname?.startsWith('/ai');
  if (isAiRoute) {
    return (
      <div className="min-h-[100dvh] h-[100dvh] flex flex-col bg-[#050816] text-[#F8FAFC] overflow-hidden">
        <TelemetryClient />
        <main className="flex-1 min-w-0 w-full h-full overflow-hidden flex flex-col">{children}</main>
        <CookieConsentBanner />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      <TelemetryClient />
      <Header onOpenMobileTools={() => setMobileDrawerOpen(true)} />

      <div className="flex-1 flex w-full">
        {/* Persistent desktop tools sidebar */}
        <ToolsSidebar />

        {/* Main page content area */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden">{children}</main>
      </div>

      <Footer />

      {/* Floating AI companion for quick questions */}
      <FloatingAIChat />

      {/* Cookie / Privacy Consent Banner & Modal */}
      <CookieConsentBanner />

      {/* Touch-friendly mobile tools drawer */}
      <MobileToolsDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </div>
  );
}
