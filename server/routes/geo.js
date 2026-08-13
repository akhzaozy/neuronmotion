import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Daftar kota per negara. Berkasnya sekitar 2 MB sehingga sengaja tidak
 * dibundel ke frontend; dimuat sekali ke memori saat pertama diminta agar
 * tidak membaca ulang berkas pada tiap permintaan.
 */
let citiesCache = null;

function getCities() {
  if (!citiesCache) {
    citiesCache = JSON.parse(readFileSync(join(__dirname, '../data/cities.json'), 'utf8'));
  }
  return citiesCache;
}

/**
 * GET /api/geo/cities?country=Indonesia
 * Mengembalikan daftar kota untuk satu negara. Nama negara memakai penamaan
 * yang sama dengan daftar negara ISO pada frontend.
 */
router.get('/cities', (req, res) => {
  const country = (req.query.country || '').trim();
  if (!country) return res.status(400).json({ error: 'Parameter country wajib diisi' });

  try {
    const all = getCities();
    // Beberapa nama negara berbeda antar sumber data, jadi dicocokkan longgar
    const key = Object.keys(all).find(
      k => k.toLowerCase() === country.toLowerCase()
    ) || Object.keys(all).find(
      k => k.toLowerCase().includes(country.toLowerCase()) ||
           country.toLowerCase().includes(k.toLowerCase())
    );

    const cities = key ? all[key] : [];
    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ country: key || country, count: cities.length, cities });
  } catch (e) {
    console.error('Geo cities error:', e.message);
    res.status(500).json({ error: 'Gagal memuat data kota' });
  }
});

export default router;
