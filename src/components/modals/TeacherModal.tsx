'use client';

import React, { useState, useEffect } from 'react';
import { X, UserCheck, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Teacher } from '@/types';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherToEdit?: Teacher | null;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, teacherToEdit }) => {
  const { addTeacher, updateTeacher } = useApp();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Guru BK' | 'Wali Kelas' | 'Guru Mapel' | 'Kepala Sekolah'>('Wali Kelas');
  const [assignedClass, setAssignedClass] = useState('4A');

  useEffect(() => {
    if (teacherToEdit) {
      setName(teacherToEdit.name);
      setPhone(teacherToEdit.phone);
      setEmail(teacherToEdit.email);
      setRole(teacherToEdit.role);
      setAssignedClass(teacherToEdit.assigned_class || '4A');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setRole('Wali Kelas');
      setAssignedClass('4A');
    }
  }, [teacherToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama Guru Wajib diisi!');
      return;
    }

    if (teacherToEdit) {
      updateTeacher(teacherToEdit.id, {
        name,
        phone,
        email,
        role,
        assigned_class: assignedClass
      });
    } else {
      addTeacher({
        name,
        phone,
        email,
        role,
        assigned_class: assignedClass
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/40 backdrop-blur-xs animate-in fade-in font-['Work_Sans']">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#bec8cd]/30 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-[#005a71] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-[#62fae3]" />
            <h3 className="font-['Manrope'] font-bold text-base">
              {teacherToEdit ? 'Edit Profil Guru' : 'Tambah Guru / Wali Kelas'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-cyan-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#0b1c30]">
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Nama Lengkap & Gelar <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: Dra. Hj. Maryam, M.Pd"
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">Peran / Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
              >
                <option value="Guru BK">Guru BK</option>
                <option value="Wali Kelas">Wali Kelas</option>
                <option value="Guru Mapel">Guru Mapel</option>
                <option value="Kepala Sekolah">Kepala Sekolah</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">Kelas Ditetapkan</label>
              <input
                type="text"
                value={assignedClass}
                onChange={(e) => setAssignedClass(e.target.value)}
                placeholder="misal: 4A atau Semua"
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">No. WhatsApp / Telepon</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812xxxxxxx"
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">Email Kontak</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guru@sekolah.sch.id"
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
            />
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
              Simpan Profile Guru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
