'use client';

import { useState, useEffect } from 'react';

export const signIn = {
  email: async ({ email, password }: { email: string; password: string }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: { message: data.error || 'Sign in failed' } };
      }
      return { data };
    } catch (e: any) {
      return { error: { message: e?.message || 'Network error' } };
    }
  },
  social: async ({ provider, callbackURL }: { provider: string; callbackURL?: string }) => {
    if (provider === 'google') {
      window.location.href = '/api/auth/google';
    }
  }
};

export const signUp = {
  email: async ({ email, password, name }: { email: string; password: string; name: string }) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: { message: data.error || 'Sign up failed' } };
      }
      return { data };
    } catch (e: any) {
      return { error: { message: e?.message || 'Network error' } };
    }
  }
};

export const signOut = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  } catch (e) {}
};

export function useSession() {
  const [data, setData] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/get-session')
      .then(res => res.json())
      .then(sessionData => {
        if (isMounted) {
          setData(sessionData?.user ? sessionData : null);
          setIsPending(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setData(null);
          setIsPending(false);
        }
      });
    return () => { isMounted = false; };
  }, []);

  return { data, isPending };
}

export const authClient = {
  signIn,
  signUp,
  signOut,
  useSession,
};
