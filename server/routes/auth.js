import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'neuronmotion-secret-key';

/**
 * Mengenali galat akibat database yang belum mengikuti skema terbaru,
 * misalnya setelah git pull membawa kolom baru tetapi migrasi belum dijalankan.
 * P2021 tabel tidak ada, P2022 kolom tidak ada.
 */
function isSchemaDriftError(error) {
  if (error?.code === 'P2021' || error?.code === 'P2022') return true;
  const msg = String(error?.message || '');
  return /no such column|no such table|does not exist in the current database/i.test(msg);
}

// Register User (PATIENT or DOCTOR)
router.post('/register', async (req, res) => {
  try {
    const {
      email, password, name, role, gender, dateOfBirth,
      specialization, institution, licenseNumber,
      country, countryName, region, state, city,
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const resolvedRole = role || 'PATIENT';

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: resolvedRole,
        gender: gender === 'M' || gender === 'F' ? gender : null,
        // Pasien: tanggal lahir dipakai untuk hitung usia & rentang normal per kelompok usia
        dateOfBirth: resolvedRole === 'PATIENT' && dateOfBirth ? new Date(dateOfBirth) : null,
        // Dokter/nakes: profesi & institusi dicatat sebagai info profesional yang tampil ke pasien
        specialization: resolvedRole === 'DOCTOR' ? (specialization || null) : null,
        institution: resolvedRole === 'DOCTOR' ? (institution || null) : null,
        licenseNumber: resolvedRole === 'DOCTOR' ? (licenseNumber || null) : null,
        // Lokasi berlaku untuk kedua peran: identitas bagi pasien, dan bahan
        // pemetaan sebaran pasien bagi tenaga kesehatan
        country: country || null,
        countryName: countryName || null,
        region: region || null,
        state: state || null,
        city: city || null,
      }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error('Registration Error:', error);
    // Struktur database tertinggal dari skema (kolom belum ada) menghasilkan galat
    // Prisma tersendiri. Tanpa dibedakan, kondisi ini muncul sebagai 500 tanpa
    // petunjuk, padahal perbaikannya cukup menjalankan `npx prisma db push`.
    if (isSchemaDriftError(error)) {
      return res.status(500).json({
        error: 'Struktur database server belum diperbarui. Jalankan "npx prisma db push" di server lalu restart layanan.',
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        specialization: user.specialization,
        institution: user.institution,
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Profil ──────────────────────────────────────────────────────────────────

/** GET /api/auth/me, profil akun yang sedang login (untuk refresh data profil) */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'Akun tidak ditemukan' });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /api/auth/profile, ubah data pribadi milik akun sendiri */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const {
      name, gender, dateOfBirth, specialization, institution,
      country, countryName, region, state, city,
    } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'Akun tidak ditemukan' });

    const data = {};
    if (name !== undefined) data.name = name;
    if (gender !== undefined) data.gender = gender === 'M' || gender === 'F' ? gender : null;
    if (user.role === 'PATIENT' && dateOfBirth !== undefined) {
      data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }
    if (user.role === 'DOCTOR') {
      if (specialization !== undefined) data.specialization = specialization || null;
      if (institution !== undefined) data.institution = institution || null;
    }
    // Lokasi dapat diperbarui oleh kedua peran
    if (country !== undefined) data.country = country || null;
    if (countryName !== undefined) data.countryName = countryName || null;
    if (region !== undefined) data.region = region || null;
    if (state !== undefined) data.state = state || null;
    if (city !== undefined) data.city = city || null;

    const updated = await prisma.user.update({ where: { id: req.user.userId }, data });
    const { password, ...safeUser } = updated;
    res.json(safeUser);
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** PUT /api/auth/password, ganti password (wajib password lama yang benar) */
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Password lama dan baru wajib diisi' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'Akun tidak ditemukan' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Password lama tidak sesuai' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.userId }, data: { password: hashedPassword } });
    res.json({ message: 'Password berhasil diperbarui' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /api/auth/account, hapus akun sendiri secara permanen (hak hapus data, UU PDP) */
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { OR: [{ patientId: userId }, { doctorId: userId }] } }),
      prisma.doctorPatient.deleteMany({ where: { OR: [{ doctorId: userId }, { patientId: userId }] } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);
    res.json({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
