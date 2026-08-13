'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '@/lib/auth';
import { api, ScreeningResult } from '@/lib/api';
import { useBiomarkerCapture } from '@/hooks/useBiomarkerCapture';
import { TEST_SEQUENCE, TOTAL_CAPTURE_SECONDS, ScreeningTest } from '@/lib/tests';
import { useI18n } from '@/lib/i18n';
import CameraView from '@/components/CameraView';
import AppNav from '@/components/AppNav';
import ScreeningInstruction from '@/components/ScreeningInstruction';
import PreScreeningQuestionnaire, { QuestionnaireAnswers } from '@/components/PreScreeningQuestionnaire';
import styles from './screening.module.css';

/**
 * Kunci penyimpanan sesi.
 *
 * Rekaman yang sudah selesai dan jawaban kuesioner disimpan di sessionStorage.
 * Tanpa ini, satu panggilan masuk, satu layar terkunci, atau satu perjalanan ke
 * halaman login menghapus tujuh menit tes fisik yang dikerjakan sendirian oleh
 * orang dengan gangguan gerak.
 */
const STORE_KEY = 'nm.screening.session.v1';

interface StoredSession {
  completed: Record<string, unknown>;
  questionnaire: QuestionnaireAnswers | null;
  phase: 'questionnaire' | 'tests';
  step: number;
}

export default function ScreeningPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const { t } = useI18n();

  const {
    videoRef, canvasRef, cameraReady, poseReady,
    activeTest, isCapturing, liveMetrics, countdown, capturedData,
    detectionWarning, lightingWarning, fault, rejection, clearRejection,
    startCamera, startCapture, stopCapture,
  } = useBiomarkerCapture();

  const [restored, setRestored] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTests, setCompletedTests] = useState<Record<string, unknown>>({});
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireAnswers | null>(null);
  const [phase, setPhase] = useState<'questionnaire' | 'tests'>('questionnaire');
  const [showIntro, setShowIntro] = useState(false);
  const [instructionFor, setInstructionFor] = useState<ScreeningTest | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentTest = TEST_SEQUENCE[currentStep];
  const doneCount = TEST_SEQUENCE.filter(s => completedTests[s.type]).length;
  const hasWork = doneCount > 0 || !!questionnaire;

  /* ── Gerbang masuk ────────────────────────────────────────────────────────
     Autentikasi diperiksa saat halaman dimuat, bukan saat mengirim. Versi
     sebelumnya menaruh dinding login di langkah terakhir dan membuang keenam
     rekaman ketika pengguna ternyata belum masuk. */
  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) router.replace('/login?next=/screening');
  }, [authLoading, user, token, router]);

  /* ── Pulihkan sesi ────────────────────────────────────────────────────── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as StoredSession;
        setCompletedTests(s.completed ?? {});
        setQuestionnaire(s.questionnaire ?? null);
        setPhase(s.phase ?? 'questionnaire');
        setCurrentStep(Math.min(s.step ?? 0, TEST_SEQUENCE.length - 1));
      } else {
        setShowIntro(true);
      }
    } catch {
      setShowIntro(true);
    }
    setRestored(true);
  }, []);

  /* ── Simpan sesi ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!restored) return;
    try {
      const payload: StoredSession = {
        completed: completedTests,
        questionnaire,
        phase,
        step: currentStep,
      };
      sessionStorage.setItem(STORE_KEY, JSON.stringify(payload));
    } catch {
      /* Penyimpanan penuh atau diblokir. Alur tetap berjalan tanpa pemulihan. */
    }
  }, [restored, completedTests, questionnaire, phase, currentStep]);

  /* Peringatan sebelum menutup tab selagi ada rekaman yang belum dikirim. */
  useEffect(() => {
    if (!hasWork || result) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasWork, result]);

  /* Simpan hasil rekaman yang lolos quality gate. */
  useEffect(() => {
    if (capturedData?.testType) {
      setCompletedTests(prev => ({
        ...prev,
        [capturedData.testType as string]: capturedData.payload,
      }));
    }
  }, [capturedData]);

  const beginTest = useCallback((type: ScreeningTest) => {
    const index = TEST_SEQUENCE.findIndex(s => s.type === type);
    if (index >= 0) setCurrentStep(index);
    setInstructionFor(type);
  }, []);

  const runCapture = useCallback(() => {
    const type = instructionFor;
    setInstructionFor(null);
    if (type) startCapture(type);
  }, [instructionFor, startCapture]);

  const skipCurrentTest = useCallback(() => {
    setInstructionFor(null);
    setCurrentStep(s => Math.min(s + 1, TEST_SEQUENCE.length - 1));
  }, []);

  const submitScreening = async () => {
    if (!user || !token) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.fullScreening(
        user.id,
        {
          tremor: completedTests.tremor,
          fingerTapping: completedTests.fingerTapping,
          gait: completedTests.gait,
          armSwing: completedTests.armSwing,
          posturalStability: completedTests.posture,
          rom: completedTests.rom,
          questionnaire: questionnaire || undefined,
        },
        token,
      );
      setResult(res);
      try { sessionStorage.removeItem(STORE_KEY); } catch {}
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const riskLevel = useMemo(() => {
    const c = result?.composite.riskCategory;
    if (c === 'HIGH') return 'high' as const;
    if (c === 'MEDIUM') return 'mid' as const;
    return 'low' as const;
  }, [result]);

  if (authLoading || !user) return null;

  /* ── Fase kuesioner ───────────────────────────────────────────────────── */
  if (phase === 'questionnaire' && !result) {
    return (
      <div className={styles.page}>
        <AppNav />
        <main className="sheet" id="main">
          <div className={styles.pad}>
            <PreScreeningQuestionnaire
              onComplete={answers => {
                setQuestionnaire(answers);
                setPhase('tests');
              }}
              onSkip={() => setPhase('tests')}
            />
          </div>
        </main>
        <IntroDialog open={showIntro} onClose={() => setShowIntro(false)} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <AppNav />

      <main className="sheet" id="main">
        <div className={styles.pad}>
          <header className="docHead">
            <div className="docHead__meta">
              <span>{t('res.title')}</span>
              <span>
                {t('scr.stepOf')
                  .replace('{a}', String(currentStep + 1))
                  .replace('{b}', String(TEST_SEQUENCE.length))}
              </span>
              <span>
                {doneCount}/{TEST_SEQUENCE.length} {t('scr.done')}
              </span>
            </div>
            <h1>{t(currentTest.nameKey)}</h1>
            <p className={styles.lead}>{t(currentTest.descKey)}</p>
          </header>

          <div className={styles.layout}>
            <div className={styles.captureColumn}>
              {instructionFor ? (
                <ScreeningInstruction
                  test={currentTest}
                  onStart={runCapture}
                  onSkipTest={skipCurrentTest}
                  onCancel={() => setInstructionFor(null)}
                />
              ) : (
                <CameraView
                  videoRef={videoRef}
                  canvasRef={canvasRef}
                  cameraReady={cameraReady}
                  poseReady={poseReady}
                  isCapturing={isCapturing}
                  activeTest={activeTest}
                  test={currentTest}
                  liveMetrics={liveMetrics}
                  countdown={countdown}
                  fault={fault}
                  detectionWarning={detectionWarning}
                  lightingWarning={lightingWarning}
                  onStart={startCamera}
                  onStop={stopCapture}
                />
              )}

              {cameraReady && poseReady && !isCapturing && !instructionFor && (
                <div className={styles.controls}>
                  <button
                    type="button"
                    className="btn btn--primary btn--lg"
                    onClick={() => beginTest(currentTest.type)}
                  >
                    {completedTests[currentTest.type] ? t('scr.retake') : t('scr.beginTest')}
                  </button>

                  {doneCount > 0 && (
                    <button
                      type="button"
                      className="btn btn--lg"
                      onClick={
                        currentStep === TEST_SEQUENCE.length - 1
                          ? submitScreening
                          : () => setCurrentStep(s => s + 1)
                      }
                    >
                      {currentStep === TEST_SEQUENCE.length - 1 ? t('scr.submit') : t('scr.next')}
                    </button>
                  )}
                </div>
              )}

              {submitError && (
                <p className={styles.submitError} role="alert">
                  {submitError}
                </p>
              )}
            </div>

            {/* Indeks tes. Setiap baris bisa dibuka ulang, jadi rekaman yang
                terlanjur buruk tidak lagi permanen ikut ke dalam skor. */}
            <nav className={styles.index} aria-label={t('scr.sequence')}>
              <h2 className="label">{t('scr.sequence')}</h2>
              <ol className={styles.indexList}>
                {TEST_SEQUENCE.map((spec, i) => {
                  const done = !!completedTests[spec.type];
                  const active = i === currentStep;
                  return (
                    <li key={spec.type}>
                      <button
                        type="button"
                        className={styles.indexRow}
                        data-active={active ? '' : undefined}
                        data-done={done ? '' : undefined}
                        onClick={() => setCurrentStep(i)}
                        aria-current={active ? 'step' : undefined}
                        disabled={isCapturing}
                      >
                        <span className={styles.indexNum}>{String(i + 1).padStart(2, '0')}</span>
                        <span className={styles.indexName}>{t(spec.nameKey)}</span>
                        <span className={styles.indexState}>
                          {done ? t('scr.done') : active ? t('scr.current') : t('scr.pending')}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </div>
        </div>
      </main>

      <IntroDialog open={showIntro} onClose={() => setShowIntro(false)} />

      {/* Rekaman ditolak quality gate. Panel, bukan window.alert. */}
      <Dialog.Root open={!!rejection} onOpenChange={o => !o && clearRejection()}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialogScrim" />
          <Dialog.Content className="dialogSheet">
            <Dialog.Title className={styles.dialogTitle}>
              {rejection?.reason === 'bodyPartMissing'
                ? t('scr.reject.bodyPart.title')
                : t('scr.reject.tooFew.title')}
            </Dialog.Title>
            <Dialog.Description className={styles.dialogBody}>
              {rejection?.reason === 'bodyPartMissing'
                ? t(`test.${rejection.testType}.step1`)
                : t('scr.reject.tooFew.body')}
            </Dialog.Description>
            <button
              type="button"
              className="btn btn--primary btn--lg btn--block"
              onClick={() => {
                clearRejection();
                beginTest(currentTest.type);
              }}
            >
              {t('scr.retake')}
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {isSubmitting && (
        <div className={styles.submitting} role="status" aria-live="polite">
          <div className={styles.submittingInner}>
            <h2>{t('scr.analysing')}</h2>
            <p>{t('scr.analysingBody')}</p>
          </div>
        </div>
      )}

      {/* ── Hasil ─────────────────────────────────────────────────────────── */}
      <Dialog.Root open={!!result}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialogScrim" />
          <Dialog.Content className="dialogSheet" onEscapeKeyDown={e => e.preventDefault()}>
            {result && (
              <article className={styles.result}>
                <Dialog.Title className={styles.resultKicker}>{t('res.title')}</Dialog.Title>

                <p className={styles.scoreLine}>
                  <span className={styles.scoreValue}>
                    {Math.round(result.composite.compositeScore)}
                  </span>
                  <span className={styles.scoreOf}>{t('res.scoreOf')}</span>
                </p>

                <p className={`level level--${riskLevel} ${styles.levelChip}`}>
                  {result.composite.riskLabel}
                </p>

                <p className={styles.scaleNote}>{t('res.scaleNote')}</p>

                {/* Disclaimer tidak lagi bersarang di dalam cabang mana pun.
                    Sebelumnya ia hidup di dalam blok analisis AI, sehingga
                    ketika layanan AI mati pengguna melihat angka merah dan
                    nama kondisi tanpa satu pun peringatan. */}
                <p className={styles.disclaimer}>{t('res.notDiagnosis')}</p>

                <hr className="rule" />

                {result.questionnaireResult && (
                  <table className="dataTable">
                    <tbody>
                      <tr>
                        <td>{t('res.symptomScore')}</td>
                        <td className="num">{Math.round(result.questionnaireResult.score)}</td>
                      </tr>
                      <tr>
                        <td>{t('res.compositeScore')}</td>
                        <td className="num">{Math.round(result.composite.compositeScore)}</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {riskLevel === 'low' && (
                  <section className={styles.block}>
                    <h3>{t('res.lowTitle')}</h3>
                    <p>{t('res.lowBody')}</p>
                  </section>
                )}

                {/* Dugaan model ditandai eksperimental secara eksplisit, karena
                    klasifikasi ML belum tervalidasi klinis. */}
                {result.composite.mlClassification?.predictedLabel && (
                  <section className={styles.experimental}>
                    <h3 className={styles.experimentalHead}>{t('res.experimental')}</h3>
                    <p className={styles.experimentalLabel}>
                      {result.composite.mlClassification.predictedLabel}
                    </p>
                    <p className={styles.experimentalBody}>{t('res.experimentalBody')}</p>
                  </section>
                )}

                {result.aiAnalysis?.available && (
                  <section className={styles.block}>
                    <p>{result.aiAnalysis.ringkasan}</p>

                    {!!result.aiAnalysis.korelasiGejala?.length && (
                      <>
                        <h3>{t('res.correlation')}</h3>
                        <table className="dataTable">
                          <tbody>
                            {result.aiAnalysis.korelasiGejala.map((k, i) => (
                              <tr key={i}>
                                <td>
                                  <strong>{k.gejala}</strong>
                                  <br />
                                  {k.temuanPengukuran}
                                </td>
                                <td className={styles.consistency}>
                                  {k.konsisten ? t('res.consistent') : t('res.inconsistent')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}

                    {!!result.aiAnalysis.saranTindakLanjut?.length && (
                      <>
                        <h3>{t('res.followUp')}</h3>
                        <ul className={styles.list}>
                          {result.aiAnalysis.saranTindakLanjut.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {result.aiAnalysis.perluPerhatianSegera && (
                      <p className={styles.urgent}>{t('res.urgent')}</p>
                    )}

                    <p className={styles.aiNote}>{t('res.aiNote')}</p>
                  </section>
                )}

                {!result.aiAnalysis?.available && result.composite.recommendations?.[0] && (
                  <section className={styles.block}>
                    <p>{result.composite.recommendations[0]}</p>
                  </section>
                )}

                <div className={styles.resultActions}>
                  <button
                    type="button"
                    className="btn btn--primary btn--lg"
                    onClick={() => router.push('/riwayat')}
                  >
                    {t('res.saveForDoctor')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--lg"
                    onClick={() => router.push('/bantuan')}
                  >
                    {t('res.needHelp')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--lg"
                    onClick={() => router.push('/dashboard')}
                  >
                    {t('res.backToDashboard')}
                  </button>
                </div>
              </article>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

/** Lembar pembuka. Empat hal yang harus disiapkan, bukan lima poin berklausa. */
function IntroDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const rows: [string, string][] = [
    ['intro.room', 'intro.roomBody'],
    ['intro.device', 'intro.deviceBody'],
    ['intro.time', 'intro.timeBody'],
    ['intro.privacy', 'intro.privacyBody'],
  ];

  return (
    <Dialog.Root open={open} onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialogScrim" />
        <Dialog.Content className="dialogSheet">
          <Dialog.Title className={styles.dialogTitle}>{t('intro.title')}</Dialog.Title>
          <Dialog.Description className={styles.dialogBody}>{t('intro.lead')}</Dialog.Description>

          <dl className={styles.introList}>
            {rows.map(([k, body]) => (
              <div key={k} className={styles.introRow}>
                <dt className="label">{t(k)}</dt>
                <dd>{t(body).replace('{s}', String(TOTAL_CAPTURE_SECONDS))}</dd>
              </div>
            ))}
          </dl>

          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={onClose}>
            {t('intro.begin')}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
