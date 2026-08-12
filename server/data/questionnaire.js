/**
 * ============================================================
 * NEURONMOTION, Kuesioner Pra-Skrining (Gejala Subjektif)
 * ============================================================
 * Pertanyaan disusun mengacu pada tanda peringatan dini Parkinson yang
 * umum dipakai di literatur (mis. "10 Early Warning Signs" Parkinson's
 * Foundation) dan domain gejala non-motorik pada MDS-UPDRS Bagian I.
 *
 * PENTING: bobot di bawah adalah heuristik untuk MENYUSUN RINGKASAN GEJALA,
 * bukan skor diagnostik tervalidasi. Kuesioner ini melengkapi pengukuran
 * biomarker objektif dari kamera, bukan menggantikannya.
 * ============================================================
 */

export const QUESTIONNAIRE = [
  {
    id: 'restTremor',
    category: 'MOTORIK',
    question: 'Apakah tangan atau jari Anda bergetar saat sedang diam dan rileks?',
    help: 'Getaran yang muncul justru ketika anggota tubuh tidak sedang digunakan.',
    type: 'choice',
    weight: 3.0,
    options: [
      { value: 'never', label: 'Tidak pernah', score: 0 },
      { value: 'rare', label: 'Kadang, saat lelah atau cemas saja', score: 1 },
      { value: 'often', label: 'Sering, hampir setiap hari', score: 2 },
      { value: 'always', label: 'Hampir selalu, mengganggu aktivitas', score: 3 },
    ],
  },
  {
    id: 'slowness',
    category: 'MOTORIK',
    question: 'Apakah gerakan Anda terasa lebih lambat dari biasanya?',
    help: 'Misalnya butuh waktu lebih lama untuk berpakaian, mandi, atau bangkit dari kursi.',
    type: 'choice',
    weight: 3.0,
    options: [
      { value: 'never', label: 'Tidak', score: 0 },
      { value: 'mild', label: 'Sedikit, tapi tidak mengganggu', score: 1 },
      { value: 'moderate', label: 'Cukup terasa dan mulai mengganggu', score: 2 },
      { value: 'severe', label: 'Sangat lambat, butuh bantuan orang lain', score: 3 },
    ],
  },
  {
    id: 'handwriting',
    category: 'MOTORIK',
    question: 'Apakah tulisan tangan Anda menjadi lebih kecil atau rapat belakangan ini?',
    help: 'Dikenal sebagai mikrografia, salah satu tanda awal yang sering terlewat.',
    type: 'choice',
    weight: 2.5,
    options: [
      { value: 'no', label: 'Tidak berubah', score: 0 },
      { value: 'maybe', label: 'Mungkin sedikit berubah', score: 1 },
      { value: 'yes', label: 'Ya, jelas mengecil', score: 2 },
    ],
  },
  {
    id: 'balance',
    category: 'MOTORIK',
    question: 'Apakah Anda merasa mudah kehilangan keseimbangan atau hampir jatuh?',
    help: 'Terutama saat berbalik badan, berdiri dari duduk, atau berjalan di tempat gelap.',
    type: 'choice',
    weight: 3.0,
    options: [
      { value: 'never', label: 'Tidak pernah', score: 0 },
      { value: 'rare', label: 'Jarang, sesekali saja', score: 1 },
      { value: 'often', label: 'Sering merasa goyah', score: 2 },
      { value: 'fell', label: 'Pernah benar-benar jatuh dalam 6 bulan terakhir', score: 3 },
    ],
  },
  {
    id: 'armSwing',
    category: 'MOTORIK',
    question: 'Saat berjalan, apakah salah satu lengan Anda kurang berayun dibanding yang lain?',
    help: 'Berkurangnya ayunan pada satu sisi adalah tanda motorik awal yang cukup khas.',
    type: 'choice',
    weight: 2.5,
    options: [
      { value: 'no', label: 'Tidak, keduanya sama', score: 0 },
      { value: 'unsure', label: 'Tidak yakin / belum pernah memperhatikan', score: 0.5 },
      { value: 'yes', label: 'Ya, satu sisi jelas berkurang', score: 2 },
    ],
  },
  {
    id: 'smell',
    category: 'NON_MOTORIK',
    question: 'Apakah kemampuan Anda membau berkurang tanpa sebab jelas?',
    help: 'Di luar kondisi flu, pilek, atau alergi. Bisa muncul bertahun-tahun sebelum gejala motorik.',
    type: 'choice',
    weight: 2.0,
    options: [
      { value: 'no', label: 'Tidak, normal', score: 0 },
      { value: 'partial', label: 'Berkurang sebagian', score: 1.5 },
      { value: 'severe', label: 'Hampir tidak bisa membau', score: 2 },
    ],
  },
  {
    id: 'sleepActing',
    category: 'NON_MOTORIK',
    question: 'Apakah Anda bergerak aktif, berteriak, atau memukul saat tidur (seolah memerankan mimpi)?',
    help: 'Dikenal sebagai gangguan perilaku tidur REM, sering ditemukan pada tahap sangat awal.',
    type: 'choice',
    weight: 2.5,
    options: [
      { value: 'no', label: 'Tidak / tidak ada yang memberi tahu', score: 0 },
      { value: 'sometimes', label: 'Kadang-kadang', score: 1.5 },
      { value: 'often', label: 'Sering, sampai mengganggu pasangan/keluarga', score: 2.5 },
    ],
  },
  {
    id: 'constipation',
    category: 'NON_MOTORIK',
    question: 'Apakah Anda mengalami sembelit menahun?',
    help: 'Buang air besar kurang dari 3 kali seminggu secara terus-menerus.',
    type: 'choice',
    weight: 1.5,
    options: [
      { value: 'no', label: 'Tidak', score: 0 },
      { value: 'sometimes', label: 'Kadang-kadang', score: 1 },
      { value: 'chronic', label: 'Ya, menahun', score: 1.5 },
    ],
  },
  {
    id: 'voice',
    category: 'NON_MOTORIK',
    question: 'Apakah suara Anda menjadi lebih pelan, serak, atau datar?',
    help: 'Orang lain sering meminta Anda mengulang atau berbicara lebih keras.',
    type: 'choice',
    weight: 1.5,
    options: [
      { value: 'no', label: 'Tidak berubah', score: 0 },
      { value: 'mild', label: 'Sedikit berubah', score: 1 },
      { value: 'yes', label: 'Ya, jelas berubah', score: 1.5 },
    ],
  },
  {
    id: 'duration',
    category: 'RIWAYAT',
    question: 'Sudah berapa lama Anda merasakan keluhan tersebut?',
    help: 'Jika tidak ada keluhan sama sekali, pilih opsi pertama.',
    type: 'choice',
    weight: 2.0,
    options: [
      { value: 'none', label: 'Tidak ada keluhan', score: 0 },
      { value: 'lt1m', label: 'Kurang dari 1 bulan', score: 0.5 },
      { value: '1to6m', label: '1 sampai 6 bulan', score: 1.5 },
      { value: 'gt6m', label: 'Lebih dari 6 bulan', score: 2 },
    ],
  },
  {
    id: 'familyHistory',
    category: 'RIWAYAT',
    question: 'Adakah keluarga kandung Anda dengan Parkinson, tremor menahun, atau stroke?',
    type: 'choice',
    weight: 1.5,
    options: [
      { value: 'no', label: 'Tidak ada', score: 0 },
      { value: 'unsure', label: 'Tidak tahu', score: 0.5 },
      { value: 'yes', label: 'Ada', score: 1.5 },
    ],
  },
  {
    id: 'medicalHistory',
    category: 'RIWAYAT',
    question: 'Apakah Anda memiliki riwayat kondisi berikut?',
    type: 'multi',
    weight: 2.0,
    options: [
      { value: 'stroke', label: 'Pernah stroke', score: 2 },
      { value: 'headInjury', label: 'Cedera kepala berat', score: 1.5 },
      { value: 'diabetes', label: 'Diabetes', score: 0.5 },
      { value: 'hypertension', label: 'Hipertensi', score: 0.5 },
      { value: 'none', label: 'Tidak ada satu pun di atas', score: 0 },
    ],
  },
  {
    id: 'medication',
    category: 'RIWAYAT',
    question: 'Apakah Anda sedang mengonsumsi obat yang dapat memengaruhi gerakan?',
    help: 'Misalnya obat antipsikotik, antimual tertentu, atau obat penenang. Obat ini dapat menyebabkan gejala mirip Parkinson.',
    type: 'choice',
    weight: 1.0,
    options: [
      { value: 'no', label: 'Tidak', score: 0 },
      { value: 'unsure', label: 'Tidak yakin', score: 0.5 },
      { value: 'yes', label: 'Ya', score: 1 },
    ],
  },
  {
    id: 'freeText',
    category: 'TAMBAHAN',
    question: 'Ada keluhan lain yang ingin Anda sampaikan?',
    help: 'Opsional. Ceritakan dengan bahasa Anda sendiri, misalnya kapan keluhan muncul atau apa yang memperburuknya.',
    type: 'text',
    weight: 0,
  },
];

/** Skor maksimum teoretis dari seluruh pertanyaan berbobot. */
function getMaxScore() {
  return QUESTIONNAIRE.reduce((total, q) => {
    if (q.type === 'text' || !q.options) return total;
    if (q.type === 'multi') {
      // Skor maksimum realistis: kombinasi paling berat yang mungkin dipilih bersamaan
      const positives = q.options.filter(o => o.value !== 'none').map(o => o.score);
      return total + q.weight * positives.reduce((a, b) => a + b, 0);
    }
    const max = Math.max(...q.options.map(o => o.score));
    return total + q.weight * max;
  }, 0);
}

const MAX_SCORE = getMaxScore();

/**
 * Menghitung skor gejala subjektif (0-100) dari jawaban kuesioner.
 * Bukan skor diagnostik; dipakai sebagai salah satu masukan bagi ringkasan akhir.
 */
export function scoreQuestionnaire(answers = {}) {
  let raw = 0;
  const flagged = [];

  for (const q of QUESTIONNAIRE) {
    if (q.type === 'text' || !q.options) continue;
    const answer = answers[q.id];
    if (answer === undefined || answer === null) continue;

    if (q.type === 'multi') {
      const values = Array.isArray(answer) ? answer : [answer];
      for (const v of values) {
        const opt = q.options.find(o => o.value === v);
        if (opt && opt.score > 0) {
          raw += q.weight * opt.score;
          if (opt.score >= 1.5) flagged.push({ id: q.id, question: q.question, answer: opt.label });
        }
      }
    } else {
      const opt = q.options.find(o => o.value === answer);
      if (opt && opt.score > 0) {
        raw += q.weight * opt.score;
        const maxScore = Math.max(...q.options.map(o => o.score));
        if (opt.score >= maxScore * 0.66) {
          flagged.push({ id: q.id, question: q.question, answer: opt.label });
        }
      }
    }
  }

  const normalized = MAX_SCORE > 0 ? Math.min(100, (raw / MAX_SCORE) * 100) : 0;

  let category;
  if (normalized >= 55) category = 'HIGH';
  else if (normalized >= 25) category = 'MEDIUM';
  else category = 'LOW';

  return {
    score: parseFloat(normalized.toFixed(1)),
    category,
    flaggedSymptoms: flagged,
    freeText: typeof answers.freeText === 'string' ? answers.freeText.trim() : '',
    answeredCount: Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length,
  };
}

/** Versi ringan untuk dikirim ke frontend (tanpa bobot & skor internal). */
export function getPublicQuestionnaire() {
  return QUESTIONNAIRE.map(q => ({
    id: q.id,
    category: q.category,
    question: q.question,
    help: q.help,
    type: q.type,
    options: q.options?.map(o => ({ value: o.value, label: o.label })),
  }));
}
