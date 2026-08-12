'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api, ScreeningResult } from '@/lib/api';
import { useBiomarkerCapture, TestType } from '@/hooks/useBiomarkerCapture';
import CameraView from '@/components/CameraView';
import styles from './screening.module.css';

const TEST_SEQUENCE: { type: TestType; name: string; desc: string; icon: string }[] = [
  { type: 'tremor', name: 'Tremor', desc: 'Angkat tangan kanan Anda sejajar dada dan tahan dalam keadaan rileks. Kamera akan mengukur frekuensi dan amplitudo getaran.', icon: '🤚' },
  { type: 'fingerTapping', name: 'Finger Tapping', desc: 'Angkat tangan Anda. Buka ibu jari dan telunjuk selebar mungkin, lalu ketuk keduanya secepat dan selebar mungkin berulang kali.', icon: '☝️' },
  { type: 'gait', name: 'Pola Jalan (Gait)', desc: 'Mundur 2-3 meter agar seluruh tubuh terlihat. Berjalanlah lurus mendekati kamera dengan langkah biasa.', icon: '🚶' },
  { type: 'armSwing', name: 'Ayunan Lengan', desc: 'Berjalanlah di tempat atau bolak-balik dengan mengayunkan lengan secara natural.', icon: '💪' },
  { type: 'posture', name: 'Keseimbangan', desc: 'Berdiri tegak dengan kaki rapat dan tangan di samping badan. Tahan posisi tersebut.', icon: '🧍' },
  { type: 'rom', name: 'ROM Lutut', desc: 'Berdiri menyamping, angkat satu lutut setinggi mungkin, lalu luruskan perlahan.', icon: '🦵' },
];

export default function ScreeningPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  
  const {
    videoRef, canvasRef, cameraReady, poseReady, error,
    activeTest, isCapturing, liveMetrics, countdown, capturedData, detectionWarning, lightingWarning,
    startCamera, startCapture, stopCapture,
  } = useBiomarkerCapture();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedTests, setCompletedTests] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [showInstruction, setShowInstruction] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Auto-save captured data when a test finishes
  useEffect(() => {
    if (capturedData && capturedData.testType) {
      setCompletedTests(prev => ({
        ...prev,
        [capturedData.testType as string]: capturedData.payload
      }));
    }
  }, [capturedData]);

  const handleNext = () => {
    if (currentStep < TEST_SEQUENCE.length - 1) {
      setCurrentStep(s => s + 1);
      setShowInstruction(false); // reset instruksi untuk tes berikutnya
    } else {
      submitScreening();
    }
  };

  // Dipanggil saat user klik "Mulai Rekam"
  const handleStartRequest = () => {
    setShowInstruction(true);
  };

  // Dipanggil setelah instruksi countdown selesai
  const handleInstructionDone = () => {
    setShowInstruction(false);
    startCapture(currentTest.type);
  };

  // Dipanggil saat user klik "Lewati"
  const handleInstructionSkip = () => {
    setShowInstruction(false);
    startCapture(currentTest.type);
  };

  const submitScreening = async () => {
    if (!user || !token) {
      alert('Anda harus login terlebih dahulu');
      router.push('/login');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // payload matches full-screening API
      const payload = {
        tremor: completedTests['tremor'],
        fingerTapping: completedTests['fingerTapping'],
        gait: completedTests['gait'],
        armSwing: completedTests['armSwing'],
        posturalStability: completedTests['posture'],
        rom: completedTests['rom']
      };
      
      const res = await api.fullScreening(user.id, payload, token);
      setResult(res);
    } catch (e: any) {
      alert('Gagal mengirim data: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTest = TEST_SEQUENCE[currentStep];

  return (
    <div className={styles.page}>
      {showOnboarding && (
        <div className={styles.resultPanel}>
          <div className={styles.resultCard} style={{ textAlign: 'left', maxWidth: 520 }}>
            <h2 style={{ marginBottom: 16 }}>📋 Sebelum Mulai Skrining</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              Ini adalah self-test yang Anda lakukan sendiri di depan kamera, tanpa didampingi tenaga
              medis secara langsung. Mohon perhatikan hal berikut sebelum mulai:
            </p>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.9, marginBottom: 24, paddingLeft: 20 }}>
              <li>Ada <strong>6 tes gerakan</strong> singkat (± 3-5 menit total), masing-masing dengan instruksi & contoh gerakan sebelum mulai.</li>
              <li>Gunakan ruangan dengan <strong>pencahayaan cukup</strong> dan ruang gerak yang cukup, terutama untuk tes berjalan.</li>
              <li>Ikuti bagian tubuh yang diminta di setiap tes. Sistem akan menampilkan peringatan jika bagian tubuh tidak terdeteksi jelas di kamera.</li>
              <li>Hasil skrining ini <strong>bukan diagnosis medis</strong>, hanya alat bantu deteksi dini. Jika hasil menunjukkan risiko sedang/tinggi, konsultasikan ke dokter.</li>
              <li>Jika memungkinkan, lakukan didampingi keluarga atau tenaga kesehatan agar lebih mudah memahami instruksi dan hasilnya.</li>
            </ul>
            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setShowOnboarding(false)}>
              Saya Mengerti, Mulai Skrining
            </button>
          </div>
        </div>
      )}

      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Skrining Klinis NeuronMotion</h1>
          <p>Ikuti instruksi di layar untuk melakukan tes biomarker motorik.</p>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Langkah {currentStep + 1} dari {TEST_SEQUENCE.length}</span>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${((currentStep + (completedTests[currentTest.type as string] ? 1 : 0)) / TEST_SEQUENCE.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className={styles.mainColumn}>
          <div className={styles.instructions}>
            <h4>{currentTest.icon} Instruksi {currentTest.name}</h4>
            <p>{currentTest.desc}</p>
          </div>

          <CameraView 
            videoRef={videoRef}
            canvasRef={canvasRef}
            cameraReady={cameraReady}
            poseReady={poseReady}
            isCapturing={isCapturing}
            activeTest={activeTest}
            liveMetrics={liveMetrics}
            countdown={countdown}
            error={error}
            detectionWarning={detectionWarning}
            lightingWarning={lightingWarning}
            onStart={startCamera}
            onStartCapture={handleInstructionDone}
            showInstruction={showInstruction}
            instructionTestType={currentTest.type as TestType}
            onInstructionDone={handleInstructionDone}
            onInstructionSkip={handleInstructionSkip}
          />

          {cameraReady && poseReady && (
            <div className={styles.controls}>
              {!isCapturing ? (
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={handleStartRequest}
                  disabled={showInstruction}
                >
                  Mulai Rekam &bull; {currentTest.name}
                </button>
              ) : (
                <button 
                  className="btn btn-danger btn-lg" 
                  onClick={stopCapture}
                >
                  Hentikan Rekaman
                </button>
              )}
              
              {completedTests[currentTest.type as string] && !isCapturing && (
                <button 
                  className="btn btn-outline btn-lg"
                  onClick={handleNext}
                  style={{ background: 'var(--green-dim)', borderColor: 'var(--green)' }}
                >
                  {currentStep === TEST_SEQUENCE.length - 1 ? 'Kirim Hasil Skrining' : 'Lanjut ke Tes Berikutnya'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className={styles.sideColumn}>
          <div className={styles.stepCard}>
            <h3 className={styles.stepTitle}>Urutan Tes</h3>
            <div className={styles.stepList}>
              {TEST_SEQUENCE.map((test, i) => {
                const isDone = !!completedTests[test.type as string];
                const isActive = currentStep === i;
                return (
                  <div key={test.type} className={`${styles.stepItem} ${isActive ? styles.active : ''} ${isDone ? styles.done : ''}`}>
                    <span>{test.icon} {test.name}</span>
                    <span>{isDone ? '✅' : isActive ? '⏳' : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {isSubmitting && (
        <div className={styles.resultPanel}>
          <div className={styles.resultCard}>
            <h2 style={{ marginBottom: 20 }}>Menganalisis Data Biomarker...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Memproses hasil pengukuran motorik, mohon tunggu sebentar.</p>
          </div>
        </div>
      )}

      {result && (
        <div className={styles.resultPanel}>
          <div className={styles.resultCard}>
            <div 
              className={styles.scoreCircle}
              style={{
                borderColor: result.composite.riskCategory === 'HIGH' ? 'var(--red)' : 
                             result.composite.riskCategory === 'MEDIUM' ? 'var(--yellow)' : 'var(--green)',
                color: result.composite.riskCategory === 'HIGH' ? 'var(--red)' : 
                       result.composite.riskCategory === 'MEDIUM' ? 'var(--yellow)' : 'var(--green)'
              }}
            >
              {Math.round(result.composite.compositeScore)}
            </div>
            
            <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>{result.composite.riskLabel}</h2>
            
            {result.composite.mlClassification?.predictedLabel && (
              <div className="badge badge-brand" style={{ marginBottom: 24, fontSize: '1rem', padding: '6px 16px' }}>
                {result.composite.mlClassification.predictedLabel}
              </div>
            )}
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6 }}>
              {result.composite.recommendations[0]}
            </p>
            
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
                Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
