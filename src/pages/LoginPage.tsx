import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';
import { ArrowLeftIcon, EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons';
import './LandingPage.css';
import './LoginPage.css';
import './PublicPageMotion.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [enteringDashboard, setEnteringDashboard] = useState(false);

  const ornamentsRef = useRef<HTMLDivElement>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailTooltipOpen, setEmailTooltipOpen] = useState(false);

  useEffect(() => {
    const ornaments = ornamentsRef.current?.querySelectorAll<HTMLElement>('.login-ornament');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animations = new Set<Animation>();
    let stopped = false;

    function stop() {
      stopped = true;
      animations.forEach((animation) => animation.cancel());
      animations.clear();
    }

    function start() {
      stop();
      if (reducedMotion.matches) return;
      stopped = false;
      ornaments?.forEach((ornament) => {
        let position = { translate: '0px 0px', rotate: '0deg' };
        function move() {
          if (stopped) return;
          const next = {
            translate: `${Math.random() * 80 - 40}px ${Math.random() * 64 - 32}px`,
            rotate: `${Math.random() * 18 - 9}deg`,
          };
          const animation = ornament.animate([position, next], {
            duration: 3500 + Math.random() * 1500,
            easing: 'ease-in-out',
          });
          animations.add(animation);
          animation.onfinish = () => {
            animations.delete(animation);
            position = next;
            move();
          };
        }
        move();
      });
    }

    start();
    reducedMotion.addEventListener('change', start);
    return () => {
      stop();
      reducedMotion.removeEventListener('change', start);
    };
  }, []);

  function resetOrnaments(event: PointerEvent<HTMLElement>) {
    event.currentTarget.style.setProperty('--login-ornament-x', '0px');
    event.currentTarget.style.setProperty('--login-ornament-y', '0px');
  }

  function moveOrnaments(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--login-ornament-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 40}px`);
    event.currentTarget.style.setProperty('--login-ornament-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 30}px`);
  }

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
    if (enteringDashboard) return;
    const email = String(new FormData(event.currentTarget).get('email') ?? '').trim();
    const accountName = email.split('@')[0].replace(/[._-]+/g, ' ').trim();
    const displayName = accountName.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('id-ID'));
    try {
      sessionStorage.setItem('h5p-generator:display-name', displayName);
    } catch {
      // Navigation remains available when browser storage is disabled.
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate('/dashboard');
      return;
    }
    if (!document.startViewTransition) {
      navigate('/dashboard');
      return;
    }
    flushSync(() => setEnteringDashboard(true));
    document.documentElement.classList.add('login-pull-transition');
    const transition = document.startViewTransition(() => {
      flushSync(() => navigate('/dashboard'));
    });
    void transition.ready.then(() => {
      const duration = 1600;
      const frames = Array.from({ length: 65 }, (_, index) => {
        const progress = index / 64;
        const edge = 112 - progress * 124;
        const points = Array.from({ length: 81 }, (_, point) => {
          const x = point / 80 * 100;
          const y = edge + Math.sin(point / 80 * Math.PI * 4 + progress * Math.PI * 3) * 4;
          return `${x}% ${y}%`;
        });
        return { clipPath: `polygon(0% 0%, 100% 0%, ${points.reverse().join(', ')})` };
      });
      document.documentElement.animate(frames, {
        duration,
        delay: 300,
        easing: 'ease-in-out',
        fill: 'forwards',
        pseudoElement: '::view-transition-old(root)',
      });
    }).catch(() => {});
    void transition.finished.catch(() => {}).finally(() => {
      document.documentElement.classList.remove('login-pull-transition');
    });
  }

  return (
    <main className="edu-landing login-page" onPointerMove={moveOrnaments} onPointerLeave={resetOrnaments} onPointerCancel={resetOrnaments}>
        <div ref={ornamentsRef} className="login-background-ornaments" aria-hidden="true">
          <span className="login-ornament login-ornament-square" />
          <span className="login-ornament login-ornament-circle" />
          <span className="login-ornament login-ornament-triangle" />
          <span className="login-ornament login-ornament-ring" />
          <span className="login-ornament login-ornament-center-square" />
          <span className="login-ornament login-ornament-upper-ring" />
          <span className="login-ornament login-ornament-capsule" />
          <span className="login-ornament login-ornament-lower-circle" />
        </div>
      <div className="landing-hero-brand-row login-logo-row">
        <Link className="landing-hero-brand" to="/" aria-label="H5P Generator, beranda">
          <span className="landing-hero-logo"><img src="/landing-logo.png" alt="" /></span>
          <span className="landing-hero-brand-text"><strong>H5P Generator</strong><span>Ruang kreasi pembelajaran</span></span>
        </Link>
      </div>
      <section className="login-story" aria-label="H5P Generator">
        <div className="login-logo-reserved" aria-hidden="true" />
        <div className="login-story-copy landing-hero">
          <div className="landing-copy">
          <span className="landing-kicker">Ruang kreasi pembelajaran</span>
          <h1>Materi Anda,<br /><span>lebih interaktif.</span></h1>
          <p>Siapkan materi pembelajaran dalam format H5P untuk LMS Anda.</p>
          </div>
        </div>
      </section>
      <section className="login-form-panel" aria-labelledby="login-title">
        <Link to="/" className="login-back"><ArrowLeftIcon /> Kembali ke beranda</Link>
        <div className="login-card">
          <h2 id="login-title">Login ke akun Anda</h2>
          <form noValidate onSubmit={handleSubmit} onChange={() => setMessage('')}>
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
            {/* Temporary dashboard access until database authentication is connected. */}
            <button className="edu-btn-primary login-submit" type="submit" disabled={enteringDashboard} aria-busy={enteringDashboard}>
              {enteringDashboard ? 'Membuka dashboard…' : 'Login'}
            </button>
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
