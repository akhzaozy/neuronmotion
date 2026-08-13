import express from 'express';
import { translateTexts, getDeeplUsage, isDeeplConfigured } from '../services/deepl.js';

const router = express.Router();

/** GET /api/translate/status, ketersediaan layanan dan sisa kuota */
router.get('/status', async (req, res) => {
  res.json({ available: isDeeplConfigured(), usage: await getDeeplUsage() });
});

/**
 * POST /api/translate
 * Body: { texts: string[], target: 'EN' | 'ID' }
 *
 * Hanya untuk teks dinamis (ringkasan AI, catatan dokter). Label antarmuka
 * memakai kamus lokal di frontend agar tidak memakan kuota DeepL.
 */
router.post('/', async (req, res) => {
  const { texts, target } = req.body || {};
  if (!Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'texts wajib berupa array dan tidak kosong' });
  }
  if (texts.length > 20) {
    return res.status(400).json({ error: 'Maksimal 20 teks per permintaan' });
  }

  const clean = texts.filter(t => typeof t === 'string' && t.trim().length > 0);
  if (clean.length === 0) {
    return res.status(400).json({ error: 'Tidak ada teks yang dapat diterjemahkan' });
  }

  const result = await translateTexts(clean, target || 'EN');
  // Kegagalan tetap dibalas 200 dengan teks asli, agar antarmuka menampilkan
  // versi bahasa sumber alih-alih kosong ketika kuota habis atau jaringan gagal
  res.json(result);
});

export default router;
