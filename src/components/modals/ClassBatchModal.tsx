'use client';

import React, { useState, useEffect } from 'react';
import { X, GraduationCap, ArrowRight, CheckCircle2, RefreshCw, Users, CheckSquare, Square } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface ClassBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSourceClass?: string;
  initialAcademicYear?: string;
}

export const ClassBatchModal: React.FC<ClassBatchModalProps> = ({
  isOpen,
  onClose,
  initialSourceClass = '',
  initialAcademicYear = ''
}) => {
  const { students, batchPromoteStudents, currentSchool } = useApp();

  const [sourceClass, setSourceClass] = useState(initialSourceClass);
  const [sourceYear, setSourceYear] = useState(initialAcademicYear);

  const [targetClass, setTargetClass] = useState('');
  const [targetYear, setTargetYear] = useState('2026/2027');
  const [resetPoints, setResetPoints] = useState(false);

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Unique classes and years from student dataset
  const uniqueClasses = Array.from(new Set(students.map((s) => s.class_name))).sort();
  const uniqueYears = Array.from(new Set(students.map((s) => s.academic_year))).sort();

  useEffect(() => {
    if (isOpen) {
      const cls = initialSourceClass || uniqueClasses[0] || '4A';
      const yr = initialAcademicYear || uniqueYears[0] || '2025/2026';
      setSourceClass(cls);
      setSourceYear(yr);

      // Default target calculation
      setTargetClass('');
      setTargetYear('2026/2027');
      setResetPoints(false);
    }
  }, [isOpen, initialSourceClass, initialAcademicYear]);

  // Students matching source class & source year
  const sourceStudents = students.filter(
    (s) => s.class_name === sourceClass && s.academic_year === sourceYear
  );

  useEffect(() => {
    // Select all source students by default
    setSelectedStudentIds(sourceStudents.map((s) => s.id));
  }, [sourceClass, sourceYear, students]);

  if (!isOpen) return null;

  const handleToggleSelect = (id: string) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter((sid) => sid !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === sourceStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(sourceStudents.map((s) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetClass.trim()) {
      alert('Nama Kelas Tujuan Wajib diisi!');
      return;
    }
    if (!targetYear.trim()) {
      alert('Tahun Ajaran Baru Wajib diisi!');
      return;
    }
    if (selectedStudentIds.length === 0) {
      alert('Pilih minimal 1 siswa untuk diproses kenaikan kelas!');
      return;
    }

    batchPromoteStudents(selectedStudentIds, targetClass.trim(), targetYear.trim(), resetPoints);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/40 backdrop-blur-xs animate-in fade-in font-['Work_Sans']">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#bec8cd]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#005a71] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#62fae3]" />
            </div>
            <div>
              <h3 className="font-['Manrope'] font-bold text-base">
                Batch Kenaikan Kelas & Update Tahun Ajaran
              </h3>
              <p className="text-xs text-cyan-100">Instansi: {currentSchool.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-cyan-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-[#0b1c30]">
          {/* Step 1: Source Selection */}
          <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#dce9ff] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#005a71] text-xs font-['Manrope'] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#005a71] text-white flex items-center justify-center text-[10px]">
                  1
                </span>
                Pilih Kelas & Tahun Ajaran Asal (Yang Akan Dinaikkan)
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-[#3f484c]">Kelas Asal</label>
                <select
                  value={sourceClass}
                  onChange={(e) => setSourceClass(e.target.value)}
                  className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white font-semibold text-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9]"
                >
                  {uniqueClasses.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[#3f484c]">Tahun Ajaran Asal</label>
                <select
                  value={sourceYear}
                  onChange={(e) => setSourceYear(e.target.value)}
                  className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white font-semibold text-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9]"
                >
                  {uniqueYears.map((y) => (
                    <option key={y} value={y}>
                      TA {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Student List Checkbox Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#005a71] text-xs font-['Manrope'] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#005a71] text-white flex items-center justify-center text-[10px]">
                  2
                </span>
                Pilih Siswa ({selectedStudentIds.length} dari {sourceStudents.length} Terpilih)
              </h4>

              {sourceStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[11px] text-[#006781] hover:underline font-semibold flex items-center gap-1"
                >
                  {selectedStudentIds.length === sourceStudents.length ? (
                    <>
                      <Square className="w-3.5 h-3.5" /> Hapus Semua Pilihan
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" /> Pilih Semua Siswa
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="border border-[#bec8cd]/40 rounded-xl p-3 max-h-48 overflow-y-auto bg-[#f8f9ff]">
              {sourceStudents.length === 0 ? (
                <p className="text-center text-[#6f787d] py-4">
                  Tidak ada data siswa ditemukan di Kelas {sourceClass} ({sourceYear}).
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sourceStudents.map((st) => {
                    const isChecked = selectedStudentIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-[#e5eeff] border-[#005a71] font-semibold text-[#005a71]'
                            : 'bg-white border-[#bec8cd]/30 text-[#3f484c]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(st.id)}
                            className="rounded border-[#bec8cd] text-[#005a71] focus:ring-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                          />
                          <span className="truncate">{st.name}</span>
                        </div>
                        <span className="text-[10px] text-[#6f787d] font-mono shrink-0 ml-1">
                          {st.nis}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Target Class & Year Settings */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
            <h4 className="font-bold text-emerald-900 text-xs font-['Manrope'] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                3
              </span>
              Tentukan Kelas & Tahun Ajaran Tujuan (Kenaikan Kelas Baru)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-emerald-900">
                  Nama Kelas Tujuan <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  placeholder="misal: 5A, 5 Arafah, Lulus"
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-700 font-bold text-[#0b1c30] placeholder:text-[#8ea0a9]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-emerald-900">
                  Tahun Ajaran Baru <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  placeholder="2026/2027"
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-700 font-bold text-[#0b1c30] placeholder:text-[#8ea0a9]"
                  required
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mt-2 cursor-pointer text-emerald-900 font-semibold">
              <input
                type="checkbox"
                checked={resetPoints}
                onChange={(e) => setResetPoints(e.target.checked)}
                className="rounded border-emerald-400 text-emerald-700 focus:ring-emerald-700 text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              />
              <span>Reset Akumulasi Poin Pelanggaran Siswa Menjadi 0 untuk Tahun Ajaran Baru</span>
            </label>
          </div>

          {/* Footer Actions */}
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
              disabled={selectedStudentIds.length === 0}
              className="px-5 py-2.5 rounded-lg bg-[#005a71] hover:bg-[#0e7490] disabled:bg-gray-300 text-white font-bold flex items-center gap-2 shadow-md"
            >
              <GraduationCap className="w-4 h-4 text-[#62fae3]" />
              Proses Kenaikan ({selectedStudentIds.length} Siswa)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
