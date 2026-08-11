/**
 * ============================================================
 * NEURONMOTION — Clinical Training Dataset (ENHANCED ML EDITION)
 * ============================================================
 * Data sintetis berbasis literatur klinis yang telah divalidasi.
 * Peningkatan K-NN: Distribusi Gaussian, Z-Score Normalization, & Bobot Jarak.
 * ============================================================
 */

export const CLINICAL_REFERENCE = {
  tremor: { normalAmplitudeMax: 0.005, borderlineAmplitudeMax: 0.015, pathologicalAmplitude: 0.015, parkinsonsFreqMin: 4.0, parkinsonsFreqMax: 6.0, essentialTremorMin: 6.0, essentialTremorMax: 12.0 },
  fingerTapping: { normalMin: 3.5, normalMax: 6.0, mildBradykinesia: 2.5, severeBradykinesia: 1.5, decrementNormal: 10, decrementMild: 20, decrementSignif: 30 },
  gait: { normalCadenceMin: 100, slowCadence: 80, normalSymmetryMin: 0.90, mildAsymmetry: 0.85, moderateAsymmetry: 0.75, severeAsymmetry: 0.75 },
  armSwing: { normalAmplitudeMin: 25, reducedAmplitude: 15, normalAsymmetryMax: 15, mildAsymmetry: 25, significantAsymmetry: 30 },
  rom: { knee: { normal: 135, reduced: 110, severe: 90 }, shoulder: { normal: 170, reduced: 140, severe: 110 }, elbow: { normal: 145, reduced: 120, severe: 90 }, hip: { normal: 120, reduced: 100, severe: 75 } },
  posturalStability: { normalSwayLength: 0.08, mildSwayLength: 0.15, severeSwayLength: 0.25, normalSwayArea: 0.003, mildSwayArea: 0.008, severeSwayArea: 0.015 },
};

/**
 * Rentang normal gait & ROM menurun secara alami seiring usia, bahkan pada orang sehat
 * (konsisten dengan ageFactor yang sudah dipakai saat generate data training sintetis di bawah).
 * Tanpa penyesuaian ini, pasien lansia sehat berisiko salah ditandai "tidak normal" hanya
 * karena dibandingkan dengan ambang batas orang dewasa muda.
 */
export function getAgeAdjustedReference(age) {
  const ref = JSON.parse(JSON.stringify(CLINICAL_REFERENCE));
  if (!age) return ref;
  const factor = age > 75 ? 0.90 : age > 65 ? 0.95 : 1.0;
  if (factor < 1.0) {
    ref.gait.normalCadenceMin = Math.round(ref.gait.normalCadenceMin * factor);
    ref.gait.slowCadence = Math.round(ref.gait.slowCadence * factor);
    for (const joint of Object.keys(ref.rom)) {
      ref.rom[joint].normal = Math.round(ref.rom[joint].normal * factor);
      ref.rom[joint].reduced = Math.round(ref.rom[joint].reduced * factor);
    }
  }
  return ref;
}

export const CONDITION_PROFILES = {
  HEALTHY: {
    label: 'Sehat',
    description: 'Tidak ada tanda gangguan neurologis signifikan',
    biomarkerProfile: {
      tremorFreq: [0, 2], tremorAmp: [0, 0.003],
      tapRate: [4.0, 5.5], tapDecrement: [2, 8],
      gaitSymmetry: [0.93, 0.98], gaitCadence: [100, 115],
      armAsymmetry: [2, 10], armAmp: [30, 45],
      swayArea: [0.001, 0.002], swayLength: [0.04, 0.07],
    },
  },
  PARKINSON_EARLY: {
    label: 'Parkinson Awal (Hoehn-Yahr 1-2)',
    description: 'Gejala motorik unilateral atau bilateral ringan',
    biomarkerProfile: {
      tremorFreq: [4.0, 6.0], tremorAmp: [0.010, 0.020],
      tapRate: [2.5, 3.2], tapDecrement: [20, 35],
      gaitSymmetry: [0.82, 0.88], gaitCadence: [80, 95],
      armAsymmetry: [25, 40], armAmp: [15, 22],
      swayArea: [0.007, 0.011], swayLength: [0.13, 0.18],
    },
  },
  PARKINSON_ADVANCED: {
    label: 'Parkinson Lanjut (Hoehn-Yahr 3-4)',
    description: 'Gangguan motorik bilateral, instabilitas postural',
    biomarkerProfile: {
      tremorFreq: [4.5, 6.0], tremorAmp: [0.025, 0.050],
      tapRate: [1.2, 2.0], tapDecrement: [40, 55],
      gaitSymmetry: [0.65, 0.75], gaitCadence: [60, 75],
      armAsymmetry: [45, 65], armAmp: [8, 14],
      swayArea: [0.015, 0.025], swayLength: [0.25, 0.35],
    },
  },
  POST_STROKE: {
    label: 'Pasca Stroke (Hemiplegia)',
    description: 'Keterbatasan gerak unilateral akibat stroke',
    biomarkerProfile: {
      tremorFreq: [1, 3], tremorAmp: [0.005, 0.015],
      tapRate: [1.8, 2.8], tapDecrement: [12, 22],
      gaitSymmetry: [0.55, 0.70], gaitCadence: [65, 85],
      armAsymmetry: [40, 70], armAmp: [10, 20],
      swayArea: [0.010, 0.020], swayLength: [0.20, 0.35],
    },
  },
  ESSENTIAL_TREMOR: {
    label: 'Essential Tremor',
    description: 'Tremor aksi bilateral tanpa gangguan gait signifikan',
    biomarkerProfile: {
      tremorFreq: [7.0, 11.0], tremorAmp: [0.015, 0.035],
      tapRate: [3.2, 4.2], tapDecrement: [5, 12],
      gaitSymmetry: [0.90, 0.95], gaitCadence: [95, 110],
      armAsymmetry: [8, 18], armAmp: [25, 38],
      swayArea: [0.003, 0.006], swayLength: [0.08, 0.13],
    },
  },
  CEREBELLAR_ATAXIA: {
    label: 'Ataksia Serebelar',
    description: 'Gangguan koordinasi dan keseimbangan yang menonjol',
    biomarkerProfile: {
      tremorFreq: [2, 4.5], tremorAmp: [0.020, 0.045],
      tapRate: [2.0, 3.2], tapDecrement: [15, 25],
      gaitSymmetry: [0.70, 0.82], gaitCadence: [70, 90],
      armAsymmetry: [15, 25], armAmp: [18, 30],
      swayArea: [0.025, 0.045], swayLength: [0.40, 0.60], // Keseimbangan sangat buruk
    },
  },
};

// ── ML Utilities: Distribusi Gaussian ──────────────────────────────────────

// Seeded PRNG (mulberry32) — dipakai agar dataset training K-NN deterministik
// (sama persis di setiap restart server), bukan acak ulang tiap kali (Math.random()).
export function createSeededRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform untuk distribusi normal
function randomGaussian(mean, stdDev, rand = Math.random) {
  const u1 = rand() || 1e-9;
  const u2 = rand();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// Menghasilkan nilai random dalam rentang min-max tetapi terdistribusi Gaussian di tengahnya
function randGaussianRange(min, max, rand = Math.random) {
  const mean = (min + max) / 2;
  const stdDev = (max - min) / 6; // 99.7% probabilitas berada di antara min dan max
  let val = randomGaussian(mean, stdDev, rand);
  if (val < min) val = min;
  if (val > max) val = max;
  return val;
}

function randInt(min, max, rand = Math.random) {
  return Math.floor(min + rand() * (max - min + 1));
}

export function generateSyntheticBiomarkers(conditionKey, age = 60, rand = Math.random) {
  const profile = CONDITION_PROFILES[conditionKey];
  if (!profile) throw new Error(`Unknown condition: ${conditionKey}`);

  const bp = profile.biomarkerProfile;
  const ageFactor = age > 65 ? 0.95 : age > 75 ? 0.90 : 1.0;

  return {
    conditionLabel: profile.label,
    tremor: {
      dominantFrequencyHz: parseFloat(randGaussianRange(bp.tremorFreq[0], bp.tremorFreq[1], rand).toFixed(2)),
      amplitude: parseFloat(randGaussianRange(bp.tremorAmp[0], bp.tremorAmp[1], rand).toFixed(4)),
    },
    fingerTapping: {
      tapRatePerSecond: parseFloat((randGaussianRange(bp.tapRate[0], bp.tapRate[1], rand) * ageFactor).toFixed(2)),
      decrementPercent: parseFloat(randGaussianRange(bp.tapDecrement[0], bp.tapDecrement[1], rand).toFixed(1)),
    },
    gait: {
      symmetryIndex: parseFloat(randGaussianRange(bp.gaitSymmetry[0], bp.gaitSymmetry[1], rand).toFixed(3)),
      cadencePerMin: parseFloat((randGaussianRange(bp.gaitCadence[0], bp.gaitCadence[1], rand) * ageFactor).toFixed(1)),
    },
    armSwing: {
      asymmetryPercent: parseFloat(randGaussianRange(bp.armAsymmetry[0], bp.armAsymmetry[1], rand).toFixed(1)),
      leftAmplitudeDeg: parseFloat(randGaussianRange(bp.armAmp[0], bp.armAmp[1], rand).toFixed(1)),
      rightAmplitudeDeg: parseFloat(randGaussianRange(bp.armAmp[0] * 0.7, bp.armAmp[1], rand).toFixed(1)),
    },
    posturalStability: {
      swayArea: parseFloat(randGaussianRange(bp.swayArea[0], bp.swayArea[1], rand).toFixed(6)),
      swayLength: parseFloat(randGaussianRange(bp.swayLength[0], bp.swayLength[1], rand).toFixed(4)),
    },
    rom: {
      knee: parseFloat(randGaussianRange(
        CLINICAL_REFERENCE.rom.knee.severe - 5,
        conditionKey === 'HEALTHY' ? 140 : 120,
        rand
      ).toFixed(1)),
      shoulder: parseFloat(randGaussianRange(
        CLINICAL_REFERENCE.rom.shoulder.severe - 5,
        conditionKey === 'HEALTHY' ? 168 : 140,
        rand
      ).toFixed(1)),
    },
  };
}

export function generateTrainingDataset(totalPatients = 1500, rand = Math.random) {
  const distribution = {
    HEALTHY: 0.35,
    PARKINSON_EARLY: 0.20,
    PARKINSON_ADVANCED: 0.10,
    POST_STROKE: 0.15,
    ESSENTIAL_TREMOR: 0.12,
    CEREBELLAR_ATAXIA: 0.08,
  };

  const dataset = [];
  const names = ['Budi', 'Siti', 'Ahmad', 'Sri', 'Hendra', 'Dewi', 'Agus', 'Rina'];
  const lastNames = ['Santoso', 'Rahayu', 'Wijaya', 'Kusuma', 'Pratama', 'Sari'];

  let patientId = 1;

  for (const [condition, ratio] of Object.entries(distribution)) {
    const count = Math.round(totalPatients * ratio);

    for (let i = 0; i < count; i++) {
      const age = condition.includes('PARKINSON') || condition === 'POST_STROKE'
        ? randInt(55, 82, rand)
        : condition === 'ESSENTIAL_TREMOR' ? randInt(45, 78, rand)
        : randInt(30, 80, rand);

      const biomarkers = generateSyntheticBiomarkers(condition, age, rand);
      const name = `${names[Math.floor(rand() * names.length)]} ${lastNames[Math.floor(rand() * lastNames.length)]}`;

      dataset.push({
        id: patientId++,
        name,
        age,
        gender: rand() > 0.5 ? 'M' : 'F',
        email: `patient${patientId}@neuronmotion.id`,
        condition,
        conditionLabel: CONDITION_PROFILES[condition].label,
        biomarkers,
        updrsApprox: estimateUPDRS(condition, biomarkers),
      });
    }
  }

  return dataset.sort(() => rand() - 0.5);
}

function estimateUPDRS(condition, bm) {
  const scores = {};
  if (bm.tremor.amplitude < 0.005) scores.tremor = 0;
  else if (bm.tremor.amplitude < 0.015) scores.tremor = 1;
  else if (bm.tremor.amplitude < 0.030) scores.tremor = 2;
  else scores.tremor = Math.min(4, Math.floor(bm.tremor.amplitude * 100));

  if (bm.fingerTapping.tapRatePerSecond >= 4.0) scores.fingerTapping = 0;
  else if (bm.fingerTapping.tapRatePerSecond >= 3.0) scores.fingerTapping = 1;
  else if (bm.fingerTapping.tapRatePerSecond >= 2.0) scores.fingerTapping = 2;
  else scores.fingerTapping = 4;

  if (bm.gait.symmetryIndex >= 0.93) scores.gait = 0;
  else if (bm.gait.symmetryIndex >= 0.87) scores.gait = 1;
  else if (bm.gait.symmetryIndex >= 0.78) scores.gait = 2;
  else scores.gait = 4;

  if (bm.posturalStability.swayArea < 0.003) scores.posture = 0;
  else if (bm.posturalStability.swayArea < 0.007) scores.posture = 1;
  else if (bm.posturalStability.swayArea < 0.013) scores.posture = 2;
  else scores.posture = 4;

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxPossible = Object.keys(scores).length * 4;

  return {
    perDomain: scores,
    totalMotor: total,
    maxPossible,
    severityPercent: parseFloat(((total / maxPossible) * 100).toFixed(1)),
  };
}

// ── K-NN Classifier dengan Z-Score Normalization ──────────────────────────────

export class BiomarkerKNNClassifier {
  constructor(k = 11, trainingData) { // K yang ganjil dan lebih besar untuk robustness
    this.k = k;
    this.trainingData = trainingData;
    this.means = [];
    this.stds = [];
    this._fitScaler();
    this.scaledTrainingFeatures = this.trainingData.map(d => this._scale(this.extractRawFeatures(d.biomarkers)));
  }

  /**
   * Ekstrak raw feature array
   */
  extractRawFeatures(bm) {
    return [
      bm.tremor?.dominantFrequencyHz || 0,
      bm.tremor?.amplitude || 0,
      bm.fingerTapping?.tapRatePerSecond || 0,
      bm.fingerTapping?.decrementPercent || 0,
      bm.gait?.symmetryIndex || 1,
      bm.gait?.cadencePerMin || 100,
      bm.armSwing?.asymmetryPercent || 0,
      bm.posturalStability?.swayArea || 0,
    ];
  }

  /**
   * Fit Z-Score scaler berdasarkan dataset
   */
  _fitScaler() {
    const nFeatures = 8;
    const rawMatrix = this.trainingData.map(d => this.extractRawFeatures(d.biomarkers));
    
    for (let i = 0; i < nFeatures; i++) {
      const col = rawMatrix.map(row => row[i]);
      const mean = col.reduce((a, b) => a + b, 0) / col.length;
      const variance = col.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / col.length;
      this.means.push(mean);
      this.stds.push(Math.sqrt(variance) || 1); // fallback 1 to avoid div by zero
    }
  }

  /**
   * Transform raw features to Z-score
   */
  _scale(rawFeatures) {
    return rawFeatures.map((val, i) => (val - this.means[i]) / this.stds[i]);
  }

  /**
   * Euclidean distance
   */
  distance(a, b) {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - (b[i] || 0), 2), 0));
  }

  /**
   * Prediksi klasifikasi
   */
  classify(biomarkers) {
    const rawFeatures = this.extractRawFeatures(biomarkers);
    const queryFeatures = this._scale(rawFeatures);

    // Hitung jarak ke semua data training
    const distances = this.scaledTrainingFeatures.map((feats, idx) => ({
      condition: this.trainingData[idx].condition,
      conditionLabel: this.trainingData[idx].conditionLabel,
      dist: this.distance(queryFeatures, feats),
    }));

    // Ambil K terdekat
    const kNearest = distances.sort((a, b) => a.dist - b.dist).slice(0, this.k);

    // Weighted voting berdasarkan kebalikan jarak (Inverse Distance Weighting)
    const votes = {};
    let totalWeight = 0;
    
    kNearest.forEach(n => {
      // Tambahkan konstanta epsilon kecil untuk mencegah pembagian dengan nol
      const weight = 1 / (n.dist + 0.0001); 
      votes[n.condition] = (votes[n.condition] || 0) + weight;
      totalWeight += weight;
    });

    const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    const confidence = (winner[1] / totalWeight) * 100;

    return {
      predictedCondition: winner[0],
      predictedLabel: CONDITION_PROFILES[winner[0]].label,
      confidence: parseFloat(confidence.toFixed(1)),
      conditionDescription: CONDITION_PROFILES[winner[0]].description,
      voteDistribution: Object.fromEntries(
        Object.entries(votes).map(([k, v]) => [
          k, 
          { 
            label: CONDITION_PROFILES[k].label, 
            weightScore: parseFloat(v.toFixed(3)), 
            percent: parseFloat(((v / totalWeight) * 100).toFixed(1)) 
          }
        ])
      ),
    };
  }
}

// ── Training deterministik + Validasi Akurasi (Holdout 80/20) ─────────────────
// Seed tetap: dataset training K-NN SAMA persis di setiap start server, sehingga
// pasien dengan biomarker identik selalu mendapat prediksi & confidence yang sama
// (sebelumnya dataset di-generate ulang secara acak tiap restart -> hasil tidak konsisten).
const TRAINING_SEED = 20260101;
const TOTAL_SYNTHETIC_PATIENTS = 2000;
const HOLDOUT_RATIO = 0.2;

// Data holdout murni (dari generator yang sama persis dengan training) hampir selalu
// menghasilkan akurasi ~100% — itu cuma membuktikan konsistensi generator, bukan
// ketahanan model di dunia nyata. Kamera/estimasi pose selalu punya noise pengukuran,
// jadi data uji diberi noise terlebih dahulu agar angka akurasi lebih jujur & bermakna.
const MEASUREMENT_NOISE_FACTOR = 0.08; // ~8% noise relatif, mendekati galat estimasi pose di kondisi lapangan

function addMeasurementNoise(biomarkers, rand) {
  const noisy = JSON.parse(JSON.stringify(biomarkers));
  const perturb = (val, minFallback) =>
    val + randomGaussian(0, Math.max(Math.abs(val) * MEASUREMENT_NOISE_FACTOR, minFallback), rand);

  if (noisy.tremor) {
    noisy.tremor.dominantFrequencyHz = Math.max(0, perturb(noisy.tremor.dominantFrequencyHz, 0.3));
    noisy.tremor.amplitude = Math.max(0, perturb(noisy.tremor.amplitude, 0.002));
  }
  if (noisy.fingerTapping) {
    noisy.fingerTapping.tapRatePerSecond = Math.max(0, perturb(noisy.fingerTapping.tapRatePerSecond, 0.2));
    noisy.fingerTapping.decrementPercent = Math.max(0, perturb(noisy.fingerTapping.decrementPercent, 2));
  }
  if (noisy.gait) {
    noisy.gait.symmetryIndex = Math.min(1, Math.max(0, perturb(noisy.gait.symmetryIndex, 0.02)));
    noisy.gait.cadencePerMin = Math.max(0, perturb(noisy.gait.cadencePerMin, 3));
  }
  if (noisy.armSwing) {
    noisy.armSwing.asymmetryPercent = Math.max(0, perturb(noisy.armSwing.asymmetryPercent, 2));
  }
  if (noisy.posturalStability) {
    noisy.posturalStability.swayArea = Math.max(0, perturb(noisy.posturalStability.swayArea, 0.0005));
  }
  return noisy;
}

function buildValidatedModel() {
  const seededRand = createSeededRandom(TRAINING_SEED);
  const fullDataset = generateTrainingDataset(TOTAL_SYNTHETIC_PATIENTS, seededRand);

  const testSize = Math.round(fullDataset.length * HOLDOUT_RATIO);
  const testSet = fullDataset.slice(0, testSize);
  const trainSet = fullDataset.slice(testSize);

  const classifier = new BiomarkerKNNClassifier(11, trainSet);

  // Validasi holdout dengan noise pengukuran: uji classifier pada data yang TIDAK ikut
  // dilatih DAN sudah diberi gangguan acak, mensimulasikan galat estimasi pose kamera nyata.
  let correct = 0;
  for (const sample of testSet) {
    const noisyBiomarkers = addMeasurementNoise(sample.biomarkers, seededRand);
    const prediction = classifier.classify(noisyBiomarkers);
    if (prediction.predictedCondition === sample.condition) correct++;
  }
  const accuracy = testSet.length ? (correct / testSet.length) * 100 : 0;

  return {
    classifier,
    accuracy: parseFloat(accuracy.toFixed(1)),
    trainSize: trainSet.length,
    testSize: testSet.length,
    correct,
    method: `K-NN (k=11, Z-score + inverse-distance weighting), validasi holdout 80/20 pada dataset sintetis seed tetap, data uji diberi noise pengukuran ±${MEASUREMENT_NOISE_FACTOR * 100}% untuk mensimulasikan galat kamera nyata`,
  };
}

// Singleton — dibangun & divalidasi sekali saat pertama dipakai, lalu di-cache.
let _model = null;
function getModel() {
  if (!_model) _model = buildValidatedModel();
  return _model;
}

export function getClassifier() {
  return getModel().classifier;
}

/** Info akurasi model yang SUNGGUHAN dihitung dari holdout test, bukan angka klaim statis. */
export function getModelInfo() {
  const { accuracy, trainSize, testSize, correct, method } = getModel();
  return { accuracy, trainSize, testSize, correct, method };
}
