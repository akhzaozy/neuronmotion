/**
 * ============================================================
 * NEURONMOTION, Integrasi Gemini
 * ============================================================
 * Menggabungkan dua sumber data yang saling melengkapi:
 *   1. Gejala subjektif dari kuesioner pra-skrining
 *   2. Biomarker objektif hasil pengukuran kamera
 * lalu meminta Gemini menyusun ringkasan yang mudah dipahami awam.
 *
 * Prinsip penting: Gemini TIDAK menentukan skor risiko. Skor tetap
 * dihitung oleh mesin rule-based + K-NN yang deterministik dan bisa
 * diaudit. Gemini hanya menyusun narasi, menautkan gejala dengan
 * temuan pengukuran, dan merumuskan saran tindak lanjut.
 * ============================================================
 */

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Membersihkan nilai dari berkas .env: spasi di ujung, karakter carriage return
 * bawaan Windows, serta tanda kutip yang ikut tersalin. Tanpa ini, key yang
 * terlihat benar di berkas bisa ditolak Google karena membawa karakter tak terlihat.
 */
function cleanEnv(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

function getApiKey() {
  return cleanEnv(process.env.GEMINI_API_KEY);
}

// Nama model dibaca saat dibutuhkan, bukan sekali saat modul dimuat, agar
// perubahan .env cukup dengan restart proses tanpa mengubah kode.
function getModels() {
  const primary = cleanEnv(process.env.GEMINI_MODEL) || 'gemini-3.5-flash';
  const fallback = cleanEnv(process.env.GEMINI_MODEL_FALLBACK) || 'gemini-3-flash-preview';
  return { primary, fallback };
}

export function isGeminiConfigured() {
  return Boolean(getApiKey());
}

/** Ringkasan konfigurasi untuk pemeriksaan deployment (tanpa membocorkan key). */
export function getGeminiConfigInfo() {
  const key = getApiKey();
  const { primary, fallback } = getModels();
  return {
    configured: Boolean(key),
    keyLength: key.length,
    primaryModel: primary,
    fallbackModel: fallback,
  };
}

/**
 * Menguji apakah model yang dikonfigurasi benar-benar dapat dipakai oleh key ini.
 * Dipakai endpoint diagnostik agar kegagalan dapat ditelusuri tanpa membaca log server.
 */
export async function verifyGeminiSetup() {
  const key = getApiKey();
  if (!key) return { ok: false, reason: 'GEMINI_API_KEY belum diisi di server' };

  const { primary, fallback } = getModels();

  try {
    const res = await fetch(`${API_BASE}?key=${key}`, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, reason: `Google menolak API key (HTTP ${res.status})`, detail: body.slice(0, 200) };
    }
    const data = await res.json();
    const available = (data.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace('models/', ''));

    return {
      ok: available.includes(primary) || available.includes(fallback),
      primaryModel: primary,
      primaryAvailable: available.includes(primary),
      fallbackModel: fallback,
      fallbackAvailable: available.includes(fallback),
      reason: available.includes(primary) || available.includes(fallback)
        ? undefined
        : 'Model yang dikonfigurasi tidak tersedia untuk API key ini',
      suggestedModels: available.filter(m => m.includes('flash')).slice(0, 6),
    };
  } catch (e) {
    return { ok: false, reason: 'Server tidak dapat menghubungi Google', detail: e.message };
  }
}

/** Skema JSON agar keluaran Gemini selalu terstruktur dan aman di-parse. */
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    ringkasan: {
      type: 'string',
      description: 'Ringkasan 2-3 kalimat bahasa Indonesia awam tentang kondisi pengguna',
    },
    korelasiGejala: {
      type: 'array',
      description: 'Kaitan antara keluhan yang dilaporkan dan hasil pengukuran kamera',
      items: {
        type: 'object',
        properties: {
          gejala: { type: 'string' },
          temuanPengukuran: { type: 'string' },
          konsisten: { type: 'boolean' },
        },
        required: ['gejala', 'temuanPengukuran', 'konsisten'],
      },
    },
    tingkatKeyakinan: {
      type: 'string',
      enum: ['RENDAH', 'SEDANG', 'TINGGI'],
      description: 'Seberapa konsisten data kuesioner dan biomarker saling mendukung',
    },
    alasanKeyakinan: { type: 'string' },
    saranTindakLanjut: {
      type: 'array',
      items: { type: 'string' },
      description: 'Langkah konkret yang bisa dilakukan pengguna, 2-4 poin',
    },
    perluPerhatianSegera: {
      type: 'boolean',
      description: 'True hanya bila ada tanda yang butuh evaluasi medis cepat',
    },
  },
  required: ['ringkasan', 'korelasiGejala', 'tingkatKeyakinan', 'alasanKeyakinan', 'saranTindakLanjut', 'perluPerhatianSegera'],
};

function buildPrompt({ questionnaire, biomarkers, composite, age, gender }) {
  const genderLabel = gender === 'M' ? 'laki-laki' : gender === 'F' ? 'perempuan' : 'tidak disebutkan';

  const biomarkerLines = Object.entries(biomarkers || {})
    .filter(([, v]) => v && !v.error)
    .map(([key, v]) => {
      const parts = [`kategori: ${v.category}`, `skor: ${v.score}`];
      if (v.dominantFrequencyHz !== undefined) parts.push(`frekuensi: ${v.dominantFrequencyHz} Hz`);
      if (v.amplitudeMillimeter !== undefined) parts.push(`amplitudo: ${v.amplitudeMillimeter} mm`);
      if (v.tapRatePerSecond !== undefined) parts.push(`kecepatan ketuk: ${v.tapRatePerSecond}/detik`);
      if (v.decrementPercent !== undefined) parts.push(`penurunan amplitudo: ${v.decrementPercent}%`);
      if (v.symmetryPercent !== undefined) parts.push(`simetri: ${v.symmetryPercent}%`);
      if (v.cadencePerMin !== undefined) parts.push(`kadense: ${v.cadencePerMin}/menit`);
      if (v.asymmetryPercent !== undefined) parts.push(`asimetri: ${v.asymmetryPercent}%`);
      if (v.swayAreaCm2 !== undefined) parts.push(`sway area: ${v.swayAreaCm2} cm2`);
      if (v.romDeg !== undefined) parts.push(`ROM: ${v.romDeg} derajat`);
      return `- ${key}: ${parts.join(', ')}`;
    })
    .join('\n') || '- (tidak ada pengukuran biomarker yang berhasil)';

  const flaggedLines = (questionnaire?.flaggedSymptoms || [])
    .map(f => `- ${f.question} => "${f.answer}"`)
    .join('\n') || '- (tidak ada gejala menonjol yang dilaporkan)';

  return `Anda adalah asisten yang membantu MENJELASKAN hasil skrining gerakan kepada orang awam di Indonesia.

ATURAN WAJIB:
1. Anda BUKAN dokter dan TIDAK BOLEH memberi diagnosis. Jangan pernah menyatakan pengguna "menderita" atau "positif" suatu penyakit.
2. JANGAN mengubah atau mempertanyakan skor risiko yang sudah dihitung sistem. Skor itu final dan berasal dari mesin analisis terpisah.
3. Gunakan bahasa Indonesia yang hangat, sederhana, dan tidak menakut-nakuti. Hindari istilah medis rumit; jika terpaksa dipakai, jelaskan singkat.
4. Tugas Anda: menghubungkan keluhan yang dilaporkan pengguna dengan angka hasil pengukuran kamera, lalu menyusun saran tindak lanjut yang masuk akal.
5. Jika data kuesioner dan hasil pengukuran saling bertentangan, katakan terus terang bahwa keduanya belum sejalan dan sebutkan kemungkinan penyebabnya (misalnya kondisi saat tes, pencahayaan, atau gejala yang hilang timbul).
6. Set "perluPerhatianSegera" menjadi true HANYA bila ada kombinasi tanda yang benar-benar memerlukan evaluasi medis cepat, misalnya riwayat stroke disertai gangguan keseimbangan berat atau pernah jatuh.

DATA PENGGUNA
Usia: ${age ?? 'tidak diketahui'}
Jenis kelamin: ${genderLabel}

HASIL KUESIONER GEJALA SUBJEKTIF
Skor gejala: ${questionnaire?.score ?? 0} dari 100 (kategori: ${questionnaire?.category ?? 'LOW'})
Gejala yang menonjol:
${flaggedLines}
Keluhan tambahan dari pengguna: ${questionnaire?.freeText ? `"${questionnaire.freeText}"` : '(tidak ada)'}

HASIL PENGUKURAN BIOMARKER OBJEKTIF (dari kamera)
${biomarkerLines}

SKOR RISIKO FINAL DARI SISTEM (jangan diubah)
Skor komposit: ${composite?.compositeScore ?? 0} dari 100
Kategori risiko: ${composite?.riskCategory ?? 'LOW'}
Pola terdekat menurut model: ${composite?.mlClassification?.predictedLabel ?? 'tidak tersedia'}

Susun analisis gabungan dalam format JSON sesuai skema yang diminta.`;
}

async function callGemini(model, prompt, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.3,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respons Gemini kosong');

    return { parsed: JSON.parse(text), modelUsed: model };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Menghasilkan analisis gabungan. Selalu mengembalikan objek (tidak pernah throw)
 * agar kegagalan Gemini tidak sampai menggagalkan penyimpanan sesi skrining.
 */
// ── Asisten Percakapan (NeuroBot) ────────────────────────────────────────────

const CHAT_SYSTEM_INSTRUCTION = `Anda adalah asisten kesehatan virtual NeuronMotion bernama "NeuroBot".
Anda membantu pengguna memahami hasil skrining gangguan motorik saraf (seperti Parkinson dan tremor).

ATURAN PENTING:
1. Anda BUKAN dokter dan TIDAK BOLEH memberikan diagnosis medis. Selalu ingatkan pengguna untuk berkonsultasi dengan dokter ahli saraf.
2. Gunakan bahasa Indonesia yang hangat, ramah, dan mudah dipahami awam.
3. Jelaskan istilah medis dengan bahasa sederhana jika diperlukan.
4. Fokus pada: membantu memahami skor skrining, memberikan edukasi umum tentang kesehatan motorik, dan mendorong gaya hidup sehat.
5. Jika ditanya tentang darurat medis, segera sarankan untuk menghubungi layanan darurat atau pergi ke IGD.
6. Jawab dengan singkat, padat, dan informatif. Maksimal 3-4 paragraf per jawaban.
7. Anda beroperasi dalam platform NeuronMotion, sebuah sistem skrining gangguan saraf motorik berbasis kamera dan AI.`;

// Batasi riwayat yang dikirim agar permintaan tidak membengkak pada percakapan panjang
const MAX_CHAT_HISTORY = 20;

async function callGeminiChat(model, messages, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: CHAT_SYSTEM_INSTRUCTION }] },
        contents: messages,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respons Gemini kosong');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Menjawab percakapan NeuroBot. Mengembalikan { reply } bila berhasil,
 * atau { error, status } agar route dapat membalas dengan kode yang sesuai.
 */
export async function chatWithAssistant(messages) {
  const apiKey = getApiKey();
  const { primary, fallback } = getModels();
  if (!apiKey) {
    return { error: 'Layanan chat AI belum dikonfigurasi di server.', status: 503 };
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'Pesan tidak boleh kosong.', status: 400 };
  }

  // Bersihkan payload: hanya role & teks yang diteruskan ke Gemini
  const sanitized = messages
    .filter(m => m && (m.role === 'user' || m.role === 'model') && Array.isArray(m.parts))
    .slice(-MAX_CHAT_HISTORY)
    .map(m => ({
      role: m.role,
      parts: m.parts
        .filter(p => typeof p?.text === 'string')
        .map(p => ({ text: p.text.slice(0, 4000) })),
    }))
    .filter(m => m.parts.length > 0);

  if (sanitized.length === 0) {
    return { error: 'Pesan tidak valid.', status: 400 };
  }

  try {
    return { reply: await callGeminiChat(primary, sanitized, apiKey) };
  } catch (primaryError) {
    console.warn(`Chat Gemini primary (${primary}) gagal:`, primaryError.message);
    try {
      return { reply: await callGeminiChat(fallback, sanitized, apiKey) };
    } catch (fallbackError) {
      console.error(`Chat Gemini fallback (${fallback}) juga gagal:`, fallbackError.message);
      return {
        error: 'Layanan AI sementara tidak tersedia. Silakan coba lagi nanti.',
        status: 503,
        // Hanya dipakai endpoint diagnostik, tidak diteruskan ke pengguna akhir
        lastError: `${primary}: ${primaryError.message} | ${fallback}: ${fallbackError.message}`,
      };
    }
  }
}

export async function generateCombinedAnalysis(input) {
  const apiKey = getApiKey();
  const { primary, fallback } = getModels();
  if (!apiKey) {
    return { available: false, error: 'GEMINI_API_KEY belum dikonfigurasi di server' };
  }

  const prompt = buildPrompt(input);

  try {
    const { parsed, modelUsed } = await callGemini(primary, prompt, apiKey);
    return { available: true, model: modelUsed, ...parsed };
  } catch (primaryError) {
    console.warn(`Gemini primary (${primary}) gagal:`, primaryError.message);
    try {
      const { parsed, modelUsed } = await callGemini(fallback, prompt, apiKey);
      return { available: true, model: modelUsed, usedFallback: true, ...parsed };
    } catch (fallbackError) {
      console.error(`Gemini fallback (${fallback}) juga gagal:`, fallbackError.message);
      return {
        available: false,
        error: 'Analisis AI sementara tidak tersedia. Hasil skrining tetap tersimpan dan valid.',
      };
    }
  }
}
