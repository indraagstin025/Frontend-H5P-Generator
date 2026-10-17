import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import { StudioProvider } from './context/StudioContext';
import { StudioView } from './features/studio/pages/StudioView';
import { HomePage } from './pages/HomePage';
import { LandingPage } from './pages/LandingPage';

function LandingRoute() {
  const navigate = useNavigate();
  return <LandingPage onEnter={() => navigate('/dashboard')} />;
}

function App() {
  return (
    <BrowserRouter>
      <StudioProvider>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/dashboard" element={<HomePage />} />
          <Route path="/materi" element={<HomePage />} />
          <Route path="/studio" element={<StudioView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StudioProvider>
    </BrowserRouter>
  );
}

export default App;
