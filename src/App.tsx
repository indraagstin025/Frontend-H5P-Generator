import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { PageTransition } from './components/UI/PageTransition';
import { AuthProvider, ProtectedRoute, useAuth } from './context/AuthContext';
import { StudioProvider } from './context/StudioContext';
import { StudioView } from './features/studio/pages/StudioView';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';

function LandingRoute() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  return <LandingPage onEnter={() => navigate(isAuthenticated ? '/dashboard' : '/login')} />;
}

function App() {
  return (
    <BrowserRouter>
      <PageTransition />
      <AuthProvider>
        <StudioProvider>
          <Routes>
            <Route path="/" element={<LandingRoute />} />
            <Route path="/login" element={<LoginPage />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </StudioProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
