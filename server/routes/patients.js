import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTrainingDataset, CONDITION_PROFILES, CLINICAL_REFERENCE } from '../data/clinicalData.js';

const router = express.Router();
const prisma = new PrismaClient();

/** GET /api/patients, Daftar semua pasien (admin/dokter) */
router.get('/', async (req, res) => {
  try {
    const { search, risk, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { role: 'PATIENT' };
    if (search) where.name = { contains: search };

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: parseInt(limit),
        select: {
          id: true, name: true, email: true, gender: true, dateOfBirth: true, createdAt: true,
          patientSessions: {
            orderBy: { timestamp: 'desc' }, take: 1,
            select: { riskCategory: true, compositeScore: true, timestamp: true },
          },
          patientDoctors: { select: { doctor: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const enriched = patients.map(p => {
      const age = p.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth)) / (365.25 * 24 * 3600 * 1000)) : null;
      const lastSession = p.patientSessions[0] || null;
      return { ...p, age, lastSession, doctors: p.patientDoctors.map(d => d.doctor) };
    });

    const filtered = risk ? enriched.filter(p => p.lastSession?.riskCategory === risk) : enriched;
    res.json({ total, page: parseInt(page), limit: parseInt(limit), patients: filtered });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/patients/:id, Detail pasien */
router.get('/:id', async (req, res) => {
  try {
    const patient = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true, name: true, email: true, gender: true, dateOfBirth: true, phone: true, address: true, createdAt: true,
        patientSessions: {
          orderBy: { timestamp: 'desc' },
          select: {
            id: true, compositeScore: true, riskCategory: true, timestamp: true,
            mlPrediction: true, updrsEstimate: true, doctorNote: true, followUpDate: true,
            tremorResult: true, fingerTappingResult: true, gaitResult: true,
            armSwingResult: true, posturalResult: true, recommendations: true,
            doctor: { select: { id: true, name: true, specialization: true } },
          },
        },
        patientDoctors: { select: { doctor: { select: { id: true, name: true, specialization: true } }, linkedAt: true } },
      },
    });

    if (!patient) return res.status(404).json({ error: 'Pasien tidak ditemukan' });

    const age = patient.dateOfBirth
      ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
      : null;

    // Parse JSON fields
    const sessions = patient.patientSessions.map(s => ({
      ...s,
      tremorResult: s.tremorResult ? JSON.parse(s.tremorResult) : null,
      fingerTappingResult: s.fingerTappingResult ? JSON.parse(s.fingerTappingResult) : null,
      gaitResult: s.gaitResult ? JSON.parse(s.gaitResult) : null,
      armSwingResult: s.armSwingResult ? JSON.parse(s.armSwingResult) : null,
      posturalResult: s.posturalResult ? JSON.parse(s.posturalResult) : null,
      mlPrediction: s.mlPrediction ? JSON.parse(s.mlPrediction) : null,
      updrsEstimate: s.updrsEstimate ? JSON.parse(s.updrsEstimate) : null,
      recommendations: s.recommendations ? JSON.parse(s.recommendations) : [],
    }));

    // Tren skor risiko
    const trend = sessions.map(s => ({ date: s.timestamp, score: s.compositeScore, risk: s.riskCategory }));

    res.json({ ...patient, age, sessions, trend, doctors: patient.patientDoctors });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/patients/:id/summary, Ringkasan statistik pasien */
router.get('/:id/summary', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { patientId: parseInt(req.params.id) },
      orderBy: { timestamp: 'asc' },
      select: { compositeScore: true, riskCategory: true, timestamp: true, mlPrediction: true },
    });

    if (!sessions.length) return res.json({ message: 'Belum ada data sesi', sessions: [] });

    const scores = sessions.map(s => s.compositeScore || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const trend = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;

    const riskCounts = sessions.reduce((acc, s) => {
      acc[s.riskCategory || 'UNKNOWN'] = (acc[s.riskCategory || 'UNKNOWN'] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalSessions: sessions.length,
      averageScore: parseFloat(avgScore.toFixed(1)),
      latestScore: scores[scores.length - 1],
      trendDelta: parseFloat(trend.toFixed(1)),
      trendDirection: trend > 5 ? 'WORSENING' : trend < -5 ? 'IMPROVING' : 'STABLE',
      riskDistribution: riskCounts,
      timeline: sessions.map(s => ({ date: s.timestamp, score: s.compositeScore, risk: s.riskCategory })),
    });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
