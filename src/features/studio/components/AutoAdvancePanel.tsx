import type { ProjectSettings, Slide } from '../constants/h5pModel';

export function AutoAdvancePanel({ settings, slides, onChange }: {
  settings: ProjectSettings;
  slides: Slide[];
  onChange: (patch: Partial<ProjectSettings>) => void;
}) {
  const auto = settings.autoAdvance ?? { enabled: false, scope: 'all' as const, targetType: 'next' as const, targetSlideId: '', rules: [] };
  return (
    <aside className="st-panel st-right hs-auto-advance" aria-label="Perpindahan slide otomatis">
      <div className="st-panel-head"><h2 className="st-title">Perpindahan Slide</h2></div>
      <p className="hs-auto-advance-description">Atur tujuan setelah semua soal pada slide dijawab.</p>
      <label className="check-row"><input type="checkbox" checked={auto.enabled} onChange={(e) => onChange({ autoAdvance: { ...auto, enabled: e.target.checked } })} /><span><strong>Pindah slide otomatis</strong><small>Aktifkan untuk berpindah setelah semua soal dijawab.</small></span></label>
      {auto.enabled && <div className="hs-auto-advance-fields">
        <label className="field-label">Berlaku untuk<select value={auto.scope} onChange={(e) => onChange({ autoAdvance: { ...auto, scope: e.target.value as 'all' | 'selected' } })}><option value="all">Semua halaman</option><option value="selected">Halaman tertentu</option></select></label>
        {auto.scope === 'all' ? <>
          <label className="field-label">Pindah ke<select value={auto.targetType} onChange={(e) => onChange({ autoAdvance: { ...auto, targetType: e.target.value as 'next' | 'previous' | 'specified' } })}><option value="next">Slide berikutnya</option><option value="previous">Slide sebelumnya</option><option value="specified">Slide pilihan</option></select></label>
          {auto.targetType === 'specified' && <label className="field-label">Slide tujuan<select value={auto.targetSlideId} onChange={(e) => onChange({ autoAdvance: { ...auto, targetSlideId: e.target.value } })}><option value="">Pilih slide</option>{slides.map((s) => <option key={s.id} value={s.id}>Slide {s.order}: {s.title}</option>)}</select></label>}
        </> : <>
          <p className="hs-auto-advance-description">Pilih slide asal dan tujuan untuk setiap aturan.</p>
          {auto.rules.map((rule, index) => <div key={index} className="hs-auto-advance-rule">
            <div className="hs-auto-advance-rule-head"><strong>Aturan {index + 1}</strong><button type="button" className="small-icon-button danger" aria-label={`Hapus aturan ${index + 1}`} onClick={() => onChange({ autoAdvance: { ...auto, rules: auto.rules.filter((_, i) => i !== index) } })}>×</button></div>
            <label className="field-label">Slide asal<select value={rule.sourceId} onChange={(e) => onChange({ autoAdvance: { ...auto, rules: auto.rules.map((r, i) => i === index ? { ...r, sourceId: e.target.value } : r) } })}><option value="">Pilih slide</option>{slides.map((s) => <option key={s.id} value={s.id}>Slide {s.order}: {s.title}</option>)}</select></label>
            <label className="field-label">Slide tujuan<select value={rule.targetId} onChange={(e) => onChange({ autoAdvance: { ...auto, rules: auto.rules.map((r, i) => i === index ? { ...r, targetId: e.target.value } : r) } })}><option value="">Pilih slide</option>{slides.map((s) => <option key={s.id} value={s.id}>Slide {s.order}: {s.title}</option>)}</select></label>
          </div>)}
          <button type="button" className="secondary-button" onClick={() => onChange({ autoAdvance: { ...auto, rules: [...auto.rules, { sourceId: '', targetId: '' }] } })}>+ Tambah aturan halaman</button>
        </>}
      </div>}
    </aside>
  );
}
