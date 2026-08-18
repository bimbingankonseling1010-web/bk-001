'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { MasterViolation, SeverityLevel } from '@/types';

interface ViolationMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterToEdit?: MasterViolation | null;
}

export const ViolationMasterModal: React.FC<ViolationMasterModalProps> = ({
  isOpen,
  onClose,
  masterToEdit
}) => {
  const { addMasterViolation, updateMasterViolation } = useApp();

  const [name, setName] = useState('');
  const [points, setPoints] = useState(10);
  const [category, setCategory] = useState<SeverityLevel>('Rendah');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (masterToEdit) {
      setName(masterToEdit.name);
      setPoints(masterToEdit.points);
      setCategory(masterToEdit.category);
      setDescription(masterToEdit.description || '');
    } else {
      setName('');
      setPoints(10);
      setCategory('Rendah');
      setDescription('');
    }
  }, [masterToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Nama Pelanggaran Wajib diisi!');
      return;
    }

    if (masterToEdit) {
      updateMasterViolation(masterToEdit.id, {
        name,
        points: Number(points),
        category,
        description
      });
    } else {
      addMasterViolation({
        name,
        points: Number(points),
        category,
        description
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0b1c30]/40 backdrop-blur-xs animate-in fade-in font-['Work_Sans']">
      <div className="bg-white rounded-2xl max-w-md w-full border border-[#bec8cd]/30 shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 bg-[#005a71] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
            <h3 className="font-['Manrope'] font-bold text-base">
              {masterToEdit ? 'Edit Katalog Pelanggaran' : 'Tambah Master Pelanggaran'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-cyan-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#0b1c30]">
          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">
              Nama Pelanggaran <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="misal: Terlambat Masuk Upacara"
              className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">Kategori Bobot</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SeverityLevel)}
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg bg-white text-[#0b1c30] placeholder:text-[#8ea0a9]"
              >
                <option value="Rendah">Rendah (ringan)</option>
                <option value="Sedang">Sedang (menengah)</option>
                <option value="Tinggi">Tinggi (berat)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#3f484c]">Bobot Poin (Integer)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 5)}
                className="w-full px-3 py-2 border border-[#bec8cd] rounded-lg text-[#0b1c30] placeholder:text-[#8ea0a9] bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#3f484c]">Penjelasan / Kriteria</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan mengenai batasan atau indikator pelanggaran..."
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
              Simpan Master Pelanggaran
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
