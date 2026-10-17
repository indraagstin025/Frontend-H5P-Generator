/**
 * File pilihan di modal "Bikin materi baru": disimpan sementara di memori
 * (tidak bisa lewat router state karena File tidak serializable tapi tetap
 * bisa — singleton lebih aman dari remount/StrictMode).
 * Studio mengambilnya sekali saat mount (peek non-destruktif + take).
 */

let pending: File | null = null;

export function setPendingFile(file: File | null): void {
  pending = file;
}

export function peekPendingFile(): File | null {
  return pending;
}

export function takePendingFile(): void {
  pending = null;
}
