'use client';

import React, { Suspense, useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Building2, Sparkles, AlertCircle } from 'lucide-react';
import { createInitialSuperAdmin, needsInitialSetup, signIn } from '@/lib/supabase/actions';

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] via-[#eff4ff] to-[#dce9ff]" />}
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';
  const urlError = searchParams.get('error');

  const [needsSetup, setNeedsSetup] = useState(false);
  const [isSetupChecked, setIsSetupChecked] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    urlError === 'forbidden' ? 'Anda tidak memiliki akses ke halaman tersebut.' : null
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    void needsInitialSetup()
      .then((setupRequired) => {
        if (active) setNeedsSetup(setupRequired);
      })
      .finally(() => {
        if (active) setIsSetupChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      if (needsSetup) {
        const result = await createInitialSuperAdmin({ name, email, password });
        if (!result.ok) {
          setError(result.error ?? 'Gagal membuat Super Admin pertama.');
          return;
        }
        
        // Auto sign-in setelah berhasil membuat Super Admin
        const signInResult = await signIn({ email, password, redirect: redirectTo });
        
        if (signInResult && !signInResult.ok && signInResult.error) {
          // Jika auto sign-in gagal karena suatu hal, kembalikan ke form login biasa
          setNeedsSetup(false);
          setPassword('');
          setError('Akun berhasil dibuat, namun gagal masuk otomatis: ' + signInResult.error);
        }
        return;
      }

      const result = await signIn({ email, password, redirect: redirectTo });
      if (result && !result.ok && result.error) {
        setError(result.error);
      }
      // Jika OK, signIn() akan redirect dari server
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9ff] via-[#eff4ff] to-[#dce9ff] font-['Work_Sans'] p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#005a71] to-[#0e7490] text-white shadow-lg shadow-[#005a71]/30 mb-4">
            <Sparkles className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="font-['Manrope'] font-bold text-2xl text-[#0b1c30]">BK Portal SD</h1>
          <p className="text-xs text-[#6f787d] mt-1 font-medium">Serene Counsel Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-[#bec8cd]/30 shadow-xl p-6 space-y-5">
          <div>
            <h2 className="font-['Manrope'] font-bold text-lg text-[#0b1c30]">
              {needsSetup ? 'Buat Super Admin Pertama' : 'Masuk ke Portal'}
            </h2>
            <p className="text-xs text-[#6f787d] mt-1">
              {needsSetup
                ? 'Buat akun pemilik pertama untuk mengaktifkan portal ini.'
                : 'Akses dibatasi untuk Guru BK, Wali Kelas, dan Admin sekolah.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-[#005a71] mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-[#005a71]">
                {needsSetup ? 'Setup aman satu kali' : 'Multi-Tenant dengan RLS'}
              </p>
              <p className="text-[#3f484c] mt-0.5">
                {needsSetup
                  ? 'Form ini otomatis ditutup setelah satu Super Admin berhasil dibuat.'
                  : 'Data Anda terisolasi otomatis per sekolah. Guru SD A tidak akan melihat data SD B.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {needsSetup && (
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-[#3f484c] mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Super Admin"
                  className="w-full px-3 py-2 border border-[#bec8cd] bg-white text-[#0b1c30] placeholder:text-[#8ea0a9] rounded-lg text-xs focus:outline-none focus:border-[#005a71] focus:ring-2 focus:ring-[#005a71]/20 transition-all"
                />
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#3f484c] mb-1"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sekolah.sch.id"
                className="w-full px-3 py-2 border border-[#bec8cd] bg-white text-[#0b1c30] placeholder:text-[#8ea0a9] rounded-lg text-xs focus:outline-none focus:border-[#005a71] focus:ring-2 focus:ring-[#005a71]/20 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#3f484c] mb-1"
              >
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={needsSetup ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={needsSetup ? 'Minimal 8 karakter' : '••••••••'}
                className="w-full px-3 py-2 border border-[#bec8cd] bg-white text-[#0b1c30] placeholder:text-[#8ea0a9] rounded-lg text-xs focus:outline-none focus:border-[#005a71] focus:ring-2 focus:ring-[#005a71]/20 transition-all"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#ba1a1a] mt-0.5 shrink-0" />
                <p className="text-xs text-[#93000a] font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 rounded-lg bg-[#005a71] hover:bg-[#0e7490] disabled:bg-[#6f787d] text-white font-semibold text-xs shadow-md shadow-[#005a71]/20 transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  {needsSetup ? 'Buat Super Admin' : 'Masuk'}
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-center text-[#6f787d]">
            {isSetupChecked && needsSetup ? (
              'Hanya akun pertama yang dapat dibuat dari halaman ini.'
            ) : (
              <>
                Tidak bisa masuk? Hubungi Admin sekolah Anda untuk dibuatkan akun.
                <br />
                Registrasi publik tidak tersedia demi keamanan data siswa.
              </>
            )}
          </p>
        </div>

        <p className="text-center text-[10px] text-[#6f787d] mt-6">
          © {new Date().getFullYear()} BK Portal SD — Multi-Tenant Counseling System
        </p>
      </div>
    </div>
  );
}
