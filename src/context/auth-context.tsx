'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/env';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: { displayName: string; username: string; bio?: string | null; avatarPath?: string | null }) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  isConfigured: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  updateProfile: async () => ({ error: 'Not implemented' }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isSupabaseConfigured();

  const loadProfile = useCallback(async (userId: string) => {
    if (!isConfigured) {
      setProfile(null);
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.warn('Error fetching profile:', error.message || error);
      } else if (data) {
        setProfile(data as Profile);
      }
    } catch (err) {
      console.warn('Failed to load profile:', err);
    }
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    // Initial session fetch
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      const session = data?.session;
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isConfigured, loadProfile]);

  const signOut = async () => {
    if (isConfigured) {
      if (profile?.id) {
        try {
          await fetch('/api/presence/heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: profile.id }),
          });
        } catch {
          // Ignore error on sign out
        }
      }
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const updateProfile = async (data: {
    displayName: string;
    username: string;
    bio?: string | null;
    avatarPath?: string | null;
  }) => {
    if (!profile) return { error: 'No profile found' };

    // Update optimistic local state immediately
    setProfile(prev =>
      prev
        ? {
            ...prev,
            display_name: data.displayName,
            username: data.username,
            bio: data.bio ?? null,
            avatar_path: data.avatarPath !== undefined ? data.avatarPath : prev.avatar_path,
          }
        : null
    );

    if (!isConfigured) {
      return {};
    }

    try {
      // 1. First attempt via server endpoint (handles service-role bypassing RLS issues)
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': profile.id,
        },
        body: JSON.stringify({
          userId: profile.id,
          displayName: data.displayName,
          username: data.username,
          bio: data.bio,
          avatarPath: data.avatarPath,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        await refreshProfile();
        return { error: resData.error || 'Failed to update profile' };
      }

      if (resData.profile) {
        setProfile(resData.profile as Profile);
      } else {
        await refreshProfile();
      }

      return {};
    } catch (err: unknown) {
      // 2. Direct client fallback with browser Supabase client
      try {
        const supabase = getSupabaseBrowserClient();
        const updatePayload: Record<string, any> = {
          display_name: data.displayName,
          username: data.username,
          bio: data.bio ?? null,
          updated_at: new Date().toISOString(),
        };

        if (data.avatarPath !== undefined) {
          updatePayload.avatar_path = data.avatarPath;
        }

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', profile.id);

        if (error) {
          await refreshProfile();
          return { error: error.message };
        }

        await refreshProfile();
        return {};
      } catch (clientErr: unknown) {
        return { error: (clientErr as Error)?.message || (err as Error)?.message || 'Failed to update profile' };
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
