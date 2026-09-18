'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { ToolsSidebar } from './ToolsSidebar';
import { MobileToolsDrawer } from './MobileToolsDrawer';
import { FloatingAIChat } from '../ai/FloatingAIChat';
import { TelemetryClient } from '../telemetry/TelemetryClient';
import { Footer } from './Footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // If navigating admin routes, the Admin layout handles sidebar and structure
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return <>{children}</>;
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

      {/* Touch-friendly mobile tools drawer */}
      <MobileToolsDrawer
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />
    </div>
  );
}
