'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Tag, Plus, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Student } from '@/types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentToEdit?: Student | null;
}

export const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, studentToEdit }) => {
  const { addStudent, updateStudent, teachers, students } = useApp();

  const [nis, setNis] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('4A');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [gender, setGender] = useState<'L' | 'P'>('L');
  const [parentPhone, setParentPhone] = useState('');
  const [guardianTeacherId, setGuardianTeacherId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (studentToEdit) {
      setNis(studentToEdit.nis);
      setName(studentToEdit.name);
      setClassName(studentToEdit.class_name);
      setAcademicYear(studentToEdit.academic_year);
      setGender(studentToEdit.gender || 'L');
      setParentPhone(studentToEdit.parent_phone || '');
      setGuardianTeacherId(studentToEdit.guardian_teacher_id || '');
      setTags(studentToEdit.tags || []);
    } else {
      setNis('');
      setName('');
      setClassName('4A');
      setAcademicYear('2025/2026');
      setGender('L');
      setParentPhone('');
      setGuardianTeacherId(teachers[0]?.id || '');
      setTags(['rajin belajar']);
    }
  }, [studentToEdit, isOpen, teachers]);

  if (!isOpen) return null;

  const handleAddTag = (t: string) => {
    if (t.trim() && !tags.includes(t.trim())) {
      setTags([...tags, t.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim() || !name.trim()) {
      alert('NIS dan Nama Wajib diisi!');
      return;
    }

    const gTeacher = teachers.find((t) => t.id === guardianTeacherId);

    if (studentToEdit) {
      updateStudent(studentToEdit.id, {
        nis,
        name,
        class_name: className,
        academic_year: academicYear,
        gender,
        parent_phone: parentPhone,
        guardian_teacher_id: guardianTeacherId,
        guardian_teacher_name: gTeacher?.name,
        tags
      });
    } else {
      addStudent({
        nis,
        name,
        class_name: className,
        academic_year: academicYear,
        gender,
        parent_phone: parentPhone,
        guardian_teacher_id: guardianTeacherId,
        guardian_teacher_name: gTeacher?.name,
        tags
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/40 backdrop-blur-xs animate-in fade-in font-['Work_Sans']">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-[#bec8cd]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#005a71] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-[#62fae3]" />
            <h3 className="font-['Manrope'] font-bold text-base">
              {studentToEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-cyan-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-[#0b1c30]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">
                NIS Siswa <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                value={nis}
                onChange={(e) => setNis(e.target.value)}
                placeholder="misal: 21220106"
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                required
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">Jenis Kelamin</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'L' | 'P')}
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Nama Lengkap Siswa <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: Ahmad Raihan"
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">
                Kelas (Bisa Custom / Bebas) <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="text"
                list="class-suggestions"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="misal: 1 Arafah, 4B, 6 Cempaka"
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg focus:outline-none focus:border-[#005a71] text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
                required
              />
              <datalist id="class-suggestions">
                {Array.from(new Set(students.map((s) => s.class_name))).map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
              <p className="text-[10px] text-[#6f787d] mt-1">
                Ketik nama kelas bebas (misal: &quot;1 Abu Bakar&quot;, &quot;4A&quot;, &quot;5 Cempaka&quot;).
              </p>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">Tahun Ajaran</label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">Wali Kelas Ditetapkan</label>
            <select
              value={guardianTeacherId}
              onChange={(e) => setGuardianTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
            >
              <option value="">-- Pilih Wali Kelas --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.assigned_class || 'Wali Kelas'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">No. HP Orang Tua / Wali</label>
            <input
              type="text"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="0812xxxxxxx"
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
            />
          </div>

          {/* JSONB Custom Tags */}
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Custom Tags (JSONB Field Supabase)
            </label>
            <p className="text-[11px] text-[#6f787d] mb-1.5">
              Tag khusus penanganan BK seperti &quot;rajin&quot;, &quot;perlu motivasi&quot;, &quot;pendiam&quot;, &quot;juara&quot;.
            </p>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ketik tag baru..."
                className="flex-1 px-3 py-1.5 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              />
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="px-3 py-1.5 bg-[#e5eeff] text-[#005a71] font-semibold rounded-lg hover:bg-[#dce9ff]"
              >
                + Tag
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['rajin belajar', 'aktif', 'pendiam', 'perlu perbaikan', 'juara kelas'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleAddTag(preset)}
                  className="text-[10px] px-2 py-0.5 bg-gray-100 text-[#3f484c] rounded-full hover:bg-gray-200 border border-gray-300"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tg, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#006b5f] text-white text-[11px] font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    {tg}
                    <button type="button" onClick={() => handleRemoveTag(idx)} className="ml-1 hover:text-red-200">
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

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
              className="px-5 py-2 rounded-lg bg-[#005a71] hover:bg-[#0e7490] text-white font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {studentToEdit ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
