/**
 * ============================================================
 * NEURONMOTION, Aturan Akses Data Pasien
 * ============================================================
 * Rekam skrining memuat nama, surel, tanggal lahir, skor risiko, dugaan
 * kondisi klinis, dan catatan dokter. Seluruhnya data kesehatan pribadi, jadi
 * setiap jalur yang menyentuhnya harus melewati pemeriksaan di berkas ini.
 *
 * Aturannya satu kalimat: pasien hanya boleh membaca dirinya sendiri, dokter
 * hanya boleh membaca pasien yang tertaut kepadanya, administrator boleh
 * membaca semuanya.
 * ============================================================
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Menolak permintaan yang perannya tidak termasuk daftar yang diizinkan. */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Token diperlukan' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Peran akun ini tidak berhak mengakses data tersebut' });
    }
    next();
  };
}

/** Benar bila dokter tersebut punya tautan aktif ke pasien yang diminta. */
export async function isLinkedToPatient(doctorId, patientId) {
  const dId = Number.parseInt(doctorId, 10);
  const pId = Number.parseInt(patientId, 10);
  if (!Number.isInteger(dId) || !Number.isInteger(pId)) return false;
  const link = await prisma.doctorPatient.findUnique({
    where: { doctorId_patientId: { doctorId: dId, patientId: pId } },
    select: { status: true },
  });
  return link?.status === 'ACTIVE';
}

/**
 * Memastikan pengguna berhak atas data pasien pada :id atau :patientId.
 *
 * Nomor pasien diambil dari parameter rute, bukan dari badan permintaan, agar
 * tidak bisa ditukar diam-diam oleh pemanggil.
 */
export async function canAccessPatient(req, res, next) {
  const raw = req.params.patientId ?? req.params.id;
  const patientId = Number.parseInt(raw, 10);
  if (!Number.isInteger(patientId)) {
    return res.status(400).json({ error: 'Nomor pasien tidak valid' });
  }
  if (!req.user) return res.status(401).json({ error: 'Token diperlukan' });

  const { userId, role } = req.user;

  if (role === 'ADMIN') return next();
  if (userId === patientId) return next();

  if (role === 'DOCTOR' && await isLinkedToPatient(userId, patientId)) return next();

  // Pesan sengaja tidak membedakan "tidak ada" dari "tidak berhak", supaya
  // tidak bisa dipakai menebak nomor pasien mana yang terdaftar.
  return res.status(403).json({ error: 'Anda tidak berhak mengakses data pasien ini' });
}

/** Sama seperti di atas, tetapi pasien ditentukan lewat nomor sesi. */
export async function canAccessSession(req, res, next) {
  const sessionId = Number.parseInt(req.params.sessionId, 10);
  if (!Number.isInteger(sessionId)) {
    return res.status(400).json({ error: 'Nomor sesi tidak valid' });
  }
  if (!req.user) return res.status(401).json({ error: 'Token diperlukan' });

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { patientId: true },
  });
  if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan' });

  const { userId, role } = req.user;
  if (role === 'ADMIN' || userId === session.patientId
      || (role === 'DOCTOR' && await isLinkedToPatient(userId, session.patientId))) {
    req.sessionPatientId = session.patientId;
    return next();
  }

  return res.status(403).json({ error: 'Anda tidak berhak mengakses sesi ini' });
}
