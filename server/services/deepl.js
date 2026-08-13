/**
 * ============================================================
 * NEURONMOTION, Penerjemahan DeepL
 * ============================================================
 * Melayani penerjemahan seluruh isi halaman ketika pengguna memilih bahasa
 * Inggris. Frontend mengirimkan teks apa adanya dari halaman, sehingga tidak
 * ada bagian yang tertinggal dalam bahasa Indonesia.
 *
 * Kuota tetap menjadi perhatian: paket gratis DeepL dibatasi 500.000 karakter
 * per bulan. Karena itu hasil terjemahan disimpan dua lapis, di memori dan di
 * berkas, sehingga satu kalimat hanya pernah dikirim ke DeepL sekali seumur
 * hidup pemasangan ini. Kunjungan berikutnya, oleh pengguna mana pun, dilayani
 * dari cache tanpa memakai kuota sama sekali.
 * ============================================================
 */
import fs from 'node:fs';
import path from 'node:path';

const FREE_ENDPOINT = 'https://api-free.deepl.com/v2/translate';
const PRO_ENDPOINT = 'https://api.deepl.com/v2/translate';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_CHARS_PER_REQUEST = 4_000;   // batas aman per panggilan ke DeepL
const CACHE_FILE = path.join(process.cwd(), 'data', 'translation-cache.json');

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
 * Cache dua lapis. Teks antarmuka tidak pernah berubah, jadi menyimpannya ke
 * berkas membuat kuota hanya terpakai pada kunjungan pertama setelah teks baru
 * ditambahkan, bukan setiap kali server dijalankan ulang.
 */
const cache = new Map();
const MAX_CACHE_ENTRIES = 20_000;
let cacheDirty = false;
let flushTimer = null;

function cacheKey(text, target) {
  return `${target}::${text}`;
}

function loadCacheFromDisk() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    for (const [k, v] of Object.entries(raw)) cache.set(k, v);
    console.log(`Cache terjemahan dimuat: ${cache.size} entri`);
  } catch (e) {
    console.warn('Cache terjemahan tidak dapat dibaca:', e.message);
  }
}
loadCacheFromDisk();

/**
 * Penulisan ke berkas ditunda beberapa detik agar satu halaman yang memicu
 * puluhan entri baru hanya menghasilkan satu operasi tulis.
 */
function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    if (!cacheDirty) return;
    cacheDirty = false;
    try {
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(cache)), 'utf8');
    } catch (e) {
      console.warn('Cache terjemahan gagal disimpan:', e.message);
    }
  }, 5_000);
  flushTimer.unref?.();
}

function rememberTranslation(key, value) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    // Buang entri terlama agar penggunaan memori tetap terbatas
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, value);
  cacheDirty = true;
  scheduleFlush();
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

  // Permintaan dipecah menjadi beberapa panggilan agar halaman panjang tetap
  // dapat diterjemahkan sekaligus, bukan ditolak karena melewati batas.
  const batches = [];
  let current = [];
  let currentChars = 0;
  for (let i = 0; i < pending.length; i++) {
    const len = pending[i]?.length || 0;
    if (current.length > 0 && currentChars + len > MAX_CHARS_PER_REQUEST) {
      batches.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(i);
    currentChars += len;
  }
  if (current.length > 0) batches.push(current);

  try {
    for (const batch of batches) {
      const body = new URLSearchParams();
      body.append('target_lang', target);
      // Bahasa sumber ditetapkan, tidak dibiarkan dideteksi otomatis. Potongan
      // teks antarmuka sering pendek dan memuat nama produk berbahasa Inggris,
      // sehingga DeepL kerap salah menyimpulkan bahwa teksnya sudah Inggris dan
      // mengembalikannya tanpa perubahan, misalnya judul tab "NeuronMotion -
      // Skrining Gangguan Saraf".
      body.append('source_lang', target === 'ID' ? 'EN' : 'ID');
      // Spasi dan tanda baca di awal atau akhir potongan ikut menyusun tata
      // letak, jadi tidak boleh dirapikan sendiri oleh DeepL.
      body.append('preserve_formatting', '1');
      for (const i of batch) body.append('text', pending[i]);

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
        return { ok: false, error: `DeepL menolak permintaan (HTTP ${res.status})`, translations: result.map((t, i) => (t === null ? list[i] : t)) };
      }

      const data = await res.json();
      const translated = (data.translations || []).map(t => t.text);

      translated.forEach((text, n) => {
        const pendingPos = batch[n];
        result[pendingIndex[pendingPos]] = text;
        rememberTranslation(cacheKey(pending[pendingPos], target), text);
      });
    }

    // Jaga-jaga bila DeepL mengembalikan lebih sedikit dari yang diminta
    return { ok: true, translations: result.map((t, i) => (t === null ? list[i] : t)) };
  } catch (e) {
    console.error('DeepL error:', e.message);
    return { ok: false, error: 'Layanan penerjemahan sementara tidak tersedia', translations: result.map((t, i) => (t === null ? list[i] : t)) };
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
