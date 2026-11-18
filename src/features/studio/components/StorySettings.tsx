/**
 * Tahap 2 — Struktur babak & navigasi storytelling (FR-04/05/06 + §5).
 */
import type { ProjectSettings } from '../constants/h5pModel';

type StorySettingsProps = {
  settings: ProjectSettings;
  onChange: (patch: Partial<ProjectSettings>) => void;
  onOpenAutoAdvance: () => void;
};

export function StorySettings({ settings, onChange, onOpenAutoAdvance }: StorySettingsProps) {
  return (
    <div>
      <div className="settings-grid">
        <label className="field-label">
          Ukuran slide (buat slide baru)
          <select value={settings.aspect} onChange={(e) => onChange({ aspect: e.target.value as '16:9' | '4:3' })}>
            <option value="16:9">16:9 — layar lebar</option>
            <option value="4:3">4:3 — kotak klasik</option>
          </select>
        </label>
        <label className="field-label">
          Bahasa
          <select value={settings.language} onChange={(e) => onChange({ language: e.target.value as 'id' | 'en' })}>
            <option value="id">Indonesia</option>
            <option value="en">Inggris</option>
          </select>
        </label>
      </div>

      <div className="check-row" style={{ display: 'block' }}>
      <label style={{ display: 'flex', gap: 10, alignItems: 'start' }}>
        <input
          type="checkbox"
          checked={settings.requireQuestionsBeforeNavigation !== false}
          onChange={(e) => { onChange({ requireQuestionsBeforeNavigation: e.target.checked }); if (e.target.checked) onOpenAutoAdvance(); }}
        />
        <span>
          <strong>Wajib jawab semua soal sebelum melanjutkan</strong>
          <small>Tombol navigasi pada slide muncul setelah semua soal di slide tersebut dijawab.</small>
        </span>
      </label>
      {settings.requireQuestionsBeforeNavigation !== false && <button type="button" className="secondary-button" style={{ marginLeft: 26, marginTop: 10 }} onClick={onOpenAutoAdvance}>Atur perpindahan otomatis</button>}
      </div>


      <label className="check-row">
        <input
          type="checkbox"
          checked={settings.keywordListEnabled}
          onChange={(e) => onChange({ keywordListEnabled: e.target.checked })}
        />
        <span>
          <strong>Tampilkan daftar isi di samping</strong>
          <small>Daftar judul slide di samping, biar gampang lompat ke bagian tertentu.</small>
        </span>
      </label>

      <label className="check-row">
        <input
          type="checkbox"
          checked={settings.activeSurface}
          onChange={(e) => onChange({ activeSurface: e.target.checked, hideSummarySlide: e.target.checked ? true : settings.hideSummarySlide })}
        />
        <span>
          <strong>Kunci tombol next/back</strong>
          <small>Tombol maju/mundur disembunyikan. Peserta cuma bisa pindah lewat tombol pilihan di slide.</small>
        </span>
      </label>

      <div className="settings-grid">
        <label className="check-row">
          <input
            type="checkbox"
            checked={!settings.hideSummarySlide}
            disabled={settings.activeSurface}
            onChange={(e) => onChange({ hideSummarySlide: !e.target.checked })}
          />
          <span>
            <strong>Halaman nilai akhir</strong>
            <small>Menampilkan total nilai kuis di halaman terakhir.</small>
          </span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.showSolutionButton}
            onChange={(e) => onChange({ showSolutionButton: e.target.checked })}
          />
          <span>
            <strong>Tombol “Lihat kunci jawaban”</strong>
            <small>Penjelasan jawaban benar/salah di tiap kuis.</small>
          </span>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.retryButton}
            onChange={(e) => onChange({ retryButton: e.target.checked })}
          />
          <span>
            <strong>Tombol “Coba lagi”</strong>
            <small>Peserta boleh mengulang menjawab.</small>
          </span>
        </label>
      </div>
    </div>
  );
}
