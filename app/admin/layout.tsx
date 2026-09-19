import React from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { verifySessionToken, ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { AdminClientLayout } from './AdminClientLayout';

export const metadata: Metadata = {
  title: 'Admin Control Center | StudentAI',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';

  // If on login page, allow unauthenticated access to the authentication form
  if (pathname === '/admin/login' || pathname.endsWith('/admin/login')) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>;
  }

  // Server-side cryptographic verification of HMAC session cookie
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isValid = sessionCookie ? verifySessionToken(sessionCookie) : false;

  if (!isValid) {
    redirect('/admin/login');
  }

  return <AdminClientLayout>{children}</AdminClientLayout>;
}
