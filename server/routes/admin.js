import express from 'express';
import { PrismaClient } from '@prisma/client';
import { CONDITION_PROFILES, generateTrainingDataset, getModelInfo } from '../data/clinicalData.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/access.js';

const router = express.Router();
const prisma = new PrismaClient();

/** GET /api/admin/model-accuracy, Akurasi K-NN sungguhan (holdout 80/20, bukan angka klaim) */
router.get('/model-accuracy', (req, res) => {
  res.json(getModelInfo());
});

/** GET /api/admin/stats, Statistik sistem keseluruhan */
/**
 * Jalur di bawah ini memuat cacah pasien nyata, daftar dokter beserta nomor
 * izin praktik, dan pasangan dokter-pasien. Semuanya sebelumnya terbuka tanpa
 * token, jadi kini dibatasi untuk administrator.
 *
 * /model-accuracy sengaja tetap terbuka karena angkanya ditampilkan di halaman
 * depan dan tidak memuat data siapa pun, hanya hasil validasi model.
 */
router.get('/stats', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const [totalPatients, totalDoctors, totalSessions, riskBreakdown, recentSessions] = await Promise.all([
      prisma.user.count({ where: { role: 'PATIENT' } }),
      prisma.user.count({ where: { role: 'DOCTOR' } }),
      prisma.session.count(),
      prisma.session.groupBy({ by: ['riskCategory'], _count: { id: true } }),
      prisma.session.findMany({
        orderBy: { timestamp: 'desc' }, take: 5,
        select: {
          id: true, compositeScore: true, riskCategory: true, timestamp: true,
          patient: { select: { id: true, name: true } },
          mlPrediction: true,
        },
      }),
    ]);

    const highRisk = riskBreakdown.find(r => r.riskCategory === 'HIGH')?._count.id || 0;
    const medRisk = riskBreakdown.find(r => r.riskCategory === 'MEDIUM')?._count.id || 0;
    const lowRisk = riskBreakdown.find(r => r.riskCategory === 'LOW')?._count.id || 0;

    res.json({
      system: { totalPatients, totalDoctors, totalSessions },
      riskSummary: { HIGH: highRisk, MEDIUM: medRisk, LOW: lowRisk },
      recentSessions: recentSessions.map(s => ({
        ...s, mlPrediction: s.mlPrediction ? JSON.parse(s.mlPrediction) : null,
      })),
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/admin/conditions, Referensi kondisi klinis */
router.get('/conditions', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const conditions = await prisma.condition.findMany();
  res.json(conditions.map(c => ({ ...c, biomarkerThresholds: JSON.parse(c.biomarkerThresholds) })));
});

/** GET /api/admin/training-data, Preview data training */
router.get('/training-data', requireAuth, requireRole('ADMIN'), (req, res) => {
  const { count = 10 } = req.query;
  const dataset = generateTrainingDataset(Math.min(parseInt(count), 50));
  res.json({
    description: 'Data sintetis dengan rentang mengacu pada MDS-UPDRS, Hoehn & Yahr, Zhang dkk. 2017 (tremor), '
      + 'Zanardi dkk. 2021 (gait), dan Lewek dkk. 2010 (ayunan lengan). Daftar lengkap beserta status '
      + 'verifikasi tiap parameter ada di dataset/NeuronMotion-Dataset-Training.xlsx sheet Referensi.',
    count: dataset.length,
    conditions: Object.keys(CONDITION_PROFILES),
    sample: dataset.slice(0, 5),
  });
});

/** GET /api/admin/doctors, Daftar dokter */
router.get('/doctors', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true, name: true, email: true, specialization: true, licenseNumber: true, createdAt: true,
        doctorPatients: { select: { patientId: true } },
      },
    });
    res.json(doctors.map(d => ({ ...d, totalPatients: d.doctorPatients.length })));
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
