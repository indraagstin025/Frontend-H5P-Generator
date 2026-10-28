import type { RefObject } from 'react';
import { Cross2Icon, MagnifyingGlassIcon, PlusIcon } from '@radix-ui/react-icons';

interface HomeTopbarProps {
  tab: 'dashboard' | 'materi';
  query: string;
  onQueryChange: (q: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onOpenNewModal: () => void;
}

export function HomeTopbar({
  tab,
  query,
  onQueryChange,
  searchInputRef,
  onOpenNewModal,
}: HomeTopbarProps) {
  return (
    <header className="db-topbar">
      <div className="db-topbar-title">
        <h1>{tab === 'dashboard' ? 'Dashboard' : 'Materi saya'}</h1>
        <p>
          {tab === 'dashboard'
            ? 'Ringkasan materi, riwayat ekspor, dan akses cepat ke ruang kerja.'
            : 'Kelola materi tersimpan, cari, gandakan, atau buka kembali berkas .h5p.'}
        </p>
      </div>

      <div className="db-tools">
        {tab === 'dashboard' && (
          <div className="db-search">
            <MagnifyingGlassIcon aria-hidden="true" />
            <label
              htmlFor="db-search"
              style={{
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                clip: 'rect(0 0 0 0)',
              }}
            >
              Cari materi
            </label>
            <input
              ref={searchInputRef}
              id="db-search"
              type="search"
              placeholder="Cari judul materi atau berkas..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
            {query ? (
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  color: 'var(--db-muted)',
                }}
                onClick={() => onQueryChange('')}
                aria-label="Bersihkan pencarian"
              >
                <Cross2Icon />
              </button>
            ) : (
              <kbd className="db-kbd">⌘K</kbd>
            )}
          </div>
        )}

        <button
          type="button"
          className="db-topbar-btn"
          aria-label="Buat materi baru"
          onClick={onOpenNewModal}
        >
          <PlusIcon />
          <span>Materi baru</span>
        </button>

        <span className="db-avatar" title="Akun Pemateri" aria-hidden="true">
          P
        </span>
      </div>
    </header>
  );
}
