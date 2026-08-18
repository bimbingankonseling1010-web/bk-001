'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StudentModal } from '@/components/modals/StudentModal';
import { ViolationModal } from '@/components/modals/ViolationModal';
import { ExcelModal } from '@/components/modals/ExcelModal';
import { useApp } from '@/context/AppContext';
import { Student } from '@/types';
import { downloadStudentProfileExcel, downloadStudentListExcel } from '@/lib/excelHelper';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpDown,
  UserPlus, 
  PlusCircle, 
  FileSpreadsheet, 
  Tag, 
  FileText, 
  Edit3, 
  Trash2, 
  AlertTriangle,
  Building2,
  ExternalLink
} from 'lucide-react';

export default function DataSiswaPage() {
  const { 
    currentSchool, 
    students, 
    logs,
    deleteStudent, 
    openViolationModalForStudent,
    setIsExcelModalOpen
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'DEFAULT' | 'POINTS_DESC' | 'POINTS_ASC' | 'NAME_ASC'>('DEFAULT');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Class Filter options
  const classOptions = Array.from(new Set(students.map((s) => s.class_name))).sort();

  const filteredStudents = students
    .filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.tags && s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesClass = selectedClass === 'ALL' || s.class_name === selectedClass;

      return matchesSearch && matchesClass;
    })
    .sort((a, b) => {
      if (sortOrder === 'POINTS_DESC') {
        return b.total_points - a.total_points;
      }
      if (sortOrder === 'POINTS_ASC') {
        return a.total_points - b.total_points;
      }
      if (sortOrder === 'NAME_ASC') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  const handleOpenEdit = (st: Student) => {
    setStudentToEdit(st);
    setIsStudentModalOpen(true);
  };

  const handleOpenAdd = () => {
    setStudentToEdit(null);
    setIsStudentModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header
          title="Kelola Data Siswa"
          subtitle={`Manajemen Tabel Siswa, Filter Kelas, Custom JSONB Tags & Export Excel - ${currentSchool.name}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="p-6 space-y-6 flex-1">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Kelas */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#005a71]" />
                <label className="text-xs font-semibold text-[#3f484c]">Filter Kelas:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#bec8cd] text-xs bg-white text-[#0b1c30] focus:outline-none focus:border-[#005a71] placeholder:text-[#8ea0a9]"
                >
                  <option value="ALL">Semua Kelas ({students.length})</option>
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      Kelas {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Poin Pelanggaran */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#005a71]" />
                <label className="text-xs font-semibold text-[#3f484c]">Urutkan:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-[#bec8cd] text-xs bg-white text-[#0b1c30] focus:outline-none focus:border-[#005a71] placeholder:text-[#8ea0a9]"
                >
                  <option value="DEFAULT">Default (NIS)</option>
                  <option value="POINTS_DESC">🔥 Poin Terbanyak (Tinggi ➔ Rendah)</option>
                  <option value="POINTS_ASC">🌱 Poin Terendah (Rendah ➔ Tinggi)</option>
                  <option value="NAME_ASC">🔤 Nama (A - Z)</option>
                </select>
              </div>

              <span className="text-xs text-[#6f787d] font-medium hidden sm:inline">
                | Menampilkan {filteredStudents.length} dari {students.length} siswa
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-[#005a71] hover:bg-[#0e7490] text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-all"
              >
                <UserPlus className="w-4 h-4 text-[#62fae3]" />
                + Tambah Siswa Baru
              </button>

              <button
                onClick={() => downloadStudentListExcel(filteredStudents, currentSchool.name)}
                className="px-4 py-2 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#005a71] font-semibold text-xs border border-[#dce9ff] flex items-center gap-2 transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-[#bec8cd]/30 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9ff] border-b border-[#bec8cd]/30 text-[11px] font-semibold uppercase tracking-wider text-[#3f484c]">
                    <th className="py-3.5 px-4">NIS</th>
                    <th className="py-3.5 px-4">Nama Lengkap Siswa</th>
                    <th className="py-3.5 px-4 text-center">Kelas</th>
                    <th className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (sortOrder === 'POINTS_DESC') setSortOrder('POINTS_ASC');
                          else setSortOrder('POINTS_DESC');
                        }}
                        className="inline-flex items-center gap-1 hover:text-[#005a71] font-bold"
                        title="Klik untuk mengubah urutan poin"
                      >
                        <span>Total Poin BK</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3.5 px-4">Tags Custom (JSONB)</th>
                    <th className="py-3.5 px-4">Wali Kelas</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#bec8cd]/20 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#6f787d]">
                        Tidak ada data siswa yang cocok dengan pencarian / filter kelas.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => {
                      const isHighRisk = student.total_points > 30;
                      const isMedRisk = student.total_points > 10;

                      return (
                        <tr key={student.id} className="hover:bg-[#eff4ff]/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#005a71]">
                            {student.nis}
                          </td>

                          <td className="py-3.5 px-4">
                            <Link
                              href={`/siswa/${student.id}`}
                              className="font-bold text-[#0b1c30] hover:text-[#005a71] hover:underline flex items-center gap-1.5"
                            >
                              <span>{student.name}</span>
                              <ExternalLink className="w-3 h-3 text-[#6f787d]" />
                            </Link>
                            <p className="text-[10px] text-[#6f787d]">
                              TA {student.academic_year} | {student.gender === 'P' ? 'Perempuan' : 'Laki-laki'}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-md bg-[#e5eeff] text-[#005a71] font-bold text-[11px]">
                              {student.class_name}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs ${
                                isHighRisk
                                  ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/30'
                                  : isMedRisk
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {isHighRisk && <AlertTriangle className="w-3 h-3" />}
                              {student.total_points} Poin
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {student.tags && student.tags.length > 0 ? (
                                student.tags.map((tg, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-[#006b5f] text-[10px] font-medium border border-teal-200"
                                  >
                                    <Tag className="w-2.5 h-2.5" />
                                    {tg}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-[#6f787d] italic">Tidak ada tag</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-[#3f484c]">
                            {student.guardian_teacher_name || '-'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openViolationModalForStudent(student)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#005a71] hover:bg-[#0e7490] text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                                title="Catat Pelanggaran Pop-out Modal"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span className="hidden lg:inline">+ Log</span>
                              </button>

                              <button
                                onClick={() => downloadStudentProfileExcel(student, logs, currentSchool.name)}
                                className="p-1.5 rounded-lg text-[#006781] hover:bg-[#eff4ff] border border-transparent hover:border-[#dce9ff]"
                                title="Download Profil & History Excel"
                              >
                                <FileText className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(student)}
                                className="p-1.5 rounded-lg text-[#3f484c] hover:bg-gray-100"
                                title="Edit Data Siswa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Yakin mau menghapus siswa ${student.name}?`)) {
                                    deleteStudent(student.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-[#6f787d] hover:text-[#ba1a1a] hover:bg-red-50"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <StudentModal
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          studentToEdit={studentToEdit}
        />
        <ViolationModal />
        <ExcelModal />
      </main>
    </div>
  );
}
