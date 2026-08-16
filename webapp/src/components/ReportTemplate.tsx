'use client';
import { Session } from '@/lib/api';
import { normalizeBiomarkers } from '@/lib/biomarkers';
import Logo from './Logo';
import styles from './ReportTemplate.module.css';

export interface ReportPatient {
  name?: string;
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  age?: number | null;
  city?: string;
  state?: string;
  countryName?: string;
}

export interface ReportMeta {
  /** Nama tenaga kesehatan yang mencetak, kosong bila dicetak sendiri oleh pasien */
  clinicianName?: string;
  clinicianRole?: string;
  clinicianInstitution?: string;
}

interface Props {
  patient: ReportPatient;
  sessions: Session[];
  meta?: ReportMeta;
}

const RISK_LABEL: Record<string, string> = {
  HIGH: 'Tinggi', MEDIUM: 'Sedang', LOW: 'Rendah',
};

function fmtDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function calcAge(dob?: string) {
  if (!dob) return null;
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

/** Sparkline tren skor, digambar sebagai SVG agar ikut tercetak dengan tajam. */
function TrendChart({ sessions }: { sessions: Session[] }) {
  const points = [...sessions].reverse();
  if (points.length < 2) return null;

  const w = 640, h = 150, padL = 34, padR = 12, padT = 12, padB = 26;
  const xStep = (w - padL - padR) / (points.length - 1);
  const yFor = (s: number) => padT + (1 - s / 100) * (h - padT - padB);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${padL + i * xStep} ${yFor(p.compositeScore)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={styles.chart}>
      {/* Pita kategori risiko sebagai latar */}
      <rect x={padL} y={yFor(100)} width={w - padL - padR} height={yFor(65) - yFor(100)} className={styles.bandHigh} />
      <rect x={padL} y={yFor(65)} width={w - padL - padR} height={yFor(35) - yFor(65)} className={styles.bandMid} />
      <rect x={padL} y={yFor(35)} width={w - padL - padR} height={yFor(0) - yFor(35)} className={styles.bandLow} />

      {[0, 35, 65, 100].map(v => (
        <g key={v}>
          <line x1={padL} y1={yFor(v)} x2={w - padR} y2={yFor(v)} className={styles.gridLine} />
          <text x={padL - 6} y={yFor(v) + 3} textAnchor="end" fontSize="8" className={styles.axisText}>{v}</text>
        </g>
      ))}

      <path d={path} className={styles.trendLine} />
      {points.map((p, i) => (
        <g key={p.id}>
          <circle cx={padL + i * xStep} cy={yFor(p.compositeScore)} r="3"
            className={styles[`dot${p.riskCategory}` as keyof typeof styles] ?? styles.dotLOW} />
          <text x={padL + i * xStep} y={h - 8} textAnchor="middle" fontSize="7" className={styles.axisText}>
            #{p.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

/**
 * Template laporan tunggal yang dipakai baik oleh pasien maupun tenaga kesehatan.
 * Dirancang khusus untuk dicetak, bukan menyalin tampilan dashboard, sehingga
 * tata letaknya tetap rapi di kertas A4 dan tidak membawa elemen antarmuka.
 */
export default function ReportTemplate({ patient, sessions, meta }: Props) {
  const latest = sessions[0];
  const nb = normalizeBiomarkers(latest);
  const age = patient.age ?? calcAge(patient.dateOfBirth);
  const location = [patient.city, patient.state, patient.countryName].filter(Boolean).join(', ');
  const printedAt = new Date().toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className={styles.sheet} id="neuronmotion-report">
      {/* ── Kop laporan ── */}
      <header className={styles.head}>
        {/* Tanda nama yang sama dengan seluruh produk. Sebelumnya di sini ada
            ikon kotak biru bersudut membulat, padahal Logo.tsx menyatakan
            bahwa dunia visual ini tidak memakai ikon dan tandanya adalah
            namanya sendiri. Laporan adalah berkas yang paling sering dilihat
            di luar aplikasi, jadi justru di sinilah tandanya harus benar. */}
        <div className={styles.brandBlock}>
          <Logo size={17} />
          <div className={styles.brandSub}>Laporan Skrining Biomarker Motorik</div>
        </div>
        <div className={styles.printedAt}>
          <div>Dicetak</div>
          <strong>{printedAt}</strong>
        </div>
      </header>

      {/* ── Identitas ── */}
      <section className={styles.identity}>
        <div className={styles.idGrid}>
          <div><span className={styles.idLabel}>Nama</span><span className={styles.idValue}>{patient.name || '-'}</span></div>
          <div><span className={styles.idLabel}>Usia</span><span className={styles.idValue}>{age !== null && age !== undefined ? `${age} tahun` : '-'}</span></div>
          <div><span className={styles.idLabel}>Jenis Kelamin</span><span className={styles.idValue}>
            {patient.gender === 'M' ? 'Laki-laki' : patient.gender === 'F' ? 'Perempuan' : '-'}
          </span></div>
          <div><span className={styles.idLabel}>Wilayah</span><span className={styles.idValue}>{location || '-'}</span></div>
          <div><span className={styles.idLabel}>Total Sesi</span><span className={styles.idValue}>{sessions.length}</span></div>
          <div><span className={styles.idLabel}>Sesi Terakhir</span><span className={styles.idValue}>{fmtDate(latest?.timestamp)}</span></div>
        </div>
      </section>

      {/* ── Ringkasan hasil terakhir ── */}
      {latest && (
        <section className={styles.section}>
          <h2 className={styles.h2}>Ringkasan Hasil Terakhir</h2>
          <div className={styles.summaryRow}>
            <div className={`${styles.scoreBox} ${styles['risk' + latest.riskCategory]}`}>
              <div className={styles.scoreNum}>{Math.round(latest.compositeScore)}</div>
              <div className={styles.scoreLabel}>Skor Risiko</div>
            </div>
            <div className={styles.summaryInfo}>
              <div className={styles.kv}>
                <span>Kategori</span><strong>{RISK_LABEL[latest.riskCategory] || latest.riskCategory}</strong>
              </div>
              {latest.mlPrediction?.predictedLabel && (
                <div className={styles.kv}>
                  <span>Pola terdekat</span><strong>{latest.mlPrediction.predictedLabel}</strong>
                </div>
              )}
              {latest.questionnaireScore !== null && latest.questionnaireScore !== undefined && (
                <div className={styles.kv}>
                  <span>Skor gejala kuesioner</span><strong>{Math.round(latest.questionnaireScore)} dari 100</strong>
                </div>
              )}
              {latest.recommendations?.[0] && (
                <p className={styles.recommend}>{latest.recommendations[0]}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Tren ── */}
      {sessions.length > 1 && (
        <section className={styles.section}>
          <h2 className={styles.h2}>Tren Skor Antar Sesi</h2>
          <TrendChart sessions={sessions} />
          <p className={styles.caption}>
            Pita hijau menandai risiko rendah, kuning sedang, merah tinggi. Sumbu mendatar berurutan
            dari sesi terlama ke terbaru.
          </p>
        </section>
      )}

      {/* ── Rincian biomarker ── */}
      {latest?.rawBiomarkers && (
        <section className={styles.section}>
          <h2 className={styles.h2}>Rincian Biomarker Sesi Terakhir</h2>
          <table className={styles.table}>
            <thead>
              <tr><th>Parameter</th><th>Nilai</th><th>Satuan</th></tr>
            </thead>
            {/* Dibaca lewat penormal, bukan dari rawBiomarkers langsung.
                Sebelumnya simetri langkah, asimetri ayunan lengan, sway area,
                dan ROM tidak pernah tercetak untuk pasien yang datanya berasal
                dari seed, karena keempatnya menyebut nama field yang hanya
                ditulis analisator live. Ini laporan yang masuk rekam medis,
                jadi baris yang diam-diam hilang adalah persoalan yang lebih
                besar daripada tampilan. Lihat lib/biomarkers.ts. */}
            <tbody>
              {([
                ['Frekuensi tremor', 'Hz', nb.tremorHz],
                ['Kecepatan finger tapping', 'ketuk/detik', nb.tapRate],
                ['Simetri langkah', '%', nb.symmetryPercent],
                ['Kadense', 'langkah/menit', nb.cadence],
                ['Asimetri ayunan lengan', '%', nb.armAsymmetryPercent],
                ['Sway area postural', 'cm²', nb.swayAreaCm2],
                ['Range of motion lutut', 'derajat', nb.romDeg],
              ] as [string, string, number | null][]).map(([label, unit, value]) =>
                value === null ? null : (
                  <tr key={label}><td>{label}</td><td>{value.toFixed(2)}</td><td>{unit}</td></tr>
                ),
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Riwayat sesi ── */}
      <section className={styles.section}>
        <h2 className={styles.h2}>Riwayat Seluruh Sesi</h2>
        <table className={styles.table}>
          <thead>
            <tr><th>Sesi</th><th>Tanggal</th><th>Skor</th><th>Kategori</th><th>Catatan Nakes</th></tr>
          </thead>
          <tbody>
            {sessions.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td>{fmtDate(s.timestamp)}</td>
                <td>{Math.round(s.compositeScore)}</td>
                <td>{RISK_LABEL[s.riskCategory] || s.riskCategory}</td>
                <td className={styles.noteCell}>{s.doctorNote || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ── Analisis AI sesi terakhir ── */}
      {latest?.aiAnalysis?.available && (
        <section className={styles.section}>
          <h2 className={styles.h2}>Analisis Gabungan AI, Sesi Terakhir</h2>
          <p className={styles.aiText}>{latest.aiAnalysis.ringkasan}</p>
          {latest.aiAnalysis.saranTindakLanjut && latest.aiAnalysis.saranTindakLanjut.length > 0 && (
            <ul className={styles.aiList}>
              {latest.aiAnalysis.saranTindakLanjut.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          )}
          <p className={styles.caption}>
            Ringkasan disusun model bahasa untuk memudahkan pemahaman. Skor risiko tetap dihitung
            mesin analisis terpisah dan tidak diubah oleh AI.
          </p>
        </section>
      )}

      {/* ── Kaki laporan ── */}
      <footer className={styles.foot}>
        {meta?.clinicianName && (
          <div className={styles.signature}>
            <div className={styles.signLine} />
            <div className={styles.signName}>{meta.clinicianName}</div>
            <div className={styles.signRole}>
              {[meta.clinicianRole, meta.clinicianInstitution].filter(Boolean).join(', ')}
            </div>
          </div>
        )}
        <p className={styles.disclaimer}>
          NeuronMotion adalah alat bantu skrining awal berbasis kamera, bukan alat diagnosis. Nilai
          pada laporan ini merupakan hasil pengukuran gerakan dan tidak menggantikan pemeriksaan
          klinis langsung. Sistem belum divalidasi pada populasi pasien nyata, sehingga seluruh
          temuan perlu dikonfirmasi oleh tenaga medis sebelum dijadikan dasar keputusan.
        </p>
      </footer>
    </div>
  );
}
