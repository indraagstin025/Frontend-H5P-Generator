import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../services/api';
import { subscribeOnlineRecovery } from '../services/network';
import {
  clearAuthSession,
  fetchCurrentUser,
  getAuthToken,
  getStoredUser,
  loginWithEmail,
  registerWithEmail,
  setAuthSession,
  type AuthUser,
} from '../services/authService';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: { email: string; password: string; name: string }) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<AuthUser | null>(() => (getAuthToken() ? getStoredUser() : null));
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(getAuthToken() && !getStoredUser()));

  const syncFromStorage = useCallback(() => {
    const nextToken = getAuthToken();
    const nextUser = nextToken ? getStoredUser() : null;
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const activeToken = getAuthToken();
    if (!activeToken) {
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return null;
    }

    try {
      const freshUser = await fetchCurrentUser();
      setAuthSession(activeToken, freshUser);
      setToken(activeToken);
      setUser(freshUser);
      return freshUser;
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearAuthSession();
        setToken(null);
        setUser(null);
        return null;
      }
      // Jika jaringan ke backend terputus sesaat, pertahankan sesi lokal sementara
      const cached = getStoredUser();
      setUser(cached);
      return cached;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getAuthToken()) {
      void refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    const onAuthChanged = () => syncFromStorage();
    const onUnauthorized = () => {
      setToken(null);
      setUser(null);
      navigate('/login', { replace: true });
    };
    const unsubscribeRecovery = subscribeOnlineRecovery(() => {
      if (getAuthToken()) {
        void refreshUser();
      }
    });

    window.addEventListener('h5p:auth-changed', onAuthChanged);
    window.addEventListener('h5p:auth-unauthorized', onUnauthorized);
    return () => {
      unsubscribeRecovery();
      window.removeEventListener('h5p:auth-changed', onAuthChanged);
      window.removeEventListener('h5p:auth-unauthorized', onUnauthorized);
    };
  }, [navigate, refreshUser, syncFromStorage]);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    const data = await loginWithEmail(email, password);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (input: { email: string; password: string; name: string }): Promise<AuthUser> => {
      const data = await registerWithEmail(input);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, token, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return ctx;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="db-scope" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p className="muted">Memverifikasi sesi akun…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return (
      <main className="auth-denied" role="alert">
        <h1>Akses khusus administrator</h1>
        <p>
          Akun Anda memiliki peran Pengguna. Pengelolaan pengguna dan hak akses hanya tersedia untuk akun Administrator.
        </p>
        <div className="auth-denied-actions">
          <Link to="/dashboard" className="primary-button">
            Kembali ke dashboard
          </Link>
          <button type="button" className="secondary-button" onClick={logout}>
            Keluar dari akun
          </button>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
