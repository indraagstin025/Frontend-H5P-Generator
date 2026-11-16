/**
 * Layanan API Admin RBAC untuk mengelola akun pengguna di PostgreSQL.
 * Seluruh endpoint memerlukan JWT milik pengguna dengan peran ADMIN.
 */
import { apiFetch } from './api';
import type { UserRole } from './authService';

export type AdminStatusFilter = 'ALL' | 'ACTIVE' | 'BLOCKED';
export type AdminRoleFilter = 'ALL' | UserRole;

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl: string | null;
  projectsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUsersSummary {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
}

export interface AdminUsersResponse {
  data: AdminUserRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: AdminUsersSummary;
}

export async function fetchAdminUsers(params: {
  q?: string;
  role?: AdminRoleFilter;
  status?: AdminStatusFilter;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<AdminUsersResponse> {
  const qs = new URLSearchParams();
  if (params.q?.trim()) qs.set('q', params.q.trim());
  if (params.role && params.role !== 'ALL') qs.set('role', params.role);
  if (params.status && params.status !== 'ALL') qs.set('status', params.status);
  qs.set('page', String(params.page ?? 1));
  qs.set('limit', String(params.limit ?? 10));

  return apiFetch<AdminUsersResponse>(`/admin/users?${qs.toString()}`, {
    signal: params.signal,
  });
}

export async function updateAdminUserRole(
  userId: string,
  role: UserRole,
): Promise<{ message: string; data: AdminUserRecord }> {
  return apiFetch<{ message: string; data: AdminUserRecord }>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });
}

export async function updateAdminUserStatus(
  userId: string,
  isActive: boolean,
): Promise<{ message: string; data: AdminUserRecord }> {
  return apiFetch<{ message: string; data: AdminUserRecord }>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: { isActive },
  });
}

export async function deleteAdminUser(userId: string): Promise<void> {
  await apiFetch<void>(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export function formatAdminDate(value: string): string {
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}
