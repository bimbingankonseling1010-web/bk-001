'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StaffModal } from '@/components/modals/StaffModal';
import { ViolationModal } from '@/components/modals/ViolationModal';
import { ExcelModal } from '@/components/modals/ExcelModal';
import { useApp } from '@/context/AppContext';
import { StaffAccount, StaffRole } from '@/types';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Building2, 
  KeyRound, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  FileSpreadsheet, 
  ShieldAlert,
  Users,
  Sparkles
} from 'lucide-react';

export default function ManajemenStafPage() {
  const { 
    currentSchool, 
    allStaffAccounts, 
    deleteStaffAccount, 
    toggleStaffStatus,
    schools 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [schoolFilter, setSchoolFilter] = useState<string>('ALL');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffAccount | null>(null);

  const filteredStaff = allStaffAccounts.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || st.role === roleFilter;
    const matchesSchool = schoolFilter === 'ALL' || st.school_id === schoolFilter;

    return matchesSearch && matchesRole && matchesSchool;
  });

  const handleOpenAdd = () => {
    setStaffToEdit(null);
    setIsStaffModalOpen(true);
  };

  const handleOpenEdit = (st: StaffAccount) => {
    setStaffToEdit(st);
    setIsStaffModalOpen(true);
  };

  const getRoleBadgeStyle = (role: StaffRole) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      case 'Admin':
        return 'bg-[#005a71] text-white font-bold';
      case 'Guru BK':
        return 'bg-[#006b5f] text-white font-bold';
      default:
        return 'bg-blue-100 text-blue-900 border-blue-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header
          title="Manajemen Staf & Akun Admin Sekolah"
          subtitle={`Panel Super Admin untuk Pembuatan & Otorisasi Akun Pengedit WebApp - ${currentSchool.name}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="p-6 space-y-6 flex-1">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#005a71] via-[#0e7490] to-[#213145] text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#62fae3] text-xs font-semibold mb-2 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5" />
                Role-Based Access Control (RBAC) & Supabase Auth
              </span>
              <h2 className="font-['Manrope'] text-xl font-bold">
                Pengelolaan Otorisasi Akun Multi-Tenant
              </h2>
              <p className="text-xs text-cyan-100 mt-1 max-w-xl">
                Super Admin dapat membuat dan memberikan hak pengeditan data (Data Siswa, Catat Pelanggaran, Catalog, Export Excel) untuk Admin di setiap sekolah.
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-[#62fae3] hover:bg-[#3cddc7] text-[#00201c] font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              + Buat Akun Admin Sekolah
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6f787d] font-medium">Total Akun Terdaftar</p>
                <h3 className="font-['Manrope'] text-2xl font-bold text-[#0b1c30] mt-1">
                  {allStaffAccounts.length} <span className="text-xs font-normal text-[#6f787d]">Akun</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#eff4ff] text-[#005a71] flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6f787d] font-medium">Akun Aktif</p>
                <h3 className="font-['Manrope'] text-2xl font-bold text-emerald-700 mt-1">
                  {allStaffAccounts.filter((s) => s.status === 'Aktif').length} <span className="text-xs font-normal text-[#6f787d]">Aktif</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6f787d] font-medium">Admin</p>
                <h3 className="font-['Manrope'] text-2xl font-bold text-[#005a71] mt-1">
                  {allStaffAccounts.filter((s) => s.role === 'Admin').length} <span className="text-xs font-normal text-[#6f787d]">Admin</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#e5eeff] text-[#005a71] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6f787d] font-medium">Super Admin</p>
                <h3 className="font-['Manrope'] text-2xl font-bold text-purple-900 mt-1">
                  {allStaffAccounts.filter((s) => s.role === 'Super Admin').length} <span className="text-xs font-normal text-[#6f787d]">Global</span>
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#005a71]" />
                <label className="text-xs font-semibold text-[#3f484c]">Filter Peran:</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#bec8cd] text-xs bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
                >
                  <option value="ALL">Semua Role ({allStaffAccounts.length})</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Guru BK">Guru BK</option>
                  <option value="Wali Kelas">Wali Kelas</option>
                </select>
              </div>

              {/* School Filter */}
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#005a71]" />
                <label className="text-xs font-semibold text-[#3f484c]">Instansi Sekolah:</label>
                <select
                  value={schoolFilter}
                  onChange={(e) => setSchoolFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#bec8cd] text-xs bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
                >
                  <option value="ALL">Semua Sekolah (Global)</option>
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-xs text-[#6f787d] font-medium">
              Menampilkan {filteredStaff.length} akun terdaftar
            </span>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-[#bec8cd]/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9ff] border-b border-[#bec8cd]/30 text-[11px] font-semibold uppercase tracking-wider text-[#3f484c]">
                    <th className="py-3.5 px-4">Nama Staf & Email Auth</th>
                    <th className="py-3.5 px-4">Instansi Sekolah (Multi-Tenant)</th>
                    <th className="py-3.5 px-4 text-center">Peran (Role)</th>
                    <th className="py-3.5 px-4 text-center">Status Login</th>
                    <th className="py-3.5 px-4">Hak Otorisasi Edit WebApp</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bec8cd]/20">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#6f787d]">
                        Tidak ada akun admin yang sesuai dengan kriteria filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-[#eff4ff]/40 transition-colors">
                        {/* Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#0b1c30] flex items-center gap-1.5">
                            <span>{staff.name}</span>
                          </div>
                          <p className="text-[11px] text-[#005a71] font-mono">{staff.email}</p>
                        </td>

                        {/* School */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#006781]">
                            {staff.school_name || (staff.school_id === 'ALL' ? 'Semua Instansi (Global)' : staff.school_id)}
                          </span>
                        </td>

                        {/* Role Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full border text-[10px] ${getRoleBadgeStyle(staff.role)}`}>
                            {staff.role}
                          </span>
                        </td>

                        {/* Status Toggle */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => toggleStaffStatus(staff.id)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all ${
                              staff.status === 'Aktif'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                            }`}
                            title="Klik untuk mengubah status akun"
                          >
                            {staff.status === 'Aktif' ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            ) : (
                              <XCircle className="w-3 h-3 text-red-700" />
                            )}
                            {staff.status}
                          </button>
                        </td>

                        {/* Permissions Badges */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {!staff.can_edit_students && !staff.can_log_violations && !staff.can_edit_master && !staff.can_export_excel ? (
                              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-bold border border-gray-300">
                                👁️ Read-Only (Hanya Lihat)
                              </span>
                            ) : (
                              <>
                                {staff.can_edit_students && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                    Edit Siswa
                                  </span>
                                )}
                                {staff.can_log_violations && (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                                    Catat Pelanggaran
                                  </span>
                                )}
                                {staff.can_edit_master && (
                                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200">
                                    Master Pelanggaran
                                  </span>
                                )}
                                {staff.can_export_excel && (
                                  <span className="px-2 py-0.5 rounded bg-[#e5eeff] text-[#005a71] text-[10px] font-semibold border border-[#dce9ff]">
                                    Excel
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(staff)}
                              className="px-2.5 py-1 rounded-lg border border-[#bec8cd] text-[#3f484c] hover:bg-gray-50 font-semibold text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Yakin mau menghapus akun admin ${staff.name}?`)) {
                                  deleteStaffAccount(staff.id);
                                }
                              }}
                              className="p-1.5 text-[#6f787d] hover:text-[#ba1a1a] hover:bg-red-50 rounded-lg"
                              title="Hapus Akun Admin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <StaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          staffToEdit={staffToEdit}
        />
        <ViolationModal />
        <ExcelModal />
      </main>
    </div>
  );
}
