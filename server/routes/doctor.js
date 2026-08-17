import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireRole, canAccessSession } from '../middleware/access.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Seluruh jalur di berkas ini menyentuh rekam pasien, jadi tidak ada satu pun
 * yang boleh terbuka. Sebelumnya semuanya dapat dipanggil tanpa token, dan
 * nomor dokter diambil dari permintaan sehingga siapa pun bisa membaca panel
 * dokter mana saja hanya dengan menebak nomornya.
 */
router.use(requireAuth, requireRole('DOCTOR', 'ADMIN'));

/**
 * Nomor dokter selalu diambil dari token, bukan dari kueri atau badan
 * permintaan. Administrator tetap boleh menyebut dokter lain secara eksplisit
 * karena memang berwenang meninjau seluruh panel.
 */
function resolveDoctorId(req, requested) {
  if (req.user.role === 'ADMIN' && requested) {
    const id = Number.parseInt(requested, 10);
    if (Number.isInteger(id)) return id;
  }
  return req.user.userId;
}

/**
 * Menyusun sebaran wilayah pasien beserta kategori risiko terakhirnya.
 * Menyediakan struktur berjenjang (Negara -> Provinsi -> Kota) untuk drilldown interaktif
 * serta daftar datar (byCountry, byState, byCity) untuk kompatibilitas.
 */
async function buildGeoBreakdown(patientIds) {
  if (!patientIds.length) return { byCountry: [], byState: [], byCity: [], hierarchy: [], unknownCount: 0, totalPatients: 0 };

  const patients = await prisma.user.findMany({
    where: { id: { in: patientIds } },
    select: {
      country: true, countryName: true, region: true, state: true, city: true,
      patientSessions: {
        orderBy: { timestamp: 'desc' }, take: 1,
        select: { riskCategory: true },
      },
    },
  });

  const countryMap = new Map();
  const stateFlatMap = new Map();
  const cityFlatMap = new Map();
  let unknown = 0;

  for (const p of patients) {
    const cName = p.countryName || p.country;
    if (!cName && !p.state && !p.city) {
      unknown++;
      continue;
    }

    const effectiveCountry = cName || 'Tidak Diketahui';
    const effectiveState = p.state || 'Lainnya';
    const effectiveCity = p.city || 'Lainnya';
    const risk = p.patientSessions[0]?.riskCategory;

    // 1. Hierarchy Grouping
    if (!countryMap.has(effectiveCountry)) {
      countryMap.set(effectiveCountry, {
        name: effectiveCountry,
        code: p.country || '',
        region: p.region || '',
        total: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        stateMap: new Map(),
      });
    }
    const cEntry = countryMap.get(effectiveCountry);
    cEntry.total++;
    if (risk === 'HIGH' || risk === 'MEDIUM' || risk === 'LOW') cEntry[risk]++;

    if (!cEntry.stateMap.has(effectiveState)) {
      cEntry.stateMap.set(effectiveState, {
        name: effectiveState,
        countryName: effectiveCountry,
        total: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        cityMap: new Map(),
      });
    }
    const sEntry = cEntry.stateMap.get(effectiveState);
    sEntry.total++;
    if (risk === 'HIGH' || risk === 'MEDIUM' || risk === 'LOW') sEntry[risk]++;

    if (!sEntry.cityMap.has(effectiveCity)) {
      sEntry.cityMap.set(effectiveCity, {
        name: effectiveCity,
        stateName: effectiveState,
        countryName: effectiveCountry,
        total: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      });
    }
    const cityEntry = sEntry.cityMap.get(effectiveCity);
    cityEntry.total++;
    if (risk === 'HIGH' || risk === 'MEDIUM' || risk === 'LOW') cityEntry[risk]++;

    // 2. Flat state map
    if (p.state) {
      const sf = stateFlatMap.get(p.state) || { name: p.state, countryName: effectiveCountry, total: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      sf.total++;
      if (risk === 'HIGH' || risk === 'MEDIUM' || risk === 'LOW') sf[risk]++;
      stateFlatMap.set(p.state, sf);
    }

    // 3. Flat city map
    if (p.city) {
      const cf = cityFlatMap.get(p.city) || { name: p.city, stateName: effectiveState, countryName: effectiveCountry, total: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      cf.total++;
      if (risk === 'HIGH' || risk === 'MEDIUM' || risk === 'LOW') cf[risk]++;
      cityFlatMap.set(p.city, cf);
    }
  }

  const hierarchy = Array.from(countryMap.values()).map(c => ({
    name: c.name,
    code: c.code,
    region: c.region,
    total: c.total,
    HIGH: c.HIGH,
    MEDIUM: c.MEDIUM,
    LOW: c.LOW,
    states: Array.from(c.stateMap.values()).map(s => ({
      name: s.name,
      countryName: s.countryName,
      total: s.total,
      HIGH: s.HIGH,
      MEDIUM: s.MEDIUM,
      LOW: s.LOW,
      cities: Array.from(s.cityMap.values()).sort((a, b) => b.total - a.total || b.HIGH - a.HIGH),
    })).sort((a, b) => b.total - a.total || b.HIGH - a.HIGH),
  })).sort((a, b) => b.total - a.total || b.HIGH - a.HIGH);

  const byCountry = hierarchy.map(c => ({
    name: c.name,
    code: c.code,
    region: c.region,
    total: c.total,
    HIGH: c.HIGH,
    MEDIUM: c.MEDIUM,
    LOW: c.LOW,
  }));

  const byState = Array.from(stateFlatMap.values()).sort((a, b) => b.total - a.total || b.HIGH - a.HIGH);
  const byCity = Array.from(cityFlatMap.values()).sort((a, b) => b.total - a.total || b.HIGH - a.HIGH);

  return {
    byCountry,
    byState,
    byCity,
    hierarchy,
    unknownCount: unknown,
    totalPatients: patients.length,
  };
}

/** GET /api/doctor/patients, daftar pasien yang tertaut ke dokter ini. */
router.get('/patients', async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req, req.query.doctorId);

    const links = await prisma.doctorPatient.findMany({
      where: { doctorId, status: 'ACTIVE' },
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

/**
 * POST /api/doctor/link-by-code
 * Body: { code }
 *
 * Menautkan pasien ke dokter yang sedang masuk berdasarkan kode berbagi yang
 * ditunjukkan pasien dari halaman Riwayat atau laporan PDF miliknya.
 *
 * Penautan sengaja berangkat dari kode, bukan dari nomor pasien. Dengan nomor,
 * dokter mana pun dapat menautkan dirinya ke pasien mana pun tanpa
 * sepengetahuan orang tersebut; dengan kode, akses hanya terjadi bila pasien
 * memang menyerahkannya.
 */
router.post('/link-by-code', async (req, res) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase().replace(/[\s-]/g, '');
    if (code.length < 6) {
      return res.status(400).json({ error: 'Kode berbagi tidak valid' });
    }

    const patient = await prisma.user.findFirst({
      where: { shareCode: code, role: 'PATIENT' },
      select: { id: true, name: true },
    });
    if (!patient) {
      return res.status(404).json({ error: 'Kode tidak dikenali. Pastikan pasien menyalinnya dengan benar.' });
    }

    const doctorId = req.user.userId;
    await prisma.doctorPatient.upsert({
      where: { doctorId_patientId: { doctorId, patientId: patient.id } },
      update: { status: 'ACTIVE' },
      create: { doctorId, patientId: patient.id },
    });

    res.json({ message: `${patient.name} berhasil ditautkan`, patient });
  } catch (e) {
    console.error('Link by code error:', e.message);
    res.status(500).json({ error: 'Gagal menautkan pasien' });
  }
});

/**
 * DELETE /api/doctor/patients/:patientId
 * Melepaskan tautan, sehingga data pasien tidak lagi muncul di panel dokter.
 */
router.delete('/patients/:patientId', async (req, res) => {
  try {
    const patientId = Number.parseInt(req.params.patientId, 10);
    if (!Number.isInteger(patientId)) {
      return res.status(400).json({ error: 'Nomor pasien tidak valid' });
    }
    await prisma.doctorPatient.updateMany({
      where: { doctorId: req.user.userId, patientId },
      data: { status: 'INACTIVE' },
    });
    res.json({ message: 'Tautan pasien dilepaskan' });
  } catch (e) {
    res.status(500).json({ error: 'Gagal melepaskan tautan' });
  }
});

/**
 * PUT /api/doctor/sessions/:sessionId/note, menambahkan catatan klinis.
 *
 * canAccessSession memastikan dokter memang tertaut ke pasien pemilik sesi
 * tersebut. Tanpa itu, catatan bisa dituliskan ke sesi pasien mana pun hanya
 * dengan menebak nomor sesinya.
 */
router.put('/sessions/:sessionId/note', canAccessSession, async (req, res) => {
  try {
    const { note, followUpDate } = req.body;
    const session = await prisma.session.update({
      where: { id: parseInt(req.params.sessionId) },
      data: {
        doctorNote: note,
        doctorId: req.user.userId,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
      },
    });
    res.json({ message: 'Catatan berhasil disimpan', session });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET /api/doctor/dashboard/:doctorId, statistik panel dokter. */
router.get('/dashboard/:doctorId', async (req, res) => {
  try {
    const doctorId = resolveDoctorId(req, req.params.doctorId);

    /* Statistik dihitung dari SELURUH pasien tertaut, bukan dari 50 terbaru.
       ───────────────────────────────────────────────────────────────────────
       Sebelumnya kueri ini memakai take: 50, lalu melaporkan panjang larik
       hasilnya sebagai totalPatients. Akibatnya bukan sekadar daftar yang
       terpotong melainkan angkanya sendiri yang keliru: kelima dokter di data
       contoh sama-sama menampilkan "50" padahal masing-masing menaungi 283
       sampai 315 pasien. Sebaran risiko, sebaran kondisi, dan peta wilayah
       juga ikut dihitung dari 50 sampel itu tetapi disajikan sebagai total.

       Yang dibatasi memang seharusnya daftar pasien di endpoint /patients,
       karena daftar itu yang dirender; statistik cukup mengambil id-nya saja,
       dan satu kolom integer untuk beberapa ratus baris jauh lebih murah
       daripada angka yang salah. */
    const links = await prisma.doctorPatient.findMany({
      where: { doctorId, status: 'ACTIVE' },
      select: { patientId: true },
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
      geoBreakdown: await buildGeoBreakdown(patientIds),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
