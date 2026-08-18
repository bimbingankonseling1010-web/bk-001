'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  School,
  Student,
  MasterViolation,
  ViolationLog,
  Teacher,
  StaffAccount,
  SchoolId,
  StaffRole,
} from '../types';

import { useAuth } from './AuthContext';
import {
  fetchSchoolsFromSupabase,
  fetchStudentsFromSupabase,
  fetchLogsFromSupabase,
  fetchTeachersFromSupabase,
  fetchMasterViolationsFromSupabase,
  fetchStaffAccountsFromSupabase,
  insertSchoolToSupabase,
  updateSchoolInSupabase,
  deleteSchoolFromSupabase,
  insertStudentToSupabase,
  updateStudentInSupabase,
  deleteStudentFromSupabase,
  insertLogToSupabase
} from '../lib/supabaseService';

interface AppContextType {
  // Multi-Tenant — currentSchoolId berasal dari session user (lihat AuthContext)
  currentSchool: School;
  schools: School[];
  setCurrentSchoolId: (id: SchoolId) => void;
  canSwitchSchool: boolean; // Hanya Super Admin yang boleh ganti sekolah di UI

  // Data for active school
  students: Student[];
  teachers: Teacher[];
  masters: MasterViolation[];
  logs: ViolationLog[];
  staffAccounts: StaffAccount[];
  allStaffAccounts: StaffAccount[];
  addSchool: (school: School) => Promise<void>;
  updateSchool: (id: string, updated: Partial<School>) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;

  // Actions
  addViolationLog: (data: Omit<ViolationLog, 'id' | 'created_at' | 'school_id'>) => Promise<void>;
  addStudent: (student: Omit<Student, 'id' | 'school_id' | 'total_points'>) => Promise<void>;
  updateStudent: (id: string, updated: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  addTeacher: (teacher: Omit<Teacher, 'id' | 'school_id'>) => Promise<void>;
  updateTeacher: (id: string, updated: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;

  addMasterViolation: (mv: Omit<MasterViolation, 'id' | 'school_id'>) => Promise<void>;
  updateMasterViolation: (id: string, updated: Partial<MasterViolation>) => Promise<void>;
  deleteMasterViolation: (id: string) => Promise<void>;

  bulkImportStudents: (newStudents: Array<{ nis: string; name: string; class_name: string; tags?: string[] }>) => Promise<void>;

  batchPromoteStudents: (
    studentIds: string[],
    targetClassName: string,
    targetAcademicYear: string,
    resetPoints?: boolean
  ) => Promise<void>;

  addStaffAccount: (staff: Omit<StaffAccount, 'id' | 'created_at'>) => Promise<void>;
  updateStaffAccount: (id: string, updated: Partial<StaffAccount>) => Promise<void>;
  deleteStaffAccount: (id: string) => Promise<void>;
  toggleStaffStatus: (id: string) => Promise<void>;

  // Modals state
  isViolationModalOpen: boolean;
  setIsViolationModalOpen: (open: boolean) => void;
  selectedStudentForViolation?: Student | null;
  openViolationModalForStudent: (student?: Student) => void;

  isExcelModalOpen: boolean;
  setIsExcelModalOpen: (open: boolean) => void;

  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Loading states
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isReady } = useAuth();

  // Schools statis dari seed; di produksi harusnya fetch dari DB.
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    fetchSchoolsFromSupabase().then(setSchools);
  }, []);

  // currentSchoolId prioritas:
  //  1. Override user (misal Super Admin switch sekolah di UI)
  //  2. user.schoolId dari session
  const [overrideSchoolId, setOverrideSchoolId] = useState<SchoolId | null>(null);

  const currentSchoolId: SchoolId = useMemo(() => {
    if (overrideSchoolId) return overrideSchoolId;
    if (user?.schoolId) return user.schoolId;
    return schools[0]?.id ?? 'sd-01';
  }, [overrideSchoolId, user, schools]);

  const canSwitchSchool = user?.isSuperAdmin ?? false;

  // Data state
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [allMasters, setAllMasters] = useState<MasterViolation[]>([]);
  const [allLogs, setAllLogs] = useState<ViolationLog[]>([]);
  const [allStaffAccounts, setAllStaffAccounts] = useState<StaffAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // UI state
  const [isViolationModalOpen, setIsViolationModalOpen] = useState(false);
  const [selectedStudentForViolation, setSelectedStudentForViolation] = useState<Student | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const currentSchool = useMemo(
    () => schools.find((s) => s.id === currentSchoolId) ?? schools[0] ?? {
      id: currentSchoolId,
      name: 'Memuat data instansi...',
      code: '...',
      npsn: '...',
      address: '...',
      accentColor: '#005a71'
    },
    [schools, currentSchoolId]
  );

  // Filtered by school (RLS juga akan enforce di server; filter client ini hanya UX)
  const students = useMemo(
    () => allStudents.filter((s) => s.school_id === currentSchoolId),
    [allStudents, currentSchoolId]
  );
  const teachers = useMemo(
    () => allTeachers.filter((t) => t.school_id === currentSchoolId),
    [allTeachers, currentSchoolId]
  );
  const masters = useMemo(
    () => allMasters.filter((m) => m.school_id === currentSchoolId),
    [allMasters, currentSchoolId]
  );
  const logs = useMemo(
    () => allLogs.filter((l) => l.school_id === currentSchoolId),
    [allLogs, currentSchoolId]
  );
  const staffAccounts = useMemo(
    () => allStaffAccounts.filter((st) => st.school_id === currentSchoolId),
    [allStaffAccounts, currentSchoolId]
  );

  const setCurrentSchoolId = useCallback(
    (id: SchoolId) => {
      if (!canSwitchSchool) {
        showToast('Hanya Super Admin yang dapat berganti instansi.');
        return;
      }
      setOverrideSchoolId(id);
      showToast(`Beralih ke instansi: ${schools.find((s) => s.id === id)?.name}`);
    },
    [canSwitchSchool, schools, showToast]
  );

  // Fetch data dari Supabase saat user ready atau school berubah
  const fetchAll = useCallback(async () => {
    if (!isReady || !user) return;
    setIsLoading(true);
    try {
      const [studentsRes, logsRes, teachersRes, mastersRes, staffRes] = await Promise.all([
        fetchStudentsFromSupabase(currentSchoolId),
        fetchLogsFromSupabase(currentSchoolId),
        fetchTeachersFromSupabase(currentSchoolId),
        fetchMasterViolationsFromSupabase(currentSchoolId),
        // Untuk staff: Super Admin fetch semua, Admin biasa filter sekolah sendiri
        fetchStaffAccountsFromSupabase(user.isSuperAdmin ? undefined : currentSchoolId),
      ]);

      setAllStudents(studentsRes);
      setAllLogs(logsRes);
      setAllTeachers(teachersRes);
      setAllMasters(mastersRes);
      setAllStaffAccounts(staffRes);
    } catch (err) {
      console.warn('[AppContext] Supabase fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, user, currentSchoolId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openViolationModalForStudent = useCallback((student?: Student) => {
    setSelectedStudentForViolation(student ?? null);
    setIsViolationModalOpen(true);
  }, []);

  const addSchool = useCallback(
    async (schoolData: School) => {
      setSchools((prev) => [...prev, schoolData]);
      const inserted = await insertSchoolToSupabase(schoolData);
      if (inserted) {
        setSchools((prev) => prev.map((s) => (s.id === schoolData.id ? inserted : s)));
        showToast(`Instansi ${schoolData.name} berhasil ditambahkan.`);
      } else {
        // revert on failure
        setSchools((prev) => prev.filter((s) => s.id !== schoolData.id));
      }
    },
    [showToast]
  );

  const updateSchool = useCallback(
    async (id: string, updated: Partial<School>) => {
      setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      const success = await updateSchoolInSupabase(id, updated);
      if (success) {
        showToast('Data instansi berhasil diperbarui.');
      } else {
        // revert on failure by refetching
        await fetchSchoolsFromSupabase().then(setSchools);
      }
    },
    [showToast]
  );

  const deleteSchool = useCallback(
    async (id: string) => {
      setSchools((prev) => prev.filter((s) => s.id !== id));
      const success = await deleteSchoolFromSupabase(id);
      if (success) {
        showToast('Instansi berhasil dihapus.');
      } else {
        await fetchSchoolsFromSupabase().then(setSchools);
      }
    },
    [showToast]
  );

  // ===== Actions =====

  const addViolationLog = useCallback(
    async (logData: Omit<ViolationLog, 'id' | 'created_at' | 'school_id'>) => {
      const newLog: ViolationLog = {
        ...logData,
        id: `log-${Date.now()}`,
        school_id: currentSchoolId,
        created_at: new Date().toISOString(),
      };
      setAllLogs((prev) => [newLog, ...prev]);
      setAllStudents((prev) =>
        prev.map((st) =>
          st.id === logData.student_id
            ? { ...st, total_points: st.total_points + logData.points_deducted }
            : st
        )
      );

      const inserted = await insertLogToSupabase(newLog);
      if (inserted) {
        // Replace dengan row dari DB (id mungkin berubah sesuai DB default)
        setAllLogs((prev) => prev.map((l) => (l.id === newLog.id ? inserted : l)));
        // DB trigger sudah update total_points, refetch siswa untuk konsistensi
        const updatedStudents = await fetchStudentsFromSupabase(currentSchoolId);
        if (updatedStudents.length > 0) setAllStudents(updatedStudents);
      }
      showToast(
        `Pelanggaran "${newLog.violation_name}" (+${newLog.points_deducted} Poin) berhasil dicatat untuk ${newLog.student_name}!`
      );
    },
    [currentSchoolId, showToast]
  );

  const addStudent = useCallback(
    async (data: Omit<Student, 'id' | 'school_id' | 'total_points'>) => {
      const newStudent: Student = {
        ...data,
        id: `s-${Date.now()}`,
        school_id: currentSchoolId,
        total_points: 0,
      };
      setAllStudents((prev) => [newStudent, ...prev]);
      const inserted = await insertStudentToSupabase({ ...data, school_id: currentSchoolId });
      if (inserted) {
        setAllStudents((prev) => prev.map((s) => (s.id === newStudent.id ? inserted : s)));
      }
      showToast(`Siswa ${newStudent.name} (${newStudent.nis}) berhasil ditambahkan.`);
    },
    [currentSchoolId, showToast]
  );

  const updateStudent = useCallback(
    async (id: string, updated: Partial<Student>) => {
      setAllStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      await updateStudentInSupabase(id, updated);
      showToast('Data siswa berhasil diperbarui.');
    },
    [showToast]
  );

  const deleteStudent = useCallback(
    async (id: string) => {
      setAllStudents((prev) => prev.filter((s) => s.id !== id));
      await deleteStudentFromSupabase(id);
      showToast('Siswa berhasil dihapus.');
    },
    [showToast]
  );

  const addTeacher = useCallback(
    async (data: Omit<Teacher, 'id' | 'school_id'>) => {
      const newTeacher: Teacher = {
        ...data,
        id: `t-${Date.now()}`,
        school_id: currentSchoolId,
      };
      setAllTeachers((prev) => [...prev, newTeacher]);
      showToast(`Guru ${newTeacher.name} berhasil ditambahkan.`);
    },
    [currentSchoolId, showToast]
  );

  const updateTeacher = useCallback(
    async (id: string, updated: Partial<Teacher>) => {
      setAllTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      showToast('Profil guru berhasil diperbarui.');
    },
    [showToast]
  );

  const deleteTeacher = useCallback(
    async (id: string) => {
      setAllTeachers((prev) => prev.filter((t) => t.id !== id));
      showToast('Data guru berhasil dihapus.');
    },
    [showToast]
  );

  const addMasterViolation = useCallback(
    async (data: Omit<MasterViolation, 'id' | 'school_id'>) => {
      const newMV: MasterViolation = {
        ...data,
        id: `mv-${Date.now()}`,
        school_id: currentSchoolId,
      };
      setAllMasters((prev) => [...prev, newMV]);
      showToast(`Katalog pelanggaran "${newMV.name}" berhasil dibuat.`);
    },
    [currentSchoolId, showToast]
  );

  const updateMasterViolation = useCallback(
    async (id: string, updated: Partial<MasterViolation>) => {
      setAllMasters((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
      showToast('Katalog pelanggaran berhasil diperbarui.');
    },
    [showToast]
  );

  const deleteMasterViolation = useCallback(
    async (id: string) => {
      setAllMasters((prev) => prev.filter((m) => m.id !== id));
      showToast('Katalog pelanggaran berhasil dihapus.');
    },
    [showToast]
  );

  const bulkImportStudents = useCallback(
    async (newStudents: Array<{ nis: string; name: string; class_name: string; tags?: string[] }>) => {
      const prepared: Student[] = newStudents.map((item, idx) => ({
        id: `s-import-${Date.now()}-${idx}`,
        school_id: currentSchoolId,
        nis: item.nis,
        name: item.name,
        class_name: item.class_name,
        academic_year: '2025/2026',
        total_points: 0,
        tags: item.tags || ['siswa baru'],
        gender: 'L',
      }));
      setAllStudents((prev) => [...prepared, ...prev]);
      showToast(`Berhasil mengimpor ${prepared.length} data siswa baru ke ${currentSchool.name}.`);
    },
    [currentSchoolId, currentSchool, showToast]
  );

  const batchPromoteStudents = useCallback(
    async (
      studentIds: string[],
      targetClassName: string,
      targetAcademicYear: string,
      resetPoints = false
    ) => {
      setAllStudents((prev) =>
        prev.map((s) =>
          studentIds.includes(s.id)
            ? {
                ...s,
                class_name: targetClassName,
                academic_year: targetAcademicYear,
                total_points: resetPoints ? 0 : s.total_points,
              }
            : s
        )
      );
      showToast(
        `Berhasil menaikkan ${studentIds.length} siswa ke Kelas ${targetClassName} (Tahun Ajaran ${targetAcademicYear})!`
      );
    },
    [showToast]
  );

  // Staff account actions sekarang lewat Server Actions di supabase/actions.ts
  // (lihat updateStaffAccount/deleteStaffAccount server actions).
  // Wrapper ini mempertahankan API agar komponen lama tidak perlu diubah,
  // TAPI real work dilakukan server-side.
  const addStaffAccount = useCallback(
    async (data: Omit<StaffAccount, 'id' | 'created_at'>) => {
      // Catatan: Pembuatan akun baru WAJIB lewat Server Action `createStaffAccount`
      // (lihat src/lib/supabase/actions.ts). Fungsi ini sebagai fallback optimistic
      // saja; di produksi, panggil Server Action dari komponen.
      showToast(
        'Pembuatan akun baru harus dipanggil via Server Action createStaffAccount.'
      );
      console.warn('addStaffAccount client-only — gunakan Server Action createStaffAccount.');
    },
    [showToast]
  );

  const updateStaffAccount = useCallback(
    async (id: string, updated: Partial<StaffAccount>) => {
      // Optimistic update di state lokal saja
      setAllStaffAccounts((prev) => prev.map((st) => (st.id === id ? { ...st, ...updated } : st)));
      showToast('Perubahan akan disinkronkan via Server Action.');
    },
    [showToast]
  );

  const deleteStaffAccount = useCallback(
    async (id: string) => {
      setAllStaffAccounts((prev) => prev.filter((st) => st.id !== id));
      showToast('Penghapusan harus dikonfirmasi via Server Action.');
    },
    [showToast]
  );

  const toggleStaffStatus = useCallback(
    async (id: string) => {
      setAllStaffAccounts((prev) =>
        prev.map((st) => {
          if (st.id === id) {
            const newStatus = st.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
            showToast(`Status akun ${st.name} diubah menjadi ${newStatus}.`);
            return { ...st, status: newStatus };
          }
          return st;
        })
      );
    },
    [showToast]
  );

  const refresh = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  const value: AppContextType = {
    currentSchool,
    schools,
    setCurrentSchoolId,
    canSwitchSchool,
    students,
    teachers,
    masters,
    logs,
    staffAccounts,
    allStaffAccounts,
    addSchool,
    updateSchool,
    deleteSchool,
    addViolationLog,
    addStudent,
    updateStudent,
    deleteStudent,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addMasterViolation,
    updateMasterViolation,
    deleteMasterViolation,
    bulkImportStudents,
    batchPromoteStudents,
    addStaffAccount,
    updateStaffAccount,
    deleteStaffAccount,
    toggleStaffStatus,
    isViolationModalOpen,
    setIsViolationModalOpen,
    selectedStudentForViolation,
    openViolationModalForStudent,
    isExcelModalOpen,
    setIsExcelModalOpen,
    toastMessage,
    showToast,
    isLoading,
    refresh,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
