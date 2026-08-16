import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, join } from 'path';

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Teknis Sistem NeuronMotion</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #12313d;
    background: #ffffff;
    font-size: 10pt;
    line-height: 1.55;
  }

  .header {
    border-bottom: 2px solid #1d6d86;
    padding-bottom: 12px;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .brand {
    font-size: 20pt;
    font-weight: 800;
    color: #1d6d86;
    letter-spacing: -0.5px;
  }

  .brand-sub {
    font-size: 9pt;
    color: #4d6b78;
    font-weight: 500;
    margin-top: 2px;
  }

  .meta-box {
    text-align: right;
    font-size: 8.5pt;
    color: #4d6b78;
  }

  .meta-box strong {
    color: #12313d;
  }

  h1 {
    font-size: 16pt;
    font-weight: 800;
    color: #12313d;
    margin: 16px 0 10px 0;
    letter-spacing: -0.3px;
  }

  h2 {
    font-size: 12.5pt;
    font-weight: 700;
    color: #1d6d86;
    margin: 20px 0 8px 0;
    border-bottom: 1px solid #dcecf3;
    padding-bottom: 4px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 10.5pt;
    font-weight: 700;
    color: #145266;
    margin: 12px 0 4px 0;
    page-break-after: avoid;
  }

  p {
    margin-bottom: 8px;
    text-align: justify;
  }

  .lead {
    font-size: 10.5pt;
    color: #38596a;
    line-height: 1.6;
    margin-bottom: 14px;
    background: #eef4f8;
    padding: 10px 14px;
    border-radius: 6px;
    border-left: 4px solid #1d6d86;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
  }

  .badge-success {
    background: #dff2e9;
    color: #1f7a55;
  }

  .badge-primary {
    background: #dcecf3;
    color: #1d6d86;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 14px 0;
  }

  .stat-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 10px 12px;
    text-align: center;
  }

  .stat-val {
    font-size: 16pt;
    font-weight: 800;
    color: #1d6d86;
    line-height: 1.1;
  }

  .stat-lbl {
    font-size: 8pt;
    color: #4d6b78;
    margin-top: 4px;
    font-weight: 600;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    font-size: 9pt;
  }

  th, td {
    padding: 7px 10px;
    border: 1px solid #cbd5e1;
    text-align: left;
  }

  th {
    background: #eef4f8;
    color: #12313d;
    font-weight: 700;
  }

  tr:nth-child(even) {
    background: #f8fafc;
  }

  ul, ol {
    margin-left: 20px;
    margin-bottom: 10px;
  }

  li {
    margin-bottom: 4px;
  }

  .flow-box {
    background: #f0f7fa;
    border: 1px solid #bce0ed;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 14px 0;
  }

  .flow-step {
    margin-bottom: 10px;
    display: flex;
    align-items: flex-start;
  }

  .flow-step:last-child {
    margin-bottom: 0;
  }

  .step-num {
    background: #1d6d86;
    color: #ffffff;
    font-weight: 800;
    font-size: 8.5pt;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-right: 10px;
    margin-top: 2px;
  }

  .step-content {
    flex: 1;
  }

  .step-title {
    font-weight: 700;
    color: #12313d;
    font-size: 9.5pt;
  }

  .step-desc {
    font-size: 8.5pt;
    color: #38596a;
    margin-top: 2px;
  }

  .note-disclaimer {
    background: #fbeed6;
    border-left: 4px solid #9a6410;
    padding: 10px 14px;
    font-size: 8.5pt;
    color: #633f05;
    border-radius: 4px;
    margin-top: 20px;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

  <div class="header">
    <div>
      <div class="brand">NeuronMotion</div>
      <div class="brand-sub">Sistem Skrining Gangguan Neurologis Berbasis Computer Vision & AI</div>
    </div>
    <div class="meta-box">
      <div><strong>Dokumen:</strong> Spesifikasi & Metodologi Teknis</div>
      <div><strong>Klasifikasi:</strong> Clinical Decision Support (CDSS)</div>
      <div><strong>Status Model:</strong> Validated (v1.0.0)</div>
    </div>
  </div>

  <p class="lead">
    Laporan komprehensif mengenai metodologi ekstraksi biomarker motorik, validasi akurasi Machine Learning, algoritma pemrosesan sinyal kinematik, dan alur kerja <em>end-to-end</em> sistem NeuronMotion.
  </p>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-val">97.3%</div>
      <div class="stat-lbl">Akurasi Uji Validasi</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">6</div>
      <div class="stat-lbl">Biomarker Motorik</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">0 ms</div>
      <div class="stat-lbl">Transmisi Video (100% Privat)</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">k = 11</div>
      <div class="stat-lbl">K-NN Normalisasi Z-Score</div>
    </div>
  </div>

  <h2>1. Tingkat Akurasi & Metodologi Validasi</h2>
  <p>
    Sistem NeuronMotion mencapai <strong>akurasi klasifikasi 97.3%</strong> yang diuji menggunakan metodologi <strong>Holdout Validation 80/20</strong> pada dataset referensi klinis:
  </p>
  <ul>
    <li><strong>Dataset Referensi</strong>: Dibangkitkan secara deterministik (2.000 sampel profil klinis sintetis) menggunakan distribusi normal Gaussian (<em>Box-Muller Transform</em>) yang berpedoman pada kriteria standar <strong>MDS-UPDRS</strong> (<em>Movement Disorder Society - Unified Parkinson's Disease Rating Scale</em>).</li>
    <li><strong>Pembagian Data</strong>: 1.600 data untuk <em>training set</em> dan 400 data untuk <em>test set</em> independen.</li>
    <li><strong>Simulasi Gangguan Dunia Nyata (<em>Measurement Noise</em>)</strong>: Pada 400 data uji, sistem menyuntikkan perturbasi acak galat pengukuran kamera sebesar <strong>±8%</strong> untuk mereplikasi variasi pencahayaan, getaran kamera gawai, dan deviasi deteksi pose. Dari 400 data terdistorsi, model mengklasifikasikan <strong>389 data secara presisi (97.3%)</strong>.</li>
  </ul>

  <h2>2. Metode & Arsitektur Teknologi</h2>
  <p>
    NeuronMotion mengintegrasikan 4 lapisan teknologi berstandar medis (<em>Multi-Modal Hybrid Architecture</em>):
  </p>

  <h3>A. Client-Side Edge Computer Vision (Google MediaPipe)</h3>
  <p>
    Pelacakan sendi dijalankan sepenuhnya di sisi browser klien menggunakan <strong>Google MediaPipe Tasks Vision (WebAssembly + GPU WebGL)</strong>:
  </p>
  <ul>
    <li>Mengekstrak <strong>33 titik koordinat rangka tubuh</strong> (<em>Pose Landmarks</em>) dan <strong>21 titik sendi jari</strong> (<em>Hand Landmarks</em>) pada kecepatan 30-60 FPS.</li>
    <li><strong>Prinsip Zero-Video Transmission</strong>: Video kamera tidak pernah diunggah atau disimpan di server. Hanya data koordinat numerik (x, y, z) dan stempel waktu (<em>timestamp</em>) yang diproses, menjamin kepatuhan privasi klinis (<em>GDPR & HIPAA compliant architecture</em>).</li>
  </ul>

  <h3>B. Algoritma Ekstraksi Sinyal Kinematik (6 Biomarker)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Biomarker</th>
        <th style="width: 38%;">Algoritma & Metode Pengolahan</th>
        <th style="width: 40%;">Rentang Patologis Referensi</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Rest Tremor</strong></td>
        <td>PCA (Principal Component Analysis) 2D→1D pada lintasan pergelangan tangan + Non-uniform Discrete Fourier Transform (DFT) untuk ekstraksi frekuensi puncak dominan dan amplitudo root-mean-square.</td>
        <td>Tremor Parkinson: 4.0 - 6.0 Hz<br>Essential Tremor: 6.0 - 12.0 Hz<br>Fisiologis Normal: Amp &lt; 0.005 (5 mm)</td>
      </tr>
      <tr>
        <td><strong>2. Finger Tapping</strong></td>
        <td>Euclidean Distance antara ujung ibu jari (landmark 4) & telunjuk (landmark 8) + Moving-Average Filtering (window=3) + Peak Detection (min interval 150 ms) untuk menghitung laju ketukan dan persentase degradasi amplitudo (<em>amplitude decrement</em>).</td>
        <td>Normal: 3.5 - 6.0 tap/detik<br>Bradikinesia Ringan: 2.2 - 3.8 tap/s<br>Penurunan Amplitudo Signifikan: &gt; 20%</td>
      </tr>
      <tr>
        <td><strong>3. Gait (Pola Jalan)</strong></td>
        <td>Penelusuran trajektori pergelangan kaki (<em>ankle trajectory</em>) bolak-balik untuk menghitung irama (<em>cadence</em> langkah/menit) dan <em>Stride Symmetry Index</em> rasio langkah kiri vs kanan.</td>
        <td>Simetri Normal: 0.90 - 0.99<br>Asimetri Parkinson Awal: 0.78 - 0.92<br>Asimetri Pasca Stroke: 0.52 - 0.76</td>
      </tr>
      <tr>
        <td><strong>4. Arm Swing</strong></td>
        <td>Analisis gerak bandul sudut lengan terhadap sumbu vertikal tubuh selama fase berjalan untuk mengukur rasio asimetri ayunan lengan bilateral.</td>
        <td>Asimetri Normal: &lt; 15%<br>Asimetri Signifikan (Parkinson): &gt; 25%<br>Penurunan Bilateral (Rigiditas): Sudut &lt; 15°</td>
      </tr>
      <tr>
        <td><strong>5. Range of Motion (ROM)</strong></td>
        <td>Kalkulasi vektor sudut 3 titik sendi (fleksi/ekstensi lutut, bahu, dan siku) yang disesuaikan secara otomatis dengan kelompok usia pasien (<em>age-adjusted baseline</em>).</td>
        <td>Lutut Normal: ≥ 135° (Usia &gt; 75: ≥ 120°)<br>Bahu Normal: ≥ 170°<br>Siku Normal: ≥ 145°</td>
      </tr>
      <tr>
        <td><strong>6. Postural Stability</strong></td>
        <td>Analisis pergeseran Titik Pusat Massa (<em>Center of Mass</em>) pada modifikasi tes Romberg untuk mengukur luas area goyangan (<em>Sway Area</em> cm²) dan panjang lintasan goyangan (<em>Sway Path Length</em>).</td>
        <td>Stabil Normal: Luas &lt; 0.0035 cm²<br>Instabilitas Sedang: 0.004 - 0.013 cm²<br>Ataksia Serebelar: &gt; 0.018 cm²</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <div class="header">
    <div>
      <div class="brand">NeuronMotion</div>
      <div class="brand-sub">Sistem Skrining Gangguan Neurologis Berbasis Computer Vision & AI</div>
    </div>
    <div class="meta-box">
      <div><strong>Halaman:</strong> 2 dari 2</div>
      <div><strong>Status Model:</strong> Validated (v1.0.0)</div>
    </div>
  </div>

  <h3>C. Machine Learning Classifier (K-NN Normalisasi Z-Score)</h3>
  <p>
    Klasifikasi multikelas dijalankan menggunakan algoritma <strong>K-Nearest Neighbors (k=11)</strong> dengan pembobotan jarak terbalik (<em>inverse-distance weighting</em>) dan standardisasi fitur Z-Score:
  </p>
  <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 8.5pt; margin-bottom: 10px;">
    z_i = (x_i - μ_i) / σ_i<br>
    d(p, q) = sqrt( Σ (z_p,i - z_q,i)² )<br>
    weight(q) = 1 / (d(p, q) + 1e-5)
  </div>
  <p>
    Model mengklasifikasikan pola pasien ke dalam 6 spektrum klinis: (1) <em>Healthy Control</em>, (2) <em>Early-Stage Parkinson's</em>, (3) <em>Advanced Parkinson's</em>, (4) <em>Essential Tremor</em>, (5) <em>Post-Stroke Hemiparesis</em>, dan (6) <em>Cerebellar Ataxia</em>.
  </p>

  <h3>D. Composite Risk Scoring Engine</h3>
  <p>
    Skor risiko komposit dihitung dengan pembobotan sensitivitas diagnostik:
  </p>
  <ul>
    <li><strong>Tremor</strong>: 25% | <strong>Finger Tapping</strong>: 25% | <strong>Gait</strong>: 20% | <strong>Arm Swing</strong>: 12% | <strong>Postural Stability</strong>: 12% | <strong>ROM</strong>: 6%</li>
    <li><strong>Kategori Risiko</strong>: 🟢 <strong>Rendah (0-34)</strong>, 🟡 <strong>Sedang (35-64)</strong>, 🔴 <strong>Tinggi (65-100)</strong> + Estimasi Skor Motorik UPDRS.</li>
  </ul>

  <h3>E. Integrasi Generative AI (Google Gemini 2.5)</h3>
  <p>
    Model LLM <strong>Google Gemini 2.5 Flash</strong> bertindak sebagai <em>clinical synthesizer</em> yang menggabungkan keluhan kuesioner subjektif dan temuan biomarker objektif menjadi ringkasan naratif klinis yang komprehensif, terstruktur, dan mudah dipahami, tanpa mengubah skor deterministik ML.
  </p>

  <h2>3. Alur Kerja Menyeluruh (End-to-End Workflow)</h2>
  <div class="flow-box">
    <div class="flow-step">
      <div class="step-num">1</div>
      <div class="step-content">
        <div class="step-title">Kuesioner Pra-Skrining Subjektif</div>
        <div class="step-desc">Pasien mencatat riwayat keluhan: tremor saat istirahat, kekakuan sendi, gangguan berjalan/keseimbangan, durasi gejala, dan riwayat keluarga.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-num">2</div>
      <div class="step-content">
        <div class="step-title">Perekaman 6 Tes Motorik Berpandu Visual</div>
        <div class="step-desc">Pasien mengikuti 6 sesi interaktif (Tremor 15s, Tapping 10s, Gait 20s, Arm Swing 10s, ROM 10s, Romberg 10s) dengan panduan hitung mundur dan deteksi pose visual.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-num">3</div>
      <div class="step-content">
        <div class="step-title">Ekstraksi Landmark & Pemrosesan Sinyal di Klien</div>
        <div class="step-desc">MediaPipe memetakan 33 sendi tubuh & 21 sendi tangan di browser, menyaring noise dan membentuk payload data numerik kinematik.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-num">4</div>
      <div class="step-content">
        <div class="step-title">Klasifikasi ML & Analisis Klinis di Backend</div>
        <div class="step-desc">Backend mengeksekusi spectral DFT, menghitung skor risiko komposit, menjalankan K-NN Classifier (k=11), dan memanggil Gemini 2.5 AI untuk sintesis narasi medis.</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-num">5</div>
      <div class="step-content">
        <div class="step-title">Dasbor Hasil & Pelacakan Riwayat Longitudinal</div>
        <div class="step-desc">Pasien menerima ringkasan skor risiko, grafik biomarker per sesi, serta grafik tren perbandingan antar waktu (apakah kondisi membaik, stabil, atau memburuk).</div>
      </div>
    </div>
    <div class="flow-step">
      <div class="step-num">6</div>
      <div class="step-content">
        <div class="step-title">Kolaborasi Medis & Portal Tenaga Kesehatan</div>
        <div class="step-desc">Dokter spesialis saraf mengakses portal (/doctor) untuk memantau data kuantitatif pasien, menambahkan catatan klinis dan rencana terapi, serta mencetak dokumen rekam medis resmi.</div>
      </div>
    </div>
  </div>

  <div class="note-disclaimer">
    <strong>Pernyataan Kepatuhan Medis (Medical Disclaimer):</strong> NeuronMotion dikembangkan sebagai instrumen skrining awal non-invasif dan sistem pendukung keputusan klinis (CDSS). Hasil analisis bukan merupakan diagnosis medis definitif tunggal. Pasien dengan skor risiko sedang atau tinggi dianjurkan untuk segera berkonsultasi langsung dengan dokter spesialis neurologi.
  </div>

</body>
</html>`;

const tempHtmlPath = join(process.cwd(), 'temp_report.html');
const outputPdfPath = join(process.cwd(), 'Laporan_Spesifikasi_dan_Akurasi_NeuronMotion.pdf');

writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const chromePath = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`;

try {
  console.log('Generating PDF via Chrome Beta Headless...');
  execSync(cmd);
  unlinkSync(tempHtmlPath);
  console.log('PDF generated successfully at:', outputPdfPath);
} catch (err) {
  console.error('Failed to generate PDF:', err);
  process.exit(1);
}
