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
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_MODEL_FALLBACK || 'gemini-3-flash-preview';
const REQUEST_TIMEOUT_MS = 30_000;

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
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
export async function generateCombinedAnalysis(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { available: false, error: 'GEMINI_API_KEY belum dikonfigurasi di server' };
  }

  const prompt = buildPrompt(input);

  try {
    const { parsed, modelUsed } = await callGemini(PRIMARY_MODEL, prompt, apiKey);
    return { available: true, model: modelUsed, ...parsed };
  } catch (primaryError) {
    console.warn(`Gemini primary (${PRIMARY_MODEL}) gagal:`, primaryError.message);
    try {
      const { parsed, modelUsed } = await callGemini(FALLBACK_MODEL, prompt, apiKey);
      return { available: true, model: modelUsed, usedFallback: true, ...parsed };
    } catch (fallbackError) {
      console.error(`Gemini fallback (${FALLBACK_MODEL}) juga gagal:`, fallbackError.message);
      return {
        available: false,
        error: 'Analisis AI sementara tidak tersedia. Hasil skrining tetap tersimpan dan valid.',
      };
    }
  }
}
