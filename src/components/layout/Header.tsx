'use client';

import React from 'react';
import { Search, Bell, ShieldCheck, School as SchoolIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery = '',
  onSearchChange,
  title,
  subtitle
}) => {
  const { currentSchool, students, logs } = useApp();

  return (
    <header className="bg-white border-b border-[#bec8cd]/30 px-6 py-4 sticky top-0 z-20 font-['Work_Sans'] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="font-['Manrope'] font-bold text-xl text-[#0b1c30] flex items-center gap-2">
          {title || 'Dashboard Bimbingan Konseling'}
        </h2>
        <p className="text-xs text-[#6f787d]">
          {subtitle || `Sistem Pengelolaan Data BK & Poin Pelanggaran Siswa - ${currentSchool.name}`}
        </p>
      </div>

      <div className="flex items-center gap-3 self-end md:self-auto">
        {/* Search Input */}
        {onSearchChange && (
          <div className="relative w-64 md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6f787d]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama siswa / NIS..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#bec8cd]/50 bg-[#f8f9ff] text-xs focus:outline-none focus:border-[#005a71] focus:ring-2 focus:ring-[#005a71]/20 transition-all text-[#0b1c30] placeholder:text-[#8ea0a9]"
            />
          </div>
        )}

        {/* Multi-Tenant School Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#eff4ff] border border-[#dce9ff] text-[#005a71] text-xs font-medium">
          <SchoolIcon className="w-3.5 h-3.5 text-[#006781]" />
          <span>{currentSchool.code}</span>
        </div>

        {/* RLS Security Badge */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium" title="Supabase Row Level Security Active">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">RLS Protected</span>
        </div>

        {/* Notification Bell */}
        <button
          className="relative p-2 text-[#6f787d] hover:text-[#0b1c30] rounded-lg hover:bg-[#f8f9ff] transition-colors"
          title="Notifikasi Aktivitas"
          onClick={() =>
            alert(`Total Insiden Terhitung: ${logs.length} catatan pada ${currentSchool.name}`)
          }
        >
          <Bell className="w-4 h-4" />
          {logs.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full animate-ping" />
          )}
        </button>
      </div>
    </header>
  );
};
