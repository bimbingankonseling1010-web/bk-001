-- ==============================================================================
-- DATABASE SCHEMA: SISTEM BIMBINGAN KONSELING (BK) SD MULTI-TENANT & RLS
-- Versi: 2.0 — Hardened RLS dengan JWT-based school_id filtering
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CUSTOM TYPES
DO $$ BEGIN
    CREATE TYPE school_role AS ENUM ('Super Admin', 'Admin', 'Guru BK', 'Wali Kelas', 'Staf Tata Usaha');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM ('Rendah', 'Sedang', 'Tinggi');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE staff_status AS ENUM ('Aktif', 'Nonaktif');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. HELPER FUNCTIONS untuk RLS (Security Definer agar tidak recursive)
-- ==============================================================================

-- Mengambil school_id user dari JWT claims
-- Pattern: raw_user_meta_data ->> 'school_id'
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (auth.jwt() ->> 'school_id')::text,
        (auth.jwt() -> 'user_metadata' ->> 'school_id')::text,
        NULL
    );
$$;

-- Cek apakah user adalah Super Admin (akses semua sekolah)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (auth.jwt() -> 'app_metadata' ->> 'role')::text = 'Super Admin',
        (auth.jwt() ->> 'role')::text = 'Super Admin',
        (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Super Admin',
        FALSE
    ) OR EXISTS (
        SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
    );
$$;

-- Cek apakah user adalah Admin sekolah tertentu
CREATE OR REPLACE FUNCTION public.is_school_admin(p_school_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        public.is_super_admin()
        OR COALESCE(
            (auth.jwt() ->> 'role')::text = 'Admin',
            (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'Admin',
            FALSE
          )
        AND (p_school_id IS NULL OR p_school_id = public.get_my_school_id());
$$;

-- Cek permission spesifik dari JWT
CREATE OR REPLACE FUNCTION public.has_permission(perm TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (auth.jwt() -> 'app_metadata' ->> perm)::boolean,
        (auth.jwt() ->> perm)::boolean, -- fallback: claim langsung di root
        FALSE
    );
$$;

-- 4. SCHOOLS TABLE (INSTANSI MULTI-TENANT)
CREATE TABLE IF NOT EXISTS public.schools (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    npsn TEXT,
    address TEXT,
    accent_color TEXT DEFAULT '#005a71',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Schools
INSERT INTO public.schools (id, name, code, npsn, address, accent_color)
VALUES
    ('sd-01', 'SD Negeri 01 Harapan', 'SDN01', '20101234', 'Jl. Merdeka No. 45, Jakarta Pusat', '#005a71'),
    ('sd-02', 'SD Islam Al-Azhar 15', 'ALAZHAR15', '20109876', 'Jl. Kebayoran Baru No. 12, Jakarta Selatan', '#006b5f')
ON CONFLICT (id) DO NOTHING;

-- 5. STAFF ACCOUNTS TABLE — dipindah ke atas karena teachers.reference via id FK
-- Kolom id = auth.users.id (1-to-1)
CREATE TABLE IF NOT EXISTS public.staff_accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    school_name TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role school_role NOT NULL DEFAULT 'Wali Kelas',
    status staff_status NOT NULL DEFAULT 'Aktif',
    can_edit_students BOOLEAN DEFAULT TRUE,
    can_log_violations BOOLEAN DEFAULT TRUE,
    can_edit_master BOOLEAN DEFAULT TRUE,
    can_export_excel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Super Admin (akses semua sekolah) — disimpan terpisah agar RLS bisa branching
CREATE TABLE IF NOT EXISTS public.super_admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEACHERS TABLE (DATA GURU & WALI KELAS)
CREATE TABLE IF NOT EXISTS public.teachers (
    id TEXT PRIMARY KEY DEFAULT ('t-' || gen_random_uuid()),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    assigned_class TEXT,
    role TEXT NOT NULL DEFAULT 'Wali Kelas',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STUDENTS TABLE (DATA SISWA)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY DEFAULT ('s-' || gen_random_uuid()),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    nis TEXT NOT NULL,
    name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    academic_year TEXT NOT NULL DEFAULT '2025/2026',
    total_points INT NOT NULL DEFAULT 0,
    tags JSONB DEFAULT '[]'::jsonb,
    guardian_teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    guardian_teacher_name TEXT,
    gender TEXT CHECK (gender IN ('L', 'P')),
    parent_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, nis)
);

-- 8. MASTER VIOLATIONS TABLE (KATALOG PELANGGARAN)
CREATE TABLE IF NOT EXISTS public.master_violations (
    id TEXT PRIMARY KEY DEFAULT ('mv-' || gen_random_uuid()),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    points INT NOT NULL DEFAULT 5,
    category severity_level NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. VIOLATION LOGS TABLE (CATATAN INSIDEN PELANGGARAN)
CREATE TABLE IF NOT EXISTS public.violation_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || gen_random_uuid()),
    school_id TEXT NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_nis TEXT NOT NULL,
    student_class TEXT NOT NULL,
    violation_id TEXT NOT NULL REFERENCES public.master_violations(id) ON DELETE RESTRICT,
    violation_name TEXT NOT NULL,
    category severity_level NOT NULL,
    points_deducted INT NOT NULL DEFAULT 0,
    description TEXT NOT NULL,
    involved_students JSONB DEFAULT '[]'::jsonb,
    reporter_teacher_id TEXT REFERENCES public.teachers(id) ON DELETE SET NULL,
    reporter_teacher_name TEXT,
    follow_up_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- AUTOMATIC TRIGGER: RECALCULATE STUDENT TOTAL POINTS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.recalculate_student_points()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.students
        SET total_points = total_points + NEW.points_deducted
        WHERE id = NEW.student_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.students
        SET total_points = GREATEST(0, total_points - OLD.points_deducted)
        WHERE id = OLD.student_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalculate_student_points ON public.violation_logs;
CREATE TRIGGER trigger_recalculate_student_points
AFTER INSERT OR DELETE ON public.violation_logs
FOR EACH ROW EXECUTE FUNCTION public.recalculate_student_points();

-- ==============================================================================
-- ENABLE RLS pada semua tabel
-- ==============================================================================
ALTER TABLE public.schools          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_logs   ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES
-- Aturan:
--  - Super Admin: akses penuh ke semua sekolah
--  - Admin sekolah: akses penuh ke school_id miliknya
--  - Guru BK / Wali Kelas / Staf: akses sesuai school_id, tetapi CRUD terbatas
--  - Public (anon): hanya baca schools (untuk halaman login pilih sekolah jika perlu)
-- ==============================================================================

-- Hapus policies lama jika ada (idempotent migration)
DROP POLICY IF EXISTS "schools_read_all"            ON public.schools;
DROP POLICY IF EXISTS "staff_accounts_read_own"     ON public.staff_accounts;
DROP POLICY IF EXISTS "staff_accounts_read_school"  ON public.staff_accounts;
DROP POLICY IF EXISTS "staff_accounts_admin_write"  ON public.staff_accounts;
DROP POLICY IF EXISTS "staff_accounts_super_all"    ON public.staff_accounts;
DROP POLICY IF EXISTS "super_admins_self_read"      ON public.super_admins;
DROP POLICY IF EXISTS "teachers_read_school"        ON public.teachers;
DROP POLICY IF EXISTS "teachers_admin_write"        ON public.teachers;
DROP POLICY IF EXISTS "students_read_school"        ON public.students;
DROP POLICY IF EXISTS "students_admin_write"        ON public.students;
DROP POLICY IF EXISTS "master_violations_read_school" ON public.master_violations;
DROP POLICY IF EXISTS "master_violations_admin_write" ON public.master_violations;
DROP POLICY IF EXISTS "violation_logs_read_school"  ON public.violation_logs;
DROP POLICY IF EXISTS "violation_logs_write_school" ON public.violation_logs;
DROP POLICY IF EXISTS "violation_logs_admin_delete" ON public.violation_logs;

-- ============ SCHOOLS ============
-- Semua authenticated user boleh membaca daftar sekolah (untuk UI)
CREATE POLICY "schools_read_all"
    ON public.schools FOR SELECT
    TO authenticated
    USING (TRUE);

-- Hanya Super Admin yang boleh insert/update sekolah
CREATE POLICY "schools_super_admin_write"
    ON public.schools FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- ============ SUPER ADMINS ============
-- User hanya bisa lihat record miliknya sendiri
CREATE POLICY "super_admins_self_read"
    ON public.super_admins FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ============ STAFF ACCOUNTS ============
-- Guru BK / Wali Kelas / Staf boleh membaca data staff di sekolahnya sendiri
-- Super Admin boleh membaca semua staff
CREATE POLICY "staff_accounts_read_school"
    ON public.staff_accounts FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR school_id = public.get_my_school_id()
        OR auth.uid() = id  -- boleh lihat profil sendiri
    );

-- Hanya Admin sekolah / Super Admin yang boleh membuat akun baru (No Public Signup)
CREATE POLICY "staff_accounts_admin_write"
    ON public.staff_accounts FOR INSERT
    TO authenticated
    WITH CHECK (public.is_school_admin(school_id));

-- Hanya Admin sekolah / Super Admin yang boleh update akun
CREATE POLICY "staff_accounts_admin_update"
    ON public.staff_accounts FOR UPDATE
    TO authenticated
    USING (public.is_school_admin(school_id) OR auth.uid() = id)
    WITH CHECK (public.is_school_admin(school_id) OR auth.uid() = id);

-- Hanya Admin sekolah / Super Admin yang boleh delete akun
CREATE POLICY "staff_accounts_admin_delete"
    ON public.staff_accounts FOR DELETE
    TO authenticated
    USING (public.is_school_admin(school_id) AND auth.uid() <> id);

-- ============ TEACHERS ============
CREATE POLICY "teachers_read_school"
    ON public.teachers FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR school_id = public.get_my_school_id()
    );

CREATE POLICY "teachers_admin_write"
    ON public.teachers FOR ALL
    TO authenticated
    USING (
        public.is_school_admin(school_id)
        OR (
            public.has_permission('can_edit_students')
            AND school_id = public.get_my_school_id()
        )
    )
    WITH CHECK (
        public.is_school_admin(school_id)
        OR (
            public.has_permission('can_edit_students')
            AND school_id = public.get_my_school_id()
        )
    );

-- ============ STUDENTS ============
CREATE POLICY "students_read_school"
    ON public.students FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR school_id = public.get_my_school_id()
    );

CREATE POLICY "students_admin_write"
    ON public.students FOR ALL
    TO authenticated
    USING (
        public.is_school_admin(school_id)
        OR (
            public.has_permission('can_edit_students')
            AND school_id = public.get_my_school_id()
        )
    )
    WITH CHECK (
        public.is_school_admin(school_id)
        OR (
            public.has_permission('can_edit_students')
            AND school_id = public.get_my_school_id()
        )
    );

-- ============ MASTER VIOLATIONS ============
CREATE POLICY "master_violations_read_school"
    ON public.master_violations FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR school_id = public.get_my_school_id()
    );

CREATE POLICY "master_violations_admin_write"
    ON public.master_violations FOR ALL
    TO authenticated
    USING (
        public.is_school_admin(school_id)
        OR (
            public.has_permission('can_edit_master')
            AND school_id = public.get_my_school_id()
        )
    )
    WITH CHECK (
        public.is_school_admin(school_id)
        OR (
            public.has_permission('can_edit_master')
            AND school_id = public.get_my_school_id()
        )
    );

-- ============ VIOLATION LOGS ============
CREATE POLICY "violation_logs_read_school"
    ON public.violation_logs FOR SELECT
    TO authenticated
    USING (
        public.is_super_admin()
        OR school_id = public.get_my_school_id()
    );

CREATE POLICY "violation_logs_write_school"
    ON public.violation_logs FOR INSERT
    TO authenticated
    WITH CHECK (
        public.is_school_admin(school_id)
        OR (
            public.has_permission('can_log_violations')
            AND school_id = public.get_my_school_id()
        )
    );

CREATE POLICY "violation_logs_admin_delete"
    ON public.violation_logs FOR DELETE
    TO authenticated
    USING (
        public.is_school_admin(school_id)
        OR (
            public.has_permission('can_log_violations')
            AND school_id = public.get_my_school_id()
        )
    );

-- ==============================================================================
-- TRIGGER: AUTO-CREATE STAFF RECORD SAAT AUTH USER DIBUAT OLEH ADMIN
-- Dipanggil dari Server Action createStaffAccount via service-role client
-- (Admin SDK), jadi RLS bypass aman di sini
-- ==============================================================================

-- Fungsi helper: cek apakah sekolah valid
CREATE OR REPLACE FUNCTION public.is_valid_school(p_school_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT EXISTS (SELECT 1 FROM public.schools WHERE id = p_school_id);
$$;

-- ==============================================================================
-- BOOTSTRAP SUPER ADMIN (jalankan manual setelah membuat user di Supabase Auth)
-- Buat user melalui Supabase Dashboard > Authentication > Users, lalu jalankan:
--
--   UPDATE auth.users
--   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
--     || jsonb_build_object(
--       'role', 'Super Admin',
--       'can_edit_students', true,
--       'can_log_violations', true,
--       'can_edit_master', true,
--       'can_export_excel', true
--     )
--   WHERE id = '<USER_UUID>'::uuid;
--
--   INSERT INTO public.super_admins (user_id, email)
--   VALUES ('<USER_UUID>'::uuid, '<admin@example.com>')
--   ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;
--
-- Role harus berada di raw_app_meta_data karena is_super_admin() membaca
-- JWT claims. User perlu keluar lalu masuk kembali agar token memuat metadata baru.
-- ==============================================================================

-- ==============================================================================
-- CATATAN MIGRASI dari v1:
-- 1. Kolom staff_accounts.id sekarang UUID FK ke auth.users.id (sebelumnya TEXT)
-- 2. Kolom staff_accounts.school_id sekarang CHECK constraint (sebelumnya 'ALL')
--    Untuk Super Admin global, gunakan tabel super_admins terpisah
-- 3. ENUM school_role, severity_level, staff_status menggantikan TEXT CHECK
-- 4. Semua policy lama 'Allow public all access' sudah dihapus total
-- 5. Anon role TIDAK punya akses baca ke tabel apapun kecuali via service-role
-- ==============================================================================
