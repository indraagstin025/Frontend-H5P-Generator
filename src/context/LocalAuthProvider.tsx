import { useState, type ReactNode } from 'react';
import { LocalAuthContext } from './LocalAuthContext';
import { adminDemoUsers, type AdminUser } from '../pages/admin/adminDemo';

// Sesi tetap kosong sampai callback Google dan verifikasi server diintegrasikan.
export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AdminUser[]>(() => structuredClone(adminDemoUsers));
  const [currentId, setSessionUserId] = useState<string | null>(null);
  const user = users.find((entry) => entry.id === currentId && entry.isActive) ?? null;

  return <LocalAuthContext.Provider value={{ user, users, setUsers, setSessionUserId, logout: () => setSessionUserId(null) }}>{children}</LocalAuthContext.Provider>;
}
