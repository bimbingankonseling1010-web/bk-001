'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldAlert,
  FileSpreadsheet,
  PlusCircle,
  Building2,
  LogOut,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/supabase/actions';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { currentSchool, schools, setCurrentSchoolId, openViolationModalForStudent, canSwitchSchool } = useApp();
  const { user, signOut: clientSignOut } = useAuth();
  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = React.useState(false);

  const handleSignOut = async () => {
    await clientSignOut();
    window.location.href = '/login';
  };

  const displayName = user?.name ?? 'Guru BK';
  const initials = displayName
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const roleLabel = user?.role ?? 'Guru BK / Admin';

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Data Siswa', href: '/siswa', icon: Users },
    { label: 'Data & Kenaikan Kelas', href: '/kelas', icon: GraduationCap },
    { label: 'Data Guru & Wali Kelas', href: '/guru', icon: UserCheck },
    { label: 'Master Pelanggaran', href: '/master-pelanggaran', icon: ShieldAlert },
    { label: 'Import & Export Excel', href: '/excel', icon: FileSpreadsheet },
    { label: 'Manajemen Staf (Admin)', href: '/staf', icon: ShieldCheck },
  ];

  if (user?.isSuperAdmin) {
    navItems.push({ label: 'Daftar Instansi (Super)', href: '/instansi', icon: Building2 });
  }

  return (
    <aside className="w-64 bg-white border-r border-[#bec8cd]/30 flex flex-col justify-between h-screen sticky top-0 shadow-sm z-30 font-['Work_Sans']">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[#bec8cd]/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#005a71] to-[#0e7490] flex items-center justify-center text-white font-bold text-lg shadow-md shadow-[#005a71]/20">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="font-['Manrope'] font-bold text-[#0b1c30] text-base leading-snug">
              BK Portal SD
            </h1>
            <p className="text-xs text-[#6f787d] font-medium">Serene Counsel Platform</p>
          </div>
        </div>

        {/* Multi-Tenant Switcher (School Selector) — hanya Super Admin yang boleh ganti */}
        <div className="px-4 pt-4 pb-2">
          <label className="text-[11px] font-semibold text-[#6f787d] uppercase tracking-wider px-2 mb-1 block">
            Instansi Sekolah
          </label>
          <div className="relative">
            <button
              suppressHydrationWarning
              onClick={() => canSwitchSchool && setIsTenantDropdownOpen(!isTenantDropdownOpen)}
              disabled={!canSwitchSchool}
              title={canSwitchSchool ? 'Klik untuk ganti instansi' : 'Terkunci pada instansi sekolah Anda'}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left group ${
                canSwitchSchool
                  ? 'bg-[#eff4ff] hover:bg-[#e5eeff] border-[#dce9ff] cursor-pointer'
                  : 'bg-[#f8f9ff] border-[#bec8cd]/40 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-[#005a71] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-[#0b1c30] font-semibold text-xs truncate">
                    {currentSchool.name}
                  </p>
                  <p className="text-[10px] text-[#006781] font-medium">NPSN: {currentSchool.npsn}</p>
                </div>
              </div>
              {canSwitchSchool && (
                <ChevronDown className={`w-4 h-4 text-[#005a71] transition-transform duration-200 shrink-0 ${isTenantDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {isTenantDropdownOpen && canSwitchSchool && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-[#bec8cd]/30 py-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-1 text-[11px] text-[#6f787d] font-medium border-b border-[#bec8cd]/20">
                  Pilih Instansi Aktif:
                </div>
                {schools.map((sch) => (
                  <button
                    key={sch.id}
                    onClick={() => {
                      setCurrentSchoolId(sch.id);
                      setIsTenantDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#eff4ff] transition-colors ${
                      sch.id === currentSchool.id ? 'bg-[#e5eeff] font-semibold text-[#005a71]' : 'text-[#0b1c30]'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${sch.id === currentSchool.id ? 'bg-[#005a71]' : 'bg-gray-300'}`} />
                    <div className="truncate">
                      <p className="text-xs">{sch.name}</p>
                      <p className="text-[10px] text-[#6f787d]">Kode: {sch.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="px-4 py-3">
          <button
            onClick={() => openViolationModalForStudent()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#005a71] hover:bg-[#0e7490] text-white font-medium text-xs shadow-md shadow-[#005a71]/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Pelanggaran</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1 mt-2">
          <div className="text-[11px] font-semibold text-[#6f787d] uppercase tracking-wider px-3 mb-2">
            Menu Utama
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#e5eeff] text-[#005a71] font-semibold border-l-4 border-[#005a71] shadow-xs'
                    : 'text-[#3f484c] hover:bg-[#f8f9ff] hover:text-[#0b1c30]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#005a71]' : 'text-[#6f787d]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-[#bec8cd]/20 bg-[#f8f9ff]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#006781] text-white font-semibold text-xs flex items-center justify-center">
              {initials || 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-[#0b1c30] truncate">{displayName}</p>
              <p className="text-[10px] text-[#6f787d] truncate">{roleLabel}</p>
            </div>
          </div>
          <button
            title="Keluar"
            onClick={handleSignOut}
            className="p-1.5 text-[#6f787d] hover:text-[#ba1a1a] rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
