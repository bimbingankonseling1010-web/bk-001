"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection";
import { ViolationModal } from "@/components/modals/ViolationModal";
import { ExcelModal } from "@/components/modals/ExcelModal";
import { useApp } from "@/context/AppContext";
import {
  Users,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  PlusCircle,
  FileSpreadsheet,
  ChevronRight,
  Clock,
  Building2,
  Sparkles,
  Quote,
} from "lucide-react";

const DISCIPLINE_QUOTES = [
  {
    quote:
      "Disiplin bukan tentang menghukum kesalahan, tetapi membimbing anak menemukan jalan terbaik bagi pembentukan karakternya.",
    author: "Ki Hajar Dewantara",
  },
  {
    quote:
      "Tujuan utama bimbingan konseling bukan sekadar mencatat pelanggaran, melainkan menyembuhkan akar masalah dengan kasih sayang.",
    author: "Pedoman Karakter BK SD",
  },
  {
    quote:
      "Setiap kesalahan anak adalah kesempatan berharga untuk mengajarkan empati, tanggung jawab, dan kedewasaan.",
    author: "Prinsip Restoratif BK",
  },
  {
    quote:
      "Didiklah anak-anakmu sesuai dengan zamannya, karena mereka akan hidup di zaman yang berbeda dengan zamanmu.",
    author: "Ali bin Abi Thalib",
  },
  {
    quote:
      "Disiplin sejati tumbuh dari kesadaran hati dan keteladanan, bukan hanya dari rasa takut akan hukuman.",
    author: "Edukasi Pembiasaan Karakter",
  },
  {
    quote:
      "Jangan hanya menghitung poin kesalahan siswa, hitunglah pula setiap langkah kecil perubahan positif yang mereka tunjukkan.",
    author: "Refleksi Guru Pembina BK",
  },
  {
    quote:
      "Anak tidak membutuhkan kritik yang tajam, mereka membutuhkan bimbingan yang konsisten dan keteladanan yang nyata.",
    author: "Prinsip Pendidikan Dasar",
  },
];

export default function DashboardPage() {
  const [currentQuoteIndex, setCurrentQuoteIndex] = React.useState(0);

  React.useEffect(() => {
    // Pick a random quote index on component mount (each login / refresh)
    const randomIndex = Math.floor(Math.random() * DISCIPLINE_QUOTES.length);
    setCurrentQuoteIndex(randomIndex);
  }, []);

  const handleNextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % DISCIPLINE_QUOTES.length);
  };
  const {
    currentSchool,
    students,
    teachers,
    logs,
    openViolationModalForStudent,
    setIsExcelModalOpen,
    toastMessage,
  } = useApp();

  const studentsAttention = students.filter((s) => s.total_points > 20);

  return (
    <div className="flex min-h-screen bg-[#f8f9ff]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 font-['Work_Sans']">
        <Header />

        {/* Toast Alert */}
        {toastMessage && (
          <div className="mx-6 mt-4 p-3 bg-[#005a71] text-white text-xs font-semibold rounded-xl shadow-lg flex items-center justify-between animate-in slide-in-from-top duration-300 z-30">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>{toastMessage}</span>
            </div>
            <span className="text-[10px] text-cyan-200 uppercase">
              Supabase Realtime Sync
            </span>
          </div>
        )}

        <div className="p-6 space-y-6 flex-1">
          {/* Welcome Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#005a71] to-[#0e7490] text-white shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-medium mb-2 border border-white/20">
                <Building2 className="w-3.5 h-3.5" />
                Multi-Tenant: {currentSchool.name}
              </span>
              <h2 className="font-['Manrope'] text-2xl font-bold">
                Selamat Datang di Portal BK SD
              </h2>
              {/* Quote Hari Ini Dinamis (Menyatu Tanpa Kotak Pembungkus) */}
              <div className="mt-2 max-w-xl text-xs text-cyan-100 leading-relaxed font-medium space-y-1.5">
                <p>
                  <span className="italic text-cyan-50">
                    &quot;{DISCIPLINE_QUOTES[currentQuoteIndex].quote}&quot;
                  </span>{' '}
                  <span className="text-[#62fae3] font-bold not-italic">
                    — {DISCIPLINE_QUOTES[currentQuoteIndex].author}
                  </span>
                </p>
                <div>
                  <button
                    onClick={handleNextQuote}
                    title="Putar Quote Hari Ini"
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-200 hover:text-white font-semibold underline cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-[#62fae3]" /> Quote Lainnya
                  </button>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-wrap gap-2.5">
              <button
                onClick={() => openViolationModalForStudent()}
                className="px-4 py-2.5 rounded-xl bg-[#62fae3] hover:bg-[#3cddc7] text-[#00201c] font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Catat Pelanggaran
              </button>
              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import/Export Excel
              </button>
            </div>
          </div>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Stat 1 */}
            <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6f787d] font-medium">
                  Total Siswa Terdaftar
                </p>
                <h3 className="font-['Manrope'] text-2xl font-bold text-[#0b1c30] mt-1">
                  {students.length}{" "}
                  <span className="text-xs font-normal text-[#6f787d]">
                    Anak
                  </span>
                </h3>
                <p className="text-[11px] text-[#006781] mt-1 font-semibold">
                  Tahun Ajaran 2025/2026
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#eff4ff] text-[#005a71] flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6f787d] font-medium">
                  Siswa Perlu Perhatian
                </p>
                <h3 className="font-['Manrope'] text-2xl font-bold text-[#ba1a1a] mt-1">
                  {studentsAttention.length}{" "}
                  <span className="text-xs font-normal text-[#6f787d]">
                    Siswa
                  </span>
                </h3>
                <p className="text-[11px] text-[#ba1a1a] mt-1 font-semibold">
                  Poin Pelanggaran &gt; 20
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6f787d] font-medium">
                  Insiden Terpencatat
                </p>
                <h3 className="font-['Manrope'] text-2xl font-bold text-[#0b1c30] mt-1">
                  {logs.length}{" "}
                  <span className="text-xs font-normal text-[#6f787d]">
                    Log
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                  Aktif Dalam Database
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#e5eeff] text-[#0e7490] flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white rounded-2xl p-5 border border-[#bec8cd]/30 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6f787d] font-medium">
                  Guru & Wali Kelas
                </p>
                <h3 className="font-['Manrope'] text-2xl font-bold text-[#0b1c30] mt-1">
                  {teachers.length}{" "}
                  <span className="text-xs font-normal text-[#6f787d]">
                    Staf
                  </span>
                </h3>
                <p className="text-[11px] text-[#006b5f] mt-1 font-semibold">
                  Wali Kelas Assigned
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#006b5f] flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <AnalyticsSection />

          {/* Activity Logs & Quick List */}
          <div className="bg-white rounded-2xl p-6 border border-[#bec8cd]/30 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-['Manrope'] font-bold text-base text-[#0b1c30]">
                  Aktivitas Insiden Terbaru
                </h3>
                <p className="text-xs text-[#6f787d]">
                  Catatan kronologi pelanggaran terkini yang telah disubmit
                </p>
              </div>
              <Link
                href="/siswa"
                className="text-[#005a71] hover:underline text-xs font-semibold flex items-center gap-1"
              >
                Lihat Semua Data Siswa <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6f787d]">
                Belum ada insiden pelanggaran yang dicatat di{" "}
                {currentSchool.name}.
              </div>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 5).map((log) => {
                  const categoryBadge =
                    log.category === "Tinggi"
                      ? "bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/30"
                      : log.category === "Sedang"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-blue-100 text-blue-800 border-blue-200";

                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-[#bec8cd]/30 bg-[#f8f9ff] hover:bg-[#eff4ff] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-[#005a71]" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-[#0b1c30]">
                              {log.student_name}
                            </h4>
                            <span className="text-[10px] text-[#6f787d]">
                              Kelas {log.student_class} (NIS: {log.student_nis})
                            </span>
                          </div>
                          <p className="text-xs text-[#005a71] font-semibold mt-0.5">
                            {log.violation_name}
                          </p>
                          <p className="text-xs text-[#3f484c] mt-1 font-normal line-clamp-2">
                            &quot;{log.description}&quot;
                          </p>
                          {log.follow_up_description && (
                            <p className="text-[11px] text-[#006781] font-semibold mt-1 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                              📌 Tindak Lanjut: {log.follow_up_description}
                            </p>
                          )}
                          {log.involved_students &&
                            log.involved_students.length > 0 && (
                              <p className="text-[10px] text-[#6f787d] mt-1">
                                Terlibat: {log.involved_students.join(", ")}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${categoryBadge}`}
                        >
                          {log.category} (+{log.points_deducted} Poin)
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-[#6f787d]">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(log.created_at).toLocaleDateString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <ViolationModal />
        <ExcelModal />
      </main>
    </div>
  );
}
