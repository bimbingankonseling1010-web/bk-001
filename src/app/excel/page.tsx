'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ExcelModal } from '@/components/modals/ExcelModal';
import { ViolationModal } from '@/components/modals/ViolationModal';
import { useApp } from '@/context/AppContext';
import { downloadStudentListExcel, downloadStudentProfileExcel, downloadExcelTemplate, parseStudentExcel } from '@/lib/excelHelper';
import { 
  FileSpreadsheet, 
  Upload, 
  Download, 
  FileCheck2, 
  Building2, 
  Search,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function ExcelPage() {
  const { currentSchool, students, logs, bulkImportStudents, setIsExcelModalOpen } = useApp();

  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [file, setFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Array<{ nis: string; name: string; class_name: string; tags?: string[] }> | null>(null);

  const selectedStudentObj = students.find((s) => s.id === selectedStudentId);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      try {
        const rows = await parseStudentExcel(f);
        setParsedPreview(rows);
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format file .xlsx');
        setFile(null);
        setParsedPreview(null);
      }
    }
  };

  const handleProcessImport = () => {
    if (!parsedPreview) return;
    bulkImportStudents(parsedPreview);
    setFile(null);
    setParsedPreview(null);
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header
          title="Import & Export Excel"
          subtitle={`Modul Pengelolaan Berkas Excel (ExcelJS & Bun Runtime) - ${currentSchool.name}`}
        />

        <div className="p-6 space-y-6 flex-1 max-w-6xl">
          {/* Hero Banner */}
          <div className="p-6 rounded-2xl bg-white border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Manrope'] font-bold text-base text-[#0b1c30]">
                  Pusat Manipulasi & Rekapitulasi Data Excel (.xlsx)
                </h3>
                <p className="text-xs text-[#6f787d]">
                  Otomatisasi pengolahan berkas excel dengan pengisian <code className="text-[#005a71] font-bold font-mono">school_id: {currentSchool.id}</code> secara aman.
                </p>
              </div>
            </div>

            <button
              onClick={() => downloadExcelTemplate()}
              className="px-4 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#005a71] font-semibold text-xs border border-[#dce9ff] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Unduh Format Template Import
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Bulk Import Data Siswa */}
            <div className="bg-white rounded-2xl p-6 border border-[#bec8cd]/30 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#005a71] text-white flex items-center justify-center">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-['Manrope'] font-bold text-base text-[#0b1c30]">
                      1. Bulk Import Data Siswa Baru
                    </h4>
                    <p className="text-xs text-[#6f787d]">Unggah file Excel daftar siswa baru (.xlsx)</p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-[#bec8cd] hover:border-[#005a71] rounded-xl p-6 text-center bg-[#f8f9ff] relative cursor-pointer my-4">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-[#0b1c30] bg-white placeholder:text-[#8ea0a9]"
                  />
                  <Upload className="w-7 h-7 text-[#005a71] mx-auto mb-2" />
                  <p className="font-bold text-xs text-[#0b1c30]">
                    {file ? file.name : 'Pilih File Excel Siswa (.xlsx)'}
                  </p>
                  <p className="text-[10px] text-[#6f787d]">Menyisipkan school_id otomatis untuk RLS</p>
                </div>

                {parsedPreview && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[#006b5f]">
                      <FileCheck2 className="w-4 h-4" />
                      <span>{parsedPreview.length} Data Siswa Valid Ditemukan</span>
                    </div>

                    <button
                      onClick={handleProcessImport}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center justify-center gap-2"
                    >
                      <Upload className="w-4 h-4" /> Import Sekarang
                    </button>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-[#6f787d] p-3 rounded-xl bg-gray-50 border border-gray-200">
                💡 Sistem akan membaca kolom NIS, Nama Lengkap, & Kelas kemudian melakukan bulk insert ke tabel <code className="font-mono font-bold">students</code>.
              </div>
            </div>

            {/* Card 2: Export Data & Profile */}
            <div className="bg-white rounded-2xl p-6 border border-[#bec8cd]/30 shadow-xs space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#006b5f] text-white flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-['Manrope'] font-bold text-base text-[#0b1c30]">
                    2. Export Excel Laporan BK
                  </h4>
                  <p className="text-xs text-[#6f787d]">Unduh laporan tabel siswa atau profil individual</p>
                </div>
              </div>

              {/* Option A */}
              <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-[#005a71]">Export Tabel Seluruh Siswa</h5>
                  <p className="text-[11px] text-[#6f787d]">Total {students.length} data siswa terdaftar</p>
                </div>
                <button
                  onClick={() => downloadStudentListExcel(students, currentSchool.name)}
                  className="px-3 py-1.5 bg-[#005a71] hover:bg-[#0e7490] text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>

              {/* Option B */}
              <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#bec8cd]/30 space-y-3">
                <h5 className="font-bold text-xs text-[#0b1c30]">Export Laporan Profil Individual Siswa</h5>
                <p className="text-[11px] text-[#6f787d]">
                  Menghasilkan file Excel dengan biodata di bagian atas dan tabel riwayat pelanggaran di bawah.
                </p>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-xs bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} (NIS: {st.nis} - Kelas {st.class_name})
                    </option>
                  ))}
                </select>

                {selectedStudentObj && (
                  <button
                    onClick={() => downloadStudentProfileExcel(selectedStudentObj, logs, currentSchool.name)}
                    className="w-full py-2 bg-[#006b5f] hover:bg-teal-800 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Download className="w-4 h-4" /> Download Profil {selectedStudentObj.name} (.xlsx)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <ViolationModal />
        <ExcelModal />
      </main>
    </div>
  );
}
