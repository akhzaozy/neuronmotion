/**
 * ============================================================
 * NEURONMOTION, Penerjemahan DeepL
 * ============================================================
 * Dipakai HANYA untuk teks yang isinya berubah-ubah, seperti ringkasan AI,
 * catatan dokter, dan rekomendasi. Teks antarmuka yang tetap diterjemahkan
 * lewat kamus lokal di frontend, tanpa memanggil API sama sekali.
 *
 * Alasannya kuota: paket gratis DeepL dibatasi 500.000 karakter per bulan.
 * Bila seluruh label antarmuka ikut diterjemahkan setiap halaman dibuka,
 * kuota itu habis hanya oleh teks yang sebenarnya tidak pernah berubah.
 * ============================================================
 */

const FREE_ENDPOINT = 'https://api-free.deepl.com/v2/translate';
const PRO_ENDPOINT = 'https://api.deepl.com/v2/translate';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_CHARS_PER_REQUEST = 5_000;

function getApiKey() {
  const raw = process.env.DEEPL_API_KEY;
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/^["']|["']$/g, '').trim();
}

export function isDeeplConfigured() {
  return Boolean(getApiKey());
}

/** Kunci berakhiran :fx adalah paket gratis, yang memakai host berbeda. */
function getEndpoint(key) {
  return key.endsWith(':fx') ? FREE_ENDPOINT : PRO_ENDPOINT;
}

/**
 * Cache dalam memori. Ringkasan AI untuk satu sesi tidak pernah berubah,
 * sehingga menerjemahkan ulang tiap kali halaman dibuka hanya membuang kuota.
 */
const cache = new Map();
const MAX_CACHE_ENTRIES = 500;

function cacheKey(text, target) {
  return `${target}::${text}`;
}

function rememberTranslation(key, value) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Buang entri terlama agar penggunaan memori tetap terbatas
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, value);
}

/**
 * Menerjemahkan sekumpulan teks. Selalu mengembalikan array dengan panjang sama
 * dengan masukan; bila penerjemahan gagal, teks asli dikembalikan apa adanya
 * sehingga antarmuka tetap menampilkan sesuatu yang bermakna.
 */
export async function translateTexts(texts, targetLang = 'EN') {
  const key = getApiKey();
  const list = Array.isArray(texts) ? texts : [texts];

  if (!key) {
    return { ok: false, error: 'DEEPL_API_KEY belum dikonfigurasi di server', translations: list };
  }

  const target = String(targetLang).toUpperCase() === 'ID' ? 'ID' : 'EN-US';

  // Sisihkan yang sudah ada di cache agar tidak dikirim ulang
  const pending = [];
  const pendingIndex = [];
  const result = list.map((t, i) => {
    const hit = cache.get(cacheKey(t, target));
    if (hit !== undefined) return hit;
    pending.push(t);
    pendingIndex.push(i);
    return null;
  });

  if (pending.length === 0) {
    return { ok: true, translations: result, cached: true };
  }

  const totalChars = pending.reduce((sum, t) => sum + (t?.length || 0), 0);
  if (totalChars > MAX_CHARS_PER_REQUEST) {
    return { ok: false, error: 'Teks terlalu panjang untuk diterjemahkan sekaligus', translations: list };
  }

  try {
    const body = new URLSearchParams();
    body.append('target_lang', target);
    for (const t of pending) body.append('text', t);

    const res = await fetch(getEndpoint(key), {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.warn(`DeepL HTTP ${res.status}:`, detail.slice(0, 200));
      return { ok: false, error: `DeepL menolak permintaan (HTTP ${res.status})`, translations: list };
    }

    const data = await res.json();
    const translated = (data.translations || []).map(t => t.text);

    translated.forEach((text, i) => {
      const originalIndex = pendingIndex[i];
      result[originalIndex] = text;
      rememberTranslation(cacheKey(pending[i], target), text);
    });

    // Jaga-jaga bila DeepL mengembalikan lebih sedikit dari yang diminta
    return { ok: true, translations: result.map((t, i) => (t === null ? list[i] : t)) };
  } catch (e) {
    console.error('DeepL error:', e.message);
    return { ok: false, error: 'Layanan penerjemahan sementara tidak tersedia', translations: list };
  }
}

/** Sisa kuota, berguna untuk memantau pemakaian paket gratis. */
export async function getDeeplUsage() {
  const key = getApiKey();
  if (!key) return { configured: false };
  try {
    const host = key.endsWith(':fx') ? 'https://api-free.deepl.com' : 'https://api.deepl.com';
    const res = await fetch(`${host}/v2/usage`, {
      headers: { 'Authorization': `DeepL-Auth-Key ${key}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return { configured: true, error: `HTTP ${res.status}` };
    const d = await res.json();
    return {
      configured: true,
      used: d.character_count,
      limit: d.character_limit,
      percentUsed: d.character_limit ? +(d.character_count / d.character_limit * 100).toFixed(2) : null,
    };
  } catch (e) {
    return { configured: true, error: e.message };
  }
}
