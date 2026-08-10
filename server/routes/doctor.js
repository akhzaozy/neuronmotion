import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/** GET /api/doctor/patients — Daftar pasien dokter */
router.get('/patients', async (req, res) => {
  try {
    const { doctorId } = req.query;
    if (!doctorId) return res.status(400).json({ error: 'doctorId diperlukan' });

    const links = await prisma.doctorPatient.findMany({
      where: { doctorId: parseInt(doctorId), status: 'ACTIVE' },
      include: {
        patient: {
          select: {
            id: true, name: true, email: true, gender: true, dateOfBirth: true,
            patientSessions: {
              orderBy: { timestamp: 'desc' }, take: 1,
              select: { riskCategory: true, compositeScore: true, timestamp: true, doctorNote: true, mlPrediction: true },
            },
          },
        },
      },
      orderBy: { linkedAt: 'desc' },
      take: 50, // batasi 50 pasien terbaru untuk performa
    });

    const patients = links.map(l => {
      const age = l.patient.dateOfBirth
        ? Math.floor((Date.now() - new Date(l.patient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
        : null;
      return { ...l.patient, age, linkedAt: l.linkedAt, lastSession: l.patient.patientSessions[0] || null };
    });

    // Summary stats
    const highRisk = patients.filter(p => p.lastSession?.riskCategory === 'HIGH').length;
    const medRisk = patients.filter(p => p.lastSession?.riskCategory === 'MEDIUM').length;

    res.json({ total: patients.length, highRisk, medRisk, patients });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /api/doctor/link — Hubungkan dokter ke pasien */
router.post('/link', async (req, res) => {
  try {
    const { doctorId, patientId } = req.body;
    const link = await prisma.doctorPatient.upsert({
      where: { doctorId_patientId: { doctorId: parseInt(doctorId), patientId: parseInt(patientId) } },
      update: { status: 'ACTIVE' },
      create: { doctorId: parseInt(doctorId), patientId: parseInt(patientId) },
    });
    res.json({ message: 'Pasien berhasil dihubungkan', link });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** PUT /api/doctor/sessions/:sessionId/note — Tambah catatan nakes */
router.put('/sessions/:sessionId/note', async (req, res) => {
  try {
    const { doctorId, note, followUpDate } = req.body;
    const session = await prisma.session.update({
      where: { id: parseInt(req.params.sessionId) },
      data: {
        doctorNote: note,
        doctorId: doctorId ? parseInt(doctorId) : undefined,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
    });
    res.json({ message: 'Catatan berhasil disimpan', session });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/doctor/dashboard/:doctorId — Statistik dashboard dokter */
router.get('/dashboard/:doctorId', async (req, res) => {
  try {
    const doctorId = parseInt(req.params.doctorId);

    const links = await prisma.doctorPatient.findMany({
      where: { doctorId, status: 'ACTIVE' },
      select: { patientId: true },
      take: 50,
      orderBy: { linkedAt: 'desc' },
    });
    const patientIds = links.map(l => l.patientId);

    const [recentSessions, riskBreakdown, conditionBreakdown] = await Promise.all([
      prisma.session.findMany({
        where: { patientId: { in: patientIds } },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true, compositeScore: true, riskCategory: true, timestamp: true,
          mlPrediction: true, patient: { select: { id: true, name: true, gender: true } },
        },
      }),
      prisma.session.groupBy({
        by: ['riskCategory'],
        where: { patientId: { in: patientIds } },
        _count: { id: true },
      }),
      // Ambil kondisi ML dari sesi terbaru
      prisma.session.findMany({
        where: { patientId: { in: patientIds }, mlPrediction: { not: null } },
        orderBy: { timestamp: 'desc' },
        select: { mlPrediction: true, patientId: true },
        distinct: ['patientId'],
      }),
    ]);

    const conditionCounts = {};
    conditionBreakdown.forEach(s => {
      try {
        const ml = JSON.parse(s.mlPrediction);
        const c = ml?.predictedCondition || 'UNKNOWN';
        conditionCounts[c] = (conditionCounts[c] || 0) + 1;
      } catch {}
    });

    res.json({
      totalPatients: patientIds.length,
      recentSessions: recentSessions.map(s => ({
        ...s,
        mlPrediction: s.mlPrediction ? JSON.parse(s.mlPrediction) : null,
      })),
      riskBreakdown: riskBreakdown.reduce((acc, r) => {
        acc[r.riskCategory || 'UNKNOWN'] = r._count.id;
        return acc;
      }, {}),
      conditionBreakdown: conditionCounts,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
