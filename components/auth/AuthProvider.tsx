'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';

export interface OpenAuthModalOptions {
  reason?: string;
  pendingPrompt?: string;
  pendingAction?: () => void;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authReason: string | null;
  pendingPrompt: string | null;
  openAuthModal: (options?: OpenAuthModalOptions | string | unknown) => void;
  closeAuthModal: () => void;
  setPendingPrompt: (prompt: string | null) => void;
  setPendingAction: (action: (() => void) | null) => void;
  clearPendingAction: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: AuthError | null; user: User | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  requireAiAccess: (action: () => void, promptText?: string, reason?: string) => boolean;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | null>(null);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);

  const pendingActionRef = useRef<(() => void) | null>(null);
  const pendingPromptRef = useRef<string | null>(null);

  // Sync refs with state
  const updatePendingPrompt = useCallback((prompt: string | null) => {
    pendingPromptRef.current = prompt;
    setPendingPrompt(prompt);
  }, []);

  const updatePendingAction = useCallback((action: (() => void) | null) => {
    pendingActionRef.current = action;
  }, []);

  const clearPendingAction = useCallback(() => {
    pendingActionRef.current = null;
    pendingPromptRef.current = null;
    setPendingPrompt(null);
  }, []);

  useEffect(() => {
    try {
      const supabase = getSupabaseClient();

      // 1. Initial session load
      supabase.auth
        .getSession()
        .then(({ data: { session: initSession } }) => {
          setSession(initSession);
          setUser(initSession?.user ?? null);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });

      // 2. Listen to Supabase auth events
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        setSession(newSession);
        const newUser = newSession?.user ?? null;
        setUser(newUser);
        setLoading(false);

        // If newly signed in and a pending AI action exists, auto-execute it once
        if (newUser && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          if (pendingActionRef.current) {
            const actionToRun = pendingActionRef.current;
            pendingActionRef.current = null;
            setIsAuthModalOpen(false);
            try {
              actionToRun();
            } catch (err) {
              console.error('[StudentAI Auth] Error executing pending AI action:', err);
            }
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  const openAuthModal = useCallback((options?: OpenAuthModalOptions | string | unknown) => {
    if (typeof options === 'string') {
      setAuthReason(options);
    } else if (options && typeof options === 'object' && !('nativeEvent' in (options as any))) {
      const opts = options as OpenAuthModalOptions;
      if (opts.reason) setAuthReason(opts.reason);
      if (opts.pendingPrompt) updatePendingPrompt(opts.pendingPrompt);
      if (opts.pendingAction) updatePendingAction(opts.pendingAction);
    }
    setIsAuthModalOpen(true);
  }, [updatePendingAction, updatePendingPrompt]);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    // Note: Do NOT clear pendingPrompt so user doesn't lose what they typed in the composer
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/ai` : undefined,
      },
    });
    return { error, user: data?.user ?? null };
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/login?mode=reset` : undefined,
    });
    return { error };
  }, []);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/ai` : undefined,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    clearPendingAction();
  }, [clearPendingAction]);

  /**
   * Central Client-Side AI Access Gate.
   * If authenticated: executes action immediately and returns true.
   * If unauthenticated: caches pending prompt/action, opens Auth UI, and returns false.
   */
  const requireAiAccess = useCallback(
    (action: () => void, promptText?: string, reason?: string): boolean => {
      if (user) {
        action();
        return true;
      }

      updatePendingAction(action);
      if (promptText) {
        updatePendingPrompt(promptText);
      }
      openAuthModal({
        reason: reason || 'Sign in to your StudentAI account to use AI reasoning, solutions & PDF intelligence.',
        pendingPrompt: promptText,
        pendingAction: action,
      });
      return false;
    },
    [user, openAuthModal, updatePendingAction, updatePendingPrompt]
  );

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (session?.access_token) return session.access_token;
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch {
      return null;
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isConfigured: isSupabaseConfigured,
        isAuthModalOpen,
        authReason,
        pendingPrompt,
        openAuthModal,
        closeAuthModal,
        setPendingPrompt: updatePendingPrompt,
        setPendingAction: updatePendingAction,
        clearPendingAction,
        signInWithEmail,
        signUpWithEmail,
        resetPasswordForEmail,
        signInWithOAuth,
        signOut,
        requireAiAccess,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
