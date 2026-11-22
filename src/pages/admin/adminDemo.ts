export type AdminRole = 'ADMIN' | 'USER';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  projects: { id: string; title: string; slideCount: number; createdAt: string }[];
}

export const DEMO_ADMIN_ID = 'demo-admin';

// Fixture tampilan saja. Tidak mewakili akun atau materi di server.
export const adminDemoUsers: AdminUser[] = [
  { id: DEMO_ADMIN_ID, name: 'Administrator H5P', email: 'admin@h5p.local', role: 'ADMIN', isActive: true, createdAt: '2026-10-01', projects: [] },
  { id: 'demo-user', name: 'Pengguna H5P', email: 'user@h5p.local', role: 'USER', isActive: true, createdAt: '2026-10-01', projects: [] },
];

export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
