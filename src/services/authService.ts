/**
 * Layanan autentikasi & manajemen sesi JWT di sisi klien (Frontend).
 * Mengelola token, profil pengguna, dan isolasi kunci penyimpanan per userId.
 */
import { apiFetch } from './api';

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseData {
  user: AuthUser;
  token: string;
}

export const AUTH_TOKEN_KEY = 'h5p-generator:auth-token:v1';
export const AUTH_USER_KEY = 'h5p-generator:auth-user:v1';

const LEGACY_PROJECTS_KEY = 'h5p-generator:projects:v1';
const LEGACY_EXPORTS_KEY = 'h5p-generator:exports:v1';
const LEGACY_CURRENT_PROJECT_KEY = 'h5p-generator:current-project';
const DISPLAY_NAME_KEY = 'h5p-generator:display-name';

export function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_KEY);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    if (
      !parsed ||
      typeof parsed.id !== 'string' ||
      typeof parsed.email !== 'string' ||
      typeof parsed.name !== 'string' ||
      (parsed.role !== 'USER' && parsed.role !== 'ADMIN')
    ) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      isActive: parsed.isActive !== false,
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : null,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : '',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

export function getProjectsStorageKey(userId?: string | null): string {
  const resolvedId = userId ?? getStoredUser()?.id ?? null;
  return resolvedId ? `${LEGACY_PROJECTS_KEY}:${resolvedId}` : `${LEGACY_PROJECTS_KEY}:guest`;
}

export function getExportsStorageKey(userId?: string | null): string {
  const resolvedId = userId ?? getStoredUser()?.id ?? null;
  return resolvedId ? `${LEGACY_EXPORTS_KEY}:${resolvedId}` : `${LEGACY_EXPORTS_KEY}:guest`;
}

export function getCurrentProjectSessionKey(userId?: string | null): string {
  const resolvedId = userId ?? getStoredUser()?.id ?? null;
  return resolvedId ? `${LEGACY_CURRENT_PROJECT_KEY}:${resolvedId}` : `${LEGACY_CURRENT_PROJECT_KEY}:guest`;
}

function getPendingSyncStorageKey(userId?: string | null): string {
  const resolvedId = userId ?? getStoredUser()?.id ?? null;
  return resolvedId ? `h5p-generator:pending-sync:${resolvedId}` : 'h5p-generator:pending-sync:guest';
}

export function loadPendingSyncIds(userId?: string | null): Set<string> {
  if (!userId) return new Set();
  try {
    const raw = localStorage.getItem(getPendingSyncStorageKey(userId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

export function addPendingSyncId(userId: string | null | undefined, projectId: string): void {
  if (!userId || !projectId) return;
  const set = loadPendingSyncIds(userId);
  set.add(projectId);
  try {
    localStorage.setItem(getPendingSyncStorageKey(userId), JSON.stringify([...set]));
  } catch {
    // Abaikan jika penyimpanan penuh
  }
}

export function removePendingSyncId(userId: string | null | undefined, projectId: string): void {
  if (!userId || !projectId) return;
  const set = loadPendingSyncIds(userId);
  if (!set.delete(projectId)) return;
  try {
    localStorage.setItem(getPendingSyncStorageKey(userId), JSON.stringify([...set]));
  } catch {
    // Abaikan jika penyimpanan dibatasi
  }
}

export function setAuthSession(token: string, user: AuthUser): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    // Hapus cache warisan tanpa userId agar tidak bocor ke akun yang baru login
    localStorage.removeItem(LEGACY_PROJECTS_KEY);
    localStorage.removeItem(LEGACY_EXPORTS_KEY);
    sessionStorage.removeItem(LEGACY_CURRENT_PROJECT_KEY);
    sessionStorage.setItem(DISPLAY_NAME_KEY, user.name);
  } catch {
    // Abaikan jika browser membatasi akses storage
  }
  window.dispatchEvent(new CustomEvent('h5p:auth-changed'));
}

export function clearAuthSession(): void {
  const prevUser = getStoredUser();
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(LEGACY_PROJECTS_KEY);
    localStorage.removeItem(LEGACY_EXPORTS_KEY);
    sessionStorage.removeItem(LEGACY_CURRENT_PROJECT_KEY);
    sessionStorage.removeItem(DISPLAY_NAME_KEY);
    if (prevUser?.id) {
      sessionStorage.removeItem(getCurrentProjectSessionKey(prevUser.id));
    }
  } catch {
    // Abaikan
  }
  window.dispatchEvent(new CustomEvent('h5p:auth-changed'));
}

export function notifyUnauthorized(): void {
  clearAuthSession();
  window.dispatchEvent(new CustomEvent('h5p:auth-unauthorized'));
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResponseData> {
  const res = await apiFetch<{ message: string; data: AuthResponseData }>('/auth/login', {
    method: 'POST',
    body: { email: email.trim().toLowerCase(), password },
  });
  setAuthSession(res.data.token, res.data.user);
  return res.data;
}

export async function registerWithEmail(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponseData> {
  const res = await apiFetch<{ message: string; data: AuthResponseData }>('/auth/register', {
    method: 'POST',
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      name: input.name.trim(),
    },
  });
  setAuthSession(res.data.token, res.data.user);
  return res.data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await apiFetch<{ data: AuthUser }>('/auth/me');
  return res.data;
}
