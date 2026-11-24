import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { EyeClosedIcon, EyeOpenIcon, UploadIcon } from '@radix-ui/react-icons';
import { useAuth } from '../context/AuthContext';
import { uploadProfileAvatar } from '../services/authService';
import { formatNetworkError, isBrowserOffline } from '../services/network';
import { AvatarCropDialog } from '../components/UI/AvatarCropDialog';
import './LandingPage.css';
import './LoginPage.css';
import './CompleteProfilePage.css';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, completeProfile, logout } = useAuth();

  const [name, setName] = useState(() => user?.name ?? '');
  const [birthDate, setBirthDate] = useState(() => user?.birthDate ?? '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(() => user?.avatarUrl ?? null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      navigate('/admin/users', { replace: true });
    }
  }, [user?.role, navigate]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setErrorMsg('Foto profil harus berupa file PNG, JPG, atau WEBP.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setErrorMsg('Ukuran foto profil maksimal 5 MB.');
      return;
    }

    setErrorMsg('');
    setCropFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      setErrorMsg('Nama lengkap wajib diisi antara 2 hingga 100 karakter.');
      return;
    }
    if (!birthDate) {
      setErrorMsg('Tanggal lahir wajib diisi.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Kata sandi baru wajib diisi.');
      return;
    }
    if (newPassword.length > 0) {
      if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
        setErrorMsg('Kata sandi baru minimal 8 karakter dan wajib mengandung kombinasi huruf dan angka.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi kata sandi baru tidak cocok.');
        return;
      }
    }

    if (isBrowserOffline()) {
      setErrorMsg('Koneksi internet terputus. Hubungkan kembali jaringan Anda lalu coba simpan ulang.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (avatarFile) {
        await uploadProfileAvatar(avatarFile);
      }
      await completeProfile({
        name: cleanName,
        birthDate,
        ...(newPassword ? { newPassword } : {}),
      });
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !document.startViewTransition) {
        navigate('/dashboard', { replace: true });
        return;
      }
      document.documentElement.classList.add('login-pull-transition');
      const transition = document.startViewTransition(() => {
        flushSync(() => navigate('/dashboard', { replace: true }));
      });
      void transition.ready.then(() => {
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
        document.documentElement.animate(frames, { duration: 1600, delay: 300, easing: 'ease-in-out', fill: 'forwards', pseudoElement: '::view-transition-old(root)' });
      }).catch(() => {});
      void transition.finished.catch(() => {}).finally(() => document.documentElement.classList.remove('login-pull-transition'));
    } catch (err) {
      setErrorMsg(formatNetworkError(err, 'Gagal menyimpan profil. Silakan coba lagi.'));
      setSubmitting(false);
    }
  }

  const initials = (name.trim() || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <main className="complete-profile-page">
      <div className="login-background-ornaments complete-profile-mobile-ornaments" aria-hidden="true">
        <span className="login-ornament login-ornament-square" />
        <span className="login-ornament login-ornament-circle" />
        <span className="login-ornament login-ornament-triangle" />
        <span className="login-ornament login-ornament-ring" />
        <span className="login-ornament login-ornament-upper-ring" />
        <span className="login-ornament login-ornament-capsule" />
      </div>
      <div className="landing-hero-brand-row login-logo-row complete-profile-mobile-brand">
        <Link className="landing-hero-brand" to="/" aria-label="H5P Generator, beranda">
          <span className="landing-hero-logo"><img src="/landing-logo.png" alt="" /></span>
          <span className="landing-hero-brand-text"><strong>H5P Generator</strong><span>Ruang kreasi pembelajaran</span></span>
        </Link>
      </div>
      {cropFile && <AvatarCropDialog file={cropFile} onCancel={() => setCropFile(null)} onApply={(file) => { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); setCropFile(null); }} />}
      <section className="complete-profile-card" aria-labelledby="complete-profile-title">
        <header className="complete-profile-header">
          <div className="complete-profile-brand">
            <img src="/landing-logo.png" alt="" />
            <span>H5P Generator</span>
          </div>
          <button type="button" className="complete-profile-logout" onClick={logout}>
            Keluar
          </button>
        </header>

        <h1 id="complete-profile-title">Lengkapi Profil Akun Anda</h1>
        <p className="complete-profile-subtitle">
          Akun Google <strong>{user?.email}</strong> sudah aktif. Lengkapi data diri Anda agar dapat masuk menggunakan
          Google maupun form login Email &amp; Kata Sandi.
        </p>

        <form onSubmit={handleSubmit} className="complete-profile-form" noValidate>
          <div className="complete-profile-avatar-row">
            <div className="complete-profile-avatar-preview" aria-hidden="true">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview foto profil" referrerPolicy="no-referrer" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="complete-profile-avatar-actions">
              <label htmlFor="profile-avatar-input" className="complete-profile-avatar-label">
                Foto Profil
              </label>
              <input
                ref={fileInputRef}
                id="profile-avatar-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="complete-profile-file-hidden"
              />
              <button
                type="button"
                className="complete-profile-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon /> {avatarFile ? 'Ganti Foto Lain' : 'Unggah Foto Profil'}
              </button>
              <small>PNG, JPG, atau WEBP maksimal 5 MB. Opsional jika ingin memakai foto Google.</small>
            </div>
          </div>

          <div className="complete-profile-field">
            <label htmlFor="profile-name">Nama Lengkap</label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="complete-profile-field">
            <label htmlFor="profile-birthdate">Tanggal Lahir</label>
            <input
              id="profile-birthdate"
              type="date"
              value={birthDate}
              max={todayIso}
              min="1900-01-01"
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>

          <div className="complete-profile-password-section">
            <div className="complete-profile-field">
              <label htmlFor="profile-new-password">Set Kata Sandi</label>
              <div className="complete-profile-password-wrap">
                <input
                  id="profile-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Wajib minimal 8 karakter"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  aria-label={showNewPassword ? 'Sembunyikan kata sandi baru' : 'Tampilkan kata sandi baru'}
                >
                  {showNewPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
              </div>
            </div>

            {newPassword.length > 0 && (
              <div className="complete-profile-field">
                <label htmlFor="profile-confirm-password">Konfirmasi Kata Sandi Baru</label>
                <input
                  id="profile-confirm-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="complete-profile-error" role="alert">
              {errorMsg}
            </div>
          )}

          <button type="submit" className="edu-btn-primary complete-profile-submit" disabled={submitting}>
            {submitting ? 'Menyimpan Profil…' : 'Simpan & Masuk ke Dashboard'}
          </button>
        </form>
      </section>
    </main>
  );
}
