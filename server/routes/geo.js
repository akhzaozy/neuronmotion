import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = express.Router();

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Daftar kota, dikelompokkan sebagai kode negara ISO -> nama provinsi -> kota.
 *
 * Berkasnya sekitar 2 MB sehingga sengaja tidak dibundel ke frontend; dimuat
 * sekali ke memori saat pertama diminta agar tidak membaca ulang berkas pada
 * tiap permintaan.
 */
let citiesCache = null;

function getCities() {
  if (!citiesCache) {
    citiesCache = JSON.parse(readFileSync(join(__dirname, '../data/cities.json'), 'utf8'));
  }
  return citiesCache;
}

/**
 * GET /api/geo/cities?country=ID&state=Jawa%20Timur
 *
 * Tanpa parameter state, seluruh kota di negara itu dikembalikan. Dengan state,
 * hanya kota di provinsi tersebut, karena memilih "Jawa Timur" lalu disodori
 * daftar kota se-Indonesia membuat pilihan kota bisa tidak cocok dengan
 * provinsinya sendiri.
 *
 * Parameter country menerima kode ISO 3166-1 alpha-2. Nama negara juga masih
 * diterima demi menjaga kompatibilitas dengan versi frontend yang lebih lama.
 */
router.get('/cities', (req, res) => {
  const country = String(req.query.country || '').trim();
  const state = String(req.query.state || '').trim();
  if (!country) return res.status(400).json({ error: 'Parameter country wajib diisi' });

  try {
    const all = getCities();
    const byState = all[country.toUpperCase()];

    if (!byState) {
      res.set('Cache-Control', 'public, max-age=86400');
      return res.json({ country, state: state || null, count: 0, cities: [] });
    }

    let cities;
    if (state) {
      // Ejaan provinsi bisa berbeda tipis antar sumber, jadi dicocokkan tanpa
      // membedakan huruf besar-kecil sebelum menyerah ke daftar kosong.
      const key = Object.keys(byState).find(k => k.toLowerCase() === state.toLowerCase());
      cities = key ? byState[key] : [];
    } else {
      // Gabungan seluruh provinsi, dipakai ketika negara belum punya pembagian
      // provinsi pada sumber data atau pengguna belum memilih provinsi.
      cities = [...new Set(Object.values(byState).flat())].sort();
    }

    res.set('Cache-Control', 'public, max-age=86400');
    res.json({ country, state: state || null, count: cities.length, cities });
  } catch (e) {
    console.error('Geo cities error:', e.message);
    res.status(500).json({ error: 'Gagal memuat data kota' });
  }
});

export default router;
