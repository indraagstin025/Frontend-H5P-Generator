/**
 * Route /studio — wizard 4 tahap: Upload → Susun → Coba → Unduh.
 * Layar Susun memakai layout referensi gambar: 3 kolom
 * (daftar slide kiri | canvas tengah | panel elemen kanan).
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toast } from '../../../components/UI/Toast';
import { useStudio } from '../../../context/StudioContext';
import '../../../studio-canva.css';
import { ExportStep } from '../../exporter/components/ExportStep';
import { peekPendingFile, takePendingFile } from '../../ingest/api/pendingUpload';
import { H5PRealPlayer } from '../../preview/components/H5PRealPlayer';
import { H5PServerPlayer } from '../../preview/components/H5PServerPlayer';
import { PreviewPlayer } from '../../preview/components/PreviewPlayer';
import { CanvasPanel } from '../components/CanvasPanel';
import { ElementPanel } from '../components/ElementPanel';
import { IngestStep } from '../components/IngestStep';
import { PropertyPanel } from '../components/PropertyPanel';
import { StudioLeftPanel } from '../components/StudioLeftPanel';
import { Topbar } from '../components/Topbar';
import { DEFAULT_CP_MINOR } from '../constants/h5pLibraries';
import { WIZARD_STEPS } from '../constants/wizardSteps';
import { buildH5p, downloadBlob, safeFileName } from '../../exporter/api/h5pPackager';
import { recordExport } from '../../exporter/api/exportHistory';

const NOTICE_TIMEOUT_MS = 2600;

export function StudioView() {
  const { state, actions, currentId, savedLabel, saveDraft } = useStudio();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(() => {
    const requested = (location.state as { step?: number } | null)?.step;
    return requested === 1 || requested === 3 || requested === 4 ? requested : 2;
  });
  const [previewMode, setPreviewMode] = useState<'simulasi' | 'asli' | 'server'>('simulasi');
  const [notice, setNotice] = useState('');
  // Panel kanan aktif: 'elements' atau 'properties'
  const [rightPanel, setRightPanel] = useState<'elements' | 'properties'>('elements');
  // Di layar kecil panel kanan jadi drawer
  const [panelOpen, setPanelOpen] = useState(false);

  // Pilihan versi Course Presentation & status ekspor
  const [cpMinor, setCpMinor] = useState<number>(DEFAULT_CP_MINOR);
  const [exporting, setExporting] = useState(false);

  // File titipan modal (dibaca sekali saat mount)
  const [initialFile] = useState<File | null>(() => peekPendingFile());
  useEffect(() => {
    takePendingFile();
  }, []);

  // Saat elemen dipilih, otomatis buka panel properties
  useEffect(() => {
    if (state.selectedElement) {
      setRightPanel('properties');
    }
  }, [state.selectedElement]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), NOTICE_TIMEOUT_MS);
  };

  if (!currentId) {
    return (
      <main className="app-shell">
        <div className="projects-home">
          <p className="section-kicker">Studio</p>
          <h1>Belum ada materi dibuka</h1>
          <p className="muted">Pilih materi dari daftar atau bikin baru buat mulai menyusun.</p>
          <div className="new-project-actions">
            <button className="primary-button" type="button" onClick={() => navigate('/materi')}>
              Ke daftar materi
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate('/dashboard')}>
              Ke dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
  const project = state.project;
  const hasSlides = state.slides.length > 0;
  const stepLabel = WIZARD_STEPS.find((s) => s.id === step)?.label ?? '';
  const nextLabel = WIZARD_STEPS.find((s) => s.id === step + 1)?.label ?? '';
  const canNext = step < WIZARD_STEPS.length && (step > 1 || hasSlides);

  const goBack = () => {
    if (hasSlides) saveDraft();
    navigate(from);
  };

  const handleExport = async () => {
    if (project.slides.length === 0) {
      showNotice('Belum ada slide untuk diekspor.');
      return;
    }
    setExporting(true);
    showNotice(`Mengemas file .h5p (v1.${cpMinor})...`);
    try {
      const { blob, bundled, missing, media } = await buildH5p(project, cpMinor);
      const name = safeFileName(project.title);
      downloadBlob(blob, name);
      recordExport({ title: project.title, format: 'H5P', sizeKb: Math.round(blob.size / 1024) });
      const mediaNote =
        media.failed.length > 0
          ? ` ${media.failed.length} media gagal diambil (${media.failed[0]}).`
          : '';
      showNotice(
        (missing.length > 0
          ? `${name} terunduh (v1.${cpMinor}), tapi library ${missing.slice(0, 3).join(', ')} tidak ada lokal — pilih v1.26 untuk paket lengkap.`
          : `Berhasil! ${name} terunduh (v1.${cpMinor}, ${bundled.length} pustaka H5P).`) + mediaNote,
      );
    } catch (err) {
      showNotice(err instanceof Error ? err.message : 'Gagal mengekspor file H5P.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="hs-studio-shell">
      <Topbar
        projectTitle={project.title}
        savedLabel={savedLabel}
        cpMinor={cpMinor}
        onCpMinorChange={setCpMinor}
        onExport={handleExport}
        isExporting={exporting}
        onHome={goBack}
        onSave={() => {
          saveDraft();
          showNotice('Sudah kesimpan.');
        }}
        onPreview={() => setStep(3)}
        onRenameTitle={(title) => {
          actions.setTitle(title);
          showNotice('Judul diganti — jangan lupa Simpan.');
        }}
      />

      {step === 1 && (
        <section className="hs-step-section">
          <IngestStep
            initialFile={initialFile}
            onComplete={(next) => {
              actions.replaceProject(next);
              setStep(2);
            }}
            onNotice={showNotice}
          />
        </section>
      )}

      {step === 2 && (
        <div className="hs-studio-workspace">
          {/* Kolom kiri: Daftar Slide */}
          <StudioLeftPanel
            slides={state.slides}
            activeSlideId={state.activeSlideId}
            onSelectSlide={actions.setActiveSlideId}
            onAddSlide={actions.addSlide}
            onDuplicateSlide={actions.duplicateSlide}
            onDeleteSlide={(id) => {
              actions.deleteSlide(id);
              showNotice('Slide dihapus.');
            }}
            onReorderSlide={actions.reorderSlide}
          />

          {/* Kolom tengah: Canvas */}
          <div className="hs-canvas-area">
            {/* Edit mode indicator */}
            <div className="hs-canvas-topbar">
              <span className="hs-edit-mode-badge">EDIT MODE</span>
              <span className="hs-canvas-hint">Klik elemen pada slide untuk mengedit</span>
              <button
                type="button"
                className="hs-panel-toggle"
                aria-expanded={panelOpen}
                onClick={() => setPanelOpen((open) => !open)}
              >
                {panelOpen ? 'Tutup panel' : 'Panel elemen'}
              </button>
            </div>

            {state.activeSlide ? (
              <CanvasPanel
                slide={state.activeSlide}
                total={state.slides.length}
                selectedElementId={state.selectedElementId}
                activeSurface={project.settings.activeSurface}
                onSelectElement={(id) => {
                  actions.setSelectedElementId(id);
                  if (id) {
                    setRightPanel('properties');
                    setPanelOpen(true);
                  } else {
                    setRightPanel('elements');
                  }
                }}
                onMoveElement={(id, x, y) => {
                  const el = state.activeSlide?.elements.find((e) => e.id === id);
                  if (el) actions.updateElement(id, { position: { ...el.position, x, y } });
                }}
                onPrev={() => state.activeSlide && actions.setActiveSlideId(prevNextId(state.slides.map((s) => s.id), state.activeSlide.id, -1))}
                onNext={() => state.activeSlide && actions.setActiveSlideId(prevNextId(state.slides.map((s) => s.id), state.activeSlide.id, 1))}
              />
            ) : (
              <div className="hs-canvas-empty">
                <p>Belum ada slide. Upload file di langkah 1 atau tambah slide dari panel kiri.</p>
              </div>
            )}
          </div>

          {/* Kolom kanan: Panel Elemen / Properti */}
          {panelOpen && (
            <button
              type="button"
              className="hs-panel-backdrop"
              aria-label="Tutup panel"
              onClick={() => setPanelOpen(false)}
            />
          )}
          <div className={`hs-right-panel-container ${panelOpen ? 'is-open' : ''}`}>
            {rightPanel === 'elements' || !state.selectedElement ? (
              <>
                <ElementPanel
                  onAddElement={(kind) => {
                    actions.addElement(kind);
                    showNotice('Elemen baru ditambah — atur propertinya.');
                    setRightPanel('properties');
                    setPanelOpen(true);
                  }}
                />
              </>
            ) : (
              <div className="hs-properties-wrapper">
                <div className="hs-panel-switch">
                  <button
                    type="button"
                    className="hs-panel-switch-btn"
                    onClick={() => setRightPanel('elements')}
                  >
                    ← Tambah Elemen
                  </button>
                </div>
                <PropertyPanel
                  key={state.selectedElement?.id ?? state.activeSlide?.id ?? 'empty'}
                  project={project}
                  slide={state.activeSlide}
                  slides={state.slides}
                  element={state.selectedElement}
                  settings={project.settings}
                  slideCount={state.slides.length}
                  onUpdateElement={actions.updateElement}
                  onDeleteElement={(id) => {
                    actions.deleteElement(id);
                    showNotice('Elemen sudah dihapus.');
                    setRightPanel('elements');
                  }}
                  onUpdateSlide={actions.updateSlide}
                  onUpdateKeyword={actions.updateKeywordMain}
                  onUpdateSettings={actions.updateSettings}
                  onNotice={showNotice}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <section className="hs-step-section">
          <div className="step-panel">
            <div className="step-heading">
              <div>
                <p className="section-kicker">Langkah 3 — Coba mainkan</p>
                <h2>Coba alur cerita & nilai kuis</h2>
                <p className="muted">
                  Klik tombol buat pindah slide, jawab kuisnya, lalu lihat nilainya
                  {project.settings.activeSurface ? '. Tombol next/back dimatikan.' : '.'}
                </p>
              </div>
            </div>
            {hasSlides ? (
              <>
                <div className="home-tabs pv-mode-tabs">
                  <button
                    type="button"
                    className={`tab-btn ${previewMode === 'simulasi' ? 'active' : ''}`}
                    onClick={() => setPreviewMode('simulasi')}
                  >
                    Coba cepat (simulasi)
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${previewMode === 'asli' ? 'active' : ''}`}
                    onClick={() => setPreviewMode('asli')}
                  >
                    Player H5P asli
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${previewMode === 'server' ? 'active' : ''}`}
                    onClick={() => setPreviewMode('server')}
                  >
                    Player server + nilai
                  </button>
                </div>
                {previewMode === 'simulasi' ? (
                  <PreviewPlayer key={project.id + project.slides.length} project={project} />
                ) : previewMode === 'asli' ? (
                  <H5PRealPlayer key={`real-${project.id}-${project.updatedAt}`} project={project} />
                ) : (
                  <H5PServerPlayer
                    key={`server-${project.id}-${project.updatedAt}`}
                    project={project}
                    cpMinor={cpMinor}
                    onNotice={showNotice}
                  />
                )}
              </>
            ) : (
              <p className="muted">Belum ada slide. Selesaikan Langkah 1 dulu.</p>
            )}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="hs-step-section">
          <ExportStep
            project={project}
            cpMinor={cpMinor}
            onCpMinorChange={setCpMinor}
            onNotice={showNotice}
          />
        </section>
      )}

      {/* Navigasi langkah bawah (hanya di luar layar Susun agar tampilan Studio persis seperti referensi) */}
      {step !== 2 && (
        <nav className="hs-step-nav" aria-label="Navigasi langkah">
          <span className="muted">
            Langkah {step} dari {WIZARD_STEPS.length} · {stepLabel}
          </span>
          <div className="hs-step-nav-actions">
            {step > 1 && (
              <button className="secondary-button" type="button" onClick={() => setStep(step - 1)}>
                Kembali
              </button>
            )}
            {canNext && (
              <button
                className="primary-button"
                type="button"
                title={step === 1 && !hasSlides ? 'Upload file dulu sampai jadi slide' : undefined}
                onClick={() => setStep(step + 1)}
              >
                Lanjut ke {nextLabel}
              </button>
            )}
          </div>
        </nav>
      )}

      <Toast message={notice} />
    </main>
  );
}

function prevNextId(ids: string[], current: string, dir: -1 | 1): string {
  const idx = ids.indexOf(current);
  const next = Math.min(ids.length - 1, Math.max(0, idx + dir));
  return ids[next] ?? current;
}
