'use client';
/**
 * useBiomarkerCapture — Hook utama MediaPipe + biomarker extraction
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

const TEST_DURATION: Record<string, number> = {
  tremor: 10,
  fingerTapping: 10,
  gait: 15,
  armSwing: 15,
  posture: 15,
  rom: 10,
};

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

// Threshold jarak (normalized 0–1) untuk menentukan jari "CLOSED" (tersentuh)
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
  // Deteksi langkah (peak) untuk live counter gait — bukan angka simetri yang di-hardcode
  const gaitStepCountRef = useRef(0);
  const gaitLastPeakTimeRef = useRef<number | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [activeTest, setActiveTest] = useState<TestType>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({});
  const [capturedData, setCapturedData] = useState<Record<string, unknown> | null>(null);
  const [isCapturingState, setIsCapturingState] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [modelsReady, setModelsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Init Camera ─────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
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
      setError('Kamera tidak bisa diakses. Pastikan izin kamera sudah diberikan.');
      console.error(e);
    }
  }, []);

  // ── Init MediaPipe Models ───────────────────────────────────────────────────
  const initMediaPipe = useCallback(async () => {
    // Timeout 30 detik — jika model tidak selesai load, tampilkan error
    const timeoutId = setTimeout(() => {
      if (!modelsRef.current) {
        setError('Sistem analisis tidak bisa dimuat (timeout). Periksa koneksi internet lalu refresh halaman.');
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
        setError('Sistem analisis tidak bisa dimuat (timeout). Periksa koneksi internet lalu refresh halaman.');
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
      setError('Gagal memuat sistem analisis. Coba refresh halaman atau periksa koneksi internet Anda.');
    }
  }, []);

  // ── Stop Capture Local ──────────────────────────────────────────────────────
  const handleStopFromLoop = () => {
    isCapturing.current = false;
    setIsCapturingState(false);
    setCountdown(0);

    const test = activeTestRef.current;
    let samples = samplesRef.current;
    
    // QUALITY GATE: Validasi kelengkapan data (Minimal 20 frame terekam)
    if (samples.length < 20) {
      alert(`Data pergerakan tidak cukup (Hanya ${samples.length} sampel terdeteksi). Pastikan posisi Anda sesuai panduan di kamera. Silakan ulangi tes ini.`);
      return; // Memaksa user untuk mengulang (tanpa men-trigger setCapturedData)
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

      const test = activeTestRef.current;
      const isHandMode = test === 'tremor' || test === 'fingerTapping';

      let landmarksToDraw: Landmark[] | null = null;

      // Jalankan model sesuai tipe tes
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

      if (landmarksToDraw) {
        drawSkeleton(ctx, landmarksToDraw, canvas.width, canvas.height, isHandMode);
      }

      // Countdown overlay
      if (isCapturing.current) {
        const elapsed = (Date.now() - startTime.current) / 1000;
        const dur = TEST_DURATION[test || 'tremor'] || 10;
        const remaining = Math.max(0, dur - elapsed);
        setCountdown(Math.ceil(remaining));

        ctx.fillStyle = 'rgba(239,68,68,0.8)';
        ctx.beginPath();
        ctx.arc(canvas.width - 30, 30, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Inter';
        ctx.textAlign = 'right';
        ctx.fillText(`REC ${remaining.toFixed(1)}s`, canvas.width - 50, 38);
        ctx.textAlign = 'left';

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

  return {
    videoRef, canvasRef,
    cameraReady, poseReady: modelsReady, error,
    activeTest, isCapturing: isCapturingState,
    liveMetrics, countdown, capturedData,
    startCamera, stopCamera,
    startCapture, stopCapture,
  };
}
