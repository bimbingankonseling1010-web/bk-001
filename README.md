# BK Portal SD

Portal Bimbingan dan Konseling multi-tenant untuk sekolah dasar, dibangun dengan
Next.js dan Supabase. Data setiap sekolah dilindungi oleh Supabase Row Level
Security (RLS).

## Menjalankan aplikasi

1. Instal dependensi dan salin konfigurasi lingkungan:

   ```bash
   npm install
   cp .env.local.example .env.local
   ```

2. Isi `.env.local` dari **Supabase Dashboard → Project Settings → API**:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-secret>
   ```

   `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan oleh Server Actions untuk membuat
   dan menghapus akun staf. Jangan beri awalan `NEXT_PUBLIC_`, jangan masukkan ke
   kode klien, dan jangan commit nilainya.

3. Di **Supabase Dashboard → SQL Editor**, jalankan seluruh isi
   [`supabase_schema.sql`](./supabase_schema.sql).

4. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

   Buka [http://localhost:3000](http://localhost:3000). Jika tabel
   `super_admins` masih kosong, halaman login otomatis menampilkan form
   **Buat Super Admin Pertama** untuk mengaktifkan portal.

## Membuat Super Admin pertama

Karena pendaftaran publik dinonaktifkan, hanya satu akun Super Admin yang dapat
dibuat. Jika tabel `super_admins` masih kosong, halaman `/login` menampilkan
form **Buat Super Admin Pertama**. Form ini menutup dirinya sendiri setelah satu
akun berhasil dibuat dan tidak akan muncul lagi. Setelah itu Super Admin atau
Admin sekolah membuat akun staf melalui halaman **Staf**.

Opsi fallback berikut dapat dipakai jika Anda lebih suka menyiapkan akun secara
manual di Supabase:

1. Di **Authentication → Users**, pilih **Add user → Create new user**. Masukkan
   email dan kata sandi yang kuat, lalu tandai email sebagai terkonfirmasi.
2. Salin UUID pengguna yang baru dibuat.
3. Di **SQL Editor**, jalankan perintah berikut. Ganti placeholder dengan UUID dan
   email pengguna tersebut:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
     || jsonb_build_object(
       'role', 'Super Admin',
       'can_edit_students', true,
       'can_log_violations', true,
       'can_edit_master', true,
       'can_export_excel', true
     )
   where id = '<USER_UUID>'::uuid;

   insert into public.super_admins (user_id, email)
   values ('<USER_UUID>'::uuid, '<admin@example.com>')
   on conflict (user_id) do update set email = excluded.email;
   ```

   Peran harus disimpan pada `raw_app_meta_data`, karena kebijakan RLS memeriksa
   klaim JWT `role` dari metadata tersebut. Tabel `super_admins` menyimpan catatan
   admin global, tetapi bukan pengganti klaim JWT.
4. Masuk dengan akun tersebut. Jika akun sudah pernah masuk sebelum metadata
   diperbarui, keluar lalu masuk kembali agar JWT baru memuat peran Super Admin.

Kedua cara tersebut memakai alur yang sama di sisi server dan keduanya aman.

## Verifikasi sebelum deploy

```bash
npm run build
```

Setelah build berhasil, uji login sebagai Super Admin, buat akun staf di halaman
**Staf**, lalu keluar dan pastikan halaman yang dilindungi mengarahkan kembali ke
`/login`.
