'use client';

import React, { useState } from 'react';
import { X, FileSpreadsheet, Upload, Download, FileCheck2, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { downloadStudentListExcel, downloadExcelTemplate, parseStudentExcel } from '@/lib/excelHelper';

export const ExcelModal: React.FC = () => {
  const { isExcelModalOpen, setIsExcelModalOpen, currentSchool, students, bulkImportStudents } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [parsedPreview, setParsedPreview] = useState<Array<{ nis: string; name: string; class_name: string }> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isExcelModalOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setIsLoading(true);
      try {
        const rows = await parseStudentExcel(selectedFile);
        setParsedPreview(rows);
      } catch (err) {
        alert('Gagal membaca file Excel. Pastikan format .xlsx sesuai template.');
        setFile(null);
        setParsedPreview(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExecuteImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    bulkImportStudents(parsedPreview);
    setIsExcelModalOpen(false);
    setFile(null);
    setParsedPreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/40 backdrop-blur-xs animate-in fade-in font-['Work_Sans']">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#bec8cd]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#005a71] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-['Manrope'] font-bold text-base">Import & Export Excel</h3>
              <p className="text-xs text-cyan-100">Instansi: {currentSchool.name}</p>
            </div>
          </div>
          <button onClick={() => setIsExcelModalOpen(false)} className="p-1 text-cyan-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-[#0b1c30]">
          {/* Section 1: Quick Export */}
          <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between">
            <div>
              <h4 className="font-bold text-[#005a71] text-sm font-['Manrope']">Export Rekap Siswa Instansi</h4>
              <p className="text-[#6f787d]">Unduh seluruh data siswa ({students.length} siswa) & total poin dalam format .xlsx</p>
            </div>
            <button
              onClick={() => downloadStudentListExcel(students, currentSchool.name)}
              className="px-4 py-2 bg-[#005a71] hover:bg-[#0e7490] text-white font-semibold rounded-lg flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </button>
          </div>

          {/* Section 2: Bulk Import */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#005a71] text-sm font-['Manrope']">Import Bulk Data Siswa Baru</h4>
              <button
                onClick={() => downloadExcelTemplate()}
                className="text-[#006781] hover:underline flex items-center gap-1 text-[11px] font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Template Excel (.xlsx)
              </button>
            </div>

            <div className="border-2 border-dashed border-[#bec8cd] hover:border-[#005a71] rounded-xl p-6 text-center bg-[#f8f9ff] transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-[#0b1c30] bg-white placeholder:text-[#8ea0a9]"
              />
              <Upload className="w-8 h-8 text-[#005a71] mx-auto mb-2" />
              <p className="font-semibold text-[#0b1c30]">
                {file ? file.name : 'Klik atau Drag & Drop file Excel di sini'}
              </p>
              <p className="text-[11px] text-[#6f787d]">Format file harus .xlsx (Batas s.d 500 baris per file)</p>
            </div>

            {/* Preview Parsed */}
            {parsedPreview && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                    <FileCheck2 className="w-4 h-4 text-emerald-600" />
                    <span>File Terbaca: {parsedPreview.length} Data Siswa Siap Diimpor</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded">
                    school_id: {currentSchool.id}
                  </span>
                </div>

                <div className="max-h-32 overflow-y-auto rounded-lg border border-emerald-200 bg-white p-2">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="border-b text-[#6f787d]">
                        <th className="p-1">NIS</th>
                        <th className="p-1">Nama</th>
                        <th className="p-1">Kelas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedPreview.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="p-1 font-semibold">{item.nis}</td>
                          <td className="p-1">{item.name}</td>
                          <td className="p-1">{item.class_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleExecuteImport}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-md flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Proses Bulk Insert ({parsedPreview.length} Siswa)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#f8f9ff] border-t border-[#bec8cd]/30 flex justify-end">
          <button
            onClick={() => setIsExcelModalOpen(false)}
            className="px-4 py-2 border border-[#bec8cd] rounded-lg text-[#3f484c]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
