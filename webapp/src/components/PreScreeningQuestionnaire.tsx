'use client';
import { useEffect, useState } from 'react';
import { api, QuestionnaireQuestion } from '@/lib/api';
import styles from './PreScreeningQuestionnaire.module.css';

const CATEGORY_LABEL: Record<string, string> = {
  MOTORIK: 'Gejala Gerakan',
  NON_MOTORIK: 'Gejala Non-Gerakan',
  RIWAYAT: 'Riwayat Kesehatan',
  TAMBAHAN: 'Keterangan Tambahan',
};

export type QuestionnaireAnswers = Record<string, string | string[]>;

interface Props {
  onComplete: (answers: QuestionnaireAnswers) => void;
  onSkip: () => void;
}

export default function PreScreeningQuestionnaire({ onComplete, onSkip }: Props) {
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});

  useEffect(() => {
    api.getQuestionnaire()
      .then(res => {
        setQuestions(res.questions);
        setAiEnabled(res.aiEnabled);
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.wrap}><div className={styles.card}><p>Memuat kuesioner...</p></div></div>;
  }

  if (questions.length === 0) {
    // Kuesioner gagal dimuat: jangan menghalangi pengguna melakukan skrining.
    return (
      <div className={styles.wrap}>
        <div className={styles.introCard}>
          <h2 className={styles.introTitle}>Kuesioner tidak dapat dimuat</h2>
          <p className={styles.introText}>
            Anda tetap dapat melanjutkan ke tes gerakan. Hasil skrining akan dihitung dari
            pengukuran kamera saja.
          </p>
          <button className="btn btn-primary btn-lg" onClick={onSkip}>Lanjut ke Tes Gerakan</button>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className={styles.wrap}>
        <div className={styles.introCard}>
          {aiEnabled && (
            <div className={styles.aiBadge}>
              <span>✨</span> Dianalisis bersama AI
            </div>
          )}
          <h2 className={styles.introTitle}>Sebelum Tes Gerakan, Ceritakan Kondisi Anda</h2>
          <p className={styles.introText}>
            Kamera dapat mengukur bagaimana tubuh Anda bergerak, tetapi tidak dapat mengetahui apa
            yang Anda rasakan sehari-hari. Beberapa tanda awal justru berupa keluhan yang hanya Anda
            sendiri yang tahu, misalnya berkurangnya kemampuan membau atau perubahan tulisan tangan.
          </p>
          <ul className={styles.introList}>
            <li>Ada {questions.length} pertanyaan singkat, sekitar 2 menit.</li>
            <li>Jawab sejujurnya. Tidak ada jawaban benar atau salah.</li>
            <li>Jawaban Anda akan digabungkan dengan hasil pengukuran kamera untuk memberi gambaran yang lebih utuh.</li>
            <li>Anda dapat melewati kuesioner ini, tetapi hasil skrining akan kurang lengkap.</li>
          </ul>
          <div className={styles.navRow}>
            <button className="btn btn-outline" onClick={onSkip}>Lewati Kuesioner</button>
            <button className="btn btn-primary btn-lg" onClick={() => setStarted(true)}>Mulai Kuesioner</button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const currentAnswer = answers[q.id];
  const isAnswered = q.type === 'text'
    ? true
    : Array.isArray(currentAnswer) ? currentAnswer.length > 0 : currentAnswer !== undefined;

  const selectChoice = (value: string) => {
    setAnswers(prev => ({ ...prev, [q.id]: value }));
  };

  const toggleMulti = (value: string) => {
    setAnswers(prev => {
      const existing = Array.isArray(prev[q.id]) ? (prev[q.id] as string[]) : [];
      // "Tidak ada satu pun" bersifat eksklusif terhadap pilihan lain
      if (value === 'none') {
        return { ...prev, [q.id]: existing.includes('none') ? [] : ['none'] };
      }
      const withoutNone = existing.filter(v => v !== 'none');
      const next = withoutNone.includes(value)
        ? withoutNone.filter(v => v !== value)
        : [...withoutNone, value];
      return { ...prev, [q.id]: next };
    });
  };

  const goNext = () => {
    if (isLast) {
      onComplete(answers);
    } else {
      setIndex(i => i + 1);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.progressHead}>
        <span className={styles.progressLabel}>Pertanyaan {index + 1} dari {questions.length}</span>
        <span className={styles.progressLabel}>{CATEGORY_LABEL[q.category] || q.category}</span>
      </div>
      <div className={styles.progressTrack}>
        <div className={styles.progressFill} style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div className={styles.card} key={q.id}>
        <span className={styles.categoryTag}>{CATEGORY_LABEL[q.category] || q.category}</span>
        <h3 className={styles.question}>{q.question}</h3>
        {q.help && <p className={styles.help}>{q.help}</p>}

        {q.type === 'text' ? (
          <textarea
            className={styles.textarea}
            aria-label={q.question}
            value={(currentAnswer as string) || ''}
            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
            placeholder="Contoh: Getaran muncul terutama saat pagi hari dan berkurang setelah beraktivitas..."
          />
        ) : q.type === 'multi' ? (
          <div className={styles.options}>
            {q.options?.map(opt => {
              const selected = Array.isArray(currentAnswer) && currentAnswer.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                  onClick={() => toggleMulti(opt.value)}
                >
                  <span className={`${styles.checkbox} ${selected ? styles.checkboxChecked : ''}`}>
                    {selected ? '✓' : ''}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.options}>
            {q.options?.map(opt => {
              const selected = currentAnswer === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
                  onClick={() => selectChoice(opt.value)}
                >
                  <span className={styles.radio}>{selected && <span className={styles.radioDot} />}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.navRow}>
          <button
            className="btn btn-outline"
            onClick={() => (index === 0 ? setStarted(false) : setIndex(i => i - 1))}
          >
            Kembali
          </button>
          <button className="btn btn-primary" onClick={goNext} disabled={!isAnswered}>
            {isLast ? 'Selesai, Lanjut ke Tes Gerakan' : 'Lanjut'}
          </button>
        </div>
      </div>
    </div>
  );
}
