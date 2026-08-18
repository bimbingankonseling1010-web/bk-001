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

-- Tambahkan fallback juga ke get_my_school_id untuk menghindari kasus metadata kosong tapi butuh baca session (jika perlu)
-- Tapi get_my_school_id tidak memerlukan fallback database karena informasinya unik per user.
