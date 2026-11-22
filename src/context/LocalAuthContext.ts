import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AdminUser } from '../pages/admin/adminDemo';

export interface LocalAuthState {
  user: AdminUser | null;
  users: AdminUser[];
  setUsers: Dispatch<SetStateAction<AdminUser[]>>;
  setSessionUserId: Dispatch<SetStateAction<string | null>>;
  logout: () => void;
}

export const LocalAuthContext = createContext<LocalAuthState | null>(null);
