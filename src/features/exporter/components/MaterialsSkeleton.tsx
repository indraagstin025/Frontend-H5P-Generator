import './MaterialsSkeleton.css';

export function MaterialsSkeleton({ variant }: { variant: 'recent' | 'table' }) {
  if (variant === 'recent') {
    return (
      <div className="materials-recent-grid" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div className="materials-recent-card materials-skeleton-card" key={index}>
            <div className="materials-skeleton materials-skeleton-preview" />
            <div className="materials-recent-body">
              <span className="materials-skeleton materials-skeleton-title" />
              <span className="materials-skeleton materials-skeleton-detail" />
              <div>
                <span className="materials-skeleton materials-skeleton-date" />
                <span className="materials-skeleton materials-skeleton-action" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="db-card db-table-wrap materials-table" aria-hidden="true">
      <table className="db-table">
        <thead><tr><th>Judul materi</th><th>Sumber</th><th>Komposisi</th><th>Terakhir diubah</th><th>Aksi</th></tr></thead>
        <tbody>
          {[0, 1, 2, 3, 4].map((index) => (
            <tr key={index}>
              <td><span className="materials-skeleton materials-skeleton-title" /><span className="materials-skeleton materials-skeleton-detail" /></td>
              <td><span className="materials-skeleton materials-skeleton-date" /></td>
              <td><span className="materials-skeleton materials-skeleton-detail" /></td>
              <td><span className="materials-skeleton materials-skeleton-detail" /></td>
              <td><span className="materials-skeleton materials-skeleton-action" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
