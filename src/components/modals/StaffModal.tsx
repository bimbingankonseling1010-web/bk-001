'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { X, ShieldCheck, Check, KeyRound, Building2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { StaffAccount, StaffRole, SchoolId } from '@/types';
import {
  createStaffAccount,
  updateStaffAccount,
  deleteStaffAccount,
} from '@/lib/supabase/actions';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit?: StaffAccount | null;
}

export const StaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, staffToEdit }) => {
  const { schools, currentSchool, showToast, refresh } = useApp();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Untuk Admin biasa, schoolId default & terkunci ke sekolahnya.
  // Untuk Super Admin, boleh pilih sekolah mana saja (tidak ada 'ALL' di DB,
  // jadi Super Admin yang ingin akses global masuk ke tabel super_admins).
  const isAdmin = user?.role === 'Admin' && !user?.isSuperAdmin;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolId, setSchoolId] = useState<SchoolId>(
    (user?.schoolId ?? currentSchool.id) as SchoolId
  );
  const [role, setRole] = useState<StaffRole>('Guru BK');
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');

  // Checkboxes
  const [canEditStudents, setCanEditStudents] = useState(true);
  const [canLogViolations, setCanLogViolations] = useState(true);
  const [canEditMaster, setCanEditMaster] = useState(true);
  const [canExportExcel, setCanExportExcel] = useState(true);

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name);
      setEmail(staffToEdit.email);
      setPassword('********');
      setSchoolId(staffToEdit.school_id as SchoolId);
      setRole(staffToEdit.role);
      setStatus(staffToEdit.status);
      setCanEditStudents(staffToEdit.can_edit_students);
      setCanLogViolations(staffToEdit.can_log_violations);
      setCanEditMaster(staffToEdit.can_edit_master);
      setCanExportExcel(staffToEdit.can_export_excel);
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setSchoolId((user?.schoolId ?? currentSchool.id) as SchoolId);
      setRole('Guru BK');
      setStatus('Aktif');
      setCanEditStudents(true);
      setCanLogViolations(true);
      setCanEditMaster(true);
      setCanExportExcel(true);
    }
    setError(null);
  }, [staffToEdit, isOpen, user, currentSchool]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Nama dan Email wajib diisi.');
      return;
    }

    if (!staffToEdit && password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    startTransition(async () => {
      try {
        if (staffToEdit) {
          const res = await updateStaffAccount(staffToEdit.id, {
            name,
            role,
            status,
            canEditStudents,
            canLogViolations,
            canEditMaster,
            canExportExcel,
          });
          if (!res.ok) {
            setError(res.error ?? 'Gagal memperbarui akun.');
            return;
          }
          showToast(`Akun ${name} berhasil diperbarui.`);
        } else {
          const res = await createStaffAccount({
            email,
            password,
            name,
            role,
            schoolId,
            canEditStudents,
            canLogViolations,
            canEditMaster,
            canExportExcel,
          });
          if (!res.ok) {
            setError(res.error ?? 'Gagal membuat akun.');
            return;
          }
          showToast(`Akun ${name} (${role}) berhasil dibuat di ${currentSchool.name}.`);
        }
        await refresh();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan tak terduga.');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/40 backdrop-blur-xs animate-in fade-in font-['Work_Sans']">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#bec8cd]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#005a71] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#62fae3]" />
            </div>
            <div>
              <h3 className="font-['Manrope'] font-bold text-base">
                {staffToEdit ? 'Edit Akun Admin / Staf' : 'Buat Akun Admin Sekolah Baru'}
              </h3>
              <p className="text-xs text-cyan-100">Panel Super Admin RBAC & Supabase Auth</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-cyan-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-[#0b1c30]">
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Nama Lengkap Admin / Staf <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: Drs. Maryadi, M.Pd"
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-2 focus:ring-[#005a71]/20 text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">
                Email Login (Supabase Auth) <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sekolah.sch.id"
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">
                Password Awal {!staffToEdit && <span className="text-[#ba1a1a]">*</span>}
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 Karakter"
                  className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                  required={!staffToEdit}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">
                Instansi Sekolah Ditetapkan <span className="text-[#ba1a1a]">*</span>
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value as SchoolId)}
                disabled={isAdmin}
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white disabled:bg-[#f8f9ff] disabled:cursor-not-allowed text-[#0b1c30] placeholder:text-[#8ea0a9]"
              >
                {schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    🏫 {sch.name} ({sch.code})
                  </option>
                ))}
              </select>
              {isAdmin && (
                <p className="text-[10px] text-[#6f787d] mt-1">
                  Akun baru otomatis terikat ke sekolah Anda.
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">Peran (Role RBAC)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                disabled={isAdmin}
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white disabled:bg-[#f8f9ff] disabled:cursor-not-allowed text-[#0b1c30] placeholder:text-[#8ea0a9]"
              >
                {!isAdmin && <option value="Super Admin">Super Admin</option>}
                {!isAdmin && <option value="Admin">Admin</option>}
                <option value="Guru BK">Guru BK</option>
                <option value="Wali Kelas">Wali Kelas</option>
                <option value="Staf Tata Usaha">Staf Tata Usaha</option>
              </select>
              {isAdmin && (
                <p className="text-[10px] text-[#6f787d] mt-1">
                  Admin biasa hanya dapat membuat akun guru/staf.
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#ba1a1a] mt-0.5 shrink-0" />
              <p className="text-xs text-[#93000a] font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">Status Akun</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Aktif' | 'Nonaktif')}
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
            >
              <option value="Aktif">🟢 Aktif (Bisa Login & Edit)</option>
              <option value="Nonaktif">🔴 Nonaktif (Login Diblokir)</option>
            </select>
          </div>

          {/* Otorisasi Edit Checkboxes */}
          <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#dce9ff] space-y-2">
            <span className="font-bold text-[#005a71] block">
              Hak Otorisasi Edit WebApp (Permissions):
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canEditStudents}
                  onChange={(e) => setCanEditStudents(e.target.checked)}
                  className="rounded border-[#bec8cd] text-[#005a71] focus:ring-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                />
                <span>Edit & Kelola Data Siswa</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canLogViolations}
                  onChange={(e) => setCanLogViolations(e.target.checked)}
                  className="rounded border-[#bec8cd] text-[#005a71] focus:ring-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                />
                <span>Catat Pelanggaran (Pop-out Modal)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canEditMaster}
                  onChange={(e) => setCanEditMaster(e.target.checked)}
                  className="rounded border-[#bec8cd] text-[#005a71] focus:ring-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                />
                <span>Kelola Master Catalog</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={canExportExcel}
                  onChange={(e) => setCanExportExcel(e.target.checked)}
                  className="rounded border-[#bec8cd] text-[#005a71] focus:ring-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                />
                <span>Import / Export File Excel</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[#bec8cd]/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#bec8cd] text-[#3f484c]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-lg bg-[#005a71] hover:bg-[#0e7490] disabled:bg-[#6f787d] text-white font-semibold flex items-center gap-2 shadow-md disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {staffToEdit ? 'Simpan Perubahan Akun' : 'Buat Akun Admin'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
