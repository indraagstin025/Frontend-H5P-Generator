import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && user.role !== 'ADMIN') return <main className="auth-denied"><h1>Akses khusus administrator</h1><p>Akun Anda memiliki peran Pengguna. Pengelolaan akun hanya tersedia untuk Admin.</p><Link to="/dashboard">Kembali ke dashboard</Link><button onClick={logout}>Keluar dari akun</button></main>;
  return children;
}
