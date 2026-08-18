export type SchoolId = string;

export interface School {
  id: SchoolId;
  name: string;
  code: string;
  npsn: string;
  address: string;
  accentColor: string;
}

export type SeverityLevel = 'Rendah' | 'Sedang' | 'Tinggi';

export interface MasterViolation {
  id: string;
  school_id: SchoolId;
  name: string;
  points: number;
  category: SeverityLevel;
  description?: string;
}

export interface Student {
  id: string;
  school_id: SchoolId;
  nis: string;
  name: string;
  class_name: string; // e.g. "1A", "4B", "6C"
  academic_year: string; // e.g. "2025/2026"
  total_points: number;
  tags: string[]; // JSONB custom tags e.g. ["rajin belajar", "aktif", "pendiam"]
  guardian_teacher_id?: string;
  guardian_teacher_name?: string;
  gender?: 'L' | 'P';
  parent_phone?: string;
}

export interface ViolationLog {
  id: string;
  school_id: SchoolId;
  student_id: string;
  student_name: string;
  student_nis: string;
  student_class: string;
  violation_id: string;
  violation_name: string;
  category: SeverityLevel;
  points_deducted: number;
  description: string;
  involved_students?: string[]; // Array of student names or IDs
  reporter_teacher_id: string;
  reporter_teacher_name: string;
  follow_up_description?: string; // Deskripsi Tindak Lanjut oleh Guru
  created_at: string; // ISO string date
}

export interface Teacher {
  id: string;
  school_id: SchoolId;
  nip?: string;
  name: string;
  phone: string;
  email: string;
  assigned_class?: string; // e.g. "4A"
  role: 'Guru BK' | 'Wali Kelas' | 'Guru Mapel' | 'Kepala Sekolah';
}

export type StaffRole = 'Super Admin' | 'Admin' | 'Guru BK' | 'Wali Kelas' | 'Staf Tata Usaha';

export interface StaffAccount {
  id: string;
  school_id: SchoolId | 'ALL';
  school_name?: string;
  name: string;
  email: string;
  role: StaffRole;
  status: 'Aktif' | 'Nonaktif';
  can_edit_students: boolean;
  can_log_violations: boolean;
  can_edit_master: boolean;
  can_export_excel: boolean;
  created_at: string;
  last_login?: string;
}

export interface ClassGroup {
  id: string;
  school_id: SchoolId;
  class_name: string;
  academic_year: string;
  guardian_teacher_id?: string;
  guardian_teacher_name?: string;
  student_count?: number;
}
