'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ViolationModal } from '@/components/modals/ViolationModal';
import { ExcelModal } from '@/components/modals/ExcelModal';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { School } from '@/types';
import { 
  Building2, 
  PlusCircle, 
  Search, 
  Trash2,
  Edit3,
  Sparkles,
  Lock
} from 'lucide-react';

export default function InstansiPage() {
  const { 
    schools,
    addSchool,
    updateSchool,
    deleteSchool,
    isLoading
  } = useApp();

  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    npsn: '',
    address: '',
    accentColor: '#005a71'
  });

  const filteredSchools = schools.filter((sch) => {
    return (
      sch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.npsn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleOpenAdd = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '', code: '', npsn: '', address: '', accentColor: '#005a71' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch: School) => {
    setIsEditing(true);
    setFormData({
      id: sch.id,
      name: sch.name,
      code: sch.code || '',
      npsn: sch.npsn || '',
      address: sch.address || '',
      accentColor: sch.accentColor || '#005a71'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.name) {
      alert("ID dan Nama instansi wajib diisi.");
      return;
    }
    
    if (isEditing) {
      await updateSchool(formData.id, {
        name: formData.name,
        code: formData.code,
        npsn: formData.npsn,
        address: formData.address,
        accentColor: formData.accentColor
      });
    } else {
      await addSchool({
        id: formData.id,
        name: formData.name,
        code: formData.code,
        npsn: formData.npsn,
        address: formData.address,
        accentColor: formData.accentColor
      });
    }
    
    setIsModalOpen(false);
    setFormData({ id: '', name: '', code: '', npsn: '', address: '', accentColor: '#005a71' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus instansi ${name}? Semua data yang terkait mungkin akan ikut terhapus atau menyebabkan error jika masih ada siswa di dalamnya.`)) {
      await deleteSchool(id);
    }
  };

  if (!user?.isSuperAdmin) {
    return (
      <div className="flex min-h-screen bg-[#f8f9ff]">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center min-w-0 font-['Work_Sans'] p-6">
           <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center max-w-md">
             <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
               <Lock className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-[#0b1c30] mb-2 font-['Manrope']">Akses Ditolak</h2>
             <p className="text-sm text-[#6f787d]">Halaman ini khusus untuk Global Super Admin. Anda tidak memiliki izin untuk mengelola daftar instansi sekolah.</p>
           </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header
          title="Manajemen Instansi Sekolah"
          subtitle="Panel Super Admin untuk Mengelola Cabang / Instansi Sekolah (Multi-Tenant)"
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="p-6 space-y-6 flex-1">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#005a71] via-[#0e7490] to-[#213145] text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#62fae3] text-xs font-semibold mb-2 border border-white/20">
                <Building2 className="w-3.5 h-3.5" />
                Sistem Multi-Tenant
              </span>
              <h2 className="font-['Manrope'] text-xl font-bold">
                Daftar Instansi Terdaftar
              </h2>
              <p className="text-xs text-cyan-100 mt-1 max-w-2xl leading-relaxed font-medium">
                Sistem portal mendukung banyak instansi secara terpusat. Setiap instansi memiliki data siswa, staf, dan log pelanggaran yang saling terisolasi berkat Row Level Security (RLS) di database.
              </p>
            </div>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-[#62fae3] hover:bg-[#3cddc7] text-[#00201c] font-bold text-xs shadow-md transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Instansi Baru
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#bec8cd]/30 shadow-xs overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#bec8cd]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#f8f9ff]/50">
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6f787d]" />
                <input
                  type="text"
                  placeholder="Cari sekolah, kode, atau NPSN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-1 focus:ring-[#005a71] bg-white transition-all text-[#0b1c30] placeholder:text-[#8ea0a9]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9ff] border-b border-[#bec8cd]/30 text-[11px] uppercase tracking-wider text-[#6f787d]">
                    <th className="p-4 font-semibold">Nama Instansi</th>
                    <th className="p-4 font-semibold">ID / NPSN</th>
                    <th className="p-4 font-semibold">Kode</th>
                    <th className="p-4 font-semibold">Alamat</th>
                    <th className="p-4 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {filteredSchools.map((sch) => (
                    <tr key={sch.id} className="border-b border-[#bec8cd]/10 hover:bg-[#f8f9ff]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                            style={{ backgroundColor: sch.accentColor || '#005a71' }}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="font-semibold text-[#0b1c30]">
                            {sch.name}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-[#3f484c]">
                          <span className="font-mono text-[10px] bg-gray-100 px-1 py-0.5 rounded mr-1">ID: {sch.id}</span>
                          <br/>NPSN: <span className="font-semibold">{sch.npsn}</span>
                        </div>
                      </td>
                      <td className="p-4 text-[#3f484c] font-medium">{sch.code}</td>
                      <td className="p-4 text-[#6f787d] max-w-xs truncate" title={sch.address}>
                        {sch.address || '-'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(sch)}
                            className="p-1.5 text-[#6f787d] hover:text-[#005a71] hover:bg-[#eff4ff] rounded-lg transition-colors"
                            title="Edit Instansi"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(sch.id, sch.name)}
                            className="p-1.5 text-[#6f787d] hover:text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Instansi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSchools.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[#6f787d]">
                        {searchQuery ? 'Tidak ada instansi yang cocok dengan pencarian.' : 'Belum ada data instansi.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <ViolationModal />
        <ExcelModal />
      </main>

      {/* Add School Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#bec8cd]/30 bg-[#f8f9ff] flex items-center justify-between">
              <div>
                <h3 className="font-['Manrope'] font-bold text-[#0b1c30] text-base">{isEditing ? 'Edit Instansi Sekolah' : 'Tambah Instansi Sekolah'}</h3>
                <p className="text-[11px] text-[#6f787d]">{isEditing ? 'Perbarui detail data instansi yang sudah ada.' : 'Buat ruang kerja (tenant) baru untuk sekolah di sistem ini.'}</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="school-form" onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-[11px] font-semibold text-[#3f484c] uppercase tracking-wider mb-1.5">ID Instansi (Unik)</label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={isEditing}
                    placeholder="Contoh: sd-03"
                    className={`w-full px-3 py-2 text-xs border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-1 focus:ring-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] ${isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                  />
                  <p className="text-[10px] text-gray-500 mt-1">{isEditing ? 'ID Instansi tidak dapat diubah.' : 'Gunakan huruf kecil dan tanpa spasi (disarankan).'}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#3f484c] uppercase tracking-wider mb-1.5">Nama Lengkap Instansi</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: SD Islam Nusantara 03"
                    className="w-full px-3 py-2 text-xs border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-1 focus:ring-[#005a71] bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#3f484c] uppercase tracking-wider mb-1.5">Kode Singkat</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Contoh: SDIN03"
                      className="w-full px-3 py-2 text-xs border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-1 focus:ring-[#005a71] bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#3f484c] uppercase tracking-wider mb-1.5">NPSN</label>
                    <input
                      type="text"
                      required
                      value={formData.npsn}
                      onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                      placeholder="Nomor Pokok Sekolah"
                      className="w-full px-3 py-2 text-xs border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-1 focus:ring-[#005a71] bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#3f484c] uppercase tracking-wider mb-1.5">Alamat</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Alamat lengkap instansi..."
                    className="w-full px-3 py-2 text-xs border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-1 focus:ring-[#005a71] bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#3f484c] uppercase tracking-wider mb-1.5">Warna Aksen (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="flex-1 px-3 py-2 text-xs border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-1 focus:ring-[#005a71] bg-white uppercase text-[#0b1c30] placeholder:text-[#8ea0a9]"
                    />
                  </div>
                </div>

              </form>
            </div>

            <div className="px-6 py-4 border-t border-[#bec8cd]/30 bg-[#f8f9ff] flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#3f484c] hover:text-[#0b1c30] hover:bg-[#bec8cd]/20 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                form="school-form"
                className="px-6 py-2 text-xs font-bold text-white bg-[#005a71] hover:bg-[#0e7490] rounded-lg shadow-md transition-colors"
              >
                {isEditing ? 'Simpan Perubahan' : 'Simpan Instansi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
