'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ViolationModal } from '@/components/modals/ViolationModal';
import { useApp } from '@/context/AppContext';
import { downloadStudentProfileExcel } from '@/lib/excelHelper';
import { 
  ArrowLeft, 
  User, 
  Tag, 
  PlusCircle, 
  FileSpreadsheet, 
  AlertTriangle, 
  Clock, 
  ShieldAlert,
  UserCheck,
  Building2
} from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentSchool, students, logs, openViolationModalForStudent } = useApp();

  const studentId = params?.id as string;
  const student = students.find((s) => s.id === studentId);

  if (!student) {
    return (
      <div className="flex min-h-screen bg-[#f8f9ff]">
        <Sidebar />
        <main className="flex-1 p-8 text-center font-['Work_Sans']">
          <p className="text-sm text-[#6f787d]">Data siswa tidak ditemukan di instansi {currentSchool.name}.</p>
          <Link href="/siswa" className="mt-4 inline-block px-4 py-2 bg-[#005a71] text-white rounded-lg text-xs">
            Kembali ke Data Siswa
          </Link>
        </main>
      </div>
    );
  }

  const studentLogs = logs.filter((l) => l.student_id === student.id);
  const isHighRisk = student.total_points > 30;

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header
          title={`Profil BK Siswa: ${student.name}`}
          subtitle={`NIS: ${student.nis} | Kelas: ${student.class_name} | Instansi: ${currentSchool.name}`}
        />

        <div className="p-6 space-y-6 flex-1">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#005a71] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Siswa
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => openViolationModalForStudent(student)}
                className="px-4 py-2 bg-[#005a71] hover:bg-[#0e7490] text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                Catat Pelanggaran Siswa Ini
              </button>

              <button
                onClick={() => downloadStudentProfileExcel(student, logs, currentSchool.name)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export Profile Excel (.xlsx)
              </button>
            </div>
          </div>

          {/* Student Profile Card (Level 1 Surface) */}
          <div className="bg-white rounded-2xl p-6 border border-[#bec8cd]/30 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Avatar & Key Stats */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-[#eff4ff] rounded-xl border border-[#dce9ff] text-center">
              <div className="w-20 h-20 rounded-full bg-[#005a71] text-white font-bold text-2xl flex items-center justify-center shadow-md">
                {student.name.substring(0, 2).toUpperCase()}
              </div>
              <h3 className="font-['Manrope'] font-bold text-lg text-[#0b1c30] mt-3">
                {student.name}
              </h3>
              <p className="text-xs text-[#6f787d]">NIS: {student.nis}</p>

              <div className="mt-4 w-full pt-4 border-t border-[#dce9ff]">
                <p className="text-xs text-[#6f787d]">Total Poin Pelanggaran</p>
                <div
                  className={`mt-1 py-1.5 px-4 rounded-full font-extrabold text-sm inline-flex items-center gap-2 ${
                    isHighRisk
                      ? 'bg-[#ffdad6] text-[#ba1a1a] border border-[#ba1a1a]/30'
                      : 'bg-[#e5eeff] text-[#005a71]'
                  }`}
                >
                  {isHighRisk && <AlertTriangle className="w-4 h-4" />}
                  {student.total_points} Poin Accumulated
                </div>
              </div>
            </div>

            {/* Details & Tags */}
            <div className="md:col-span-8 space-y-4">
              <h4 className="font-['Manrope'] font-bold text-base text-[#0b1c30] border-b border-[#bec8cd]/20 pb-2">
                Informasi Biodata & Akses Wali
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#6f787d]">Kelas:</span>
                  <p className="font-semibold text-[#0b1c30] text-sm">Kelas {student.class_name}</p>
                </div>
                <div>
                  <span className="text-[#6f787d]">Tahun Ajaran:</span>
                  <p className="font-semibold text-[#0b1c30] text-sm">{student.academic_year}</p>
                </div>
                <div>
                  <span className="text-[#6f787d]">Wali Kelas:</span>
                  <p className="font-semibold text-[#005a71]">{student.guardian_teacher_name || 'Belum diassign'}</p>
                </div>
                <div>
                  <span className="text-[#6f787d]">Kontak Orang Tua:</span>
                  <p className="font-semibold text-[#0b1c30]">{student.parent_phone || '0812xxxxxxx'}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#bec8cd]/20">
                <span className="text-xs font-semibold text-[#3f484c] block mb-2">
                  Custom Tags / Catatan Khusus BK (JSONB Field):
                </span>
                <div className="flex flex-wrap gap-2">
                  {student.tags && student.tags.length > 0 ? (
                    student.tags.map((tg, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-[#006b5f] text-white text-xs font-medium flex items-center gap-1.5 shadow-xs"
                      >
                        <Tag className="w-3 h-3" />
                        {tg}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-[#6f787d]">Belum ada tag khusus.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Incident Logs Table */}
          <div className="bg-white rounded-2xl p-6 border border-[#bec8cd]/30 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-['Manrope'] font-bold text-base text-[#0b1c30]">
                  Riwayat Insiden Pelanggaran ({studentLogs.length})
                </h4>
                <p className="text-xs text-[#6f787d]">Rekap kronologi pelanggaran yang tercatat untuk siswa ini</p>
              </div>
            </div>

            {studentLogs.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold">
                Siswa Bersih! Belum ada riwayat pelanggaran tercatat.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#f8f9ff] border-b border-[#bec8cd]/30 text-[11px] font-semibold text-[#3f484c]">
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Jenis Pelanggaran</th>
                      <th className="py-3 px-4 text-center">Kategori</th>
                      <th className="py-3 px-4 text-center">Poin</th>
                      <th className="py-3 px-4">Deskripsi Kronologi</th>
                      <th className="py-3 px-4">Pelapor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#bec8cd]/20">
                    {studentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#eff4ff]/40">
                        <td className="py-3 px-4 font-mono text-[#6f787d]">
                          {new Date(log.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#005a71]">
                          {log.violation_name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.category === 'Tinggi'
                                ? 'bg-[#ffdad6] text-[#ba1a1a]'
                                : log.category === 'Sedang'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-[#ba1a1a]">
                          +{log.points_deducted}
                        </td>
                        <td className="py-3 px-4 text-[#3f484c]">
                          <div>{log.description}</div>
                          {log.follow_up_description && (
                            <div className="text-[11px] font-semibold text-[#006781] bg-teal-50 px-2 py-0.5 rounded border border-teal-200 mt-1 inline-block">
                              📌 Tindak Lanjut: {log.follow_up_description}
                            </div>
                          )}
                          {log.involved_students && log.involved_students.length > 0 && (
                            <span className="block text-[10px] text-[#6f787d] mt-0.5">
                              Siswa lain terlibat: {log.involved_students.join(', ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#6f787d]">
                          {log.reporter_teacher_name}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <ViolationModal />
      </main>
    </div>
  );
}
