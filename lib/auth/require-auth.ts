import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export interface AuthValidationResult {
  authenticated: boolean;
  user: User | null;
  errorResponse?: NextResponse;
}

/**
 * Server-side AI Authentication Gate.
 * Enforces mandatory Supabase authentication on all AI-powered API routes
 * BEFORE any external AI provider (Gemini, Groq, OpenRouter, Bytez, Atria) is contacted.
 */
export async function requireAiAuth(req: NextRequest): Promise<AuthValidationResult> {
  try {
    const supabase = createSupabaseServerClient();

    // 1. Check Authorization Bearer token header if provided by client
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          return { authenticated: true, user: data.user };
        }
      }
    }

    // 2. Check Cookie-based session via Supabase SSR
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      return { authenticated: true, user: data.user };
    }

    // Unauthenticated: Return standard HTTP 401 response
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Please sign in to use StudentAI AI features.',
            status: 401,
          },
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache',
            'Content-Type': 'application/json',
          },
        }
      ),
    };
  } catch {
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        {
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Please sign in to use StudentAI AI features.',
            status: 401,
          },
        },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache',
            'Content-Type': 'application/json',
          },
        }
      ),
    };
  }
}

export const requireAuthenticatedUser = requireAiAuth;
