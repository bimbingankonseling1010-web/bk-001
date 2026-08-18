'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ClassBatchModal } from '@/components/modals/ClassBatchModal';
import { ViolationModal } from '@/components/modals/ViolationModal';
import { ExcelModal } from '@/components/modals/ExcelModal';
import { useApp } from '@/context/AppContext';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  ArrowRight, 
  UserCheck, 
  Filter, 
  Search, 
  PlusCircle,
  Building2,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function DataKelasPage() {
  const { currentSchool, students, teachers } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchClassSource, setBatchClassSource] = useState('');
  const [batchYearSource, setBatchYearSource] = useState('');

  // Extract all unique academic years
  const academicYears = Array.from(new Set(students.map((s) => s.academic_year))).sort();

  // Group students into unique class + year combinations
  interface ClassGroupItem {
    class_name: string;
    academic_year: string;
    student_count: number;
    guardian_teacher_name?: string;
  }

  const classGroupMap: Record<string, ClassGroupItem> = {};

  students.forEach((s) => {
    const key = `${s.class_name}||${s.academic_year}`;
    if (!classGroupMap[key]) {
      classGroupMap[key] = {
        class_name: s.class_name,
        academic_year: s.academic_year,
        student_count: 1,
        guardian_teacher_name: s.guardian_teacher_name
      };
    } else {
      classGroupMap[key].student_count += 1;
    }
  });

  const classGroupsList = Object.values(classGroupMap);

  const filteredGroups = classGroupsList.filter((cg) => {
    const matchesSearch =
      cg.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cg.academic_year.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cg.guardian_teacher_name && cg.guardian_teacher_name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesYear = selectedYearFilter === 'ALL' || cg.academic_year === selectedYearFilter;

    return matchesSearch && matchesYear;
  });

  const handleOpenBatchForClass = (className: string, yearName: string) => {
    setBatchClassSource(className);
    setBatchYearSource(yearName);
    setIsBatchModalOpen(true);
  };

  const handleOpenBatchGeneral = () => {
    setBatchClassSource('');
    setBatchYearSource('');
    setIsBatchModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header
          title="Data & Batch Kenaikan Kelas"
          subtitle={`Manajemen Kelas per Tahun Ajaran & Update Massal Kenaikan Kelas - ${currentSchool.name}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="p-6 space-y-6 flex-1">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#005a71] via-[#0e7490] to-[#006b5f] text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-2 border border-white/20">
                <GraduationCap className="w-3.5 h-3.5" />
                Batch Class Promotion & Academic Year Isolation
              </span>
              <h2 className="font-['Manrope'] text-xl font-bold">
                Pembaruan Kenaikan Kelas Tanpa Bentrok Data
              </h2>
              <p className="text-xs text-cyan-100 mt-1 max-w-xl">
                Sistem membedakan kelas berdasarkan kombinasi <code className="text-[#62fae3] font-bold">Nama Kelas + Tahun Ajaran</code>. Administrator dapat melakukan proses batch kenaikan kelas tanpa risiko data double!
              </p>
            </div>

            <button
              onClick={handleOpenBatchGeneral}
              className="px-4 py-2.5 rounded-xl bg-[#62fae3] hover:bg-[#3cddc7] text-[#00201c] font-bold text-xs shadow-md transition-all flex items-center gap-2 shrink-0"
            >
              <GraduationCap className="w-4 h-4" />
              + Batch Kenaikan Kelas
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#005a71]" />
                <label className="text-xs font-semibold text-[#3f484c]">Filter Tahun Ajaran:</label>
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-[#bec8cd] text-xs bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
                >
                  <option value="ALL">Semua Tahun Ajaran ({academicYears.length})</option>
                  {academicYears.map((yr) => (
                    <option key={yr} value={yr}>
                      TA {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-xs text-[#6f787d] font-medium">
              Menampilkan {filteredGroups.length} grup kelas terdaftar di {currentSchool.name}
            </span>
          </div>

          {/* Class Groups Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGroups.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-[#bec8cd]/30 text-center text-xs text-[#6f787d]">
                Tidak ada grup kelas ditemukan.
              </div>
            ) : (
              filteredGroups.map((group, idx) => (
                <div
                  key={`${group.class_name}-${group.academic_year}-${idx}`}
                  className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#e5eeff] text-[#005a71] font-bold text-xs inline-block mb-1">
                          Kelas {group.class_name}
                        </span>
                        <h4 className="font-['Manrope'] font-bold text-base text-[#0b1c30]">
                          Kelas {group.class_name}
                        </h4>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                        TA {group.academic_year}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#bec8cd]/20 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#6f787d]">Jumlah Siswa:</span>
                        <span className="font-bold text-[#0b1c30] bg-gray-100 px-2 py-0.5 rounded">
                          {group.student_count} Anak
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[#6f787d]">Wali Kelas:</span>
                        <span className="font-semibold text-[#005a71] truncate max-w-[150px]">
                          {group.guardian_teacher_name || 'Belum diassign'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#bec8cd]/20 flex items-center justify-between gap-2">
                    <Link
                      href={`/siswa?class=${encodeURIComponent(group.class_name)}`}
                      className="text-xs font-semibold text-[#005a71] hover:underline flex items-center gap-1"
                    >
                      <Users className="w-3.5 h-3.5" /> Lihat Siswa
                    </Link>

                    <button
                      onClick={() => handleOpenBatchForClass(group.class_name, group.academic_year)}
                      className="px-3 py-1.5 bg-[#005a71] hover:bg-[#0e7490] text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-[#62fae3]" /> Kenaikan Kelas
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <ClassBatchModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          initialSourceClass={batchClassSource}
          initialAcademicYear={batchYearSource}
        />
        <ViolationModal />
        <ExcelModal />
      </main>
    </div>
  );
}
