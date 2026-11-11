import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './PageTransition.css';

function LogoLoader() {
  const [finished, setFinished] = useState(false);

  if (finished) return null;

  return (
    <div
      className="page-transition"
      role="status"
      aria-live="polite"
      aria-label="Memuat halaman"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) setFinished(true);
      }}
    >
      <div className="page-transition__content">
        <div className="page-transition__mark">
          <span className="page-transition__ring" aria-hidden="true" />
          <img src="/logo.png" alt="" className="page-transition__logo" />
        </div>
        <span className="page-transition__label">Memuat halaman…</span>
        <span className="page-transition__track" aria-hidden="true">
          <span />
        </span>
      </div>
    </div>
  );
}

export function PageTransition() {
  const { pathname } = useLocation();
  return <LogoLoader key={pathname} />;
}
