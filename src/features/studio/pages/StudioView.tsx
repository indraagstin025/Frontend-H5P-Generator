/**
 * Route /studio — wizard 4 tahap: Upload → Susun → Coba → Unduh.
 * Layar Susun memakai bahasa visual referensi Canva (3 kolom).
 * Tombol kembali menghormati riwayat browser (state.from saat dibuka).
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
import { IngestStep } from '../components/IngestStep';
import { PropertyPanel } from '../components/PropertyPanel';
import { SlideFlowStrip } from '../components/SlideFlowStrip';
import { StudioLeftPanel } from '../components/StudioLeftPanel';
import { Topbar } from '../components/Topbar';
import { WIZARD_STEPS } from '../constants/wizardSteps';

const NOTICE_TIMEOUT_MS = 2600;

export function StudioView() {
  const { state, actions, currentId, savedLabel, saveDraft } = useStudio();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(() => {
    const requested = (location.state as { step?: number } | null)?.step;
    return requested === 2 || requested === 3 || requested === 4 ? requested : 1;
  });
  const [previewMode, setPreviewMode] = useState<'simulasi' | 'asli' | 'server'>('simulasi');
  const [notice, setNotice] = useState('');
  // File titipan modal (dibaca sekali saat mount)
  const [initialFile] = useState<File | null>(() => peekPendingFile());
  useEffect(() => {
    takePendingFile();
  }, []);

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

  return (
    <main className="app-shell">
      <Topbar
        projectTitle={project.title}
        savedLabel={savedLabel}
        onHome={goBack}
        onSave={() => {
          saveDraft();
          showNotice('Sudah kesimpan.');
        }}
        onRenameTitle={(title) => {
          actions.setTitle(title);
          showNotice('Judul diganti — jangan lupa Simpan.');
        }}
      />
      {step === 1 && (
        <section className="workspace single">
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
        <section className="workspace single st-scope">
          <div className="st-workspace">
            <StudioLeftPanel
              slides={state.slides}
              activeSlideId={state.activeSlideId}
              selectedKind={state.selectedElement?.kind ?? null}
              onAddElement={(kind) => {
                actions.addElement(kind);
                showNotice('Isi baru ditambah — atur di panel kanan.');
              }}
              onSelectSlide={actions.setActiveSlideId}
              onAddSlide={actions.addSlide}
              onDuplicateSlide={actions.duplicateSlide}
              onDeleteSlide={(id) => {
                actions.deleteSlide(id);
                showNotice('Slide dihapus.');
              }}
              onReorderSlide={actions.reorderSlide}
            />
            <div className="st-central">
              <div className="st-center-head">
                <div>
                  <span className="st-kicker">Ruang kerja / susun slide</span>
                  <h2>Studio Susun Slide</h2>
                </div>
                <span className="st-badge">
                  {hasSlides ? `${state.slides.length} slide` : 'Draf materi'}
                </span>
              </div>
              {state.activeSlide ? (
                <CanvasPanel
                  slide={state.activeSlide}
                  total={state.slides.length}
                  selectedElementId={state.selectedElementId}
                  activeSurface={project.settings.activeSurface}
                  onSelectElement={actions.setSelectedElementId}
                  onMoveElement={(id, x, y) => {
                    const el = state.activeSlide?.elements.find((e) => e.id === id);
                    if (el) actions.updateElement(id, { position: { ...el.position, x, y } });
                  }}
                  onPrev={() => state.activeSlide && actions.setActiveSlideId(prevNextId(state.slides.map((s) => s.id), state.activeSlide.id, -1))}
                  onNext={() => state.activeSlide && actions.setActiveSlideId(prevNextId(state.slides.map((s) => s.id), state.activeSlide.id, 1))}
                />
              ) : (
                <div className="st-panel">
                  <p className="muted">Belum ada slide. Upload file di langkah 1 atau tambah slide dari panel kiri.</p>
                </div>
              )}
              {hasSlides && (
                <SlideFlowStrip
                  slides={state.slides}
                  activeSlideId={state.activeSlideId}
                  onSelect={actions.setActiveSlideId}
                  onAdd={actions.addSlide}
                />
              )}
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
                showNotice('Isi sudah dihapus.');
              }}
              onUpdateSlide={actions.updateSlide}
              onUpdateKeyword={actions.updateKeywordMain}
              onUpdateSettings={actions.updateSettings}
              onNotice={showNotice}
            />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="workspace single">
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
        <section className="workspace single">
          <ExportStep project={project} onNotice={showNotice} />
        </section>
      )}

      <nav className="st-stepnav" aria-label="Navigasi langkah">
        <span className="muted">
          Langkah {step} dari {WIZARD_STEPS.length} · {stepLabel}
        </span>
        <div className="st-stepnav-actions">
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

      <Toast message={notice} />
    </main>
  );
}

function prevNextId(ids: string[], current: string, dir: -1 | 1): string {
  const idx = ids.indexOf(current);
  const next = Math.min(ids.length - 1, Math.max(0, idx + dir));
  return ids[next] ?? current;
}
