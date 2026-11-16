import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PersonIcon, MagnifyingGlassIcon, Cross2Icon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { DEMO_ADMIN_ID as PREVIEW_ADMIN_ID, formatAdminDate, type AdminUser } from './adminDemo';
import { useAuth } from '../../context/useAuth';
import './AdminUsersPage.css';

type UserAction = 'status' | 'delete';
type Modal = { kind: UserAction; user: AdminUser };
const PAGE_SIZE = 5;

export function AdminUsersPage() {
  const { users, setUsers, user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const DEMO_ADMIN_ID = currentUser?.id ?? PREVIEW_ADMIN_ID;
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('ALL');
  const [status, setStatus] = useState(() => ['ACTIVE', 'BLOCKED'].includes(searchParams.get('status') ?? '') ? searchParams.get('status')! : 'ALL');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Modal | null>(null);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [notice, setNotice] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Kelola Pengguna | H5P Generator';
    return () => { document.title = previous; };
  }, []);

  useEffect(() => {
    if (modal && !dialogRef.current?.open) dialogRef.current?.showModal();
  }, [modal]);

  const filteredUsers = users.filter((user) => {
    const matchesQuery = `${user.name} ${user.email}`.toLocaleLowerCase('id-ID').includes(query.trim().toLocaleLowerCase('id-ID'));
    return matchesQuery && (role === 'ALL' || user.role === role) && (status === 'ALL' || user.isActive === (status === 'ACTIVE'));
  });
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function closeModal() {
    dialogRef.current?.close();
    setModal(null);
    triggerRef.current?.focus();
  }

  function openModal(kind: Modal['kind'], user: AdminUser) {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDeleteEmail('');
    setModal({ kind, user });
  }

  function confirmAction() {
    if (!modal) return;
    const { user, kind } = modal;
    if (user.id === DEMO_ADMIN_ID) return;
    if (kind === 'delete' && deleteEmail !== user.email) return;
    setUsers((previous) => kind === 'delete'
      ? previous.filter((entry) => entry.id !== user.id)
      : previous.map((entry) => entry.id !== user.id ? entry : {
        ...entry,
        isActive: !entry.isActive,
      }));
    setNotice(kind === 'delete'
      ? `${user.name} dihapus dari data contoh.`
      : `${user.name} ${user.isActive ? 'diblokir' : 'dibuka blokirnya'} pada data contoh.`);
    closeModal();
  }

  const modalTitle = modal?.kind === 'delete' ? 'Hapus akun pengguna?' : modal?.user.isActive ? 'Blokir pengguna?' : 'Buka blokir pengguna?';

  return (
    <>
          <div className="admin-heading"><div><h1>Kelola pengguna</h1><p>Kelola akun dan akses pengguna H5P Generator.</p></div></div>

          <section className="admin-summary" aria-label="Ringkasan data contoh">
            <div><span>Total pengguna</span><strong>{users.length}</strong><small>Akun contoh</small></div>
            <div><span>Pengguna aktif</span><strong>{users.filter((user) => user.isActive).length}</strong><small>Dari data contoh</small></div>
            <div><span>Administrator</span><strong>{users.filter((user) => user.role === 'ADMIN').length}</strong><small>Memiliki peran admin</small></div>
          </section>

          {notice && <div className="admin-notice" role="status"><span>{notice}</span><button aria-label="Tutup pemberitahuan" onClick={() => setNotice('')}><Cross2Icon aria-hidden="true" /></button></div>}

          <section className="admin-directory" aria-labelledby="directory-title">
            <div className="admin-directory-heading"><div><h2 id="directory-title">Daftar pengguna</h2><p>Tinjau akun dan kelola hak aksesnya.</p></div><span className="admin-data-label">Data contoh</span></div>
            <div className="admin-filters">
              <label className="admin-search">Cari pengguna<span><MagnifyingGlassIcon aria-hidden="true" /><input type="search" placeholder="Cari nama atau email…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></span></label>
              <label>Peran<select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }}><option value="ALL">Semua peran</option><option value="ADMIN">Admin</option><option value="USER">Pengguna</option></select></label>
              <label>Status<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="ALL">Semua status</option><option value="ACTIVE">Aktif</option><option value="BLOCKED">Diblokir</option></select></label>
            </div>

            {!filteredUsers.length ? <div className="admin-state"><PersonIcon aria-hidden="true" /><h3>{query || role !== 'ALL' || status !== 'ALL' ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna'}</h3><p>{query || role !== 'ALL' || status !== 'ALL' ? 'Coba kata pencarian lain atau atur ulang filter.' : 'Akun pengguna akan ditampilkan di sini setelah tersedia.'}</p><button className="admin-button" onClick={() => { setQuery(''); setRole('ALL'); setStatus('ALL'); }}>Tampilkan semua pengguna</button></div>
                  : <>
                    <div className="admin-table-wrap"><table className="admin-table"><caption className="admin-visually-hidden">Daftar akun contoh H5P Generator</caption><thead><tr><th scope="col">Pengguna</th><th scope="col">Peran</th><th scope="col">Status</th><th scope="col">Materi</th><th scope="col">Bergabung</th><th scope="col">Tindakan</th></tr></thead><tbody>{visibleUsers.map((user) => <tr key={user.id}>
                      <td data-label="Pengguna"><div className="admin-user"><span className="admin-initial" aria-hidden="true">{user.role === 'ADMIN' ? 'AD' : 'PD'}</span><span><strong>{user.name} {user.id === DEMO_ADMIN_ID && <small className="admin-self">(Anda)</small>}</strong><small>{user.email}</small></span></div></td>
                      <td data-label="Peran"><span className={`admin-role ${user.role === 'ADMIN' ? 'is-admin' : ''}`}>{user.role === 'ADMIN' ? 'Admin' : 'Pengguna'}</span></td>
                      <td data-label="Status"><span className={`admin-status ${user.isActive ? '' : 'is-blocked'}`}>{user.isActive ? 'Aktif' : 'Diblokir'}</span></td>
                      <td data-label="Materi">{user.projects.length} materi</td>
                      <td data-label="Bergabung">{formatAdminDate(user.createdAt)}</td>
                      <td data-label="Tindakan"><div className="admin-row-actions"><button disabled={user.id === DEMO_ADMIN_ID} title={user.id === DEMO_ADMIN_ID ? 'Akun sendiri tidak dapat diblokir' : undefined} onClick={() => openModal('status', user)} aria-label={`${user.isActive ? 'Blokir' : 'Buka blokir'} ${user.name}`}>{user.isActive ? 'Blokir' : 'Buka blokir'}</button><button className="admin-danger-text" disabled={user.id === DEMO_ADMIN_ID} title={user.id === DEMO_ADMIN_ID ? 'Akun sendiri tidak dapat dihapus' : undefined} onClick={() => openModal('delete', user)} aria-label={`Hapus ${user.name}`}>Hapus</button></div></td>
                    </tr>)}</tbody></table></div>
                    <div className="admin-pagination"><span>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} dari {filteredUsers.length} pengguna</span><nav aria-label="Paginasi pengguna"><button type="button" className="admin-button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeftIcon aria-hidden="true" /></button><span aria-live="polite">{currentPage} / {pageCount}</span><button type="button" className="admin-button" aria-label="Halaman berikutnya" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRightIcon aria-hidden="true" /></button></nav></div>
                  </>}
          </section>
      <dialog ref={dialogRef} className="admin-dialog" aria-labelledby="admin-dialog-title" onCancel={(event) => { event.preventDefault(); closeModal(); }} onClick={(event) => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeModal(); } }}>
        {modal && <><div className="admin-dialog-heading"><h2 id="admin-dialog-title">{modalTitle}</h2><button className="admin-button" aria-label="Tutup dialog" onClick={closeModal}><Cross2Icon aria-hidden="true" /></button></div>
          <form onSubmit={(event) => { event.preventDefault(); confirmAction(); }}>
            <p><strong>{modal.user.name}</strong><br />{modal.user.email}</p>
            {modal.kind === 'delete' ? <><p>Akun dan riwayat materinya akan dihapus dari daftar contoh. Untuk mengonfirmasi, ketik email pengguna.</p><label>Email konfirmasi<input type="email" value={deleteEmail} onChange={(event) => setDeleteEmail(event.target.value)} placeholder={modal.user.email} required autoComplete="off" /></label></>
                : <p>{modal.user.isActive ? 'Pengguna yang diblokir tidak dapat mengakses aplikasi setelah integrasi backend diterapkan.' : 'Pengguna akan kembali berstatus aktif.'}</p>}
            <p className="admin-modal-note">Simulasi lokal saja. Tidak ada perubahan pada akun sebenarnya.</p>
            <div className="admin-dialog-actions"><button type="button" className="admin-button" onClick={closeModal}>Batal</button><button type="submit" className={`admin-button ${modal.kind === 'delete' || (modal.kind === 'status' && modal.user.isActive) ? 'admin-danger' : 'admin-primary'}`} disabled={modal.kind === 'delete' && deleteEmail !== modal.user.email}>{modal.kind === 'delete' ? 'Hapus akun contoh' : modal.user.isActive ? 'Blokir pengguna' : 'Buka blokir'}</button></div>
          </form>
        </>}
      </dialog>
    </>
  );
}
