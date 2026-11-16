import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { PageTransition } from './components/UI/PageTransition';
import { StudioProvider } from './context/StudioContext';
import { StudioView } from './features/studio/pages/StudioView';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { LocalAuthProvider } from './context/LocalAuthProvider';
import { AdminLayout } from './pages/admin/AdminLayout';

function LandingRoute() {
  const navigate = useNavigate();
  return <LandingPage onEnter={() => navigate('/login')} />;
}

function App() {
  return (
    <BrowserRouter>
      <PageTransition />
      <LocalAuthProvider>
      <StudioProvider>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/materi" element={<HomePage />} />
          <Route path="/studio" element={<StudioView />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="*" element={<Navigate to="/admin/users" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StudioProvider>
      </LocalAuthProvider>
    </BrowserRouter>
  );
}

export default App;
