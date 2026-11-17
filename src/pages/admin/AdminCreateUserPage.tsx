import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircledIcon, EyeClosedIcon, EyeOpenIcon, PersonIcon, PlusIcon } from '@radix-ui/react-icons';
import { createAdminUser } from '../../services/adminService';
import { formatNetworkError } from '../../services/network';
import { FloatingShapes } from '../../components/UI/FloatingShapes';

export function AdminCreateUserPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ name: string; email: string } | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Tambah User | H5P Generator';
    return () => { document.title = previous; };
  }, []);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (created) successRef.current?.focus();
  }, [created]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    const password = String(data.get('password') ?? '');
    const confirmation = String(data.get('confirmation') ?? '');
    setError('');
    if (name.length < 2 || name.length > 100) {
      setError('Nama harus terdiri dari 2 hingga 100 karakter.');
      return;
    }
    if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(email) || email.includes('..') || email.startsWith('.') || email.includes('.@')) {
      setError('Gunakan alamat email nama@gmail.com yang valid.');
      return;
    }
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password harus terdiri dari 8–128 karakter dengan kombinasi huruf dan angka.');
      return;
    }
    if (password !== confirmation) {
      setError('Konfirmasi password belum sama dengan password.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createAdminUser({ name, email, password });
      form.reset();
      setShowPassword(false);
      setCreated({ name: result.data.name, email: result.data.email });
    } catch (err) {
      setError(formatNetworkError(err, 'Akun belum berhasil ditambahkan. Silakan coba lagi.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link to="/admin/users" className="admin-back"><ArrowLeftIcon aria-hidden="true" /> Kembali ke daftar pengguna</Link>
      <div className="admin-heading">
        <div><span className="admin-eyebrow">RUANG ADMINISTRASI</span><h1>Tambah User</h1><p>Buka akses belajar dan berkarya untuk pengguna baru.</p></div>
      </div>
      <div className="admin-create-layout">
        <section className="admin-create-card" aria-labelledby="create-user-title">
          {created ? (
            <div className="admin-created" role="status" tabIndex={-1} ref={successRef}>
              <CheckCircledIcon aria-hidden="true" />
              <h2 id="create-user-title">Akun berhasil ditambahkan!</h2>
              <p><strong>{created.name}</strong> kini dapat login dengan email <strong>{created.email}</strong> dan password yang baru dibuat.</p>
              <div className="admin-form-actions">
                <button type="button" className="admin-button" onClick={() => setCreated(null)}>Tambah user lagi</button>
                <button type="button" className="admin-button admin-primary" onClick={() => navigate('/admin/users')}>Lihat daftar pengguna</button>
              </div>
            </div>
          ) : (
            <>
              <div className="admin-create-heading"><span className="admin-form-icon"><PersonIcon aria-hidden="true" /></span><div><h2 id="create-user-title">Informasi pengguna</h2><p>Lengkapi data untuk membuat akun baru.</p></div></div>
              <form onSubmit={handleSubmit} className="admin-create-form" aria-busy={submitting}>
                {error && <div className="admin-modal-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</div>}
                <fieldset disabled={submitting}>
                  <label htmlFor="new-user-name">Nama lengkap</label>
                  <input id="new-user-name" name="name" autoComplete="name" placeholder="Nama lengkap pengguna" minLength={2} maxLength={100} required />
                  <label htmlFor="new-user-email">Email</label>
                  <input id="new-user-email" name="email" type="email" autoComplete="off" placeholder="nama@gmail.com" maxLength={254} aria-describedby="new-email-hint" required />
                  <small id="new-email-hint">Gunakan alamat email @gmail.com.</small>
                  <label htmlFor="new-user-password">Password</label>
                  <div className="admin-password-field">
                    <input id="new-user-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Buat password pengguna" minLength={8} maxLength={128} aria-describedby="new-password-hint" required />
                    <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword}>{showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}</button>
                  </div>
                  <small id="new-password-hint">Minimal 8 karakter, gunakan kombinasi huruf dan angka.</small>
                  <label htmlFor="new-user-confirmation">Konfirmasi password</label>
                  <input id="new-user-confirmation" name="confirmation" type="password" autoComplete="new-password" placeholder="Ketik ulang password" minLength={8} maxLength={128} required />
                  <div className="admin-form-actions">
                    <button type="button" className="admin-button" onClick={() => navigate('/admin/users')}>Batal</button>
                    <button type="submit" className="admin-button admin-primary"><PlusIcon aria-hidden="true" />{submitting ? 'Menyimpan…' : 'Tambah User'}</button>
                  </div>
                </fieldset>
              </form>
            </>
          )}
        </section>
        <aside className="admin-create-note floating-shapes-host">
          <FloatingShapes />
          <span className="admin-eyebrow">BELAJAR TANPA BATAS</span>
          <h2>Satu akun baru.<br />Banyak ide berikutnya.</h2>
          <p>Bantu pengguna memulai langkahnya membuat materi pembelajaran interaktif bersama H5P Generator.</p>
          <div className="admin-account-info"><CheckCircledIcon aria-hidden="true" /><div><strong>Siap digunakan</strong><p>Akun langsung aktif dengan peran User setelah disimpan.</p></div></div>
          <div className="admin-account-info"><PersonIcon aria-hidden="true" /><div><strong>Ruang berkarya pribadi</strong><p>Pengguna dapat membuat dan mengelola materi pembelajarannya sendiri.</p></div></div>
        </aside>
      </div>
    </>
  );
}
