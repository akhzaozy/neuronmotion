import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateTrainingDataset, CONDITION_PROFILES, CLINICAL_REFERENCE } from '../data/clinicalData.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, canAccessPatient } from '../middleware/access.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/patients, daftar seluruh pasien.
 *
 * Hanya untuk administrator. Sebelumnya jalur ini terbuka tanpa token dan
 * mengembalikan nama, surel, serta tanggal lahir seluruh pasien terdaftar
 * kepada siapa pun yang mengetahui alamatnya. Dokter tidak memakai jalur ini;
 * daftar pasiennya diambil dari /api/doctor/patients yang sudah tersaring
 * menurut tautan.
 */
router.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
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

/** GET /api/patients/:id, detail pasien beserta seluruh sesinya. */
router.get('/:id', requireAuth, canAccessPatient, async (req, res) => {
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

/** GET /api/patients/:id/summary, ringkasan statistik pasien. */
router.get('/:id/summary', requireAuth, canAccessPatient, async (req, res) => {
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

/**
 * Kode berbagi memakai huruf dan angka yang tidak mudah tertukar saat dibaca
 * atau didiktekan: tanpa I, O, 0, dan 1. Panjang delapan karakter memberi lebih
 * dari satu triliun kemungkinan, sehingga tidak realistis ditebak.
 */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateShareCode() {
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * GET /api/patients/:id/share-code
 * Mengembalikan kode berbagi milik pasien, dan membuatkannya bila belum ada.
 * Kode ini yang diserahkan pasien kepada tenaga kesehatan agar dapat melihat
 * hasil skriningnya.
 */
router.get('/:id/share-code', requireAuth, canAccessPatient, async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);

    // Hanya pemilik akun yang boleh memunculkan kodenya sendiri. Dokter yang
    // sudah tertaut tidak perlu, dan membiarkannya membaca kode akan membuat
    // kode itu bisa diteruskan ke pihak lain tanpa sepengetahuan pasien.
    if (req.user.userId !== patientId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Hanya pemilik akun yang dapat melihat kode berbaginya' });
    }

    const existing = await prisma.user.findUnique({
      where: { id: patientId },
      select: { shareCode: true },
    });
    if (existing?.shareCode) return res.json({ shareCode: existing.shareCode });

    // Tabrakan kode sangat jarang, tetapi tetap dicoba ulang beberapa kali
    // agar permintaan tidak gagal hanya karena kebetulan.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateShareCode();
      try {
        const updated = await prisma.user.update({
          where: { id: patientId },
          data: { shareCode: code },
          select: { shareCode: true },
        });
        return res.json({ shareCode: updated.shareCode });
      } catch (e) {
        if (e.code !== 'P2002') throw e;
      }
    }
    res.status(500).json({ error: 'Gagal membuat kode berbagi, coba lagi' });
  } catch (e) {
    console.error('Share code error:', e.message);
    res.status(500).json({ error: 'Gagal menyiapkan kode berbagi' });
  }
});

/**
 * POST /api/patients/:id/share-code/reset
 * Membuat kode baru sekaligus membatalkan kode lama. Dipakai bila pasien
 * merasa kodenya sudah tersebar terlalu luas.
 */
router.post('/:id/share-code/reset', requireAuth, canAccessPatient, async (req, res) => {
  try {
    const patientId = parseInt(req.params.id);
    if (req.user.userId !== patientId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Hanya pemilik akun yang dapat mengganti kode berbaginya' });
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const updated = await prisma.user.update({
          where: { id: patientId },
          data: { shareCode: generateShareCode() },
          select: { shareCode: true },
        });
        return res.json({ shareCode: updated.shareCode });
      } catch (e) {
        if (e.code !== 'P2002') throw e;
      }
    }
    res.status(500).json({ error: 'Gagal membuat kode baru, coba lagi' });
  } catch (e) {
    res.status(500).json({ error: 'Gagal mengganti kode berbagi' });
  }
});

export default router;
