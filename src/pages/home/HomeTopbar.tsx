interface HomeTopbarProps {
  displayName: string;
  tab: 'dashboard' | 'materi';
}

export function HomeTopbar({
  displayName,
  tab,
}: HomeTopbarProps) {
  return (
    <header className="db-topbar">
      <div className="db-topbar-title">
        {tab === 'dashboard' && <span className="db-intro-eyebrow">Ruang untuk ide Anda</span>}
        <h1>{tab === 'dashboard' ? (displayName ? `Selamat datang, ${displayName}.` : 'Selamat datang.') : 'Materi Pembelajaran Saya'}</h1>
        <p>
          {tab === 'dashboard'
            ? 'Buat materi baru atau lanjutkan materi yang sudah Anda kerjakan.'
            : 'Kelola, cari materi tersimpan, gandakan, atau buka kembali berkas .h5p'}
        </p>
      </div>

      <div className="db-tools">
        <span className="db-avatar" title="Akun Pemateri" aria-hidden="true">
          P
        </span>
      </div>
    </header>
  );
}
