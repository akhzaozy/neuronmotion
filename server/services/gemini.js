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

export function getModelCascade() {
  const customModels = cleanEnv(process.env.GEMINI_MODELS);
  if (customModels) {
    const list = customModels.split(',').map(m => cleanEnv(m)).filter(Boolean);
    if (list.length > 0) return [...new Set(list)];
  }

  const primary = cleanEnv(process.env.GEMINI_MODEL);
  const fallback = cleanEnv(process.env.GEMINI_MODEL_FALLBACK);

  const list = [
    primary || 'gemini-3.7-flash',
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-3.5-flash-lite',
    fallback || 'gemini-flash-latest',
  ];

  return [...new Set(list.filter(Boolean))];
}

export function getModels() {
  const cascade = getModelCascade();
  return {
    primary: cascade[0],
    fallback: cascade[1] || cascade[0],
    cascade,
  };
}

export function isGeminiConfigured() {
  return Boolean(getApiKey());
}

/** Ringkasan konfigurasi untuk pemeriksaan deployment (tanpa membocorkan key). */
export function getGeminiConfigInfo() {
  const key = getApiKey();
  const { primary, fallback, cascade } = getModels();
  return {
    configured: Boolean(key),
    keyLength: key.length,
    primaryModel: primary,
    fallbackModel: fallback,
    modelCascade: cascade,
  };
}

/**
 * Menguji apakah model yang dikonfigurasi benar-benar dapat dipakai oleh key ini.
 * Dipakai endpoint diagnostik agar kegagalan dapat ditelusuri tanpa membaca log server.
 */
export async function verifyGeminiSetup() {
  const key = getApiKey();
  if (!key) return { ok: false, reason: 'GEMINI_API_KEY belum diisi di server' };

  const { cascade } = getModels();

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

    const workingModels = cascade.filter(m => available.includes(m));

    return {
      ok: workingModels.length > 0,
      configuredCascade: cascade,
      availableInAccount: workingModels,
      reason: workingModels.length > 0 ? undefined : 'Tidak ada model dalam cascade yang tersedia untuk API key ini',
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
Tugas Anda adalah membantu pengguna memahami hasil skrining gangguan motorik saraf, tremor, dan Parkinson dengan ramah, jelas, dan cepat.

ATURAN PENTING:
1. Anda BUKAN dokter dan TIDAK BOLEH memberikan diagnosis medis formal. Ingatkan selalu untuk berkonsultasi dengan dokter spesialis saraf jika ada keluhan berlanjut.
2. Berikan jawaban yang ramah, ringkas, padat, dan langsung menjawab inti pertanyaan (maksimal 2-3 paragraf singkat atau poin-poin jelas).
3. Gunakan bahasa yang mudah dipahami orang awam tanpa istilah rumit yang membingungkan.
4. Fokus pada edukasi kesehatan motorik, penjelasan skor skrining, dan tips gaya hidup sehat.
5. DILARANG menggunakan tanda garis panjang em-dash atau en-dash. Gunakan tanda hubung biasa (-) atau titik dua (:).`;

// Batasi riwayat yang dikirim agar permintaan tetap cepat dan efisien
const MAX_CHAT_HISTORY = 12;

/**
 * Ditambahkan ke instruksi sistem ketika antarmuka sedang berbahasa Inggris,
 * supaya jawaban asisten mengikuti bahasa yang dipilih pengguna.
 */
const CHAT_LANGUAGE_INSTRUCTION = {
  id: '\n6. Selalu jawab dalam Bahasa Indonesia yang baik dan hangat.',
  en: '\n6. Always answer in clear, concise English.',
};

function sanitizeDashes(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/[\u2014\u2015]/g, ' - ') // em-dash
    .replace(/[\u2013\u2012]/g, ' - ') // en-dash
    .replace(/\s{2,}/g, ' ');
}

function sanitizeObjectDashes(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeDashes(obj) : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObjectDashes);
  }
  const result = {};
  for (const [key, val] of Object.entries(obj)) {
    result[key] = sanitizeObjectDashes(val);
  }
  return result;
}

function buildChatSystemPrompt(lang = 'id', patientContext = null) {
  let instruction = CHAT_SYSTEM_INSTRUCTION + (CHAT_LANGUAGE_INSTRUCTION[lang] || CHAT_LANGUAGE_INSTRUCTION.id);

  if (patientContext?.isLoggedIn) {
    if (patientContext.hasSessions) {
      instruction += `\n\nDATA HASIL SKRINING PENGGUNA TERAKHIR (AKTIF DI AKUN SAAT INI):
- Nama Pengguna: ${patientContext.name}
- Usia / Gender: ${patientContext.age ? patientContext.age + ' tahun' : 'Tidak disebutkan'} / ${patientContext.gender}
- Skor Risiko Komposit Terakhir: ${patientContext.compositeScore} dari 100 (${patientContext.riskCategory})
- Tanggal Pemeriksaan Terakhir: ${patientContext.dateFormatted}
- Pola Estimasi AI: ${patientContext.conditionPattern}${patientContext.conditionConfidence ? ` (Keyakinan: ${patientContext.conditionConfidence})` : ''}
- Hasil Pengukuran Tiap Biomarker:
${patientContext.biomarkersList}
- Ringkasan Klinis: ${patientContext.aiSummary || 'Pemeriksaan selesai dianalisis.'}
- Catatan Dokter (jika ada): ${patientContext.doctorNote || 'Belum ada catatan dari dokter.'}

PETUNJUK PENTING:
1. Anda SUDAH MEMILIKI data skrining pengguna di atas.
2. JANGAN PERNAH bertanya balik "berapa skor Anda?" atau "apa kategori risiko Anda?". Jika pengguna menanyakan tentang skor risiko, hasil skrining, atau kondisi motorik mereka, LANGSUNG BACA DAN JELASKAN data di atas (${patientContext.compositeScore}/100, kategori ${patientContext.riskCategory}, serta biomarker terkait).
3. Panggil nama pengguna (${patientContext.name}) dengan ramah dan sopan.
4. Jelaskan apa arti skor ${patientContext.compositeScore}/100 tersebut dengan nada empatik, edukatif, dan menenangkan, serta berikan rekomendasi langkah selanjutnya.
5. Tegaskan bahwa hasil skrining kamera ini adalah deteksi awal penunjang dan anjurkan konsultasi ke dokter spesialis saraf bila memerlukan evaluasi medis definitif.
6. Sampaikan penjelasan Anda secara lengkap, tuntas, dan terstruktur rapi tanpa terpotong di tengah kalimat.
7. JANGAN gunakan tanda garis panjang em-dash atau en-dash, hanya gunakan tanda hubung biasa (-).`;
    } else {
      instruction += `\n\nDATA PENGGUNA:
- Pengguna (${patientContext.name}) sudah masuk ke akun, namun BELUM pernah melakukan skrining di sistem.
- Jika pengguna menanyakan skor atau hasil skrining mereka, beritahukan dengan ramah bahwa akun mereka belum memiliki riwayat pemeriksaan, dan sarankan untuk mencoba tombol "Mulai Skrining".`;
    }
  } else {
    instruction += `\n\nDATA PENGGUNA:
- Pengguna belum masuk ke akun (tamu).
- Jika pengguna menanyakan hasil atau skor risiko pribadi mereka, jelaskan bahwa mereka perlu masuk ke akun terlebih dahulu atau melakukan skrining di aplikasi agar NeuroBot dapat membaca riwayat pemeriksaan mereka secara otomatis.`;
  }

  return instruction;
}

async function callGeminiChat(model, messages, apiKey, lang = 'id', patientContext = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  const systemPrompt = buildChatSystemPrompt(lang, patientContext);

  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: messages,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    const validParts = parts
      .filter(p => p && typeof p.text === 'string' && !p.thought)
      .map(p => p.text);

    const text = validParts.length > 0
      ? validParts.join('\n').trim()
      : parts.map(p => p.text || '').join('\n').trim();

    if (!text) throw new Error('Respons Gemini kosong');
    return sanitizeDashes(text);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Menjawab percakapan NeuroBot. Mengembalikan { reply } bila berhasil,
 * atau { error, status } agar route dapat membalas dengan kode yang sesuai.
 */
export async function chatWithAssistant(messages, lang = 'id', patientContext = null) {
  const apiKey = getApiKey();
  const models = getModelCascade();
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

  const errors = [];
  for (const model of models) {
    try {
      const reply = await callGeminiChat(model, sanitized, apiKey, lang, patientContext);
      return { reply, modelUsed: model };
    } catch (err) {
      console.warn(`Chat Gemini (${model}) gagal:`, err.message);
      errors.push(`${model}: ${err.message}`);
    }
  }

  console.error('Semua model Gemini dalam cascade gagal:', errors.join(' | '));
  return {
    error: 'Layanan AI sementara tidak tersedia. Silakan coba lagi nanti.',
    status: 503,
    lastError: errors.join(' | '),
  };
}

export async function generateCombinedAnalysis(input) {
  const apiKey = getApiKey();
  const models = getModelCascade();
  if (!apiKey) {
    return { available: false, error: 'GEMINI_API_KEY belum dikonfigurasi di server' };
  }

  const prompt = buildPrompt(input);
  const errors = [];

  for (const model of models) {
    try {
      const sanitized = sanitizeObjectDashes(parsed);
      return { available: true, model: modelUsed, ...sanitized };
    } catch (err) {
      console.warn(`Analisis Gemini (${model}) gagal:`, err.message);
      errors.push(`${model}: ${err.message}`);
    }
  }

  console.error('Semua model Gemini untuk analisis gagal:', errors.join(' | '));
  return {
    available: false,
    error: 'Analisis AI sementara tidak tersedia. Hasil skrining tetap tersimpan dan valid.',
  };
}
