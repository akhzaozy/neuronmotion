import express from 'express';
import { PrismaClient } from '@prisma/client';
import {
  analyzeTremor,
  analyzeFingerTapping,
  analyzeGait,
  analyzeArmSwing,
  analyzeROM,
  analyzePosturalStability,
  calculateCompositeRisk,
} from '../services/biomarkers.js';
import { getClassifier } from '../data/clinicalData.js';

const router = express.Router();
const prisma = new PrismaClient();

// ── Tes Individual ────────────────────────────────────────────────────────────

/** POST /api/tests/tremor */
router.post('/tremor', (req, res) => {
  const result = analyzeTremor(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ test: 'TREMOR', ...result });
});

/** POST /api/tests/finger-tapping */
router.post('/finger-tapping', (req, res) => {
  const result = analyzeFingerTapping(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ test: 'FINGER_TAPPING', ...result });
});

/** POST /api/tests/gait */
router.post('/gait', (req, res) => {
  const result = analyzeGait(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ test: 'GAIT', ...result });
});

/** POST /api/tests/arm-swing */
router.post('/arm-swing', (req, res) => {
  const result = analyzeArmSwing(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ test: 'ARM_SWING', ...result });
});

/** POST /api/tests/rom */
router.post('/rom', (req, res) => {
  const result = analyzeROM(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ test: 'RANGE_OF_MOTION', ...result });
});

/** POST /api/tests/posture */
router.post('/posture', (req, res) => {
  const result = analyzePosturalStability(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json({ test: 'POSTURAL_STABILITY', ...result });
});

// ── Tes Lengkap (Semua Biomarker Sekaligus) ───────────────────────────────────

/**
 * POST /api/tests/full-screening
 * Body: { patientId, tremor?, fingerTapping?, gait?, armSwing?, rom?, posturalStability? }
 * Menerima data dari semua tes, menghitung semua biomarker, skor komposit,
 * dan menyimpan ke database sebagai satu sesi pemeriksaan.
 */
router.post('/full-screening', async (req, res) => {
  try {
    const { patientId, tremor, fingerTapping, gait, armSwing, rom, posturalStability } = req.body;

    if (!patientId) return res.status(400).json({ error: 'patientId wajib diisi' });

    const testResults = {};

    if (tremor)            testResults.tremor            = analyzeTremor(tremor);
    if (fingerTapping)     testResults.fingerTapping     = analyzeFingerTapping(fingerTapping);
    if (gait)              testResults.gait              = analyzeGait(gait);
    if (armSwing)          testResults.armSwing          = analyzeArmSwing(armSwing);
    if (rom)               testResults.rom               = analyzeROM(rom);
    if (posturalStability) testResults.posturalStability = analyzePosturalStability(posturalStability);

    if (Object.keys(testResults).length === 0) {
      return res.status(400).json({ error: 'Minimal satu data tes harus dikirim' });
    }

    const composite = calculateCompositeRisk(testResults);

    // Catatan: rekomendasi yang disimpan HARUS konsisten dengan kategori risiko
    // komposit (composite.recommendations), bukan gabungan interpretasi per-tes.
    // Menggabungkan interpretasi individual (termasuk yang berlabel "BORDERLINE"/
    // ringan) tanpa melihat skor total pernah membuat pasien berisiko RENDAH
    // mendapat catatan riwayat yang terdengar seperti kasus berat.

    // Jalankan K-NN ML Prediction
    let mlPrediction = null;
    try {
      const classifier = getClassifier();
      mlPrediction = classifier.classify(testResults);
    } catch (e) {
      console.warn("K-NN Warning:", e);
    }

    // Simpan ke database
    const session = await prisma.session.create({
      data: {
        patientId: parseInt(patientId),
        tremorResult: testResults.tremor ? JSON.stringify(testResults.tremor) : null,
        fingerTappingResult: testResults.fingerTapping ? JSON.stringify(testResults.fingerTapping) : null,
        gaitResult: testResults.gait ? JSON.stringify(testResults.gait) : null,
        armSwingResult: testResults.armSwing ? JSON.stringify(testResults.armSwing) : null,
        romResult: testResults.rom ? JSON.stringify(testResults.rom) : null,
        posturalResult: testResults.posturalStability ? JSON.stringify(testResults.posturalStability) : null,
        compositeScore: composite.compositeScore,
        riskCategory: composite.riskCategory,
        mlPrediction: mlPrediction ? JSON.stringify(mlPrediction) : null,
        updrsEstimate: JSON.stringify(composite.updrsEstimate),
        recommendations: JSON.stringify(composite.recommendations),
      },
    });

    // Auto-link pasien ke SEMUA dokter yang ada
    // sehingga setiap akun dokter langsung bisa melihat hasil screening pasien baru
    try {
      const allDoctors = await prisma.user.findMany({
        where: { role: 'DOCTOR' },
        select: { id: true },
      });
      for (const doc of allDoctors) {
        await prisma.doctorPatient.upsert({
          where: { doctorId_patientId: { doctorId: doc.id, patientId: parseInt(patientId) } },
          update: { status: 'ACTIVE' },
          create: { doctorId: doc.id, patientId: parseInt(patientId), status: 'ACTIVE' },
        });
      }
    } catch (linkErr) {
      console.warn('Auto-link warning:', linkErr.message);
    }

    res.status(201).json({
      sessionId: session.id,
      timestamp: session.timestamp,
      composite,
      testResults,
      summary: composite.riskLabel,
    });


  } catch (err) {
    console.error('Full Screening Error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// ── Ambil Hasil Skrining ──────────────────────────────────────────────────────

/** GET /api/tests/history/:patientId — riwayat lengkap dengan breakdown */
router.get('/history/:patientId', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { patientId: parseInt(req.params.patientId) },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = sessions.map(s => ({
      ...s,
      rawBiomarkers: {
        tremor: s.tremorResult ? JSON.parse(s.tremorResult) : null,
        fingerTapping: s.fingerTappingResult ? JSON.parse(s.fingerTappingResult) : null,
        gait: s.gaitResult ? JSON.parse(s.gaitResult) : null,
        armSwing: s.armSwingResult ? JSON.parse(s.armSwingResult) : null,
        rom: s.romResult ? JSON.parse(s.romResult) : null,
        posturalStability: s.posturalResult ? JSON.parse(s.posturalResult) : null,
      },
      mlPrediction: s.mlPrediction ? JSON.parse(s.mlPrediction) : null,
      updrsEstimate: s.updrsEstimate ? JSON.parse(s.updrsEstimate) : null,
      recommendations: s.recommendations ? JSON.parse(s.recommendations) : [],
    }));

    res.json({ patientId: parseInt(req.params.patientId), total: sessions.length, sessions: enriched });
  } catch (err) {
    console.error('History Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/tests/session/:sessionId — detail satu sesi */
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await prisma.session.findUnique({ where: { id: parseInt(req.params.sessionId) } });
    if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });
    res.json({
      ...session,
      rawBiomarkers: {
        tremor: session.tremorResult ? JSON.parse(session.tremorResult) : null,
        fingerTapping: session.fingerTappingResult ? JSON.parse(session.fingerTappingResult) : null,
        gait: session.gaitResult ? JSON.parse(session.gaitResult) : null,
        armSwing: session.armSwingResult ? JSON.parse(session.armSwingResult) : null,
        rom: session.romResult ? JSON.parse(session.romResult) : null,
        posturalStability: session.posturalResult ? JSON.parse(session.posturalResult) : null,
      },
      mlPrediction: session.mlPrediction ? JSON.parse(session.mlPrediction) : null,
      updrsEstimate: session.updrsEstimate ? JSON.parse(session.updrsEstimate) : null,
      recommendations: session.recommendations ? JSON.parse(session.recommendations) : [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
