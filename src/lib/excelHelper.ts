import ExcelJS from 'exceljs';
import { Student, ViolationLog } from '../types';

export const downloadStudentListExcel = async (students: Student[], schoolName: string) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Daftar Siswa');

  // Title Row
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `DAFTAR SISWA & TOTAL POIN BK - ${schoolName.toUpperCase()}`;
  titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF005A71' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Blank row

  // Headers
  const headerRow = worksheet.addRow([
    'No',
    'NIS',
    'Nama Lengkap Siswa',
    'Kelas',
    'Tahun Ajaran',
    'Total Poin Pelanggaran',
    'Custom Tags / Catatan'
  ]);

  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF005A71' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Data Rows
  students.forEach((s, idx) => {
    const row = worksheet.addRow([
      idx + 1,
      s.nis,
      s.name,
      s.class_name,
      s.academic_year,
      s.total_points,
      s.tags ? s.tags.join(', ') : ''
    ]);

    // Alignments
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(6).alignment = { horizontal: 'center' };
    row.getCell(6).font = { bold: true, color: { argb: s.total_points > 30 ? 'FFBA1A1A' : 'FF000000' } };
  });

  // Auto column width
  worksheet.columns.forEach((column) => {
    column.width = 22;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  blobDownload(buffer, `Daftar_Siswa_BK_${schoolName.replace(/\s+/g, '_')}.xlsx`);
};

export const downloadStudentProfileExcel = async (
  student: Student,
  logs: ViolationLog[],
  schoolName: string
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Profil Siswa');

  // Title
  worksheet.mergeCells('A1:E1');
  const title = worksheet.getCell('A1');
  title.value = `REKAP PROFIL & RIWAYAT BK SISWA`;
  title.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF005A71' } };
  title.alignment = { horizontal: 'center' };

  worksheet.addRow([]);

  // Biodata Section
  worksheet.addRow(['SEKOLAH INSTANSI', ':', schoolName]);
  worksheet.addRow(['NAMA SISWA', ':', student.name]);
  worksheet.addRow(['NIS', ':', student.nis]);
  worksheet.addRow(['KELAS & TA', ':', `${student.class_name} (${student.academic_year})`]);
  worksheet.addRow(['WALI KELAS', ':', student.guardian_teacher_name || '-']);
  worksheet.addRow(['AKUMULASI POIN BK', ':', `${student.total_points} POIN`]);
  worksheet.addRow(['TAGS / CATATAN', ':', student.tags.join(', ')]);

  for (let r = 3; r <= 9; r++) {
    worksheet.getCell(`A${r}`).font = { bold: true };
    worksheet.getCell(`B${r}`).alignment = { horizontal: 'center' };
  }

  worksheet.addRow([]);
  worksheet.addRow([]);

  // Log Table Header
  const logHeader = worksheet.addRow(['No', 'Tanggal', 'Jenis Pelanggaran', 'Kategori', 'Poin', 'Deskripsi Kronologi', 'Tindak Lanjut Guru']);
  logHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  logHeader.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0e7490' } };
    c.alignment = { horizontal: 'center' };
  });

  const studentLogs = logs.filter((l) => l.student_id === student.id);

  if (studentLogs.length === 0) {
    worksheet.addRow(['-', '-', 'Belum ada catatan pelanggaran (Siswa Bersih)', '-', 0, '-', '-']);
  } else {
    studentLogs.forEach((l, i) => {
      worksheet.addRow([
        i + 1,
        new Date(l.created_at).toLocaleDateString('id-ID'),
        l.violation_name,
        l.category,
        l.points_deducted,
        l.description,
        l.follow_up_description || 'Konseling BK & Wali Kelas'
      ]);
    });
  }

  worksheet.columns.forEach((col) => {
    col.width = 24;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  blobDownload(buffer, `Profil_BK_${student.name.replace(/\s+/g, '_')}_${student.nis}.xlsx`);
};

export const downloadExcelTemplate = async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Template Import');

  const header = worksheet.addRow(['NIS', 'Nama Lengkap', 'Kelas', 'Custom Tags (Dipisahkan koma)']);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.eachCell((c) => {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF005A71' } };
  });

  worksheet.addRow(['21220109', 'Ahmad Rizky', '4A', 'rajin belajar, pramuka']);
  worksheet.addRow(['21220110', 'Siti Nurhaliza', '4B', 'pendiam, kreatif']);

  worksheet.columns.forEach((col) => {
    col.width = 25;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  blobDownload(buffer, 'Template_Import_Siswa_BK.xlsx');
};

export const parseStudentExcel = async (file: File): Promise<Array<{ nis: string; name: string; class_name: string; tags?: string[] }>> => {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  const results: Array<{ nis: string; name: string; class_name: string; tags?: string[] }> = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const nis = row.getCell(1).text?.toString().trim();
    const name = row.getCell(2).text?.toString().trim();
    const class_name = row.getCell(3).text?.toString().trim();
    const rawTags = row.getCell(4).text?.toString().trim();

    if (nis && name) {
      results.push({
        nis,
        name,
        class_name: class_name || '4A',
        tags: rawTags ? rawTags.split(',').map((t) => t.trim()) : ['siswa baru']
      });
    }
  });

  return results;
};

const blobDownload = (buffer: ArrayBuffer, fileName: string) => {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
