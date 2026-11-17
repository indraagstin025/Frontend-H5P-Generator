/**
 * Utilitas validasi ketat berkas unggahan materi (.pptx / .pdf).
 * 1. Validasi ukuran dan ekstensi.
 * 2. Validasi Magic Bytes biner asli (anti file rename palsu).
 * 3. Deteksi proteksi kata sandi / enkripsi (PDF & PPTX).
 * 4. Komputasi hash SHA-256 untuk deteksi duplikasi isi berkas.
 */
import { ALLOWED_EXTENSIONS, MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from '../constants/uploadLimits';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  hash?: string;
  ext?: 'pdf' | 'pptx';
}

/**
 * Menghitung sidik jari SHA-256 dari seluruh isi berkas
 * menggunakan Web Crypto API bawaan browser modern.
 */
export async function computeFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Membaca Magic Bytes dan memvalidasi tipe biner asli berkas.
 */
async function checkMagicBytes(file: File): Promise<{
  valid: boolean;
  ext?: 'pdf' | 'pptx';
  error?: string;
}> {
  // Baca 8 byte pertama untuk memeriksa header signature
  const headerSlice = file.slice(0, 8);
  const buffer = new Uint8Array(await headerSlice.arrayBuffer());

  // 1. Signature PDF: Wajib diawali "%PDF-" (0x25, 0x50, 0x44, 0x46, 0x2D)
  const isPdfMagic =
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d;

  if (isPdfMagic) {
    return { valid: true, ext: 'pdf' };
  }

  // 2. Signature PPTX: Berkas Office OpenXML adalah ZIP archive, diawali "PK" (0x50, 0x4B, 0x03/0x05/0x07, 0x04/0x06/0x08)
  const isZipMagic =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);

  if (isZipMagic) {
    return { valid: true, ext: 'pptx' };
  }

  // 3. Deteksi berkas Office terkunci format OLE/CFB (0xD0, 0xCF, 0x11, 0xE0)
  const isOleEncrypted =
    buffer.length >= 4 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0;

  if (isOleEncrypted) {
    return {
      valid: false,
      error: 'Berkas PowerPoint ini dilindungi kata sandi. Harap buka kunci presentasi terlebih dahulu sebelum mengunggah.',
    };
  }

  return {
    valid: false,
    error: 'Format berkas tidak valid. Berkas biner bukan presentasi .pptx atau dokumen .pdf yang sah.',
  };
}

/**
 * Memeriksa apakah berkas PDF dilindungi kata sandi (password-protected).
 * Memindai kamus enkripsi "/Encrypt" pada struktur objek dokumen.
 */
async function checkPdfEncryption(file: File): Promise<{
  encrypted: boolean;
  error?: string;
}> {
  // Ambil sampel 1 MB awal dan 256 KB akhir (tempat kamus trailer PDF tersimpan)
  const headSlice = file.slice(0, Math.min(file.size, 1024 * 1024));
  const headText = new TextDecoder('latin1').decode(await headSlice.arrayBuffer());

  if (/\/Encrypt\s+/i.test(headText)) {
    return {
      encrypted: true,
      error: 'Berkas PDF ini dilindungi kata sandi (password-protected). Harap buka kunci dokumen terlebih dahulu sebelum mengunggah.',
    };
  }

  if (file.size > 1024 * 1024) {
    const tailSlice = file.slice(Math.max(0, file.size - 256 * 1024));
    const tailText = new TextDecoder('latin1').decode(await tailSlice.arrayBuffer());
    if (/\/Encrypt\s+/i.test(tailText)) {
      return {
        encrypted: true,
        error: 'Berkas PDF ini dilindungi kata sandi (password-protected). Harap buka kunci dokumen terlebih dahulu sebelum mengunggah.',
      };
    }
  }

  return { encrypted: false };
}

/**
 * Validasi ketat menyeluruh terhadap berkas materi yang akan diunggah.
 */
export async function validateUploadFileStrict(file: File): Promise<FileValidationResult> {
  // 1. Validasi nama & ekstensi
  const ext = (file.name.split('.').pop()?.toLowerCase() ?? '') as string;
  if (!ALLOWED_EXTENSIONS.includes(ext as 'pptx' | 'pdf')) {
    return {
      valid: false,
      error: 'Format file tidak diizinkan. Harap gunakan berkas presentasi .pptx atau dokumen .pdf.',
    };
  }

  // 2. Validasi ukuran
  if (file.size === 0) {
    return { valid: false, error: 'Berkas yang diunggah kosong (0 bytes).' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: `Ukuran berkas melebihi batas maksimal ${MAX_UPLOAD_LABEL}.` };
  }

  // 3. Validasi Magic Bytes biner
  const magicCheck = await checkMagicBytes(file);
  if (!magicCheck.valid) {
    return { valid: false, error: magicCheck.error };
  }

  // 4. Deteksi Proteksi Kata Sandi pada PDF
  if (magicCheck.ext === 'pdf') {
    const encCheck = await checkPdfEncryption(file);
    if (encCheck.encrypted) {
      return { valid: false, error: encCheck.error };
    }
  }

  // 5. Hitung hash SHA-256 untuk sidik jari isi berkas
  let hash = '';
  try {
    hash = await computeFileSha256(file);
  } catch {
    // Jika Web Crypto gagal pada runtime tertentu, tetap loloskan dengan hash kosong
    hash = '';
  }

  return {
    valid: true,
    ext: magicCheck.ext,
    hash,
  };
}
