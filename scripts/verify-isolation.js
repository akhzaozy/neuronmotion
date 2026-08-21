/**
 * Script Verifikasi Isolasi Akses Data Dokter & Pasien
 * Skenario: Ozy (Dokter), Ria (Pasien), Adit (Dokter yang tidak tertaut)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'geraksehat-super-secret-2024';
const PORT = process.env.PORT || 38472;
const BASE_URL = `http://localhost:${PORT}`;

async function runVerification() {
  console.log('🧪 Memulai Pengujian Verifikasi Isolasi Data Dokter-Pasien...\n');

  // Bersihkan data lama jika ada
  await prisma.session.deleteMany({
    where: { patient: { email: { in: ['ria.test@neuronmotion.id', 'ozy.test@neuronmotion.id', 'adit.test@neuronmotion.id'] } } }
  });
  await prisma.doctorPatient.deleteMany({
    where: {
      OR: [
        { doctor: { email: { in: ['ozy.test@neuronmotion.id', 'adit.test@neuronmotion.id'] } } },
        { patient: { email: 'ria.test@neuronmotion.id' } }
      ]
    }
  });
  await prisma.user.deleteMany({
    where: { email: { in: ['ria.test@neuronmotion.id', 'ozy.test@neuronmotion.id', 'adit.test@neuronmotion.id'] } }
  });

  const hash = await bcrypt.hash('password123', 10);

  // 1. Buat User: Ozy (Dokter), Ria (Pasien), Adit (Dokter)
  const ozy = await prisma.user.create({
    data: {
      email: 'ozy.test@neuronmotion.id',
      name: 'dr. Ozy Spesialis',
      password: hash,
      role: 'DOCTOR',
      specialization: 'Spesialis Neurologi',
    }
  });

  const ria = await prisma.user.create({
    data: {
      email: 'ria.test@neuronmotion.id',
      name: 'Ria Pasien',
      password: hash,
      role: 'PATIENT',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'F',
    }
  });

  const adit = await prisma.user.create({
    data: {
      email: 'adit.test@neuronmotion.id',
      name: 'dr. Adit Dokter Lain',
      password: hash,
      role: 'DOCTOR',
      specialization: 'Spesialis Bedah Saraf',
    }
  });

  console.log(`✅ 1. Akun dibuat:`);
  console.log(`   - Dokter Ozy (ID: ${ozy.id})`);
  console.log(`   - Pasien Ria (ID: ${ria.id})`);
  console.log(`   - Dokter Adit (ID: ${adit.id})\n`);

  const ozyToken = jwt.sign({ userId: ozy.id, role: 'DOCTOR' }, JWT_SECRET);
  const riaToken = jwt.sign({ userId: ria.id, role: 'PATIENT' }, JWT_SECRET);
  const aditToken = jwt.sign({ userId: adit.id, role: 'DOCTOR' }, JWT_SECRET);

  // Helper fetch
  async function api(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${BASE_URL}${path}`, opts);
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, ok: res.ok, data };
  }

  // 2. Dapatkan Share Code Ria
  const shareCodeRes = await api('GET', `/api/patients/${ria.id}/share-code`, null, riaToken);
  if (!shareCodeRes.ok || !shareCodeRes.data?.shareCode) {
    throw new Error(`Gagal mendapatkan share code Ria: ${JSON.stringify(shareCodeRes.data)}`);
  }
  const riaShareCode = shareCodeRes.data.shareCode;
  console.log(`✅ 2. Kode berbagi Ria diperoleh: ${riaShareCode}\n`);

  // 3. Dokter Ozy menautkan Ria via Share Code
  const linkRes = await api('POST', '/api/doctor/link-by-code', { code: riaShareCode }, ozyToken);
  if (!linkRes.ok) {
    throw new Error(`Ozy gagal menautkan Ria: ${JSON.stringify(linkRes.data)}`);
  }
  console.log(`✅ 3. Dokter Ozy berhasil menautkan diri ke Ria via kode berbagi.\n`);

  // 4. Ria melakukan tes skrining lengkap (POST /api/tests/full-screening)
  const screeningPayload = {
    patientId: ria.id,
    tremor: {
      bodyPart: 'WRIST_RIGHT',
      samples: [
        { timestamp: 0, x: 0.50, y: 0.30, z: 0 },
        { timestamp: 33, x: 0.52, y: 0.32, z: 0 },
        { timestamp: 66, x: 0.48, y: 0.28, z: 0 },
        { timestamp: 99, x: 0.52, y: 0.32, z: 0 },
        { timestamp: 132, x: 0.48, y: 0.28, z: 0 },
        { timestamp: 165, x: 0.52, y: 0.32, z: 0 },
        { timestamp: 198, x: 0.48, y: 0.28, z: 0 },
        { timestamp: 231, x: 0.52, y: 0.32, z: 0 },
      ]
    },
    fingerTapping: {
      taps: [
        { timestamp: 0, distance: 0.12 },
        { timestamp: 250, distance: 0.02 },
        { timestamp: 500, distance: 0.11 },
        { timestamp: 750, distance: 0.02 },
      ]
    }
  };

  const screenRes = await api('POST', '/api/tests/full-screening', screeningPayload, riaToken);
  if (!screenRes.ok) {
    throw new Error(`Ria gagal menyimpan skrining: ${JSON.stringify(screenRes.data)}`);
  }
  const sessionId = screenRes.data.sessionId;
  console.log(`✅ 4. Ria berhasil melakukan skrining. Session ID: ${sessionId}\n`);

  // 5. Verifikasi Akses Dokter Ozy (TERTAUT)
  console.log('🔍 5. Memeriksa akses Dokter Ozy (Harus BISA melihat):');
  const ozyPatients = await api('GET', '/api/doctor/patients', null, ozyToken);
  const ozyHasRia = ozyPatients.data?.patients?.some(p => p.id === ria.id);
  console.log(`   - Ozy /api/doctor/patients: total=${ozyPatients.data?.total}, memiliki Ria? ${ozyHasRia ? '✅ YA' : '❌ TIDAK'}`);
  if (!ozyHasRia) throw new Error('Dokter Ozy harusnya memiliki Ria dalam daftar pasien!');

  const ozyDetail = await api('GET', `/api/patients/${ria.id}`, null, ozyToken);
  console.log(`   - Ozy /api/patients/${ria.id}: status=${ozyDetail.status}, nama="${ozyDetail.data?.name}" ${ozyDetail.status === 200 && ozyDetail.data?.name === 'Ria Pasien' ? '✅ OK' : '❌ GAGAL'}`);
  if (ozyDetail.status !== 200) throw new Error('Ozy gagal mengakses detail pasien Ria!');

  const ozyHistory = await api('GET', `/api/tests/history/${ria.id}`, null, ozyToken);
  console.log(`   - Ozy /api/tests/history/${ria.id}: status=${ozyHistory.status}, sesi count=${ozyHistory.data?.total} ${ozyHistory.status === 200 ? '✅ OK' : '❌ GAGAL'}`);
  if (ozyHistory.status !== 200) throw new Error('Ozy gagal mengakses riwayat skrining Ria!');

  // 6. Verifikasi Akses Dokter Adit (TIDAK TERTAUT)
  console.log('\n🔒 6. Memeriksa akses Dokter Adit (TIDAK BOLEH melihat data Ria):');

  // A. Daftar pasien Adit
  const aditPatients = await api('GET', '/api/doctor/patients', null, aditToken);
  const aditHasRia = aditPatients.data?.patients?.some(p => p.id === ria.id);
  console.log(`   - Adit /api/doctor/patients: total=${aditPatients.data?.total}, memiliki Ria? ${aditHasRia ? '❌ BOCOR' : '✅ TIDAK (Aman)'}`);
  if (aditHasRia || aditPatients.data?.total !== 0) throw new Error('Kebocoran! Dokter Adit melihat pasien padahal tidak tertaut!');

  // B. Dashboard Adit
  const aditDash = await api('GET', `/api/doctor/dashboard/${adit.id}`, null, aditToken);
  const hasGeoData = (aditDash.data?.geoBreakdown?.totalPatients ?? 0) >= 0;
  console.log(`   - Adit /api/doctor/dashboard: totalPatients=${aditDash.data?.totalPatients} (hanya pasien tertaut), recentSessions=${aditDash.data?.recentSessions?.length}, geoBreakdown=${aditDash.data?.geoBreakdown ? 'Tersedia (Makro Wilayah)' : 'Kosong'} ${aditDash.data?.totalPatients === 0 && aditDash.data?.recentSessions?.length === 0 && hasGeoData ? '✅ Aman & Sebaran Wilayah Tersedia' : '❌ GAGAL'}`);
  if (aditDash.data?.totalPatients !== 0 || aditDash.data?.recentSessions?.length !== 0) {
    throw new Error('Kebocoran! Dashboard Adit menampilkan data sesi pasien yang tidak tertaut!');
  }

  // C. Adit mencoba mengakses detail Ria
  const aditDetail = await api('GET', `/api/patients/${ria.id}`, null, aditToken);
  console.log(`   - Adit /api/patients/${ria.id}: status=${aditDetail.status} (Harus 403 Forbidden) ${aditDetail.status === 403 ? '✅ DITOLAK (Aman)' : '❌ BOCOR'}`);
  if (aditDetail.status !== 403) throw new Error(`Adit berhasil mengakses detail Ria! Status: ${aditDetail.status}`);

  // D. Adit mencoba mengakses riwayat skrining Ria
  const aditHistory = await api('GET', `/api/tests/history/${ria.id}`, null, aditToken);
  console.log(`   - Adit /api/tests/history/${ria.id}: status=${aditHistory.status} (Harus 403 Forbidden) ${aditHistory.status === 403 ? '✅ DITOLAK (Aman)' : '❌ BOCOR'}`);
  if (aditHistory.status !== 403) throw new Error(`Adit berhasil mengakses riwayat Ria! Status: ${aditHistory.status}`);

  // E. Adit mencoba mengakses sesi Ria
  const aditSession = await api('GET', `/api/tests/session/${sessionId}`, null, aditToken);
  console.log(`   - Adit /api/tests/session/${sessionId}: status=${aditSession.status} (Harus 403 Forbidden) ${aditSession.status === 403 ? '✅ DITOLAK (Aman)' : '❌ BOCOR'}`);
  if (aditSession.status !== 403) throw new Error(`Adit berhasil mengakses sesi Ria! Status: ${aditSession.status}`);

  // F. Adit mencoba menulis catatan klinis pada sesi Ria
  const aditNote = await api('PUT', `/api/doctor/sessions/${sessionId}/note`, { note: 'Catatan jahat' }, aditToken);
  console.log(`   - Adit PUT note pada sesi Ria: status=${aditNote.status} (Harus 403 Forbidden) ${aditNote.status === 403 ? '✅ DITOLAK (Aman)' : '❌ BOCOR'}`);
  if (aditNote.status !== 403) throw new Error(`Adit berhasil menulis catatan pada sesi Ria! Status: ${aditNote.status}`);

  // 7. Cleanup
  console.log('\n🧹 7. Membersihkan data pengujian...');
  await prisma.session.deleteMany({ where: { patientId: ria.id } });
  await prisma.doctorPatient.deleteMany({ where: { OR: [{ doctorId: ozy.id }, { doctorId: adit.id }, { patientId: ria.id }] } });
  await prisma.user.deleteMany({ where: { id: { in: [ozy.id, ria.id, adit.id] } } });
  console.log('✅ Data pengujian dibersihkan.\n');

  console.log('🎉 SEMUA PENGUJIAN ISOLASI DATA BERHASIL 100%! Tidak ada celah kebocoran data.');
}

runVerification()
  .catch(e => {
    console.error('❌ PENGUJIAN GAGAL:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
