'use client';
/**
 * useBiomarkerCapture, Hook utama MediaPipe + biomarker extraction
 * Menggunakan @mediapipe/tasks-vision untuk pose & hand estimation real-time
 */
import { useRef, useState, useCallback, useEffect } from 'react';

export type TestType = 'tremor' | 'fingerTapping' | 'gait' | 'armSwing' | 'posture' | 'rom' | null;

export interface LiveMetrics {
  tremorFreq?: number;
  tremorAmp?: number;
  tapRate?: number;
  tapCount?: number;
  gaitSteps?: number;
  armAsymmetry?: number;
  swayArea?: number;
  romKnee?: number;
  countdown?: number;
}

interface Landmark {
  x: number; y: number; z: number; visibility?: number;
}

/**
 * Durasi perekaman per tes, dalam detik.
 *
 * Ini satu-satunya sumber kebenaran durasi. Teks instruksi TIDAK boleh menulis
 * angkanya sendiri, melainkan menyisipkan nilai dari sini, karena sebelumnya
 * setiap instruksi menyebut "10 detik" sementara tiga tes sebenarnya merekam
 * 15 detik. Pengguna berhenti bergerak di detik ke-10 dan sepertiga terakhir
 * rekaman berisi orang yang berdiri diam, yang merusak biomarkernya.
 */
export const TEST_DURATION: Record<string, number> = {
  tremor: 10,
  fingerTapping: 10,
  gait: 15,
  armSwing: 15,
  posture: 15,
  rom: 10,
};

/** Sebab kegagalan kamera, dibedakan agar tiap sebab punya pemulihannya sendiri. */
export type CameraFault =
  | 'denied'      // izin ditolak, termasuk blokir permanen
  | 'notFound'    // tidak ada kamera pada perangkat
  | 'inUse'       // kamera dipakai aplikasi lain
  | 'insecure'    // halaman tidak dilayani lewat HTTPS
  | 'modelTimeout'
  | 'modelFailed'
  | 'unknown';

/** Sebab rekaman ditolak oleh quality gate. */
export interface CaptureRejection {
  reason: 'tooFewSamples' | 'bodyPartMissing';
  testType: string;
  sampleCount?: number;
}

// Pesan peringatan spesifik per tes ketika bagian tubuh yang diminta tidak terdeteksi
const BODY_PART_WARNING: Record<string, string> = {
  tremor: 'Tangan tidak terdeteksi. Pastikan tangan Anda terlihat jelas di kamera.',
  fingerTapping: 'Tangan tidak terdeteksi. Pastikan tangan Anda terlihat jelas di kamera.',
  gait: 'Kaki tidak terdeteksi jelas. Mundur agar seluruh tubuh terlihat di kamera.',
  armSwing: 'Lengan tidak terdeteksi. Pastikan tubuh bagian atas terlihat jelas di kamera.',
  posture: 'Tubuh tidak terdeteksi. Pastikan Anda berdiri di depan kamera dengan pencahayaan cukup.',
  rom: 'Lutut tidak terdeteksi jelas. Pastikan kaki terlihat dari samping.',
};
// Frame beruntun tanpa sampel valid sebelum peringatan live ditampilkan (~1.5 detik @30fps)
const MISS_STREAK_WARNING_THRESHOLD = 45;
// Minimal proporsi frame valid dari total durasi tes agar hasil bisa diterima
const MIN_VALID_FRAME_RATIO = 0.35;

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20] // pinky
];

const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32],
];

// Threshold jarak (normalized 0 sampai 1) untuk menentukan jari "CLOSED" (tersentuh)
const TAP_CLOSED_THRESHOLD = 0.05;
// Jari harus terbuka > threshold ini agar bisa dihitung sebagai tap baru
const TAP_OPEN_THRESHOLD = 0.08;

export function useBiomarkerCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelsRef = useRef<any>(null);
  const animFrameRef = useRef<number>(0);
  const samplesRef = useRef<unknown[]>([]);
  const isCapturing = useRef(false);
  const startTime = useRef(0);
  const activeTestRef = useRef<TestType>(null);
  // State machine finger tapping
  const tapStateRef = useRef<'OPEN' | 'CLOSED'>('OPEN');
  const tapTimesRef = useRef<number[]>([]);
  // Deteksi langkah (peak) untuk live counter gait, bukan angka simetri yang di-hardcode
  const gaitStepCountRef = useRef(0);
  const gaitLastPeakTimeRef = useRef<number | null>(null);
  // Validasi bagian tubuh yang benar sedang terekam (bukan cuma jumlah total sampel)
  const missStreakRef = useRef(0);
  const totalFramesRef = useRef(0);
  const validFramesRef = useRef(0);
  const detectionWarningRef = useRef(false);
  const [detectionWarning, setDetectionWarning] = useState<string | null>(null);
  // Cek pencahayaan: sampel kecerahan rata-rata tiap ~20 frame dari kanvas kecil terpisah
  const lightingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightingFrameCounterRef = useRef(0);
  const [lightingWarning, setLightingWarning] = useState<string | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [activeTest, setActiveTest] = useState<TestType>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({});
  const [capturedData, setCapturedData] = useState<Record<string, unknown> | null>(null);
  const [isCapturingState, setIsCapturingState] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [modelsReady, setModelsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fault, setFault] = useState<CameraFault | null>(null);
  const [rejection, setRejection] = useState<CaptureRejection | null>(null);

  // ── Init Camera ─────────────────────────────────────────────────────────────
  /**
   * Tiga tes membutuhkan seluruh tubuh berdiri masuk frame. Pada layar sempit
   * yang dipegang portrait, meminta 1280x720 lanskap menghasilkan strip
   * mendatar yang secara fisik tidak bisa memuat orang dewasa berdiri pada
   * jarak dua meter, dan pergelangan kaki yang jadi dasar biomarker gait jatuh
   * di luar frame. Jadi orientasi permintaan mengikuti orientasi layar.
   */
  const startCamera = useCallback(async () => {
    setFault(null);
    setError(null);

    // getUserMedia hanya tersedia pada konteks aman. Tanpa pemeriksaan ini,
    // kegagalannya muncul sebagai penolakan biasa dan pengguna diminta memberi
    // izin yang tidak akan pernah ditawarkan browser.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setFault('insecure');
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setFault('unknown');
      return;
    }

    const portrait =
      typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: portrait
          ? { width: { ideal: 720 }, height: { ideal: 1280 }, facingMode: 'user' }
          : { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
      await initMediaPipe();
    } catch (e) {
      const name = (e as { name?: string })?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') setFault('denied');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setFault('notFound');
      else if (name === 'NotReadableError' || name === 'AbortError') setFault('inUse');
      else setFault('unknown');
      console.error(e);
    }
  }, []);

  // ── Init MediaPipe Models ───────────────────────────────────────────────────
  const initMediaPipe = useCallback(async () => {
    // Timeout 30 detik, jika model tidak selesai load, tampilkan error
    const timeoutId = setTimeout(() => {
      if (!modelsRef.current) {
        setFault('modelTimeout');
        setModelsReady(false);
      }
    }, 30_000);

    try {
      const { PoseLandmarker, HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

      // Gunakan versi pinned agar lebih stabil
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      clearTimeout(timeoutId);
      modelsRef.current = { poseLandmarker, handLandmarker };
      setModelsReady(true);
      startRenderLoop();
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn('GPU delegate failed, falling back to CPU', e);
      await initMediaPipeCPU();
    }
  }, []);

  const initMediaPipeCPU = useCallback(async () => {
    const timeoutId = setTimeout(() => {
      if (!modelsRef.current) {
        setFault('modelTimeout');
      }
    }, 30_000);
    try {
      const { PoseLandmarker, HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task', delegate: 'CPU' },
        runningMode: 'VIDEO', numPoses: 1,
      });
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task', delegate: 'CPU' },
        runningMode: 'VIDEO', numHands: 1,
      });

      clearTimeout(timeoutId);
      modelsRef.current = { poseLandmarker, handLandmarker };
      setModelsReady(true);
      startRenderLoop();
    } catch (e) {
      clearTimeout(timeoutId);
      setFault('modelFailed');
    }
  }, []);

  // ── Stop Capture Local ──────────────────────────────────────────────────────
  const handleStopFromLoop = () => {
    isCapturing.current = false;
    setIsCapturingState(false);
    setCountdown(0);
    setDetectionWarning(null);
    detectionWarningRef.current = false;

    const test = activeTestRef.current;
    let samples = samplesRef.current;

    // QUALITY GATE 1: Validasi kelengkapan data (Minimal 20 frame terekam)
    //
    // Kegagalan dilaporkan sebagai keadaan, bukan window.alert. Kotak OS tidak
    // bisa diterjemahkan, tidak bisa ditata, berukuran kecil, dan harus ditutup
    // dengan menyentuh perangkat yang justru sengaja ditinggalkan pengguna dua
    // meter di belakangnya.
    if (samples.length < 20) {
      setRejection({ reason: 'tooFewSamples', testType: test || '', sampleCount: samples.length });
      return; // Memaksa user untuk mengulang (tanpa men-trigger setCapturedData)
    }

    // QUALITY GATE 2: Validasi proporsi frame valid, mencegah tes "lolos" hanya karena
    // total sampel numerik cukup, padahal sebagian besar durasi bagian tubuh yang benar
    // tidak terdeteksi sama sekali (mis. diminta gerakkan kaki tapi yang terekam tangan).
    const validRatio = totalFramesRef.current > 0 ? validFramesRef.current / totalFramesRef.current : 1;
    if (validRatio < MIN_VALID_FRAME_RATIO) {
      setRejection({ reason: 'bodyPartMissing', testType: test || '' });
      return;
    }

    let payload: Record<string, unknown> = {};

    if (test === 'tremor') {
      payload = { samples };
    } else if (test === 'fingerTapping') {
      payload = { taps: samples };
    } else if (test === 'gait') {
      payload = { steps: samples };
    } else if (test === 'armSwing') {
      payload = { frames: samples };
    } else if (test === 'posture') {
      payload = { frames: samples };
    } else if (test === 'rom') {
      payload = { joint: 'KNEE', angles: samples as number[] };
    }

    if (test) {
      setCapturedData({ testType: test, payload, sampleCount: samples.length });
    }
  };

  // ── Render Loop ──────────────────────────────────────────────────────────────
  const startRenderLoop = useCallback(() => {
    const render = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const models = modelsRef.current;

      if (!video || !canvas || !models || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) { animFrameRef.current = requestAnimationFrame(render); return; }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw mirrored video
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Cek pencahayaan setiap ~20 frame (bukan tiap frame, demi performa) dengan
      // menyampel kecerahan rata-rata dari kanvas mini terpisah.
      lightingFrameCounterRef.current += 1;
      if (lightingFrameCounterRef.current % 20 === 0) {
        if (!lightingCanvasRef.current) {
          lightingCanvasRef.current = document.createElement('canvas');
          lightingCanvasRef.current.width = 16;
          lightingCanvasRef.current.height = 12;
        }
        const lctx = lightingCanvasRef.current.getContext('2d', { willReadFrequently: true });
        if (lctx) {
          lctx.drawImage(video, 0, 0, 16, 12);
          const data = lctx.getImageData(0, 0, 16, 12).data;
          let sum = 0;
          for (let i = 0; i < data.length; i += 4) {
            sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          }
          const avgBrightness = sum / (data.length / 4); // 0 (hitam) sampai 255 (putih)
          if (avgBrightness < 45) {
            setLightingWarning('Ruangan terlalu gelap. Cari pencahayaan lebih terang agar deteksi lebih akurat.');
          } else if (avgBrightness > 225) {
            setLightingWarning('Cahaya terlalu terang/silau. Hindari cahaya langsung menghadap kamera.');
          } else {
            setLightingWarning(null);
          }
        }
      }

      const test = activeTestRef.current;
      const isHandMode = test === 'tremor' || test === 'fingerTapping';

      let landmarksToDraw: Landmark[] | null = null;

      // Jalankan model sesuai tipe tes
      const sampleCountBefore = samplesRef.current.length;
      if (isHandMode) {
        const result = models.handLandmarker.detectForVideo(video, performance.now());
        if (result?.landmarks?.length > 0) {
          landmarksToDraw = result.landmarks[0]; // Ambil tangan pertama
          if (isCapturing.current) processHandSample(landmarksToDraw as Landmark[]);
        }
      } else {
        const result = models.poseLandmarker.detectForVideo(video, performance.now());
        if (result?.landmarks?.length > 0) {
          landmarksToDraw = result.landmarks[0]; // Ambil orang pertama
          if (isCapturing.current) processPoseSample(landmarksToDraw as Landmark[]);
        }
      }

      // Validasi live: apakah bagian tubuh yang benar sedang benar-benar terekam,
      // bukan cuma "ada orang di kamera", mengatasi kasus tes tetap "lanjut" walau
      // bagian tubuh yang diminta (mis. kaki) tidak terlihat sama sekali.
      if (isCapturing.current) {
        totalFramesRef.current += 1;
        const gotValidSample = samplesRef.current.length > sampleCountBefore;
        if (gotValidSample) {
          validFramesRef.current += 1;
          missStreakRef.current = 0;
          if (detectionWarningRef.current) { detectionWarningRef.current = false; setDetectionWarning(null); }
        } else {
          missStreakRef.current += 1;
          if (missStreakRef.current >= MISS_STREAK_WARNING_THRESHOLD && !detectionWarningRef.current) {
            detectionWarningRef.current = true;
            setDetectionWarning(BODY_PART_WARNING[test || ''] || 'Bagian tubuh tidak terdeteksi. Sesuaikan posisi Anda.');
          }
        }
      }

      if (landmarksToDraw) {
        drawSkeleton(ctx, landmarksToDraw, canvas.width, canvas.height, isHandMode);
      }

      // Countdown overlay
      if (isCapturing.current) {
        const elapsed = (Date.now() - startTime.current) / 1000;
        const dur = TEST_DURATION[test || 'tremor'] || 10;
        const remaining = Math.max(0, dur - elapsed);
        setCountdown(Math.ceil(remaining));

        // Hitung mundur digambar sebagai DOM di atas video, bukan di canvas ini.
        // Teks canvas hidup dalam ruang koordinat selebar 1280, sehingga pada
        // HP selebar 390 piksel ia tampil sekitar 6 piksel, tidak terbaca oleh
        // siapa pun, apalagi oleh pengguna yang berdiri dua meter di depannya.

        if (remaining <= 0) {
          handleStopFromLoop();
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
  }, []);

  // ── Draw Skeleton ─────────────────────────────────────────────────────────────
  function drawSkeleton(ctx: CanvasRenderingContext2D, landmarks: Landmark[], w: number, h: number, isHand: boolean) {
    ctx.strokeStyle = isHand ? 'rgba(16,185,129,0.7)' : 'rgba(59,130,246,0.7)';
    ctx.lineWidth = isHand ? 3 : 2;
    
    const connections = isHand ? HAND_CONNECTIONS : POSE_CONNECTIONS;

    connections.forEach(([a, b]) => {
      const lA = landmarks[a], lB = landmarks[b];
      if (!lA || !lB) return;
      if (!isHand && ((lA.visibility || 0) < 0.2 || (lB.visibility || 0) < 0.2)) return;
      ctx.beginPath();
      ctx.moveTo((1 - lA.x) * w, lA.y * h);
      ctx.lineTo((1 - lB.x) * w, lB.y * h);
      ctx.stroke();
    });

    landmarks.forEach((lm, i) => {
      if (!isHand && (lm.visibility || 0) < 0.2) return;
      // Beri warna khusus pada area pantauan AI (contoh: ujung jari untuk tapping)
      const isTarget = isHand ? (i === 4 || i === 8 || i === 0) : [11,12,13,14,23,24,25,26,27,28].includes(i);
      ctx.fillStyle = isTarget ? 'rgba(239,68,68,0.9)' : (isHand ? 'rgba(16,185,129,0.6)' : 'rgba(59,130,246,0.6)');
      ctx.beginPath();
      ctx.arc((1 - lm.x) * w, lm.y * h, isTarget ? (isHand ? 6 : 5) : 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // ── Process Hand Samples (HandLandmarker) ──────────────────────────────────
  function processHandSample(landmarks: Landmark[]) {
    const now = Date.now() - startTime.current;
    const test = activeTestRef.current;

    switch (test) {
      case 'tremor': {
        const wrist = landmarks[0]; // Wrist di HandLandmarker adalah titik 0
        if (wrist) {
          samplesRef.current.push({ timestamp: now, x: wrist.x, y: wrist.y, z: wrist.z || 0 });
          if (samplesRef.current.length > 5) {
            const recent = samplesRef.current.slice(-10) as Array<{ x: number; y: number }>;
            const avgX = recent.reduce((s, p) => s + p.x, 0) / recent.length;
            const avgY = recent.reduce((s, p) => s + p.y, 0) / recent.length;
            const amp = recent.reduce((s, p) => s + Math.hypot(p.x - avgX, p.y - avgY), 0) / recent.length;
            setLiveMetrics(prev => ({ ...prev, tremorAmp: parseFloat((amp * 1000).toFixed(2)) }));
          }
        }
        break;
      }
      case 'fingerTapping': {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        if (thumbTip && indexTip) {
          const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
          // Simpan setiap frame sebagai raw data untuk server
          samplesRef.current.push({ timestamp: now, distance });

          // State machine: hitung tap nyata berdasarkan transisi OPEN → CLOSED
          if (tapStateRef.current === 'OPEN' && distance < TAP_CLOSED_THRESHOLD) {
            // Transisi: jari DITUTUP → ini adalah 1 tap
            tapStateRef.current = 'CLOSED';
            tapTimesRef.current.push(now);
          } else if (tapStateRef.current === 'CLOSED' && distance > TAP_OPEN_THRESHOLD) {
            // Transisi: jari DIBUKA → siap untuk tap berikutnya
            tapStateRef.current = 'OPEN';
          }

          const tapCount = tapTimesRef.current.length;
          const dur = now / 1000 || 1;
          setLiveMetrics(p => ({
            ...p,
            tapRate: parseFloat((tapCount / dur).toFixed(1)),
            tapCount,
          }));
        }
        break;
      }
    }
  }

  // ── Process Pose Samples (PoseLandmarker) ──────────────────────────────────
  function processPoseSample(landmarks: Landmark[]) {
    const now = Date.now() - startTime.current;
    const test = activeTestRef.current;

    switch (test) {
      case 'gait': {
        const lAnkle = landmarks[27], rAnkle = landmarks[28];
        if (lAnkle && rAnkle && (lAnkle.visibility || 0) > 0.3 && (rAnkle.visibility || 0) > 0.3) {
          // Hitung jarak 2D antara kedua pergelangan kaki
          const ankleDist = Math.hypot(lAnkle.x - rAnkle.x, lAnkle.y - rAnkle.y);
          samplesRef.current.push({ timestamp: now, distance: ankleDist });

          // Deteksi langkah real-time: local maximum jarak antar-ankle = 1 langkah
          const s = samplesRef.current as Array<{ timestamp: number; distance: number }>;
          if (s.length >= 3) {
            const a = s[s.length - 3], b = s[s.length - 2], c = s[s.length - 1];
            const isPeak = b.distance > a.distance && b.distance > c.distance && b.distance > 0.05;
            const lastPeak = gaitLastPeakTimeRef.current;
            if (isPeak && (lastPeak === null || b.timestamp - lastPeak >= 250)) {
              gaitLastPeakTimeRef.current = b.timestamp;
              gaitStepCountRef.current += 1;
            }
          }
          setLiveMetrics(p => ({ ...p, gaitSteps: gaitStepCountRef.current }));
        }
        break;
      }
      case 'armSwing': {
        const lShoulder = landmarks[11], rShoulder = landmarks[12];
        const lWrist = landmarks[15], rWrist = landmarks[16]; // Gunakan wrist, bukan elbow untuk ayunan
        if (lWrist && rWrist && lShoulder && rShoulder && (lWrist.visibility || 0) > 0.3 && (rWrist.visibility || 0) > 0.3) {
          // Sudut deviasi lengan dari garis vertikal ke bawah (pendulum)
          // atan2(dx, dy) dimana dy positif ke bawah, dx positif ke kanan
          const lAngle = Math.abs(Math.atan2(lWrist.x - lShoulder.x, lWrist.y - lShoulder.y) * (180 / Math.PI));
          const rAngle = Math.abs(Math.atan2(rWrist.x - rShoulder.x, rWrist.y - rShoulder.y) * (180 / Math.PI));
          
          samplesRef.current.push({ timestamp: now, leftAngle: lAngle, rightAngle: rAngle });
          
          const asym = Math.abs(lAngle - rAngle) / (Math.max(lAngle, rAngle) || 1) * 100;
          setLiveMetrics(p => ({ ...p, armAsymmetry: parseFloat(asym.toFixed(1)) }));
        }
        break;
      }
      case 'posture': {
        const hip = landmarks[23], shoulder = landmarks[11];
        if (hip && shoulder && (hip.visibility || 0) > 0.3 && (shoulder.visibility || 0) > 0.3) {
          samplesRef.current.push({ timestamp: now, hipX: hip.x, hipY: hip.y, shoulderX: shoulder.x, shoulderY: shoulder.y });
          if (samplesRef.current.length > 5) {
            const recent = samplesRef.current.slice(-10) as Array<{ hipX: number; hipY: number }>;
            const xs = recent.map(s => s.hipX), ys = recent.map(s => s.hipY);
            const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
            setLiveMetrics(p => ({ ...p, swayArea: parseFloat((area * 10000).toFixed(3)) }));
          }
        }
        break;
      }
      case 'rom': {
        const hip = landmarks[23], knee = landmarks[25], ankle = landmarks[27];
        if (hip && knee && ankle && (knee.visibility || 0) > 0.3) {
          const v1 = { x: hip.x - knee.x, y: hip.y - knee.y };
          const v2 = { x: ankle.x - knee.x, y: ankle.y - knee.y };
          const dot = v1.x * v2.x + v1.y * v2.y;
          const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
          const angle = mag > 0 ? Math.acos(Math.min(1, Math.max(-1, dot / mag))) * (180 / Math.PI) : 0;
          samplesRef.current.push(angle);
          setLiveMetrics(p => ({ ...p, romKnee: parseFloat(angle.toFixed(1)) }));
        }
        break;
      }
    }
  }

  // ── Start / Stop Capture API untuk komponen eksternal ────────────────────────
  const startCapture = useCallback((testType: TestType) => {
    samplesRef.current = [];
    isCapturing.current = true;
    startTime.current = Date.now();
    setActiveTest(testType);
    activeTestRef.current = testType;
    setIsCapturingState(true);
    setCapturedData(null);
    setLiveMetrics({});
    // Reset state machine finger tapping
    tapStateRef.current = 'OPEN';
    tapTimesRef.current = [];
    // Reset live step counter gait
    gaitStepCountRef.current = 0;
    gaitLastPeakTimeRef.current = null;
    // Reset validasi deteksi bagian tubuh
    missStreakRef.current = 0;
    totalFramesRef.current = 0;
    validFramesRef.current = 0;
    detectionWarningRef.current = false;
    setDetectionWarning(null);
  }, []);

  const stopCapture = useCallback(() => {
    handleStopFromLoop();
  }, []);

  // ── Stop camera ───────────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraReady(false);
    setModelsReady(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const clearRejection = useCallback(() => setRejection(null), []);

  return {
    videoRef, canvasRef,
    cameraReady, poseReady: modelsReady, error,
    fault, rejection, clearRejection,
    activeTest, isCapturing: isCapturingState,
    liveMetrics, countdown, capturedData, detectionWarning, lightingWarning,
    startCamera, stopCamera,
    startCapture, stopCapture,
  };
}
