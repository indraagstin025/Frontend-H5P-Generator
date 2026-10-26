/**
 * Tahap 5 — Pengemasan & unduh .h5p untuk LMS Internal (FR-11, UAT-04).
 */
import { useEffect, useMemo, useState } from 'react';
import { CheckIcon, Cross2Icon, DownloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { API_BASE_URL } from '../../../config/env';
import { COURSE_PRESENTATION_MINORS } from '../../studio/constants/h5pLibraries';
import { countBlanks, isQuizElement } from '../../studio/constants/h5pModel';
import type { Project } from '../../studio/constants/h5pModel';
import { recordExport } from '../api/exportHistory';
import { buildH5p, downloadBlob, safeFileName, toManifest } from '../api/h5pPackager';

type ServerCheck = { ok: boolean; issues: string[]; mainLibrary: string | null } | null;

export function ExportStep({
  project,
  cpMinor,
  onCpMinorChange,
  onNotice,
}: {
  project: Project;
  cpMinor: number;
  onCpMinorChange: (minor: number) => void;
  onNotice: (m: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ name: string; sizeKb: number } | null>(null);
  const [serverCheck, setServerCheck] = useState<ServerCheck>(null);
  const [libLocal, setLibLocal] = useState<boolean | null>(null);

  // Tandai apakah library versi terpilih tersedia lokal (ikut dibundel).
  useEffect(() => {
    let stop = false;
    fetch(`/h5p-libraries/H5P.CoursePresentation-1.${cpMinor}/library.json`, { cache: 'no-store' })
      .then(async (r) => {
        let ok = false;
        if (r.ok) {
          try {
            ok = ((await r.json()) as { machineName?: string }).machineName === 'H5P.CoursePresentation';
          } catch {
            ok = false;
          }
        }
        if (!stop) setLibLocal(ok);
      })
      .catch(() => {
        if (!stop) setLibLocal(false);
      });
    return () => {
      stop = true;
    };
  }, [cpMinor]);

  const issues = useMemo(() => {
    const list: string[] = [];
    if (project.slides.length === 0) list.push('Belum ada slide.');
    const n = project.slides.length;
    for (const s of project.slides) {
      for (const el of s.elements) {
        if (el.kind === 'goToSlide' && el.targetType === 'specified' && (el.targetSlide < 1 || el.targetSlide > n)) {
          list.push(`Slide ${s.order}: tombol “${el.label}” mengarah ke slide ${el.targetSlide} yang tidak ada.`);
        }
        if (el.kind === 'multiChoice' || el.kind === 'singleChoice' || el.kind === 'multimediaChoice') {
          const label = el.kind === 'multiChoice' ? 'pilihan ganda' : el.kind === 'singleChoice' ? 'pilihan tunggal' : 'multimedia choice';
          if (el.options.length < 2) list.push(`Slide ${s.order}: kuis ${label} minimal 2 pilihan jawaban.`);
          if (!el.options.some((o) => o.correct)) list.push(`Slide ${s.order}: kuis ${label} belum ada jawaban yang benar.`);
          if (el.kind === 'singleChoice' && el.options.filter((o) => o.correct).length !== 1) {
            list.push(`Slide ${s.order}: kuis pilihan tunggal harus punya tepat satu jawaban benar.`);
          }
          if (el.kind === 'singleChoice' && el.options.length > 4) {
            list.push(`Slide ${s.order}: H5P Single Choice maksimal 4 pilihan jawaban.`);
          }
          if (el.options.some((o) => !o.text.trim())) list.push(`Slide ${s.order}: ada pilihan jawaban yang masih kosong.`);
        }
        if (
          (el.kind === 'multiChoice' || el.kind === 'singleChoice' || el.kind === 'multimediaChoice' || el.kind === 'trueFalse' || el.kind === 'dragDrop') &&
          !el.question.trim()
        ) {
          list.push(`Slide ${s.order}: pertanyaan kuisnya masih kosong.`);
        }
        if ((el.kind === 'blanks' || el.kind === 'dragWords' || el.kind === 'markWords') && countBlanks(el.text) === 0) {
          list.push(`Slide ${s.order}: kuis ${el.kind === 'blanks' ? 'isian' : el.kind === 'dragWords' ? 'drag the words' : 'mark the words'} belum punya kata *berbintang*.`);
        }
        if (el.kind === 'dragDrop') {
          if (el.zones.length === 0) list.push(`Slide ${s.order}: drag & drop belum punya zona tujuan.`);
          if (el.items.length === 0) list.push(`Slide ${s.order}: drag & drop belum punya item.`);
          if (el.zones.some((z) => !z.label.trim())) list.push(`Slide ${s.order}: ada zona drag & drop yang masih kosong.`);
          if (el.items.some((it) => !it.text.trim())) list.push(`Slide ${s.order}: ada item drag & drop yang masih kosong.`);
          if (el.items.some((it) => !el.zones.some((z) => z.id === it.zoneId))) {
            list.push(`Slide ${s.order}: ada item drag & drop yang belum punya zona jawaban.`);
          }
        }
        if (el.kind === 'summary') {
          if (el.statements.length < 2) list.push(`Slide ${s.order}: summary minimal butuh 2 pernyataan.`);
          if (!el.statements.some((st) => st.correct)) list.push(`Slide ${s.order}: summary belum ada pernyataan yang benar.`);
          if (el.statements.some((st) => !st.text.trim())) list.push(`Slide ${s.order}: ada pernyataan summary yang masih kosong.`);
        }
        if (el.kind === 'dialogCards') {
          if (el.cards.length === 0) list.push(`Slide ${s.order}: dialog cards belum punya kartu.`);
          if (el.cards.some((c) => !c.front.trim() || !c.back.trim())) {
            list.push(`Slide ${s.order}: ada kartu dialog yang sisi depan/belakangnya kosong.`);
          }
        }
        if (el.kind === 'table' && (el.rows < 1 || el.cols < 1)) {
          list.push(`Slide ${s.order}: tabel minimal 1 baris dan 1 kolom.`);
        }
        if (el.kind === 'video' && !el.file && !el.videoUrl.trim()) {
          list.push(`Slide ${s.order}: video belum ada file atau URL-nya.`);
        }
        if (el.kind === 'interactiveVideo' && !el.videoUrl.trim()) {
          list.push(`Slide ${s.order}: interactive video belum ada URL video.`);
        }
        if ((el.kind === 'image' || el.kind === 'audio') && !el.file && !el.objectUrl) {
          list.push(`Slide ${s.order}: ${el.kind === 'image' ? 'Gambar' : 'Suara'} belum ada file-nya.`);
        }
      }
    }
    return list;
  }, [project]);

  const warnings = useMemo(() => {
    const list: string[] = [];
    for (const s of project.slides) {
      for (const el of s.elements) {
        if (
          (el.kind === 'image' || el.kind === 'audio' || el.kind === 'video') &&
          !el.file &&
          el.objectUrl &&
          !/^(https?:|blob:|data:)/i.test(el.objectUrl)
        ) {
          list.push(`Slide ${s.order}: media tidak bisa diambil ulang — unggah ulang berkasnya agar ikut ke paket.`);
          break;
        }
      }
    }
    if (project.settings.activeSurface) list.push('Tombol next/back dimatikan: halaman nilai akhir ikut mati.');
    return [...new Set(list)];
  }, [project]);

  const manifest = useMemo(() => toManifest(project, cpMinor), [project, cpMinor]);
  const quizCount = project.slides.flatMap((s) => s.elements).filter(isQuizElement).length;

  const doServerCheck = async () => {
    if (issues.length > 0 || checking) return;
    setChecking(true);
    setServerCheck(null);
    try {
      const { blob } = await buildH5p(project, cpMinor);
      const form = new FormData();
      form.append('package', blob, safeFileName(project.title));
      const res = await fetch(`${API_BASE_URL}/h5p/packages/validate`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Server menjawab ${res.status}.`);
      const json = (await res.json()) as { data: ServerCheck };
      setServerCheck(json.data);
      if (json.data && !json.data.ok) onNotice('Validasi server menemukan masalah — lihat daftar.');
    } catch {
      onNotice('Backend tidak terjangkau. Download biasa tetap bisa dipakai.');
    } finally {
      setChecking(false);
    }
  };

  const doExport = async () => {
    if (issues.length > 0 || loading) return;
    setLoading(true);
    try {
      const { blob, bundled, missing, backgrounds, media } = await buildH5p(project, cpMinor);
      const name = safeFileName(project.title);
      downloadBlob(blob, name);
      setResult({ name, sizeKb: Math.round(blob.size / 1024) });
      recordExport({ title: project.title, format: 'H5P', sizeKb: Math.round(blob.size / 1024) });
      const bits: string[] = [];
      if (bundled.length > 0) bits.push(`${bundled.length} library ikut di dalam`);
      if (media.bundled > 0) bits.push(`${media.bundled} media ikut di paket`);
      if (backgrounds.real > 0) bits.push(`${backgrounds.real} latar asli ikut di paket`);
      else bits.push('latar gradien (gambar asli tidak ketemu)');
      const mediaNote =
        media.failed.length > 0
          ? ` ${media.failed.length} media gagal diambil (${media.failed[0]}).`
          : '';
      onNotice(
        (missing.length > 0
          ? `${name} terdownload, tapi library ${missing.slice(0, 3).join(', ')} tidak ketemu lokal — pilih 1.26 untuk paket lengkap.`
          : `${name} sudah terdownload (${bits.join(', ')}).`) + mediaNote,
      );
    } catch (err) {
      onNotice(err instanceof Error ? err.message : 'Gagal bikin file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-panel">
      <div className="step-heading">
        <div>
          <p className="section-kicker">Langkah 5 — Download file</p>
          <h2>File siap diupload ke LMS</h2>
          <p className="muted">
            {project.slides.length} slide · {quizCount} kuis · File .h5p standar, tinggal upload ke LMS (Moodle, Canvas, dll).
          </p>
        </div>
      </div>

      <label className="field-label">
        Versi Course Presentation di LMS kamu
        <select value={cpMinor} onChange={(e) => onCpMinorChange(Number(e.target.value))}>
          {COURSE_PRESENTATION_MINORS.map((m) => (
            <option key={m} value={m}>
              v1.{m} (samakan dengan LMS)
            </option>
          ))}
        </select>
      </label>
      {libLocal === true && (
        <p className="check-ok">
          <CheckIcon /> Library versi ini tersedia lokal — ikut dibundel, file bisa dibuka di Lumi.
        </p>
      )}
      {libLocal === false && (
        <p className="check-warn">
          <ExclamationTriangleIcon /> Library versi ini tidak ada lokal — file tetap bisa diupload ke LMS yang sudah
          punya library-nya, tapi belum tentu bisa dibuka di Lumi. Pilih 1.26 untuk paket lengkap.
        </p>
      )}
      <p className="muted">Isi paket: {manifest.preloadedDependencies.map((d) => `${d.machineName} ${d.majorVersion}.${d.minorVersion}`).join(' · ') || '—'}</p>

      <div className="check-list">
        {issues.length === 0 ? (
          <p className="check-ok">
            <CheckIcon /> Semua beres — file siap diupload ke LMS.
          </p>
        ) : (
          issues.map((issue) => (
            <p className="check-bad" key={issue}>
              <Cross2Icon /> {issue}
            </p>
          ))
        )}
        {warnings.map((w) => (
          <p className="check-warn" key={w}>
            <ExclamationTriangleIcon /> {w}
          </p>
        ))}
      </div>

      <div className="export-actions">
        <button className="primary-button" type="button" disabled={issues.length > 0 || loading} onClick={doExport}>
          <DownloadIcon /> {loading ? 'Menyiapkan file…' : 'Download file .h5p'}
        </button>
        <button className="secondary-button" type="button" disabled={issues.length > 0 || checking} onClick={doServerCheck}>
          {checking ? 'Mengecek ke server…' : 'Cek validasi server (Lumi)'}
        </button>
        {serverCheck && (
          serverCheck.ok ? (
            <p className="check-ok">
              <CheckIcon /> Validasi server lolos{serverCheck.mainLibrary ? ` — ${serverCheck.mainLibrary}` : ''}.
            </p>
          ) : (
            serverCheck.issues.map((issue) => (
              <p className="check-bad" key={issue}>
                <Cross2Icon /> {issue}
              </p>
            ))
          )
        )}
        {result && (
          <p className="muted">
            Terakhir: <strong>{result.name}</strong> ({result.sizeKb} KB). Upload ke LMS, lalu coba mainkan di sana.
          </p>
        )}
      </div>
    </div>
  );
}
