/**
 * ============================================================
 * NEURONMOTION — Enhanced Scoring Engine
 * Menggabungkan rule-based threshold + K-NN classification
 * ============================================================
 */

import { CLINICAL_REFERENCE, getClassifier } from '../data/clinicalData.js';

/**
 * Estimasi frekuensi dominan via periodogram (non-uniform DFT) pada sinyal bertanda.
 * Dipakai alih-alih zero-crossing pada magnitude (yang selalu >=0 dan cenderung
 * "melipat gandakan" frekuensi/frequency-doubling untuk gerakan tremor yang relatif linear).
 */
function estimateDominantFrequency(times, signal, minHz = 1.0, maxHz = 15.0, stepHz = 0.1) {
  let bestFreq = minHz, bestPower = -1;
  for (let f = minHz; f <= maxHz; f += stepHz) {
    let re = 0, im = 0;
    for (let i = 0; i < times.length; i++) {
      const phase = 2 * Math.PI * f * times[i];
      re += signal[i] * Math.cos(phase);
      im += signal[i] * Math.sin(phase);
    }
    const power = re * re + im * im;
    if (power > bestPower) { bestPower = power; bestFreq = f; }
  }
  return bestFreq;
}

/**
 * Analisis Tremor (enhanced)
 */
export function analyzeTremor({ samples, bodyPart = 'WRIST_RIGHT' }) {
  if (!samples || samples.length < 10)
    return { error: 'Minimal 10 sampel dibutuhkan' };

  const avgX = samples.reduce((s, p) => s + p.x, 0) / samples.length;
  const avgY = samples.reduce((s, p) => s + p.y, 0) / samples.length;
  const displacements = samples.map(p => Math.hypot(p.x - avgX, p.y - avgY));
  const amplitude = Math.sqrt(displacements.reduce((s, d) => s + d * d, 0) / displacements.length);

  // Waktu tiap sampel (detik), relatif terhadap sampel pertama
  const t0 = samples[0]?.timestamp;
  const times = samples.map((p, i) => t0 !== undefined ? (p.timestamp - t0) / 1000 : i / 30);

  // Proyeksikan (x,y) yang sudah di-center ke sumbu utama gerakan (PCA 2D→1D)
  // agar sinyalnya bertanda (+/-), bukan magnitude yang selalu positif.
  const dxs = samples.map(p => p.x - avgX);
  const dys = samples.map(p => p.y - avgY);
  const n = dxs.length;
  const covXX = dxs.reduce((s, v) => s + v * v, 0) / n;
  const covYY = dys.reduce((s, v) => s + v * v, 0) / n;
  const covXY = dxs.reduce((s, v, i) => s + v * dys[i], 0) / n;
  const theta = 0.5 * Math.atan2(2 * covXY, covXX - covYY);
  const projected = dxs.map((dx, i) => dx * Math.cos(theta) + dys[i] * Math.sin(theta));

  const dominantFrequencyHz = estimateDominantFrequency(times, projected);
  const ref = CLINICAL_REFERENCE.tremor;

  let category, interpretation, score, updrsEstimate;

  if (amplitude < ref.normalAmplitudeMax) {
    category = 'NORMAL'; score = 0; updrsEstimate = 0;
    interpretation = `Tidak ada tremor signifikan (amplitudo ${(amplitude * 1000).toFixed(1)}mm).`;
  } else if (dominantFrequencyHz >= ref.parkinsonsFreqMin && dominantFrequencyHz <= ref.parkinsonsFreqMax) {
    category = 'PARKINSON_TREMOR'; score = 85; updrsEstimate = 3;
    interpretation = `⚠️ Tremor istirahat ${dominantFrequencyHz.toFixed(1)} Hz di ${bodyPart} — pola khas Parkinson (4-6 Hz). Konsultasi spesialis saraf segera.`;
  } else if (dominantFrequencyHz > ref.essentialTremorMin && dominantFrequencyHz <= ref.essentialTremorMax) {
    category = 'ESSENTIAL_TREMOR'; score = 55; updrsEstimate = 2;
    interpretation = `Tremor frekuensi tinggi ${dominantFrequencyHz.toFixed(1)} Hz — kemungkinan Essential Tremor (bukan Parkinson).`;
  } else if (amplitude > ref.pathologicalAmplitude) {
    category = 'PATHOLOGICAL'; score = 60; updrsEstimate = 2;
    interpretation = `Tremor amplitudo tinggi (${(amplitude * 1000).toFixed(1)}mm), perlu evaluasi lebih lanjut.`;
  } else if (amplitude > ref.borderlineAmplitudeMax) {
    category = 'BORDERLINE'; score = 25; updrsEstimate = 1;
    interpretation = `Getaran ringan terdeteksi. Pantau berkala.`;
  } else {
    category = 'MINIMAL'; score = 10; updrsEstimate = 0;
    interpretation = `Getaran sangat minimal, masih dalam batas normal.`;
  }

  return {
    bodyPart, dominantFrequencyHz: parseFloat(dominantFrequencyHz.toFixed(2)),
    amplitude: parseFloat(amplitude.toFixed(4)), amplitudeMillimeter: parseFloat((amplitude * 1000).toFixed(2)),
    category, interpretation, score, updrsEstimate, sampleCount: samples.length,
  };
}

/**
 * Analisis Finger Tapping (enhanced accuracy)
 * - Menggunakan moving average smoothing untuk eliminasi noise kamera
 * - Minimum 150ms antar tap (mencegah double-count)
 * - Threshold jarak 0.06 untuk validasi "jari benar-benar tertutup"
 */
export function analyzeFingerTapping({ taps }) {
  if (!taps || taps.length < 5)
    return { error: 'Minimal 5 data tap dibutuhkan' };

  // 1. Moving average smoothing window=3
  const smoothed = taps.map((t, i) => {
    const window = taps.slice(Math.max(0, i - 1), Math.min(taps.length, i + 2));
    return {
      timestamp: t.timestamp,
      distance: window.reduce((s, w) => s + w.distance, 0) / window.length,
    };
  });

  // 2. Deteksi tap: local minimum (jari ditutup) dengan threshold + min interval 150ms
  const TAP_CLOSED = 0.09;   // jarak < ini = jari tertutup (tap terjadi)
  const TAP_MIN_MS = 150;    // min interval antar tap
  const validTaps = [];
  let inTap = false;

  for (let i = 1; i < smoothed.length - 1; i++) {
    const curr = smoothed[i];
    const prev = smoothed[i - 1];
    const next = smoothed[i + 1];

    // Local minimum di bawah threshold = tap
    const isLocalMin = curr.distance < prev.distance && curr.distance < next.distance;
    const isClosed   = curr.distance < TAP_CLOSED;

    if (isLocalMin && isClosed && !inTap) {
      const lastTap = validTaps[validTaps.length - 1];
      const timeSinceLast = lastTap ? (curr.timestamp - lastTap.timestamp) : Infinity;
      if (timeSinceLast >= TAP_MIN_MS) {
        validTaps.push(curr);
        inTap = true;
      }
    } else if (curr.distance > TAP_CLOSED + 0.03) {
      inTap = false; // jari terbuka kembali → siap tap berikutnya
    }
  }

  const tapCount = validTaps.length;
  const durationSec = Math.max((taps[taps.length - 1].timestamp - taps[0].timestamp) / 1000, 0.1);
  const tapRatePerSecond = tapCount / durationSec;

  // 3. Hitung decrement (penurunan amplitudo awal vs akhir — khas Parkinson)
  let decrementPercent = 0;
  if (validTaps.length >= 6) {
    const third = Math.ceil(validTaps.length / 3);
    const firstThird = validTaps.slice(0, third);
    const lastThird  = validTaps.slice(-third);
    // Amplitude = 1 - distance_at_closure (semakin kecil jarak = semakin besar amplitudo ketukan)
    const ampOf = arr => arr.reduce((s, t) => s + (1 - t.distance), 0) / arr.length;
    const ampFirst = ampOf(firstThird);
    const ampLast  = ampOf(lastThird);
    decrementPercent = ampFirst > 0 ? Math.max(0, ((ampFirst - ampLast) / ampFirst) * 100) : 0;
  }

  const ref = CLINICAL_REFERENCE.fingerTapping;
  let category, interpretation, score, updrsEstimate;

  if (tapRatePerSecond >= ref.normalMin && decrementPercent < ref.decrementNormal) {
    category = 'NORMAL'; score = 0; updrsEstimate = 0;
    interpretation = `Kecepatan tapping normal (${tapRatePerSecond.toFixed(1)} ketuk/det), tidak ada tanda bradikinesia.`;
  } else if (tapRatePerSecond < ref.severeBradykinesia) {
    category = 'SEVERE_BRADYKINESIA'; score = 90; updrsEstimate = 4;
    interpretation = `Bradikinesia berat: ${tapRatePerSecond.toFixed(1)} ketuk/det (normal ≥3.5). Evaluasi neurologis segera diperlukan.`;
  } else if (tapRatePerSecond < ref.mildBradykinesia) {
    category = 'MODERATE_BRADYKINESIA'; score = 65; updrsEstimate = 3;
    interpretation = `Bradikinesia sedang: ${tapRatePerSecond.toFixed(1)} ketuk/det. Kemungkinan gangguan motorik signifikan.`;
  } else if (tapRatePerSecond < ref.normalMin) {
    category = 'MILD_BRADYKINESIA'; score = 35; updrsEstimate = 2;
    interpretation = `Bradikinesia ringan: ${tapRatePerSecond.toFixed(1)} ketuk/det. Pantau dan evaluasi.`;
  } else if (decrementPercent > ref.decrementSignif) {
    category = 'SIGNIFICANT_DECREMENT'; score = 60; updrsEstimate = 3;
    interpretation = `Kecepatan awal baik namun turun ${decrementPercent.toFixed(0)}% — tanda akinesia/fatigue motorik khas Parkinson.`;
  } else if (decrementPercent > ref.decrementMild) {
    category = 'MILD_DECREMENT'; score = 35; updrsEstimate = 1;
    interpretation = `Penurunan amplitudo sedang (${decrementPercent.toFixed(0)}%). Perlu pemantauan.`;
  } else {
    category = 'BORDERLINE'; score = 15; updrsEstimate = 1;
    interpretation = `Sedikit di bawah normal, pantau berkala.`;
  }

  return {
    tapCount, tapRatePerSecond: parseFloat(tapRatePerSecond.toFixed(2)),
    decrementPercent: parseFloat(decrementPercent.toFixed(1)),
    durationSec: parseFloat(durationSec.toFixed(2)),
    category, interpretation, score, updrsEstimate,
  };
}


/**
 * Analisis Gait (Pola Jalan)
 * - Menggunakan moving average pada jarak antar ankle
 * - Mencari local maxima (peak) sebagai representasi langkah
 * - Menghitung simetri berdasarkan rata-rata panjang langkah ganjil vs genap
 */
export function analyzeGait({ steps }) {
  if (!steps || steps.length < 10)
    return { error: 'Minimal 10 frame langkah dibutuhkan' };

  // 1. Moving average smoothing window=5
  const smoothed = steps.map((s, i) => {
    const window = steps.slice(Math.max(0, i - 2), Math.min(steps.length, i + 3));
    return {
      timestamp: s.timestamp,
      distance: window.reduce((acc, w) => acc + w.distance, 0) / window.length,
    };
  });

  // 2. Deteksi puncak (peaks) = langkah kaki (kiri/kanan)
  const peaks = [];
  for (let i = 1; i < smoothed.length - 1; i++) {
    if (smoothed[i].distance > smoothed[i - 1].distance && smoothed[i].distance > smoothed[i + 1].distance) {
      // Threshold: jarak minimal agar dihitung langkah
      if (smoothed[i].distance > 0.05) {
        peaks.push(smoothed[i]);
      }
    }
  }

  // Jika terlalu sedikit langkah
  if (peaks.length < 2) {
    return { error: 'Langkah tidak terdeteksi jelas. Pastikan berjalan lurus ke arah kamera.' };
  }

  // 3. Cadence (Langkah per menit)
  const durationSec = Math.max((steps[steps.length - 1].timestamp - steps[0].timestamp) / 1000, 0.1);
  const cadencePerMin = (peaks.length / durationSec) * 60;

  // 4. Symmetry: bandingkan langkah ganjil (kaki A) dan langkah genap (kaki B)
  const evenPeaks = peaks.filter((_, i) => i % 2 === 0).map(p => p.distance);
  const oddPeaks = peaks.filter((_, i) => i % 2 === 1).map(p => p.distance);
  
  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const avgEven = avg(evenPeaks), avgOdd = avg(oddPeaks);
  const strideSymmetryIndex = (avgEven > 0 || avgOdd > 0)
    ? 1 - Math.abs(avgEven - avgOdd) / Math.max(avgEven, avgOdd) : 1;

  const ref = CLINICAL_REFERENCE.gait;
  let category, interpretation, score, updrsEstimate;

  if (strideSymmetryIndex >= ref.normalSymmetryMin && cadencePerMin >= ref.normalCadenceMin) {
    category = 'NORMAL'; score = 0; updrsEstimate = 0;
    interpretation = `Pola jalan normal: simetri ${(strideSymmetryIndex * 100).toFixed(0)}%, kadense ${cadencePerMin.toFixed(0)} langkah/menit.`;
  } else if (strideSymmetryIndex < ref.severeAsymmetry) {
    category = 'SEVERE_ASYMMETRY'; score = 88; updrsEstimate = 4;
    interpretation = `⚠️ Asimetri gait berat (${(strideSymmetryIndex * 100).toFixed(0)}%). Risiko tinggi — rujukan segera.`;
  } else if (strideSymmetryIndex < ref.moderateAsymmetry) {
    category = 'MODERATE_ASYMMETRY'; score = 60; updrsEstimate = 3;
    interpretation = `Asimetri gait moderat (${(strideSymmetryIndex * 100).toFixed(0)}%).`;
  } else if (strideSymmetryIndex < ref.mildAsymmetry) {
    category = 'MILD_ASYMMETRY'; score = 35; updrsEstimate = 2;
    interpretation = `Asimetri gait ringan (${(strideSymmetryIndex * 100).toFixed(0)}%).`;
  } else if (cadencePerMin < ref.slowCadence) {
    category = 'SLOW_GAIT'; score = 40; updrsEstimate = 2;
    interpretation = `Gait lambat: ${cadencePerMin.toFixed(0)} langkah/menit (normal ≥100).`;
  } else {
    category = 'BORDERLINE'; score = 15; updrsEstimate = 1;
    interpretation = `Gait sedikit tidak optimal. Pantau.`;
  }

  return {
    cadencePerMin: parseFloat(cadencePerMin.toFixed(1)),
    strideSymmetryIndex: parseFloat(strideSymmetryIndex.toFixed(3)),
    symmetryPercent: parseFloat((strideSymmetryIndex * 100).toFixed(1)),
    stepCount: peaks.length,
    category, interpretation, score, updrsEstimate,
  };
}

/**
 * Analisis Arm Swing
 * - Menggunakan moving average untuk memuluskan data sudut (mengatasi noise kamera)
 * - Menghitung amplitudo dari deviasi sudut lengan secara trigonometri
 */
export function analyzeArmSwing({ frames }) {
  if (!frames || frames.length < 10)
    return { error: 'Minimal 10 frame dibutuhkan' };

  // 1. Moving average smoothing window=5
  const smoothed = frames.map((f, i) => {
    const window = frames.slice(Math.max(0, i - 2), Math.min(frames.length, i + 3));
    return {
      leftAngle: window.reduce((s, w) => s + w.leftAngle, 0) / window.length,
      rightAngle: window.reduce((s, w) => s + w.rightAngle, 0) / window.length,
    };
  });

  const leftAngles = smoothed.map(f => f.leftAngle);
  const rightAngles = smoothed.map(f => f.rightAngle);
  const amplitude = arr => Math.max(...arr) - Math.min(...arr);
  
  const leftAmp = amplitude(leftAngles);
  const rightAmp = amplitude(rightAngles);
  
  const asymmetryPercent = (Math.max(leftAmp, rightAmp) > 0)
    ? (Math.abs(leftAmp - rightAmp) / Math.max(leftAmp, rightAmp)) * 100 : 0;

  const weakerSide = leftAmp < rightAmp ? 'kiri' : 'kanan';
  const ref = CLINICAL_REFERENCE.armSwing;
  let category, interpretation, score, updrsEstimate;

  if (asymmetryPercent < ref.normalAsymmetryMax && leftAmp >= ref.normalAmplitudeMin && rightAmp >= ref.normalAmplitudeMin) {
    category = 'NORMAL'; score = 0; updrsEstimate = 0;
    interpretation = `Ayunan tangan simetris dan normal (asimetri ${asymmetryPercent.toFixed(0)}%).`;
  } else if (asymmetryPercent > ref.significantAsymmetry) {
    category = 'SIGNIFICANT_ASYMMETRY'; score = 78; updrsEstimate = 3;
    interpretation = `⚠️ Asimetri ayunan tangan signifikan (${asymmetryPercent.toFixed(0)}%) — tangan ${weakerSide} berkurang. Khas pada Parkinson unilateral.`;
  } else if (asymmetryPercent > ref.mildAsymmetry) {
    category = 'MILD_ASYMMETRY'; score = 40; updrsEstimate = 2;
    interpretation = `Asimetri ayunan tangan sedang (${asymmetryPercent.toFixed(0)}%) — tangan ${weakerSide} lebih terbatas.`;
  } else if (leftAmp < ref.reducedAmplitude || rightAmp < ref.reducedAmplitude) {
    category = 'BILATERAL_REDUCTION'; score = 55; updrsEstimate = 2;
    interpretation = `Ayunan tangan bilateral berkurang — indikasi rigiditas.`;
  } else {
    category = 'BORDERLINE'; score = 15; updrsEstimate = 1;
    interpretation = `Ayunan tangan sedikit asimetris, pantau berkala.`;
  }

  return {
    leftAmplitudeDeg: parseFloat(leftAmp.toFixed(1)),
    rightAmplitudeDeg: parseFloat(rightAmp.toFixed(1)),
    asymmetryPercent: parseFloat(asymmetryPercent.toFixed(1)),
    weakerSide, category, interpretation, score, updrsEstimate,
  };
}

/**
 * Analisis Range of Motion
 */
export function analyzeROM({ joint, angles }) {
  if (!angles || angles.length < 3)
    return { error: 'Minimal 3 pengukuran sudut dibutuhkan' };

  const maxAngle = Math.max(...angles), minAngle = Math.min(...angles);
  const rom = maxAngle - minAngle;
  const jKey = (joint || 'KNEE').toUpperCase();
  const ref = CLINICAL_REFERENCE.rom[jKey.toLowerCase()] || CLINICAL_REFERENCE.rom.knee;
  const jointNames = { KNEE: 'lutut', SHOULDER: 'bahu', ELBOW: 'siku', HIP: 'pinggul' };
  const jName = jointNames[jKey] || joint;

  let category, interpretation, score;
  if (rom >= ref.normal) {
    category = 'NORMAL'; score = 0;
    interpretation = `ROM ${jName} normal (${rom.toFixed(0)}°, referensi ≥${ref.normal}°).`;
  } else if (rom >= ref.reduced) {
    category = 'MILDLY_REDUCED'; score = 30;
    interpretation = `ROM ${jName} sedikit terbatas (${rom.toFixed(0)}°). Latihan peregangan dianjurkan.`;
  } else if (rom >= ref.severe) {
    category = 'MODERATELY_REDUCED'; score = 60;
    interpretation = `ROM ${jName} terbatas sedang (${rom.toFixed(0)}°). Evaluasi fisioterapi dianjurkan.`;
  } else {
    category = 'SEVERELY_REDUCED'; score = 85;
    interpretation = `⚠️ ROM ${jName} terbatas berat (${rom.toFixed(0)}°). Rujukan rehabilitasi diperlukan.`;
  }

  return {
    joint: jKey, maxAngleDeg: parseFloat(maxAngle.toFixed(1)),
    minAngleDeg: parseFloat(minAngle.toFixed(1)), romDeg: parseFloat(rom.toFixed(1)),
    referenceNormal: ref.normal, category, interpretation, score,
  };
}

/**
 * Analisis Postural Stability
 */
export function analyzePosturalStability({ frames }) {
  if (!frames || frames.length < 20)
    return { error: 'Minimal 20 frame dibutuhkan' };

  const com = frames.map(f => ({ x: (f.hipX + f.shoulderX) / 2, y: (f.hipY + f.shoulderY) / 2 }));
  let swayLength = 0;
  for (let i = 1; i < com.length; i++)
    swayLength += Math.hypot(com[i].x - com[i - 1].x, com[i].y - com[i - 1].y);

  const xs = com.map(c => c.x), ys = com.map(c => c.y);
  const swayArea = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));

  const ref = CLINICAL_REFERENCE.posturalStability;
  let category, interpretation, score, updrsEstimate;

  if (swayLength <= ref.normalSwayLength && swayArea <= ref.normalSwayArea) {
    category = 'STABLE'; score = 0; updrsEstimate = 0;
    interpretation = `Postur stabil (sway area ${(swayArea * 10000).toFixed(2)} cm²).`;
  } else if (swayArea > ref.severeSwayArea || swayLength > ref.severeSwayLength) {
    category = 'SEVERELY_UNSTABLE'; score = 85; updrsEstimate = 4;
    interpretation = `⚠️ Ketidakstabilan postur berat (sway area ${(swayArea * 10000).toFixed(2)} cm²). Risiko jatuh tinggi — rujukan segera.`;
  } else if (swayArea > ref.mildSwayArea || swayLength > ref.mildSwayLength) {
    category = 'MODERATELY_UNSTABLE'; score = 50; updrsEstimate = 2;
    interpretation = `Postur tidak stabil sedang (sway area ${(swayArea * 10000).toFixed(2)} cm²). Latihan keseimbangan dianjurkan.`;
  } else {
    category = 'MILDLY_UNSTABLE'; score = 25; updrsEstimate = 1;
    interpretation = `Postur sedikit tidak stabil. Pantau dan latih keseimbangan.`;
  }

  return {
    swayLengthNorm: parseFloat(swayLength.toFixed(4)),
    swayAreaNorm: parseFloat(swayArea.toFixed(6)),
    swayAreaCm2: parseFloat((swayArea * 10000).toFixed(3)),
    frameCount: frames.length, category, interpretation, score, updrsEstimate,
  };
}

/**
 * Hitung Skor Risiko Komposit dengan ML Classification
 */
export function calculateCompositeRisk(testResults) {
  // Weights berdasarkan sensitivitas diagnostik dari literatur
  const weights = {
    tremor: 0.25,
    fingerTapping: 0.25,
    gait: 0.20,
    armSwing: 0.12,
    posturalStability: 0.12,
    rom: 0.06,
  };

  let weightedScore = 0, totalWeight = 0;
  const breakdown = {};
  const biomarkersForML = {};

  for (const [key, weight] of Object.entries(weights)) {
    if (testResults[key] && typeof testResults[key].score === 'number' && !testResults[key].error) {
      weightedScore += testResults[key].score * weight;
      totalWeight += weight;
      breakdown[key] = {
        score: testResults[key].score,
        category: testResults[key].category,
        updrsEstimate: testResults[key].updrsEstimate,
        interpretation: testResults[key].interpretation,
      };

      // Prepare for ML classifier
      if (key === 'tremor') {
        biomarkersForML.tremor = { dominantFrequencyHz: testResults[key].dominantFrequencyHz, amplitude: testResults[key].amplitude };
      } else if (key === 'fingerTapping') {
        biomarkersForML.fingerTapping = { tapRatePerSecond: testResults[key].tapRatePerSecond, decrementPercent: testResults[key].decrementPercent };
      } else if (key === 'gait') {
        biomarkersForML.gait = { symmetryIndex: testResults[key].strideSymmetryIndex, cadencePerMin: testResults[key].cadencePerMin };
      } else if (key === 'armSwing') {
        biomarkersForML.armSwing = { asymmetryPercent: testResults[key].asymmetryPercent };
      } else if (key === 'posturalStability') {
        biomarkersForML.posturalStability = { swayArea: testResults[key].swayAreaNorm };
      }
    }
  }

  const compositeScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  let riskCategory, riskColor;
  if (compositeScore >= 65)      { riskCategory = 'HIGH';   riskColor = '🔴'; }
  else if (compositeScore >= 35) { riskCategory = 'MEDIUM'; riskColor = '🟡'; }
  else                           { riskCategory = 'LOW';    riskColor = '🟢'; }

  // K-NN Classification
  let mlResult = null;
  if (Object.keys(biomarkersForML).length >= 2) {
    try {
      const classifier = getClassifier();
      mlResult = classifier.classify(biomarkersForML);
    } catch (e) {
      mlResult = { error: 'Klasifikasi ML tidak tersedia' };
    }
  }

  // Estimasi UPDRS total
  const updrsValues = Object.values(breakdown)
    .map(b => b.updrsEstimate)
    .filter(v => v !== undefined);
  const updrsTotal = updrsValues.reduce((a, b) => a + b, 0);

  // Rekomendasi
  const recommendations = generateRecommendations(riskCategory, breakdown, mlResult);

  return {
    compositeScore: parseFloat(compositeScore.toFixed(1)),
    riskCategory,
    riskLabel: `${riskColor} Risiko ${riskCategory === 'HIGH' ? 'Tinggi' : riskCategory === 'MEDIUM' ? 'Sedang' : 'Rendah'}`,
    mlClassification: mlResult,
    updrsEstimate: { totalMotorScore: updrsTotal, maxPossible: updrsValues.length * 4 },
    breakdown,
    recommendations,
  };
}

function generateRecommendations(risk, breakdown, ml) {
  const recs = [];

  if (risk === 'HIGH') {
    recs.push('Segera lakukan konsultasi dengan dokter spesialis saraf (neurolog).');
    recs.push('Hindari aktivitas yang memerlukan keseimbangan tinggi tanpa pengawasan.');
  } else if (risk === 'MEDIUM') {
    recs.push('Jadwalkan pemeriksaan lanjutan dalam 1-2 minggu ke depan.');
    recs.push('Mulai program latihan fisik terpandu (fisioterapi preventif).');
  }

  if (breakdown.posturalStability?.score > 50)
    recs.push('Latihan keseimbangan: Tai Chi atau fisioterapi berbasis keseimbangan sangat dianjurkan.');
  if (breakdown.gait?.score > 40)
    recs.push('Evaluasi gait oleh fisioterapis dianjurkan untuk mencegah risiko jatuh.');
  if (breakdown.tremor?.category?.includes('PARKINSON'))
    recs.push('Tes pencitraan otak (MRI/DaTscan) perlu dipertimbangkan untuk konfirmasi diagnosis.');
  if (breakdown.fingerTapping?.score > 60)
    recs.push('Latihan motorik halus tangan setiap hari untuk memperlambat progresi bradikinesia.');

  if (ml?.predictedCondition && ml.confidence > 60) {
    recs.push(`Model AI mendeteksi pola yang mirip dengan: ${ml.predictedLabel} (keyakinan ${ml.confidence}%).`);
  }

  if (recs.length === 0)
    recs.push('Tidak ada tindak lanjut mendesak. Tetap jaga kesehatan dan lakukan skrining berkala tiap 6 bulan.');

  return recs;
}
