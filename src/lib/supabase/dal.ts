/**
 * Data Access Layer (DAL) untuk server-side data fetching.
 *
 * Prinsip:
 *  - Semua akses data dari server WAJIB lewat helper di file ini.
 *  - Selalu gunakan server Supabase client (`createClient` dari `server.ts`)
 *    yang sudah terikat cookie session user yang sedang login.
 *  - RLS di Supabase akan otomatis memfilter data berdasarkan JWT user.
 *  - JANGAN pakai `createBrowserClient` untuk data fetching di server.
 *
 * Setiap helper return `null` untuk "tidak ditemukan" dan throw untuk
 * kondisi error yang genuinely error (bukan empty result).
 */

import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from './server';
import type {
  School,
  SchoolId,
  Student,
  Teacher,
  MasterViolation,
  ViolationLog,
  StaffAccount,
  StaffRole,
} from '@/types';

// ==============================================================================
// SESSION HELPERS
// ==============================================================================

export interface SessionUser {
  id: string;
  email: string;
  role: StaffRole;
  schoolId: SchoolId | null; // null = Super Admin (akses semua sekolah)
  schoolName: string | null;
  isSuperAdmin: boolean;
  permissions: {
    canEditStudents: boolean;
    canLogViolations: boolean;
    canEditMaster: boolean;
    canExportExcel: boolean;
  };
}

/**
 * Mengambil user yang sedang login dari session cookie.
 * Jika belum login, redirect ke /login.
 * Menggunakan React `cache()` agar tidak query berulang dalam 1 request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  // Ambil metadata dari JWT (raw_user_meta_data + app_metadata)
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;

  const schoolId = (meta.school_id ?? appMeta.school_id) as SchoolId | null | undefined;
  const role = (meta.role ?? appMeta.role) as StaffRole | undefined;

  // Jika tidak ada role di metadata, user belum di-provision ke staff_accounts
  // atau memang anonymous — treat sebagai not-logged-in
  if (!role) {
    return null;
  }

  const isSuperAdmin = role === 'Super Admin';

  return {
    id: user.id,
    email: user.email ?? '',
    role,
    schoolId: isSuperAdmin ? null : (schoolId ?? null),
    schoolName: (meta.school_name ?? appMeta.school_name) as string | null ?? null,
    isSuperAdmin,
    permissions: {
      canEditStudents: (appMeta.can_edit_students ?? meta.can_edit_students ?? true) as boolean,
      canLogViolations: (appMeta.can_log_violations ?? meta.can_log_violations ?? true) as boolean,
      canEditMaster: (appMeta.can_edit_master ?? meta.can_edit_master ?? true) as boolean,
      canExportExcel: (appMeta.can_export_excel ?? meta.can_export_excel ?? true) as boolean,
    },
  };
});

/**
 * Sama seperti getCurrentUser, tapi throw/redirect jika tidak ada session.
 * Pakai ini di Server Component yang pasti butuh auth.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

/**
 * Require user dengan role tertentu. Redirect ke /login jika belum auth,
 * ke /dashboard dengan error jika role tidak sesuai.
 */
export async function requireRole(...allowedRoles: StaffRole[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    redirect('/?error=forbidden');
  }
  return user;
}

// ==============================================================================
// SCHOOLS
// ==============================================================================

export const getSchools = cache(async (): Promise<School[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[DAL] getSchools error:', error);
    return [];
  }
  return (data ?? []) as School[];
});

// ==============================================================================
// STUDENTS
// ==============================================================================

/**
 * Fetch siswa untuk sekolah user saat ini.
 * RLS otomatis filter: jika user admin sekolah tertentu → hanya data sekolahnya.
 * Jika Super Admin → tanpa filter school_id (lihat implementasi di query).
 */
export async function getStudents(schoolId?: SchoolId): Promise<Student[]> {
  const supabase = await createClient();
  let query = supabase
    .from('students')
    .select('*')
    .order('name', { ascending: true });

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[DAL] getStudents error:', error);
    return [];
  }
  return (data ?? []) as Student[];
}

export async function getStudentById(id: string): Promise<Student | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[DAL] getStudentById error:', error);
    return null;
  }
  return (data ?? null) as Student | null;
}

// ==============================================================================
// TEACHERS
// ==============================================================================

export async function getTeachers(schoolId?: SchoolId): Promise<Teacher[]> {
  const supabase = await createClient();
  let query = supabase
    .from('teachers')
    .select('*')
    .order('name', { ascending: true });

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[DAL] getTeachers error:', error);
    return [];
  }
  return (data ?? []) as Teacher[];
}

// ==============================================================================
// MASTER VIOLATIONS
// ==============================================================================

export async function getMasterViolations(schoolId?: SchoolId): Promise<MasterViolation[]> {
  const supabase = await createClient();
  let query = supabase
    .from('master_violations')
    .select('*')
    .order('category', { ascending: true });

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[DAL] getMasterViolations error:', error);
    return [];
  }
  return (data ?? []) as MasterViolation[];
}

// ==============================================================================
// VIOLATION LOGS
// ==============================================================================

export async function getViolationLogs(
  schoolId?: SchoolId,
  limit?: number
): Promise<ViolationLog[]> {
  const supabase = await createClient();
  let query = supabase
    .from('violation_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }
  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[DAL] getViolationLogs error:', error);
    return [];
  }
  return (data ?? []) as ViolationLog[];
}

export async function getViolationLogsByStudent(studentId: string): Promise<ViolationLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('violation_logs')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[DAL] getViolationLogsByStudent error:', error);
    return [];
  }
  return (data ?? []) as ViolationLog[];
}

// ==============================================================================
// STAFF ACCOUNTS
// ==============================================================================

/**
 * Fetch daftar akun staff. Untuk Admin sekolah: hanya staff di sekolahnya.
 * Untuk Super Admin: SEMUA staff lintas sekolah.
 * Perhatikan: RLS sudah filter, jadi kita tidak perlu where clause eksplisit.
 * School_id parameter hanya untuk optimisasi query (RLS tetap berlaku).
 */
export async function getStaffAccounts(schoolId?: SchoolId): Promise<StaffAccount[]> {
  const supabase = await createClient();
  let query = supabase
    .from('staff_accounts')
    .select('*')
    .order('created_at', { ascending: false });

  // Hanya tambahkan filter jika schoolId diberikan.
  // Jika Super Admin tanpa schoolId → RLS akan izinkan semua data.
  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[DAL] getStaffAccounts error:', error);
    return [];
  }
  return (data ?? []) as StaffAccount[];
}
