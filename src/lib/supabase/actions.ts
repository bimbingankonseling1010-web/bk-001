'use server';

/**
 * Server Actions untuk authentication & manajemen akun.
 *
 * Prinsip:
 *  - Sign-in: pakai Supabase Auth dengan email/password
 *  - Sign-out: hapus session cookie
 *  - Create staff account: pakai SERVICE ROLE (bypass RLS), hanya boleh dipanggil
 *    dari Server Action yang sudah diverifikasi pemanggilnya adalah Admin
 *  - Tidak ada public signup — akun hanya bisa dibuat lewat createStaffAccount
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from './server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { requireRole, type SessionUser } from './dal';
import type { SchoolId, StaffRole } from '@/types';

// ==============================================================================
// SIGN IN / SIGN OUT
// ==============================================================================

export interface SignInResult {
  ok: boolean;
  error?: string;
}

export interface InitialSetupResult {
  ok: boolean;
  error?: string;
}

/** Only exposes whether this installation still needs its first administrator. */
export async function needsInitialSetup(): Promise<boolean> {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!serviceUrl || !serviceKey) return false;

  const admin = createServiceClient(serviceUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { count, error } = await admin
    .from('super_admins')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('[auth] Unable to check initial setup:', error.message);
    return false;
  }
  return count === 0;
}

/**
 * The sole public account creation path. It refuses all requests once the
 * canonical super_admins table contains its first record.
 */
export async function createInitialSuperAdmin(input: {
  name: string;
  email: string;
  password: string;
}): Promise<InitialSetupResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || name.length > 120) {
    return { ok: false, error: 'Nama wajib diisi dan maksimal 120 karakter.' };
  }
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Alamat email tidak valid.' };
  }
  if (input.password.length < 8) {
    return { ok: false, error: 'Kata sandi minimal 8 karakter.' };
  }

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!serviceUrl || !serviceKey) {
    return { ok: false, error: 'Konfigurasi server belum lengkap. SUPABASE_SERVICE_ROLE_KEY belum di-set.' };
  }

  const admin = createServiceClient(serviceUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { count, error: countError } = await admin
    .from('super_admins')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('[auth] Unable to verify initial setup:', countError.message);
    return { ok: false, error: 'Status setup tidak dapat diverifikasi. Coba lagi.' };
  }
  if ((count ?? 0) > 0) {
    return { ok: false, error: 'Super Admin sudah tersedia. Silakan masuk.' };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name, role: 'Super Admin' },
    app_metadata: {
      role: 'Super Admin',
      can_edit_students: true,
      can_log_violations: true,
      can_edit_master: true,
      can_export_excel: true,
    },
  });
  if (createError || !created.user) {
    return { ok: false, error: `Gagal membuat Super Admin: ${createError?.message ?? 'unknown error'}` };
  }

  const { error: recordError } = await admin.from('super_admins').insert({
    user_id: created.user.id,
    email,
  });
  if (recordError) {
    // Another simultaneous setup may have won the unique insert. Clean up only
    // the user created by this request so no extra public account remains.
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, error: 'Setup sudah diselesaikan oleh permintaan lain. Silakan masuk.' };
  }

  revalidatePath('/login');
  return { ok: true };
}

export async function signIn(input: { email: string; password: string; redirect?: string }): Promise<SignInResult> {
  const email = (input.email ?? '').trim().toLowerCase();
  const password = input.password ?? '';
  const redirectTo = input.redirect || '/';

  if (!email || !password) {
    return { ok: false, error: 'Email dan kata sandi wajib diisi.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      ok: false,
      error: 'Email atau kata sandi salah, atau akun belum diaktifkan.',
    };
  }

  // Update last_login di staff_accounts (best-effort, abaikan error)
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('staff_accounts')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);
    }
  } catch {
    // ignore — bukan fatal
  }

  // Redirect setelah signIn berhasil
  redirect(redirectTo || '/');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// ==============================================================================
// ADMIN: CREATE STAFF ACCOUNT (No Public Signup)
// ==============================================================================

export interface CreateStaffInput {
  email: string;
  password: string;
  name: string;
  role: StaffRole;
  schoolId: SchoolId;
  canEditStudents?: boolean;
  canLogViolations?: boolean;
  canEditMaster?: boolean;
  canExportExcel?: boolean;
}

export interface CreateStaffResult {
  ok: boolean;
  error?: string;
  userId?: string;
}

/**
 * Buat akun guru/staf baru. HANYA boleh dipanggil oleh Admin / Super Admin.
 *
 * Flow:
 *  1. Verifikasi caller adalah Admin via requireRole()
 *  2. Pakai SERVICE ROLE client (server-only) untuk membuat auth.users
 *     → RLS di-bypass karena pakai service_role
 *  3. Insert row ke staff_accounts dengan raw_user_meta_data (school_id, role)
 *     agar RLS policies bisa baca via auth.jwt()
 *  4. Cek apakah sekolah valid
 */
export async function createStaffAccount(input: CreateStaffInput): Promise<CreateStaffResult> {
  // Guard: hanya Admin / Super Admin yang boleh buat akun
  const caller: SessionUser = await requireRole('Super Admin', 'Admin');

  // Validasi sekolah
  if (!input.schoolId) {
    return { ok: false, error: 'Sekolah wajib dipilih.' };
  }

  // Super Admin boleh assign ke sekolah mana saja; Admin biasa hanya boleh
  // assign ke sekolahnya sendiri
  if (!caller.isSuperAdmin && input.schoolId !== caller.schoolId) {
    return {
      ok: false,
      error: 'Anda tidak berhak membuat akun untuk sekolah lain.',
    };
  }

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!serviceUrl || !serviceKey) {
    return {
      ok: false,
      error:
        'Konfigurasi server belum lengkap: SUPABASE_SERVICE_ROLE_KEY belum di-set. Hubungi administrator.',
    };
  }

  // Service role client — bypass RLS. JANGAN expose ke client.
  const admin = createServiceClient(serviceUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Ambil nama sekolah secara dinamis dari database
  const { data: schoolData, error: schoolErr } = await admin
    .from('schools')
    .select('name')
    .eq('id', input.schoolId)
    .single();
    
  if (schoolErr || !schoolData) {
    return { ok: false, error: 'Instansi tidak valid atau tidak ditemukan.' };
  }
  
  const schoolName = schoolData.name;

  // 1. Buat auth user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true, // auto-confirm; admin manual yang aktifkan
    user_metadata: {
      name: input.name,
      role: input.role,
      school_id: input.schoolId,
      school_name: schoolName,
    },
    app_metadata: {
      role: input.role,
      school_id: input.schoolId,
      can_edit_students: input.canEditStudents ?? true,
      can_log_violations: input.canLogViolations ?? true,
      can_edit_master: input.canEditMaster ?? true,
      can_export_excel: input.canExportExcel ?? true,
    },
  });

  if (createErr || !created?.user) {
    return {
      ok: false,
      error: `Gagal membuat akun: ${createErr?.message ?? 'unknown error'}`,
    };
  }

  // 2. Insert ke staff_accounts (RLS akan cek bahwa caller admin via service-role)
  const { error: staffErr } = await admin.from('staff_accounts').insert({
    id: created.user.id,
    school_id: input.schoolId,
    school_name: schoolName,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: 'Aktif',
    can_edit_students: input.canEditStudents ?? true,
    can_log_violations: input.canLogViolations ?? true,
    can_edit_master: input.canEditMaster ?? true,
    can_export_excel: input.canExportExcel ?? true,
  });

  if (staffErr) {
    // Rollback: hapus auth user jika staff_accounts gagal
    await admin.auth.admin.deleteUser(created.user.id);
    return {
      ok: false,
      error: `Gagal mendaftarkan profil staf: ${staffErr.message}`,
    };
  }

  revalidatePath('/staf');
  return { ok: true, userId: created.user.id };
}

// ==============================================================================
// ADMIN: UPDATE / DELETE STAFF
// ==============================================================================

export async function updateStaffAccount(
  userId: string,
  updates: {
    name?: string;
    role?: StaffRole;
    status?: 'Aktif' | 'Nonaktif';
    canEditStudents?: boolean;
    canLogViolations?: boolean;
    canEditMaster?: boolean;
    canExportExcel?: boolean;
  }
): Promise<{ ok: boolean; error?: string }> {
  const caller = await requireRole('Super Admin', 'Admin');
  const supabase = await createClient();

  // Verify target belongs to caller's school (unless Super Admin)
  if (!caller.isSuperAdmin) {
    const { data: target } = await supabase
      .from('staff_accounts')
      .select('school_id')
      .eq('id', userId)
      .maybeSingle();

    if (!target || target.school_id !== caller.schoolId) {
      return { ok: false, error: 'Akun tidak ditemukan di sekolah Anda.' };
    }
  }

  const { error } = await supabase
    .from('staff_accounts')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.role !== undefined && { role: updates.role }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.canEditStudents !== undefined && { can_edit_students: updates.canEditStudents }),
      ...(updates.canLogViolations !== undefined && { can_log_violations: updates.canLogViolations }),
      ...(updates.canEditMaster !== undefined && { can_edit_master: updates.canEditMaster }),
      ...(updates.canExportExcel !== undefined && { can_export_excel: updates.canExportExcel }),
    })
    .eq('id', userId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/staf');
  return { ok: true };
}

export async function deleteStaffAccount(userId: string): Promise<{ ok: boolean; error?: string }> {
  const caller = await requireRole('Super Admin', 'Admin');

  if (caller.id === userId) {
    return { ok: false, error: 'Anda tidak dapat menghapus akun sendiri.' };
  }

  const supabase = await createClient();

  // Verify target
  if (!caller.isSuperAdmin) {
    const { data: target } = await supabase
      .from('staff_accounts')
      .select('school_id')
      .eq('id', userId)
      .maybeSingle();

    if (!target || target.school_id !== caller.schoolId) {
      return { ok: false, error: 'Akun tidak ditemukan di sekolah Anda.' };
    }
  }

  // Pakai service role untuk hapus auth user (cascade ke staff_accounts)
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const admin = createServiceClient(serviceUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath('/staf');
  return { ok: true };
}
