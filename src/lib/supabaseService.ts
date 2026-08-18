import { createClient } from './supabase/client';
import { Student, Teacher, MasterViolation, ViolationLog, StaffAccount, SchoolId } from '@/types';
import { INITIAL_SCHOOLS, INITIAL_TEACHERS, INITIAL_MASTERS } from './mockData';

const supabase = createClient();

// AUTO SEEDING HELPERS DIHAPUS - Data dikelola sepenuhnya lewat Dashboard & Supabase
// ==============================================================================

// ==============================================================================
// SCHOOLS SERVICE
// ==============================================================================
export async function fetchSchoolsFromSupabase(): Promise<any[]> {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
  // Map snake_case to camelCase
  return (data || []).map(s => ({
    id: s.id,
    name: s.name,
    code: s.code,
    npsn: s.npsn,
    address: s.address,
    accentColor: s.accent_color
  }));
}

export async function insertSchoolToSupabase(school: { id: string; name: string; code: string; npsn: string; address: string; accentColor: string; }): Promise<any | null> {
  const { data, error } = await supabase
    .from('schools')
    .insert([{
      id: school.id,
      name: school.name,
      code: school.code,
      npsn: school.npsn,
      address: school.address,
      accent_color: school.accentColor
    }])
    .select()
    .single();

  if (error) {
    console.error('Error inserting school to Supabase:', error);
    alert(`Gagal menyimpan instansi ke Supabase (${error.code}): ${error.message}`);
    return null;
  }
  return {
    id: data.id,
    name: data.name,
    code: data.code,
    npsn: data.npsn,
    address: data.address,
    accentColor: data.accent_color
  };
}

export async function updateSchoolInSupabase(id: string, updated: Partial<{ name: string; code: string; npsn: string; address: string; accentColor: string; }>): Promise<boolean> {
  const payload: any = {};
  if (updated.name !== undefined) payload.name = updated.name;
  if (updated.code !== undefined) payload.code = updated.code;
  if (updated.npsn !== undefined) payload.npsn = updated.npsn;
  if (updated.address !== undefined) payload.address = updated.address;
  if (updated.accentColor !== undefined) payload.accent_color = updated.accentColor;

  const { error } = await supabase
    .from('schools')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('Error updating school:', error);
    alert(`Gagal memperbarui instansi (${error.code}): ${error.message}`);
    return false;
  }
  return true;
}

export async function deleteSchoolFromSupabase(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('schools')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting school:', error);
    alert(`Gagal menghapus instansi (${error.code}): ${error.message}`);
    return false;
  }
  return true;
}

// ==============================================================================
// STUDENTS SERVICE
// ==============================================================================
export async function fetchStudentsFromSupabase(schoolId: SchoolId): Promise<Student[]> {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  return data || [];
}

export async function insertStudentToSupabase(student: Omit<Student, 'id' | 'total_points'>): Promise<Student | null> {
  const payload: any = {
    school_id: student.school_id,
    nis: student.nis,
    name: student.name,
    class_name: student.class_name,
    academic_year: student.academic_year || '2025/2026',
    total_points: 0,
    tags: student.tags || [],
    gender: student.gender || 'L',
    parent_phone: student.parent_phone || null,
    guardian_teacher_id: student.guardian_teacher_id && student.guardian_teacher_id.startsWith('t-') ? student.guardian_teacher_id : null,
    guardian_teacher_name: student.guardian_teacher_name || null
  };

  let { data, error } = await supabase
    .from('students')
    .insert([payload])
    .select()
    .single();

  // Retry Fallback jika Foreign Key Guru gagal
  if (error && error.code === '23503' && payload.guardian_teacher_id) {
    payload.guardian_teacher_id = null;
    const retry = await supabase.from('students').insert([payload]).select().single();
    if (!retry.error) {
      data = retry.data;
      error = null;
    }
  }

  if (error) {
    console.error('Error inserting student to Supabase:', error);
    alert(`Gagal menyimpan ke Supabase (${error.code}): ${error.message}`);
    return null;
  }
  return data;
}

export async function updateStudentInSupabase(id: string, updated: Partial<Student>): Promise<boolean> {
  const { error } = await supabase
    .from('students')
    .update(updated)
    .eq('id', id);

  if (error) {
    console.error('Error updating student:', error);
    return false;
  }
  return true;
}

export async function deleteStudentFromSupabase(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting student:', error);
    return false;
  }
  return true;
}

// ==============================================================================
// VIOLATION LOGS SERVICE
// ==============================================================================
export async function fetchLogsFromSupabase(schoolId: SchoolId): Promise<ViolationLog[]> {
  const { data, error } = await supabase
    .from('violation_logs')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching logs:', error);
    return [];
  }
  return data || [];
}

export async function insertLogToSupabase(log: Omit<ViolationLog, 'id' | 'created_at'>): Promise<ViolationLog | null> {
  const payload: any = {
    school_id: log.school_id,
    student_id: log.student_id,
    student_name: log.student_name,
    student_nis: log.student_nis,
    student_class: log.student_class,
    violation_id: log.violation_id,
    violation_name: log.violation_name,
    category: log.category,
    points_deducted: log.points_deducted,
    description: log.description,
    involved_students: log.involved_students || [],
    reporter_teacher_id: log.reporter_teacher_id && log.reporter_teacher_id.startsWith('t-') ? log.reporter_teacher_id : null,
    reporter_teacher_name: log.reporter_teacher_name || null,
    follow_up_description: log.follow_up_description || null
  };

  const { data, error } = await supabase
    .from('violation_logs')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error inserting violation log to Supabase:', error);
    alert(`Gagal menyimpan insiden ke Supabase (${error.code}): ${error.message}`);
    return null;
  }
  return data;
}

// ==============================================================================
// TEACHERS SERVICE
// ==============================================================================
export async function fetchTeachersFromSupabase(schoolId: SchoolId): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
  return data || [];
}

// ==============================================================================
// MASTER VIOLATIONS SERVICE
// ==============================================================================
export async function fetchMasterViolationsFromSupabase(schoolId: SchoolId): Promise<MasterViolation[]> {
  const { data, error } = await supabase
    .from('master_violations')
    .select('*')
    .eq('school_id', schoolId)
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching master violations:', error);
    return [];
  }
  return data || [];
}

// ==============================================================================
// STAFF ACCOUNTS SERVICE
// ==============================================================================
/**
 * Fetch akun staff.
 *
 * Penting:
 *  - Pemanggil (browser client) di sini SUDAH terikat session user via anon key,
 *    sehingga RLS di Supabase akan otomatis memfilter.
 *  - Untuk Admin sekolah biasa: RLS akan filter hanya staff di school_id miliknya.
 *  - Untuk Super Admin: RLS izinkan membaca semua (lihat policy staff_accounts_read_school).
 *
 * Parameter `schoolId` hanya untuk optimisasi query (eksplisit WHERE) — TETAPI
 * JANGAN gunakan ini untuk bypass RLS. RLS adalah sumber otoritas.
 */
export async function fetchStaffAccountsFromSupabase(schoolId?: SchoolId): Promise<StaffAccount[]> {
  let query = supabase
    .from('staff_accounts')
    .select('*')
    .order('created_at', { ascending: false });

  if (schoolId) {
    query = query.eq('school_id', schoolId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching staff accounts:', error);
    return [];
  }
  return data || [];
}
