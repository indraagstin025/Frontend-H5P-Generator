import { useState } from 'react';
import {
  ArrowRightIcon,
  BarChartIcon,
  BookmarkIcon,
  CheckCircledIcon,
  GearIcon,
  LightningBoltIcon,
  LockClosedIcon,
  PersonIcon,
  ResetIcon,
} from '@radix-ui/react-icons';
import type { MockupTab, ScenarioStep } from '../types';

interface LandingMockupProps {
  onEnter: () => void;
}

export function LandingMockup({ onEnter }: LandingMockupProps) {
  const [mockupTab, setMockupTab] = useState<MockupTab>('employee');
  const [scenarioStep, setScenarioStep] = useState<ScenarioStep>('dilemma');
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);

  return (
    <div className="edu-mockup-wrapper" id="simulasi-hero">
      <div className="edu-mockup-window">
        <div className="edu-window-header">
          <div className="edu-window-controls">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className="edu-window-tabs">
            <button
              type="button"
              className={`edu-mockup-tab-btn ${mockupTab === 'employee' ? 'active' : ''}`}
              onClick={() => setMockupTab('employee')}
            >
              <PersonIcon /> Peserta
            </button>
            <button
              type="button"
              className={`edu-mockup-tab-btn ${mockupTab === 'trainer' ? 'active' : ''}`}
              onClick={() => setMockupTab('trainer')}
            >
              <GearIcon /> Studio
            </button>
            <button
              type="button"
              className={`edu-mockup-tab-btn ${mockupTab === 'lms' ? 'active' : ''}`}
              onClick={() => setMockupTab('lms')}
            >
              <BarChartIcon /> Rekap Nilai LMS
            </button>
          </div>
        </div>

        <div className="edu-window-stage">
          {mockupTab === 'employee' && (
            <div className="edu-slide-frame">
              <div className="edu-slide-grid-overlay"></div>

              <div className="edu-slide-top-bar">
                <span className="edu-slide-module-kicker">
                  <BookmarkIcon /> Modul K3: Tanggap Darurat Gas Bertekanan Tinggi
                </span>
                <span className="edu-slide-num-pill">
                  {scenarioStep === 'dilemma' && 'Slide 02 / 14 · Kasus Anomali'}
                  {scenarioStep === 'pathA' && 'Slide 04 / 14 · SOP Isolasi'}
                  {scenarioStep === 'pathB' && 'Slide 06 / 14 · Pelanggaran SOP'}
                  {scenarioStep === 'quiz' && 'Slide 08 / 14 · Uji Kepatuhan K3'}
                </span>
              </div>

              <div className="edu-slide-main-content">
                {scenarioStep === 'dilemma' && (
                  <>
                    <h2 className="edu-scenario-title">Kasus Lapangan: Lonjakan Tekanan Gas Melebihi 15 Bar</h2>
                    <p className="edu-scenario-prompt">
                      Pukul 22.30 WIB, indikator pipa distribusi Unit B berkedip merah dan katup otomatis tidak merespons.
                      Sebagai Pengawas Shift Operasional, instruksi pertama apa yang Anda ambil sesuai SOP K3?
                    </p>
                    <div className="edu-hotspot-choices">
                      <button
                        type="button"
                        className="edu-hotspot-btn"
                        onClick={() => setScenarioStep('pathA')}
                      >
                        <ArrowRightIcon /> Pilihan A: Eksekusi Valve Isolasi Manual & Sirine Shift
                      </button>
                      <button
                        type="button"
                        className="edu-hotspot-btn ghost-btn"
                        onClick={() => setScenarioStep('pathB')}
                      >
                        <ArrowRightIcon /> Pilihan B: Tunggu Tim Pemeliharaan Tanpa Menekan Alarm
                      </button>
                    </div>
                  </>
                )}

                {scenarioStep === 'pathA' && (
                  <>
                    <h2 className="edu-scenario-title">Keputusan Tepat: Area Kerja Berhasil Diamankan</h2>
                    <p className="edu-scenario-prompt">
                      Isolasi manual berhasil menurunkan tekanan dalam 90 detik. Seluruh personel shift berkumpul di
                      titik kumpul (Assembly Point) dengan aman. (+20 Poin Kepatuhan K3 Organisasi)
                    </p>
                    <div className="edu-hotspot-choices">
                      <button
                        type="button"
                        className="edu-hotspot-btn"
                        onClick={() => setScenarioStep('quiz')}
                      >
                        <CheckCircledIcon /> Lanjut ke Checkpoint Soal Kepatuhan
                      </button>
                      <button
                        type="button"
                        className="edu-hotspot-btn ghost-btn"
                        onClick={() => setScenarioStep('dilemma')}
                      >
                        <ResetIcon /> Ulangi Skenario
                      </button>
                    </div>
                  </>
                )}

                {scenarioStep === 'pathB' && (
                  <>
                    <h2 className="edu-scenario-title">Konsekuensi Bahaya: Kebocoran Gas Terjadi</h2>
                    <p className="edu-scenario-prompt">
                      Menunda evakuasi menyebabkan akumulasi gas berbahaya di ruang kompresor.
                      Insiden ini melanggar SOP Keselamatan Kerja Bab 4 dan berpotensi memicu sanksi audit internal.
                    </p>
                    <div className="edu-hotspot-choices">
                      <button
                        type="button"
                        className="edu-hotspot-btn"
                        onClick={() => setScenarioStep('dilemma')}
                      >
                        <ResetIcon /> Tinjau Ulang & Pilih Jalur SOP Benar
                      </button>
                      <button
                        type="button"
                        className="edu-hotspot-btn ghost-btn"
                        onClick={() => setScenarioStep('quiz')}
                      >
                        Lanjut ke Kuis Evaluasi
                      </button>
                    </div>
                  </>
                )}

                {scenarioStep === 'quiz' && (
                  <>
                    <h2 className="edu-scenario-title">Uji Kepatuhan K3: Batas Waktu Pelaporan Insiden</h2>
                    <p className="edu-scenario-prompt">
                      Berapa batas waktu maksimal pelaporan berita acara insiden K3 ke Tim HSE Perusahaan?
                    </p>
                    <div style={{ display: 'grid', gap: '6px', marginTop: '10px' }}>
                      {[
                        { id: 0, text: 'A. Maksimal 1 jam pasca kejadian darurat terkendali', correct: true },
                        { id: 1, text: 'B. Cukup dilaporkan saat rapat bulanan divisi', correct: false },
                        { id: 2, text: 'C. Setelah investigasi audit 14 hari selesai', correct: false },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          style={{
                            padding: '7px 12px',
                            textAlign: 'left',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.4)',
                            background:
                              quizAnswer === opt.id
                                ? opt.correct
                                  ? '#22c55e'
                                  : '#ef4444'
                                : 'rgba(255,255,255,0.12)',
                            color: '#fff',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={() => setQuizAnswer(opt.id)}
                        >
                          {opt.text}{' '}
                          {quizAnswer === opt.id &&
                            (opt.correct ? '✓ Benar (Sesuai SOP)' : '✗ Salah (Melanggar Regulasi)')}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="edu-slide-footer">
                <span className="edu-interactive-badge">
                  <LightningBoltIcon /> Navigasi Terkunci (Active Surface Mode)
                </span>
                <span>
                  Skor Kepatuhan Karyawan: {quizAnswer === 0 ? '100% (Lulus K3)' : '80% (Memenuhi Syarat)'}
                </span>
              </div>
            </div>
          )}

          {mockupTab === 'trainer' && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '20px',
                display: 'grid',
                gap: '14px',
                color: 'var(--ink)',
                fontSize: '12px',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px', color: 'var(--green-deep)' }}>
                  Studio Pemateri: Konfigurasi Skenario Slide 2
                </strong>
                <span className="edu-badge-academic">
                  <LockClosedIcon /> Active Surface: Kunci Tombol Maju/Mundur
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '11px', display: 'block' }}>Hotspot Keputusan A:</span>
                  <strong>Target: Slide 4 (Konsekuensi Prosedural)</strong>
                  <div style={{ fontSize: '10px', color: 'var(--green)' }}>Label: “Eksekusi Valve Darurat”</div>
                </div>
                <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '11px', display: 'block' }}>Hotspot Keputusan B:</span>
                  <strong>Target: Slide 6 (Skenario Dampak Kelalaian)</strong>
                  <div style={{ fontSize: '10px', color: 'var(--green)' }}>Label: “Tunggu Tim Pemeliharaan”</div>
                </div>
              </div>
              <div
                style={{
                  padding: '8px 12px',
                  background: '#f8faf7',
                  borderRadius: '6px',
                  border: '1px dashed var(--line)',
                }}
              >
                <span style={{ color: 'var(--muted)' }}>Narasi Penjelasan Suara SME (H5P.Audio): </span>
                <strong>instruksi_hse_manager_sop_gas.mp3</strong> (0:38 mnt)
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)', fontSize: '11px' }}>
                  Kompilasi Paket: Sesuai Standar LMS Internal Organisasi
                </span>
                <button
                  className="edu-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '11px' }}
                  onClick={onEnter}
                >
                  Buka Proyek Ini di Studio
                </button>
              </div>
            </div>
          )}

          {mockupTab === 'lms' && (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '8px',
                padding: '20px',
                display: 'grid',
                gap: '12px',
                color: 'var(--ink)',
                fontSize: '12px',
                border: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '13px' }}>Buku Nilai LMS Internal (Moodle / Canvas Enterprise)</strong>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>xAPI Statements: Terverifikasi</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Karyawan Divisi:</span>
                  <strong style={{ fontSize: '16px', display: 'block' }}>412 / 420 Selesai</strong>
                </div>
                <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Rata-rata Skor K3:</span>
                  <strong style={{ fontSize: '16px', display: 'block', color: 'var(--green)' }}>94.6%</strong>
                </div>
                <div style={{ padding: '10px', background: 'var(--soft)', borderRadius: '6px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '11px' }}>Status Kelulusan:</span>
                  <strong style={{ fontSize: '16px', display: 'block' }}>98.1% Lulus</strong>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>
                Setiap keputusan dan jawaban karyawan memancarkan data xAPI standar: <code>experienced</code>,{' '}
                <code>interacted</code>, <code>answered</code>, dan <code>completed</code>. Memenuhi persyaratan bukti
                kepatuhan sertifikasi ISO & audit internal perusahaan.
              </div>
            </div>
          )}
        </div>

        <div className="edu-window-subbar">
          <span className="edu-sync-indicator">
            <span className="edu-sync-dot"></span> Paket H5P Standar (Course Presentation v1.24/1.25)
          </span>
          <span>Kompatibel 100% LMS Internal Organisasi</span>
        </div>
      </div>
    </div>
  );
}
