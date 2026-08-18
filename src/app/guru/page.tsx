'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TeacherModal } from '@/components/modals/TeacherModal';
import { ViolationModal } from '@/components/modals/ViolationModal';
import { useApp } from '@/context/AppContext';
import { Teacher } from '@/types';
import { 
  UserCheck, 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  Edit3, 
  Trash2, 
  Building2,
  Award
} from 'lucide-react';

export default function DataGuruPage() {
  const { currentSchool, teachers, deleteTeacher } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);

  const filteredTeachers = teachers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.role.toLowerCase().includes(q) ||
      (t.email && t.email.toLowerCase().includes(q))
    );
  });

  const handleOpenEdit = (t: Teacher) => {
    setTeacherToEdit(t);
    setIsTeacherModalOpen(true);
  };

  const handleOpenAdd = () => {
    setTeacherToEdit(null);
    setIsTeacherModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header
          title="Data Guru & Wali Kelas"
          subtitle={`Kelola Staf Pengajar & Penugasan Wali Kelas - ${currentSchool.name}`}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <div className="p-6 space-y-6 flex-1">
          {/* Top Bar */}
          <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-['Manrope'] font-bold text-base text-[#0b1c30]">
                Direktori Guru & Pembina BK
              </h3>
              <p className="text-xs text-[#6f787d]">
                Menampilkan {filteredTeachers.length} staf pengajar aktif pada instansi ini
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#005a71] hover:bg-[#0e7490] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-all"
            >
              <UserPlus className="w-4 h-4 text-[#62fae3]" />
              + Tambah Profil Guru
            </button>
          </div>

          {/* Teacher Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#e5eeff] text-[#005a71] font-bold text-sm flex items-center justify-center">
                        {teacher.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-['Manrope'] font-bold text-sm text-[#0b1c30]">
                          {teacher.name}
                        </h4>
                        <p className="text-[11px] text-[#006781] font-semibold">{teacher.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#bec8cd]/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6f787d]">Role / Jabatan:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#005a71] text-white font-bold text-[10px]">
                        {teacher.role}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#6f787d]">Kelas Ditetapkan:</span>
                      <span className="font-semibold text-[#006781] bg-[#eff4ff] px-2 py-0.5 rounded">
                        {teacher.assigned_class || 'Wali Kelas'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[#3f484c] pt-1">
                      <Phone className="w-3.5 h-3.5 text-[#005a71]" />
                      <span>{teacher.phone || '0812xxxxxxx'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[#3f484c]">
                      <Mail className="w-3.5 h-3.5 text-[#005a71]" />
                      <span className="truncate">{teacher.email || 'guru@school.sch.id'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#bec8cd]/20 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(teacher)}
                    className="px-3 py-1.5 rounded-lg border border-[#bec8cd] text-[#3f484c] hover:bg-gray-50 text-xs font-semibold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus data guru ${teacher.name}?`)) {
                        deleteTeacher(teacher.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-[#6f787d] hover:text-[#ba1a1a] hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <TeacherModal
          isOpen={isTeacherModalOpen}
          onClose={() => setIsTeacherModalOpen(false)}
          teacherToEdit={teacherToEdit}
        />
        <ViolationModal />
      </main>
    </div>
  );
}
