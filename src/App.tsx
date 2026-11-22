import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { NetworkBanner } from './components/UI/NetworkBanner';
import { PageTransition } from './components/UI/PageTransition';
import { AuthProvider, ProtectedRoute, useAuth } from './context/AuthContext';
import { StudioProvider } from './context/StudioContext';
import { StudioView } from './features/studio/pages/StudioView';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCreateUserPage } from './pages/admin/AdminCreateUserPage';

function LandingRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const homePath = user?.role === 'ADMIN' ? '/admin/users' : '/dashboard';
  return <LandingPage onEnter={() => navigate(isAuthenticated ? homePath : '/login')} />;
}

function App() {
  return (
    <BrowserRouter>
      <PageTransition />
      <AuthProvider>
        <StudioProvider>
          <NetworkBanner />
          <Routes>
            <Route path="/" element={<LandingRoute />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Navigate to="/login" replace />} />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/materi"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/studio"
              element={
                <ProtectedRoute>
                  <StudioView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="users" replace />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/new" element={<AdminCreateUserPage />} />
              <Route path="*" element={<Navigate to="/admin/users" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
