import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/env';
import { updateUserProfile, uploadProfileAvatar, type AuthUser } from '../../services/authService';
import { formatNetworkError } from '../../services/network';
import { AvatarCropDialog } from '../../components/UI/AvatarCropDialog';
import './ProfileSettings.css';

export function ProfileSettings({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const { refreshUser } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(user.name);
  const [file, setFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => { dialogRef.current?.showModal(); }, []);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const avatar = preview ?? (user.avatarUrl?.startsWith('/api/') ? `${API_BASE_URL.replace(/\/api$/, '')}${user.avatarUrl}` : user.avatarUrl);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (name.trim().length < 2 || name.trim().length > 100) { setError('Nama harus terdiri dari 2 sampai 100 karakter.'); return; }
    if (file && (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) { setError('Foto harus PNG, JPG, atau WEBP dan maksimal 5 MB.'); return; }
    if (newPassword && (!currentPassword || newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || newPassword !== confirmPassword)) { setError('Masukkan kata sandi saat ini dan pastikan kata sandi baru cocok, minimal 8 karakter serta mengandung huruf dan angka.'); return; }
    setSaving(true);
    setError('');
    try {
      if (name.trim() !== user.name || newPassword) await updateUserProfile({ name, birthDate: user.birthDate, ...(newPassword ? { currentPassword, newPassword } : {}) });
      if (file) await uploadProfileAvatar(file);
      await refreshUser();
      onClose();
    } catch (err) {
      await refreshUser().catch(() => null);
      setError(formatNetworkError(err, 'Profil belum berhasil disimpan.'));
    } finally { setSaving(false); }
  }
  return <dialog ref={dialogRef} className="profile-settings" aria-labelledby="profile-settings-title" onCancel={(event) => { event.preventDefault(); if (!saving) onClose(); }}>
    <form onSubmit={save}>
      <div className="profile-settings-header"><h2 id="profile-settings-title">Pengaturan Profil</h2><button type="button" onClick={onClose} disabled={saving} aria-label="Tutup">×</button></div>
      <div className="profile-settings-avatar">{avatar ? <img src={avatar} alt="Foto profil" /> : <span>{name.charAt(0).toUpperCase()}</span>}<label>Ubah foto<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ''; if (!selected) return; if (!['image/png', 'image/jpeg', 'image/webp'].includes(selected.type) || selected.size > 5 * 1024 * 1024) { setError('Foto harus PNG, JPG, atau WEBP dan maksimal 5 MB.'); return; } setError(''); setCropFile(selected); }} /></label></div>
      <small>PNG, JPG, atau WEBP, maksimal 5 MB.</small>
      <label>Nama lengkap<input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} /></label>
      <label>Kata sandi saat ini<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
      <label>Kata sandi baru<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
      <label>Konfirmasi kata sandi baru<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
      <small>Kosongkan kolom kata sandi jika tidak ingin mengubahnya.</small>
      {error && <p role="alert" className="profile-settings-error">{error}</p>}
      <button type="submit" className="profile-settings-save" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</button>
    </form>
    {cropFile && <AvatarCropDialog file={cropFile} onCancel={() => setCropFile(null)} onApply={(cropped) => { setFile(cropped); setCropFile(null); }} />}
  </dialog>;
}
