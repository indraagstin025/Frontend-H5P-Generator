/**
 * Status validasi live ala panel Canva (Konten/Jawaban/Penilaian/Umpan balik
 * diganti pemeriksaan proyek nyata).
 */
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { getStudioChecks } from '../api/studioChecks';
import type { Project } from '../constants/h5pModel';

export function ValidationPanel({ project }: { project: Project }) {
  const checks = getStudioChecks(project);
  const passed = checks.filter((c) => c.ok).length;
  return (
    <section aria-label="Status validasi">
      <div className="st-checks-head">
        <h3>Status validasi</h3>
        <span className="st-checks-summary">
          {passed}/{checks.length} lolos
        </span>
      </div>
      <div className="st-checks">
        {checks.map((c) => (
          <div key={c.id} className={`check-row ${c.ok ? '' : 'st-bad'}`}>
            {c.ok ? <CheckIcon /> : <Cross2Icon />}
            <span>{c.label}</span>
          </div>
        ))}
      </div>
      <p className="st-note">Periksa lagi setelah mengubah isi. Daftar rinci ada di langkah Unduh.</p>
    </section>
  );
}
