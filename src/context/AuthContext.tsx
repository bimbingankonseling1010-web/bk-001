'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { SchoolId, StaffRole } from '@/types';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  schoolId: SchoolId | null; // null = Super Admin
  schoolName: string | null;
  isSuperAdmin: boolean;
  permissions: {
    canEditStudents: boolean;
    canLogViolations: boolean;
    canEditMaster: boolean;
    canExportExcel: boolean;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isReady: boolean; // true setelah initial session check selesai
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider untuk komponen client.
 * - Baca session dari Supabase Auth via cookie
 * - Decode metadata (role, school_id, permissions) dari user
 * - Subscribe ke perubahan session (login/logout)
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Browser client — hanya dipakai untuk listen session changes.
  // Data fetching tetap lewat server actions / DAL.
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  );

  const decodeUser = useCallback((authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null; app_metadata?: Record<string, unknown> | null }): AuthUser | null => {
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const appMeta = (authUser.app_metadata ?? {}) as Record<string, unknown>;

    const role = (meta.role ?? appMeta.role) as StaffRole | undefined;
    if (!role) return null; // User tanpa role tidak diizinkan masuk aplikasi

    const schoolId = (meta.school_id ?? appMeta.school_id) as SchoolId | null | undefined;
    const isSuperAdmin = role === 'Super Admin';

    return {
      id: authUser.id,
      email: authUser.email ?? '',
      name: (meta.name as string) ?? authUser.email ?? 'User',
      role,
      schoolId: isSuperAdmin ? null : schoolId ?? null,
      schoolName: (meta.school_name ?? appMeta.school_name) as string | null ?? null,
      isSuperAdmin,
      permissions: {
        canEditStudents: (appMeta.can_edit_students ?? meta.can_edit_students ?? true) as boolean,
        canLogViolations: (appMeta.can_log_violations ?? meta.can_log_violations ?? true) as boolean,
        canEditMaster: (appMeta.can_edit_master ?? meta.can_edit_master ?? true) as boolean,
        canExportExcel: (appMeta.can_export_excel ?? meta.can_export_excel ?? true) as boolean,
      },
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (mounted) {
          setUser(data.user ? decodeUser(data.user) : null);
        }
      } finally {
        if (mounted) setIsReady(true);
      }
    };

    init();

    // Listen perubahan session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const authUser = session?.user ?? null;
      setUser(authUser ? decodeUser(authUser) : null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [decodeUser, supabase]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isReady, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
