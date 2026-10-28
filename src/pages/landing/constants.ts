import type { FaqItem } from './types';

export const FAQ_ENTERPRISE: FaqItem[] = [
  {
    q: 'Apakah file H5P ini bisa langsung diupload ke LMS (Moodle, Canvas, Totara)?',
    a: 'Bisa. File .h5p yang dihasilkan sudah standar, jadi tinggal upload ke aktivitas pembelajaran di LMS tanpa plugin tambahan.',
  },
  {
    q: 'Bagaimana nilai peserta tercatat di LMS?',
    a: 'Otomatis. Saat peserta menyelesaikan modul dan kuis, nilai dan status selesainya langsung tercatat di LMS.',
  },
  {
    q: 'Apakah file materi rahasia aman?',
    a: 'Aman. Semua proses — baca file, ambil gambar, sampai bikin paket .h5p — jalan di browser Anda. Tidak ada data yang dikirim ke server luar.',
  },
  {
    q: 'Apakah harus bisa programming?',
    a: 'Tidak perlu. Cukup siapkan file materi (.pptx/.pdf) seperti biasa. Nambah tombol, tulisan, suara, dan kuis semuanya tinggal klik.',
  },
  {
    q: 'Apakah tampilan slide berubah?',
    a: 'Tidak. Setiap halaman dijadikan gambar latar, jadi font, gambar, dan tabelnya tetap sama persis kayak file aslinya.',
  },
];
