import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Cross2Icon,
  MagnifyingGlassIcon,
  PersonIcon,
  ReloadIcon,
} from '@radix-ui/react-icons';
import { useAuth } from '../../context/AuthContext';
import {
  deleteAdminUser,
  fetchAdminUsers,
  formatAdminDate,
  updateAdminUserRole,
  updateAdminUserStatus,
  type AdminRoleFilter,
  type AdminStatusFilter,
  type AdminUserRecord,
  type AdminUsersSummary,
} from '../../services/adminService';
import './AdminUsersPage.css';

type UserAction = 'role' | 'status' | 'delete';
type ModalState = { kind: UserAction; user: AdminUserRecord };

const PAGE_SIZE = 10;

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status')?.toUpperCase();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [role, setRole] = useState<AdminRoleFilter>('ALL');
  const [status, setStatus] = useState<AdminStatusFilter>(
    initialStatus === 'ACTIVE' || initialStatus === 'BLOCKED' ? initialStatus : 'ALL',
  );
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [summary, setSummary] = useState<AdminUsersSummary>({
    totalUsers: 0,
    activeUsers: 0,
    adminCount: 0,
  });
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadNonce, setReloadNonce] = useState(0);

  const [modal, setModal] = useState<ModalState | null>(null);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [notice, setNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const previous = document.title;
    document.title = 'Kelola Pengguna | H5P Generator';
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setLoadError('');
      void fetchAdminUsers({
        q: debouncedQuery,
        role,
        status,
        page,
        limit: PAGE_SIZE,
        signal: controller.signal,
      })
        .then((res) => {
          if (controller.signal.aborted) return;
          setUsers(res.data ?? []);
          setTotalFiltered(res.pagination?.total ?? 0);
          setTotalPages(Math.max(1, res.pagination?.totalPages ?? 1));
          setSummary(
            res.summary ?? {
              totalUsers: res.pagination?.total ?? 0,
              activeUsers: (res.data ?? []).filter((u) => u.isActive).length,
              adminCount: (res.data ?? []).filter((u) => u.role === 'ADMIN').length,
            },
          );
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setLoadError(err instanceof Error ? err.message : 'Gagal memuat daftar pengguna.');
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [debouncedQuery, role, status, page, reloadNonce]);

  useEffect(() => {
    if (modal && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }, [modal]);

  const closeModal = useCallback(() => {
    dialogRef.current?.close();
    setModal(null);
    setModalError('');
    setSubmitting(false);
    triggerRef.current?.focus();
  }, []);

  const openModal = (kind: UserAction, targetUser: AdminUserRecord) => {
    triggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setDeleteEmail('');
    setModalError('');
    setModal({ kind, user: targetUser });
  };

  const confirmAction = async () => {
    if (!modal || submitting) return;
    const { user: targetUser, kind } = modal;
    if (targetUser.id === currentUser?.id) return;
    if (kind === 'delete' && deleteEmail.trim().toLowerCase() !== targetUser.email.toLowerCase()) return;

    setSubmitting(true);
    setModalError('');
    try {
      if (kind === 'delete') {
        await deleteAdminUser(targetUser.id);
        setNotice({ text: `Akun ${targetUser.name} (${targetUser.email}) telah dihapus.` });
      } else if (kind === 'status') {
        const nextActive = !targetUser.isActive;
        await updateAdminUserStatus(targetUser.id, nextActive);
        setNotice({
          text: `${targetUser.name} berhasil ${nextActive ? 'diaktifkan kembali' : 'diblokir'}.`,
        });
      } else {
        const nextRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
        await updateAdminUserRole(targetUser.id, nextRole);
        setNotice({
          text: `Peran ${targetUser.name} berhasil diubah menjadi ${nextRole === 'ADMIN' ? 'Admin' : 'Pengguna'}.`,
        });
      }
      closeModal();
      setReloadNonce((n) => n + 1);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Tindakan gagal dijalankan.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setQuery('');
    setDebouncedQuery('');
    setRole('ALL');
    setStatus('ALL');
    setPage(1);
  };

  const modalTitle = !modal
    ? ''
    : modal.kind === 'delete'
      ? 'Hapus akun pengguna?'
      : modal.kind === 'status'
        ? modal.user.isActive
          ? 'Blokir pengguna?'
          : 'Buka blokir pengguna?'
        : modal.user.role === 'ADMIN'
          ? 'Turunkan ke Pengguna?'
          : 'Jadikan Administrator?';

  const startIndex = totalFiltered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(page * PAGE_SIZE, totalFiltered);

  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Kelola pengguna</h1>
          <p>Kelola akun, peran, dan akses pengguna H5P Generator.</p>
        </div>
        <button
          type="button"
          className="admin-button"
          disabled={loading}
          onClick={() => setReloadNonce((n) => n + 1)}
        >
          <ReloadIcon aria-hidden="true" /> Muat ulang
        </button>
      </div>

      <section className="admin-summary" aria-label="Ringkasan data pengguna">
        <div>
          <span>Total pengguna</span>
          <strong>{summary.totalUsers}</strong>
          <small>Terdaftar di sistem</small>
        </div>
        <div>
          <span>Pengguna aktif</span>
          <strong>{summary.activeUsers}</strong>
          <small>Dapat mengakses aplikasi</small>
        </div>
        <div>
          <span>Administrator</span>
          <strong>{summary.adminCount}</strong>
          <small>Memiliki peran admin</small>
        </div>
      </section>

      {notice && (
        <div className={`admin-notice ${notice.isError ? 'is-error' : ''}`} role="status">
          <span>{notice.text}</span>
          <button type="button" aria-label="Tutup pemberitahuan" onClick={() => setNotice(null)}>
            <Cross2Icon aria-hidden="true" />
          </button>
        </div>
      )}

      <section className="admin-directory" aria-labelledby="directory-title">
        <div className="admin-directory-heading">
          <div>
            <h2 id="directory-title">Daftar pengguna</h2>
            <p>Tinjau akun dan kelola hak akses serta status aktifnya.</p>
          </div>
          <span className="admin-data-label">{totalFiltered} akun cocok</span>
        </div>

        <div className="admin-filters">
          <label className="admin-search">
            Cari pengguna
            <span>
              <MagnifyingGlassIcon aria-hidden="true" />
              <input
                type="search"
                placeholder="Cari nama atau email…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </span>
          </label>
          <label>
            Peran
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as AdminRoleFilter);
                setPage(1);
              }}
            >
              <option value="ALL">Semua peran</option>
              <option value="ADMIN">Admin</option>
              <option value="USER">Pengguna</option>
            </select>
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as AdminStatusFilter);
                setPage(1);
              }}
            >
              <option value="ALL">Semua status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="BLOCKED">Diblokir</option>
            </select>
          </label>
        </div>

        {loadError ? (
          <div className="admin-state" role="alert">
            <PersonIcon aria-hidden="true" />
            <h3>Gagal memuat data pengguna</h3>
            <p>{loadError}</p>
            <button type="button" className="admin-button" onClick={() => setReloadNonce((n) => n + 1)}>
              Coba lagi
            </button>
          </div>
        ) : loading && users.length === 0 ? (
          <div className="admin-state" role="status">
            <PersonIcon aria-hidden="true" />
            <h3>Memuat daftar pengguna…</h3>
            <p>Mengambil data akun terbaru dari server.</p>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-state">
            <PersonIcon aria-hidden="true" />
            <h3>{query || role !== 'ALL' || status !== 'ALL' ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna'}</h3>
            <p>
              {query || role !== 'ALL' || status !== 'ALL'
                ? 'Coba kata pencarian lain atau atur ulang filter.'
                : 'Akun pengguna akan ditampilkan di sini setelah tersedia.'}
            </p>
            {(query || role !== 'ALL' || status !== 'ALL') && (
              <button type="button" className="admin-button" onClick={resetFilters}>
                Tampilkan semua pengguna
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption className="admin-visually-hidden">Daftar akun pengguna H5P Generator</caption>
                <thead>
                  <tr>
                    <th scope="col">Pengguna</th>
                    <th scope="col">Peran</th>
                    <th scope="col">Status</th>
                    <th scope="col">Bergabung</th>
                    <th scope="col">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((entry) => {
                    const isSelf = entry.id === currentUser?.id;
                    return (
                      <tr key={entry.id}>
                        <td data-label="Pengguna">
                          <div className="admin-user">
                            <span className="admin-initial" aria-hidden="true">
                              {entry.role === 'ADMIN' ? 'AD' : 'PD'}
                            </span>
                            <span>
                              <strong>
                                {entry.name} {isSelf && <small className="admin-self">(Anda)</small>}
                              </strong>
                              <small>{entry.email}</small>
                            </span>
                          </div>
                        </td>
                        <td data-label="Peran">
                          <span className={`admin-role ${entry.role === 'ADMIN' ? 'is-admin' : ''}`}>
                            {entry.role === 'ADMIN' ? 'Admin' : 'Pengguna'}
                          </span>
                        </td>
                        <td data-label="Status">
                          <span className={`admin-status ${entry.isActive ? '' : 'is-blocked'}`}>
                            {entry.isActive ? 'Aktif' : 'Diblokir'}
                          </span>
                        </td>
                        <td data-label="Bergabung">{formatAdminDate(entry.createdAt)}</td>
                        <td data-label="Tindakan">
                          <div className="admin-row-actions">
                            <button
                              type="button"
                              disabled={isSelf}
                              title={isSelf ? 'Peran akun sendiri tidak dapat diubah' : undefined}
                              onClick={() => openModal('role', entry)}
                              aria-label={`${entry.role === 'ADMIN' ? 'Jadikan Pengguna' : 'Jadikan Admin'} untuk ${entry.name}`}
                            >
                              {entry.role === 'ADMIN' ? 'Jadikan Pengguna' : 'Jadikan Admin'}
                            </button>
                            <button
                              type="button"
                              disabled={isSelf}
                              title={isSelf ? 'Akun sendiri tidak dapat diblokir' : undefined}
                              onClick={() => openModal('status', entry)}
                              aria-label={`${entry.isActive ? 'Blokir' : 'Buka blokir'} ${entry.name}`}
                            >
                              {entry.isActive ? 'Blokir' : 'Buka blokir'}
                            </button>
                            <button
                              type="button"
                              className="admin-danger-text"
                              disabled={isSelf}
                              title={isSelf ? 'Akun sendiri tidak dapat dihapus' : undefined}
                              onClick={() => openModal('delete', entry)}
                              aria-label={`Hapus ${entry.name}`}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="admin-pagination">
              <span>
                {startIndex}–{endIndex} dari {totalFiltered} pengguna
              </span>
              <nav aria-label="Paginasi pengguna">
                <button
                  type="button"
                  className="admin-button"
                  aria-label="Halaman sebelumnya"
                  disabled={page === 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeftIcon aria-hidden="true" />
                </button>
                <span aria-live="polite">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="admin-button"
                  aria-label="Halaman berikutnya"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRightIcon aria-hidden="true" />
                </button>
              </nav>
            </div>
          </>
        )}
      </section>

      <dialog
        ref={dialogRef}
        className="admin-dialog"
        aria-labelledby="admin-dialog-title"
        onCancel={(event) => {
          event.preventDefault();
          if (!submitting) closeModal();
        }}
        onClick={(event) => {
          if (submitting || event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          ) {
            closeModal();
          }
        }}
      >
        {modal && (
          <>
            <div className="admin-dialog-heading">
              <h2 id="admin-dialog-title">{modalTitle}</h2>
              <button
                type="button"
                className="admin-button"
                aria-label="Tutup dialog"
                disabled={submitting}
                onClick={closeModal}
              >
                <Cross2Icon aria-hidden="true" />
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void confirmAction();
              }}
            >
              <p>
                <strong>{modal.user.name}</strong>
                <br />
                {modal.user.email}
              </p>
              {modal.kind === 'delete' ? (
                <>
                  <p>
                    Akun ini akan dihapus permanen dari sistem (materi miliknya tidak lagi memiliki pemilik akun ini).
                    Untuk mengonfirmasi, ketik alamat email pengguna di bawah ini.
                  </p>
                  <label>
                    Email konfirmasi
                    <input
                      type="email"
                      value={deleteEmail}
                      onChange={(event) => setDeleteEmail(event.target.value)}
                      placeholder={modal.user.email}
                      required
                      autoComplete="off"
                    />
                  </label>
                </>
              ) : modal.kind === 'status' ? (
                <p>
                  {modal.user.isActive
                    ? 'Pengguna yang diblokir tidak dapat login ataupun mengakses API dengan token aktifnya.'
                    : 'Pengguna akan diaktifkan kembali dan dapat masuk seperti semula.'}
                </p>
              ) : (
                <p>
                  {modal.user.role === 'ADMIN'
                    ? 'Pengguna ini akan diturunkan menjadi Pengguna biasa dan kehilangan akses ke panel Administrator.'
                    : 'Pengguna ini akan diberikan hak akses penuh sebagai Administrator sistem.'}
                </p>
              )}

              {modalError && (
                <p className="admin-modal-error" role="alert">
                  {modalError}
                </p>
              )}

              <div className="admin-dialog-actions">
                <button type="button" className="admin-button" disabled={submitting} onClick={closeModal}>
                  Batal
                </button>
                <button
                  type="submit"
                  className={`admin-button ${
                    modal.kind === 'delete' || (modal.kind === 'status' && modal.user.isActive)
                      ? 'admin-danger'
                      : 'admin-primary'
                  }`}
                  disabled={
                    submitting ||
                    (modal.kind === 'delete' && deleteEmail.trim().toLowerCase() !== modal.user.email.toLowerCase())
                  }
                >
                  {submitting
                    ? 'Memproses…'
                    : modal.kind === 'delete'
                      ? 'Hapus akun'
                      : modal.kind === 'status'
                        ? modal.user.isActive
                          ? 'Blokir pengguna'
                          : 'Buka blokir'
                        : modal.user.role === 'ADMIN'
                          ? 'Jadikan Pengguna'
                          : 'Jadikan Admin'}
                </button>
              </div>
            </form>
          </>
        )}
      </dialog>
    </>
  );
}
