'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, UserCheck, AlertTriangle, CheckCircle2, UserPlus, Users, FileText } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SeverityLevel } from '@/types';

export const ViolationModal: React.FC = () => {
  const {
    isViolationModalOpen,
    setIsViolationModalOpen,
    selectedStudentForViolation,
    students,
    masters,
    teachers,
    addViolationLog
  } = useApp();

  const [studentId, setStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [violationId, setViolationId] = useState('');
  const [description, setDescription] = useState('');
  const [involvedInput, setInvolvedInput] = useState('');
  const [involvedStudents, setInvolvedStudents] = useState<string[]>([]);
  const [reporterTeacherId, setReporterTeacherId] = useState('');
  const [followUpDescription, setFollowUpDescription] = useState('');

  useEffect(() => {
    if (selectedStudentForViolation) {
      setStudentId(selectedStudentForViolation.id);
      setStudentSearch(`${selectedStudentForViolation.name} (${selectedStudentForViolation.nis} - ${selectedStudentForViolation.class_name})`);
    } else {
      setStudentId('');
      setStudentSearch('');
    }

    if (masters.length > 0) {
      setViolationId(masters[0].id);
    }
    if (teachers.length > 0) {
      setReporterTeacherId(teachers[0].id);
    }
    setFollowUpDescription('');
  }, [selectedStudentForViolation, isViolationModalOpen, masters, teachers]);

  if (!isViolationModalOpen) return null;

  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || s.class_name.toLowerCase().includes(q);
  });

  const selectedStudentObj = students.find((s) => s.id === studentId);
  const selectedViolationObj = masters.find((m) => m.id === violationId);

  const handleAddInvolved = (name: string) => {
    if (name.trim() && !involvedStudents.includes(name.trim())) {
      setInvolvedStudents([...involvedStudents, name.trim()]);
      setInvolvedInput('');
    }
  };

  const handleRemoveInvolved = (idx: number) => {
    setInvolvedStudents(involvedStudents.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentObj) {
      alert('Pilih siswa terlebih dahulu!');
      return;
    }
    if (!selectedViolationObj) {
      alert('Pilih jenis pelanggaran!');
      return;
    }

    const reporter = teachers.find((t) => t.id === reporterTeacherId) || teachers[0];

    addViolationLog({
      student_id: selectedStudentObj.id,
      student_name: selectedStudentObj.name,
      student_nis: selectedStudentObj.nis,
      student_class: selectedStudentObj.class_name,
      violation_id: selectedViolationObj.id,
      violation_name: selectedViolationObj.name,
      category: selectedViolationObj.category,
      points_deducted: selectedViolationObj.points,
      description: description || 'Tidak ada deskripsi rinci.',
      involved_students: involvedStudents,
      reporter_teacher_id: reporter.id,
      reporter_teacher_name: reporter.name,
      follow_up_description: followUpDescription || 'Konseling & bimbingan oleh Guru BK/Wali Kelas.'
    });

    // Reset & Close
    setIsViolationModalOpen(false);
    setDescription('');
    setInvolvedStudents([]);
    setFollowUpDescription('');
  };

  const getCategoryBadgeClass = (cat?: SeverityLevel) => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/40 backdrop-blur-xs animate-in fade-in font-['Work_Sans']">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-[#bec8cd]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#005a71] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-['Manrope'] font-bold text-base">Catat Pelanggaran Siswa</h3>
              <p className="text-xs text-cyan-100">Simulasi Server Action & Trigger Supabase DB</p>
            </div>
          </div>
          <button
            onClick={() => setIsViolationModalOpen(false)}
            className="p-1 rounded-lg text-cyan-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-[#0b1c30]">
          {/* Student Search & Select */}
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Nama Siswa / NIS <span className="text-[#ba1a1a]">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentId('');
                }}
                placeholder="Ketik nama atau NIS siswa..."
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-2 focus:ring-[#005a71]/20 text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              />
              {studentSearch && !studentId && filteredStudents.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#bec8cd] rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                  {filteredStudents.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setStudentId(st.id);
                        setStudentSearch(`${st.name} (NIS: ${st.nis} - Kelas ${st.class_name})`);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#eff4ff] border-b border-[#bec8cd]/20 flex justify-between items-center"
                    >
                      <div>
                        <span className="font-semibold text-[#005a71]">{st.name}</span>
                        <span className="text-[#6f787d] ml-2 text-[11px]">Kelas {st.class_name}</span>
                      </div>
                      <span className="text-[#6f787d] text-[10px]">NIS: {st.nis}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedStudentObj && (
              <div className="mt-2 p-2.5 rounded-lg bg-[#eff4ff] border border-[#dce9ff] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#005a71]">{selectedStudentObj.name}</p>
                  <p className="text-[11px] text-[#6f787d]">
                    NIS: {selectedStudentObj.nis} | Kelas: {selectedStudentObj.class_name} | Poin Saat Ini: <span className="font-bold text-[#ba1a1a]">{selectedStudentObj.total_points} Poin</span>
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  Tergabung
                </span>
              </div>
            )}
          </div>

          {/* Master Violation Selector */}
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Jenis Pelanggaran <span className="text-[#ba1a1a]">*</span>
            </label>
            <select
              value={violationId}
              onChange={(e) => setViolationId(e.target.value)}
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-2 focus:ring-[#005a71]/20 bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
            >
              {masters.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.category}] {m.name} (+{m.points} Poin)
                </option>
              ))}
            </select>
            {selectedViolationObj && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${getCategoryBadgeClass(selectedViolationObj.category)}`}>
                  Kategori: {selectedViolationObj.category}
                </span>
                <span className="text-xs font-bold text-[#ba1a1a]">
                  +{selectedViolationObj.points} Poin Pelanggaran
                </span>
              </div>
            )}
          </div>

          {/* Chronology Description */}
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Deskripsi Kronologi Kejadian
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan kronologi singkat kejadian pelanggaran..."
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] focus:ring-2 focus:ring-[#005a71]/20 text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
            />
          </div>

          {/* Pihak Terlibat (Multi-Select Tags) */}
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Pihak Lain yang Terlibat (Opsional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={involvedInput}
                onChange={(e) => setInvolvedInput(e.target.value)}
                placeholder="Ketik nama siswa lain..."
                className="flex-1 px-3 py-1.5 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddInvolved(involvedInput)}
                className="px-3 py-1.5 bg-[#e5eeff] text-[#005a71] rounded-lg font-semibold hover:bg-[#dce9ff]"
              >
                + Tambah
              </button>
            </div>

            {/* Tags preview */}
            <div className="flex flex-wrap gap-1.5">
              {students
                .filter((s) => s.id !== studentId)
                .slice(0, 4)
                .map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleAddInvolved(st.name)}
                    className="text-[10px] px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[#3f484c] rounded-full border border-gray-300"
                  >
                    + {st.name} ({st.class_name})
                  </button>
                ))}
            </div>

            {involvedStudents.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {involvedStudents.map((name, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#005a71] text-white text-[11px] font-medium"
                  >
                    <Users className="w-3 h-3" />
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemoveInvolved(idx)}
                      className="hover:text-red-200 ml-1"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reporter Teacher */}
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Guru Pelapor / Penanggung Jawab
            </label>
            <select
              value={reporterTeacherId}
              onChange={(e) => setReporterTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.role})
                </option>
              ))}
            </select>
          </div>

          {/* Deskripsi Tindak Lanjut oleh Guru / Wali Kelas (Paling Bawah) */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 shadow-xs space-y-1.5">
            <label className="block font-bold text-emerald-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4 text-emerald-700" />
                Deskripsi Tindak Lanjut oleh Guru / Wali Kelas
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded">
                Pembinaan & Penanganan BK
              </span>
            </label>
            <textarea
              rows={3}
              value={followUpDescription}
              onChange={(e) => setFollowUpDescription(e.target.value)}
              placeholder="Jelaskan langkah/tindakan pembinaan yang diambil (misal: Konseling tatap muka, pemanggilan orang tua, tugas pembiasaan karakter)..."
              className="w-full px-3 py-2 border border-emerald-300 rounded-lg bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 text-[#0b1c30] text-xs font-medium placeholder:text-[#8ea0a9]"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#bec8cd]/30 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsViolationModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#bec8cd] text-[#3f484c] font-medium hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#005a71] hover:bg-[#0e7490] text-white font-semibold flex items-center gap-2 shadow-md shadow-[#005a71]/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              Simpan Insiden & Update Poin DB
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
