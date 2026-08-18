'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ViolationMasterModal } from '@/components/modals/ViolationMasterModal';
import { ViolationModal } from '@/components/modals/ViolationModal';
import { useApp } from '@/context/AppContext';
import { MasterViolation, SeverityLevel } from '@/types';
import { 
  ShieldAlert, 
  PlusCircle, 
  Search, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';

export default function MasterPelanggaranPage() {
  const { currentSchool, masters, deleteMasterViolation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [masterToEdit, setMasterToEdit] = useState<MasterViolation | null>(null);

  const filteredMasters = masters.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = activeCategory === 'ALL' || m.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenEdit = (m: MasterViolation) => {
    setMasterToEdit(m);
    setIsMasterModalOpen(true);
  };

  const handleOpenAdd = () => {
    setMasterToEdit(null);
    setIsMasterModalOpen(true);
  };

  const getCategoryBadge = (cat: SeverityLevel) => {
    switch (cat) {
      case 'Tinggi':
        return 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/30';
      case 'Sedang':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header
          title="Master Katalog Pelanggaran"
          subtitle={`Manajemen Bobot Poin & Kategori Pelanggaran (Rendah, Sedang, Tinggi) - ${currentSchool.name}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="p-6 space-y-6 flex-1">
          {/* Top Category Filter & Actions */}
          <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#3f484c]">Kategori:</span>
              {['ALL', 'Rendah', 'Sedang', 'Tinggi'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === cat
                      ? 'bg-[#005a71] text-white shadow-xs'
                      : 'bg-[#f8f9ff] text-[#3f484c] border border-[#bec8cd]/40 hover:bg-[#eff4ff]'
                  }`}
                >
                  {cat === 'ALL' ? 'Semua Kategori' : cat}
                </button>
              ))}
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#005a71] hover:bg-[#0e7490] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-[#62fae3]" />
              + Tambah Master Pelanggaran
            </button>
          </div>

          {/* Catalog Table */}
          <div className="bg-white rounded-2xl border border-[#bec8cd]/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f8f9ff] border-b border-[#bec8cd]/30 text-[11px] font-semibold uppercase tracking-wider text-[#3f484c]">
                    <th className="py-3.5 px-4">Nama Pelanggaran</th>
                    <th className="py-3.5 px-4 text-center">Kategori Bobot</th>
                    <th className="py-3.5 px-4 text-center">Bobot Poin</th>
                    <th className="py-3.5 px-4">Kriteria / Deskripsi Deskriptif</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bec8cd]/20">
                  {filteredMasters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#6f787d]">
                        Katalog pelanggaran tidak ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredMasters.map((mv) => (
                      <tr key={mv.id} className="hover:bg-[#eff4ff]/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#0b1c30]">
                          {mv.name}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full border font-bold text-[10px] ${getCategoryBadge(mv.category)}`}>
                            {mv.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-extrabold text-[#ba1a1a] text-sm bg-red-50 px-2.5 py-1 rounded-md border border-red-100">
                            +{mv.points} Poin
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-[#3f484c]">
                          {mv.description || '-'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(mv)}
                              className="px-2.5 py-1 rounded-lg border border-[#bec8cd] text-[#3f484c] hover:bg-gray-50 font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus master pelanggaran "${mv.name}"?`)) {
                                  deleteMasterViolation(mv.id);
                                }
                              }}
                              className="p-1.5 text-[#6f787d] hover:text-[#ba1a1a] hover:bg-red-50 rounded-lg"
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

        <ViolationMasterModal
          isOpen={isMasterModalOpen}
          onClose={() => setIsMasterModalOpen(false)}
          masterToEdit={masterToEdit}
        />
        <ViolationModal />
      </main>
    </div>
  );
}
