import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons';
import './LandingPage.css';
import './LoginPage.css';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailTooltipOpen, setEmailTooltipOpen] = useState(false);

  function validateEmail(input: HTMLInputElement) {
    const error = !input.value
      ? 'Email wajib diisi.'
      : input.validity.typeMismatch || !/^[^\s@]+@gmail\.com$/i.test(input.value)
        ? 'Email harus dalam format nama@gmail.com.'
        : '';
    input.setCustomValidity(error);
    setEmailError(error);
    setEmailTooltipOpen(Boolean(error));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <main className="edu-landing login-page">
      <section className="login-story" aria-label="H5P Generator">
        <Link className="edu-brand" to="/">
          <span className="login-brand-logo"><img src="/landing-logo.png" alt="" /></span>
          <span className="edu-brand-title">H5P Generator</span>
        </Link>
        <div className="login-story-copy">
          <span className="login-eyebrow">Ruang kreasi pembelajaran</span>
          <h1>Materi Anda,<br /><span>lebih interaktif.</span></h1>
          <p>Siapkan materi pembelajaran dalam format H5P untuk LMS Anda.</p>
        </div>
      </section>
      <section className="login-form-panel" aria-labelledby="login-title">
        <Link to="/" className="login-back"><ArrowLeftIcon /> Kembali ke beranda</Link>
        <div className="login-card">
          <h2 id="login-title">Login ke akun Anda</h2>
          <form aria-describedby="login-availability" onSubmit={handleSubmit} onChange={() => setMessage('')}>
            <label htmlFor="login-email">Email</label>
            <div className="login-email-field">
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="nama@gmail.com"
              pattern={'[^\\s@]+@[gG][mM][aA][iI][lL]\\.[cC][oO][mM]'}
              required
              aria-invalid={Boolean(emailError)}
              aria-describedby={emailError && emailTooltipOpen ? 'login-email-error' : undefined}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setEmailTooltipOpen(false);
              }}
              onBlur={(event) => {
                if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.id === 'login-password') {
                  validateEmail(event.currentTarget);
                } else {
                  setEmailTooltipOpen(false);
                }
              }}
              onChange={(event) => {
                if (emailError) validateEmail(event.currentTarget);
              }}
              onInvalid={(event) => {
                event.preventDefault();
              }}
            />
            {emailError && emailTooltipOpen && (
              <div id="login-email-error" className="login-email-tooltip" role="alert">
                <span className="login-email-tooltip-icon" aria-hidden="true">!</span>
                <span><strong>Periksa alamat email</strong><span>{emailError}</span></span>
                <button type="button" className="login-email-tooltip-close" aria-label="Tutup pesan validasi" onClick={() => setEmailTooltipOpen(false)}>×</button>
              </div>
            )}
            </div>
            <label htmlFor="login-password">Kata sandi</label>
            <div className="login-password">
              <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Masukkan kata sandi" required />
              <button type="button" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}</button>
            </div>
            {/* TODO: Enable sign-in when authentication is available. */}
            <button className="edu-btn-primary login-submit" type="submit" disabled>Login belum tersedia</button>
          </form>
          <div className="login-divider"><span>atau</span></div>
          {/* TODO: Enable Google sign-in when authentication is available. */}
          <button className="login-google" type="button" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.89-1.74 2.98-4.3 2.98-7.36Z" />
              <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.61 0-4.83-1.76-5.62-4.13H3.04v2.59A10 10 0 0 0 12 22Z" />
              <path fill="#FBBC05" d="M6.38 13.92a6 6 0 0 1 0-3.84V7.49H3.04a10 10 0 0 0 0 9.02l3.34-2.59Z" />
              <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.49l3.34 2.59A5.98 5.98 0 0 1 12 5.95Z" />
            </svg>
            Google belum tersedia
          </button>
          {message && <div className="login-message" role="status">{message}</div>}
          <p className="login-help">Butuh akses akun? Hubungi administrator instansi Anda.</p>
        </div>
      </section>
    </main>
  );
}
