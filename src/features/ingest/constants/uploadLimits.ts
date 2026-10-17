/**
 * Batas upload sumber materi (FR-01).
 * Jaga BYTES dan LABEL sinkron agar pesan error konsisten.
 */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = '50 MB';
export const MAX_SLIDES_PER_PROJECT = 60;
export const ALLOWED_EXTENSIONS = ['pptx', 'pdf'] as const;
