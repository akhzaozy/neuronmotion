'use client';
import { useEffect, useState } from 'react';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Checkbox from '@radix-ui/react-checkbox';
import { api, QuestionnaireQuestion } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import styles from './PreScreeningQuestionnaire.module.css';

export type QuestionnaireAnswers = Record<string, string | string[]>;

interface Props {
  onComplete: (answers: QuestionnaireAnswers) => void;
  onSkip: () => void;
}

/**
 * Kuesioner gejala sebelum tes gerakan.
 *
 * Radix menangani grup radio dan kotak centang, termasuk navigasi panah,
 * pengumuman keadaan ke pembaca layar, dan hubungan label. Berkas ini hanya
 * memberi tampilannya, dan tampilannya tidak memakai ikon: pilihan terpilih
 * ditandai bidang tinta dan bobot huruf.
 */
export default function PreScreeningQuestionnaire({ onComplete, onSkip }: Props) {
  const { t } = useI18n();
  const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({});

  useEffect(() => {
    api.getQuestionnaire()
      .then(res => setQuestions(res.questions))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

  const categoryLabel = (c: string) => t(`quest.cat.${c}`, c);

  if (loading) {
    return (
      <p className={styles.status} role="status" aria-live="polite">
        {t('quest.loading')}
      </p>
    );
  }

  /* Kuesioner gagal dimuat tidak boleh menghalangi skrining. */
  if (questions.length === 0) {
    return (
      <section className={styles.intro}>
        <h1>{t('quest.unavailable')}</h1>
        <p className={styles.introLead}>{t('quest.unavailableBody')}</p>
        <button type="button" className="btn btn--primary btn--lg" onClick={onSkip}>
          {t('quest.continueToTests')}
        </button>
      </section>
    );
  }

  if (!started) {
    return (
      <section className={styles.intro}>
        <header className="docHead">
          <div className="docHead__meta">
            <span>{t('quest.kicker')}</span>
            <span>
              {t('quest.count').replace('{n}', String(questions.length))}
            </span>
          </div>
          <h1>{t('quest.introTitle')}</h1>
        </header>

        <p className={styles.introLead}>{t('quest.introLead')}</p>

        <ul className={styles.introList}>
          <li>{t('quest.point1').replace('{n}', String(questions.length))}</li>
          <li>{t('quest.point2')}</li>
          <li>{t('quest.point3')}</li>
          <li>{t('quest.point4')}</li>
        </ul>

        <div className={styles.nav}>
          <button
            type="button"
            className="btn btn--primary btn--lg"
            onClick={() => setStarted(true)}
          >
            {t('quest.begin')}
          </button>
          <button type="button" className="btn btn--lg" onClick={onSkip}>
            {t('quest.skip')}
          </button>
        </div>
      </section>
    );
  }

  const q = questions[index];
  const isLast = index === questions.length - 1;
  const currentAnswer = answers[q.id];

  // Pertanyaan teks bebas kini benar-benar opsional dan dinyatakan begitu,
  // alih-alih diam-diam dianggap terjawab sementara tombol lanjut di tempat
  // lain dinonaktifkan tanpa penjelasan.
  const isAnswered =
    q.type === 'text'
      ? true
      : Array.isArray(currentAnswer)
        ? currentAnswer.length > 0
        : currentAnswer !== undefined;

  const toggleMulti = (value: string) => {
    setAnswers(prev => {
      const existing = Array.isArray(prev[q.id]) ? (prev[q.id] as string[]) : [];
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

  return (
    <section className={styles.wrap}>
      <header className="docHead">
        <div className="docHead__meta">
          <span>
            {t('quest.progress')
              .replace('{a}', String(index + 1))
              .replace('{b}', String(questions.length))}
          </span>
          <span>{categoryLabel(q.category)}</span>
        </div>
        <h1 className={styles.question}>{q.question}</h1>
        {q.help && <p className={styles.help}>{q.help}</p>}
      </header>

      {q.type === 'text' ? (
        <>
          <label className="label" htmlFor="freeText">
            {t('quest.optional')}
          </label>
          <textarea
            id="freeText"
            className="input"
            value={(currentAnswer as string) || ''}
            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
            placeholder={t('quest.placeholder')}
          />
        </>
      ) : q.type === 'multi' ? (
        <div className={styles.options}>
          {q.options?.map(opt => {
            const selected = Array.isArray(currentAnswer) && currentAnswer.includes(opt.value);
            return (
              <label key={opt.value} className={styles.option} data-selected={selected ? '' : undefined}>
                <Checkbox.Root
                  className={styles.control}
                  checked={selected}
                  onCheckedChange={() => toggleMulti(opt.value)}
                >
                  <Checkbox.Indicator className={styles.controlMark} />
                </Checkbox.Root>
                <span>{opt.label}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <RadioGroup.Root
          className={styles.options}
          value={(currentAnswer as string) ?? ''}
          onValueChange={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
        >
          {q.options?.map(opt => {
            const selected = currentAnswer === opt.value;
            return (
              <label key={opt.value} className={styles.option} data-selected={selected ? '' : undefined}>
                <RadioGroup.Item className={styles.control} value={opt.value}>
                  <RadioGroup.Indicator className={styles.controlMark} />
                </RadioGroup.Item>
                <span>{opt.label}</span>
              </label>
            );
          })}
        </RadioGroup.Root>
      )}

      <div className={styles.nav}>
        <button
          type="button"
          className="btn btn--lg"
          onClick={() => (index === 0 ? setStarted(false) : setIndex(i => i - 1))}
        >
          {index === 0 ? t('quest.backToIntro') : t('quest.back')}
        </button>
        <button
          type="button"
          className="btn btn--primary btn--lg"
          onClick={() => (isLast ? onComplete(answers) : setIndex(i => i + 1))}
          disabled={!isAnswered}
        >
          {isLast ? t('quest.finish') : t('quest.next')}
        </button>
      </div>

      {!isAnswered && (
        <p className={styles.hint} aria-live="polite">
          {t('quest.needAnswer')}
        </p>
      )}
    </section>
  );
}
