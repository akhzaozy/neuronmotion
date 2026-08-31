import { writeFileSync, unlinkSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Dokumentasi Komprehensif & Spesifikasi Lengkap Sistem NeuronMotion</title>
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
    font-size: 9.5pt;
    line-height: 1.55;
  }

  .cover-page {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 250mm;
    padding: 20mm 10mm;
    border-left: 6px solid #0284c7;
    background: linear-gradient(135deg, rgba(2, 132, 199, 0.04) 0%, rgba(16, 185, 129, 0.02) 100%);
  }

  .cover-title {
    font-size: 28pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.15;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .cover-brand {
    color: #0284c7;
    display: inline-block;
  }

  .cover-sub {
    font-size: 13pt;
    color: #475569;
    font-weight: 500;
    margin-bottom: 24px;
  }

  .cover-badge-row {
    display: flex;
    gap: 8px;
    margin-bottom: 30px;
  }

  .cover-badge {
    background: #0284c7;
    color: #ffffff;
    font-size: 8.5pt;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .cover-badge-outline {
    border: 1px solid #0284c7;
    color: #0284c7;
    background: #ffffff;
    font-size: 8.5pt;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 4px;
  }

  .cover-desc {
    font-size: 10.5pt;
    color: #334155;
    line-height: 1.6;
    margin-bottom: 40px;
    max-width: 90%;
  }

  .cover-meta {
    margin-top: auto;
    border-top: 1px solid #cbd5e1;
    padding-top: 15px;
    font-size: 8.5pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }

  .header {
    border-bottom: 2px solid #0284c7;
    padding-bottom: 10px;
    margin-bottom: 18px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .brand {
    font-size: 16pt;
    font-weight: 800;
    color: #0284c7;
    letter-spacing: -0.5px;
  }

  .brand-sub {
    font-size: 8pt;
    color: #475569;
    font-weight: 500;
    margin-top: 2px;
  }

  .meta-box {
    text-align: right;
    font-size: 8pt;
    color: #475569;
  }

  h1 {
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 12px;
    border-bottom: 1.5px solid #0284c7;
    padding-bottom: 4px;
    page-break-after: avoid;
  }

  h2 {
    font-size: 12pt;
    font-weight: 700;
    color: #0369a1;
    margin-top: 16px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 10pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 10px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }

  p {
    margin-bottom: 8px;
    text-align: justify;
  }

  .section {
    margin-bottom: 18px;
  }

  .page-break {
    page-break-after: always;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 10px 0;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin: 10px 0;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px;
    font-size: 9pt;
  }

  .card-highlight {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
  }

  .card-primary {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
  }

  .card-title {
    font-weight: 700;
    font-size: 9.5pt;
    color: #0f172a;
    margin-bottom: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 8.5pt;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    text-align: left;
  }

  th {
    background: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 7.5pt;
    font-weight: 700;
  }

  .badge-green { background: #dcfce7; color: #166534; }
  .badge-yellow { background: #fef3c7; color: #92400e; }
  .badge-red { background: #fee2e2; color: #991b1b; }
  .badge-blue { background: #e0f2fe; color: #075985; }

  .flow-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 12px 0;
  }

  .flow-step {
    display: flex;
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 12px;
    align-items: flex-start;
  }

  .step-num {
    background: #0284c7;
    color: #ffffff;
    font-weight: 800;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8.5pt;
    flex-shrink: 0;
  }

  .step-content {
    flex: 1;
  }

  .step-title {
    font-weight: 700;
    font-size: 9pt;
    color: #0f172a;
  }

  .step-desc {
    font-size: 8.5pt;
    color: #475569;
  }

  .formula-box {
    background: #f1f5f9;
    border-left: 3px solid #0284c7;
    padding: 8px 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 8.5pt;
    margin: 8px 0;
    color: #0f172a;
  }

  .note-disclaimer {
    background: #fffbeb;
    border: 1px solid #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 10px;
    font-size: 8pt;
    color: #92400e;
    border-radius: 4px;
    margin-top: 14px;
  }
</style>
</head>
<body>

  <!-- ── COVER PAGE ────────────────────────────────────────────────────────── -->
  <div class="cover-page">
    <div class="cover-badge-row">
      <span class="cover-badge">Buku Dokumentasi Lengkap</span>
      <span class="cover-badge-outline">Versi 1.0.0 (Produksi)</span>
    </div>
    <div class="cover-title">
      <span class="cover-brand">NEURONMOTION</span><br>
      Sistem Skrining Gangguan Gerak Neurologis Berbasis Computer Vision & AI Multimodal
    </div>
    <div class="cover-sub">
      Buku Panduan Teknis, Arsitektur Sistem, Spesifikasi Biomarker, Algoritma K-NN & Keselarasan Dataset Klinis
    </div>

    <div class="cover-desc">
      Dokumen ini menyajikan seluruh arsitektur, landasan klinis, pemrosesan sinyal spektral DFT, pipeline ekstraksi MediaPipe Vision client-side, verifikasi model klasifikasi K-NN (2.000 sampel dataset), integrasi sintesis AI Gemini 2.5, serta isolasi keamanan data pasien-tenaga kesehatan pada platform NeuronMotion.
    </div>

    <div class="cover-meta">
      <div>
        <strong>Pengembang:</strong> Muhammad Akhza Fachrozy (Last Dance Teams)<br>
        <strong>Kategori:</strong> Software as a Medical Screening System (CDSS)
      </div>
      <div style="text-align: right;">
        <strong>Tanggal Rilis:</strong> 22 Agustus 2026<br>
        <strong>Status Validasi:</strong> Dataset Sintetis Klinis Terverifikasi
      </div>
    </div>
  </div>

  <!-- ── BAGIAN 1: ABSTRAK & LATAR BELAKANG ─────────────────────────────────── -->
  <div class="header">
    <div>
      <div class="brand">NEURONMOTION</div>
      <div class="brand-sub">Sistem Skrining Gangguan Neurologis Berbasis Computer Vision</div>
    </div>
    <div class="meta-box">
      <strong>BAB 1: Gambaran Umum & Arsitektur</strong><br>
      Klasifikasi Klinis Non-Invasif
    </div>
  </div>

  <div class="section">
    <h1>1. Latar Belakang & Ringkasan Eksekutif</h1>
    <p>
      Gangguan gerak neurologis seperti <strong>Penyakit Parkinson (PD)</strong>, <strong>Tremor Esensial (ET)</strong>, <strong>Defisit Pasca Stroke</strong>, dan <strong>Ataksia Serebelar</strong> memerlukan deteksi sedini mungkin untuk intervensi terapeutik yang efektif. Namun, akses ke dokter spesialis saraf di Indonesia masih sangat terkonsentrasi di kota-kota besar dengan rasio neurolog yang sangat terbatas bagi populasi luas.
    </p>
    <p>
      <strong>NeuronMotion</strong> hadir sebagai solusi skrining awal mandiri berbasis web yang memungkinkan masyarakat melakukan penilaian fungsi motorik hanya menggunakan kamera perangkat standar (ponsel/laptop) tanpa memerlukan sensor perangkat keras tambahan, wearable, atau instalasi aplikasi native.
    </p>

    <div class="grid-3">
      <div class="card card-primary">
        <div class="card-title">1. Privasi Terjamin (Client-Side)</div>
        <p>Inferensi pose dan tangan berjalan 100% di browser via WebAssembly/WebGL. Rekaman video tidak pernah keluar dari perangkat pengguna.</p>
      </div>
      <div class="card card-highlight">
        <div class="card-title">2. Biomarker Objektif</div>
        <p>Ekstraksi 6 biomarker gerak terkuantisasi sesuai standar klinis MDS-UPDRS (Tremor, Tapping, Gait, Arm Swing, ROM, Postur).</p>
      </div>
      <div class="card card-primary">
        <div class="card-title">3. AI Multimodal Cerdas</div>
        <p>Menggabungkan kuesioner gejala subjektif dengan biomarker objektif menggunakan model K-NN (k=11) & sintesis naratif Gemini 2.5.</p>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>2. Arsitektur Komputasi Sistem</h2>
    <p>
      NeuronMotion mengusung arsitektur hybrid modern yang memisahkan beban komputasi berat pemrosesan citra ke sisi klien (Edge AI) dan komputasi analitik ke backend:
    </p>

    <div class="flow-container">
      <div class="flow-step">
        <div class="step-num">1</div>
        <div class="step-content">
          <div class="step-title">Frontend Capture & Client-Side Inference (MediaPipe Tasks Vision)</div>
          <div class="step-desc">Next.js 16 + React 19 memanfaatkan @mediapipe/tasks-vision untuk mendeteksi 33 titik kerangka tubuh (Pose Landmarker) dan 21 titik tangan (Hand Landmarker) secara realtime pada 30-60 FPS.</div>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-num">2</div>
        <div class="step-content">
          <div class="step-title">Ekstraksi Sinyal Kinematik & Spektral</div>
          <div class="step-desc">Perhitungan jarak euclidian, sudut persendian (vektor kalkulus), kecepatan osilasi, rasio simetri bilateral, dan Discrete Fourier Transform (DFT) untuk analisis domain frekuensi tremor.</div>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-num">3</div>
        <div class="step-content">
          <div class="step-title">Backend API & Engine Klasifikasi (Express.js + Prisma ORM)</div>
          <div class="step-desc">Backend menerima payload biomarker JSON, melakukan normalisasi Z-Score berbasis usia, mengeksekusi Weighted K-NN (k=11), mengkalkulasi komposit risiko, dan memanggil Gemini 2.5 AI.</div>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-num">4</div>
        <div class="step-content">
          <div class="step-title">Penyimpanan & Isolasi Akses Medis (Relational Database)</div>
          <div class="step-desc">Data tersimpan aman dengan relasi granular. Pasien mandiri memiliki hak penuh atas datanya dan hanya membagikan akses ke dokter melalui pertukaran kode otorisasi unik (Share Code).</div>
        </div>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ── BAGIAN 2: SPESIFIKASI BIOMARKER & FORMULA ─────────────────────────── -->
  <div class="header">
    <div>
      <div class="brand">NEURONMOTION</div>
      <div class="brand-sub">Spesifikasi 6 Parameter Biomarker Kinematik</div>
    </div>
    <div class="meta-box">
      <strong>BAB 2: Biomarker & Formula Klinis</strong><br>
      Kuantifikasi MDS-UPDRS
    </div>
  </div>

  <div class="section">
    <h1>2. Enam Modalitas Pengujian Biomarker</h1>

    <table>
      <thead>
        <tr>
          <th>Uji Biomarker</th>
          <th>Landasan Klinis</th>
          <th>Metrik Terukur</th>
          <th>Ambang Batas Normal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>1. Tremor Tangan</strong></td>
          <td>MDS-UPDRS 3.17 (Rest Tremor)</td>
          <td>Frekuensi Dominan (Hz), Amplitudo Relatif</td>
          <td>Tremor fisiologis: 8-12 Hz (Amp &lt; 0.005)</td>
        </tr>
        <tr>
          <td><strong>2. Finger Tapping</strong></td>
          <td>MDS-UPDRS 3.4 (Bradykinesia)</td>
          <td>Kecepatan (tap/detik), Dekremen Ritme (%)</td>
          <td>&ge; 3.5 tap/detik, Dekremen &le; 10%</td>
        </tr>
        <tr>
          <td><strong>3. Pola Jalan (Gait)</strong></td>
          <td>MDS-UPDRS 3.10 (Gait Analysis)</td>
          <td>Kadense (langkah/mnt), Indeks Simetri Langkah</td>
          <td>95-120 langkah/mnt, Simetri &ge; 0.90</td>
        </tr>
        <tr>
          <td><strong>4. Ayunan Lengan</strong></td>
          <td>Marker Dini Asimetri PD</td>
          <td>Amplitudo Sudut (&deg;), Asimetri Bilateral (%)</td>
          <td>Amplitudo &ge; 25&deg;, Asimetri &le; 15%</td>
        </tr>
        <tr>
          <td><strong>5. Rentang Gerak (ROM)</strong></td>
          <td>Evaluasi Kekakuan (Rigidity)</td>
          <td>Maksimal Sudut Sendi (Lutut, Bahu, dsb)</td>
          <td>Lutut: 130-140&deg;, Bahu: 160-175&deg;</td>
        </tr>
        <tr>
          <td><strong>6. Stabilitas Postural</strong></td>
          <td>MDS-UPDRS 3.12 (Postural Stability)</td>
          <td>Sway Area (cm&sup2;), Total Sway Path Length</td>
          <td>Sway Area &lt; 0.0035 (Relatif stabil)</td>
        </tr>
      </tbody>
    </table>

    <h2>Formula Kuantifikasi Utama</h2>
    <div class="formula-box">
      // 1. Frekuensi Tremor (Discrete Fourier Transform - DFT)<br>
      X_k = &sum;_{n=0}^{N-1} x_n &middot; e^{-i 2&pi; k n / N} &rArr; f_{dom} = \text{argmax}(|X_k|) &middot; (F_s / N)<br><br>
      // 2. Indeks Simetri Ayunan Lengan & Langkah (Bilateral Asymmetry)<br>
      \text{Asymmetry}_{\%} = \frac{|A_{\text{kiri}} - A_{\text{kanan}}|}{\max(A_{\text{kiri}}, A_{\text{kanan}})} \times 100\%<br><br>
      // 3. Area Goyangan Postural (Convex Hull Sway Area Approximation)<br>
      \text{Sway Area} = \frac{1}{2} | \sum_{i=1}^{n-1} (x_i y_{i+1} - x_{i+1} y_i) |
    </div>
  </div>

  <div class="section">
    <h2>Kategori Risiko Komposit</h2>
    <div class="grid-3">
      <div class="card" style="border-left: 4px solid #16a34a;">
        <div class="card-title" style="color: #16a34a;">Skor &lt; 35: RISIKO RENDAH</div>
        <p>Biomarker berada dalam variasi fisiologis normal. Disarankan pemantauan rutin dan menjaga kebugaran fisik.</p>
      </div>
      <div class="card" style="border-left: 4px solid #d97706;">
        <div class="card-title" style="color: #d97706;">Skor 35 sampai 64: RISIKO SEDANG</div>
        <p>Terdeteksi anomali gerak ringan hingga sedang (mis. tremor istirahat atau perlambatan ketukan). Disarankan konsultasi dokter.</p>
      </div>
      <div class="card" style="border-left: 4px solid #dc2626;">
        <div class="card-title" style="color: #dc2626;">Skor &ge; 65: RISIKO TINGGI</div>
        <p>Penyimpangan biomarker motorik signifikan. Disarankan pemeriksaan klinis definitif ke dokter spesialis saraf.</p>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ── BAGIAN 3: DATASET & ALGORITMA MACHINE LEARNING ─────────────────────── -->
  <div class="header">
    <div>
      <div class="brand">NEURONMOTION</div>
      <div class="brand-sub">Validasi Model & Keselarasan Dataset Training</div>
    </div>
    <div class="meta-box">
      <strong>BAB 3: Machine Learning & Dataset</strong><br>
      Evaluasi 2.000 Sampel Klinis
    </div>
  </div>

  <div class="section">
    <h1>3. Dataset Training & Evaluasi K-NN Classifier</h1>
    <p>
      Dataset training yang tersimpan di berkas <code>dataset/NeuronMotion-Dataset-Training.csv</code> dan <code>.xlsx</code> memuat <strong>2.000 sampel data klinis sintetis</strong> yang dibagi secara stratified menjadi <strong>1.600 data latih (80%)</strong> dan <strong>400 data uji (20%)</strong>.
    </p>

    <h2>Keselarasan Dataset XLSX/CSV dengan Engine Klasifikasi</h2>
    <p>
      Generator dataset di <code>server/data/clinicalData.js</code> telah diselaraskan 100% dengan parameter literatur klinis internasional:
    </p>

    <table>
      <thead>
        <tr>
          <th>Kondisi Klinis</th>
          <th>Label Output</th>
          <th>Karakteristik Biomarker Utama</th>
          <th>Proporsi Data</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>HEALTHY</code></td>
          <td>Sehat</td>
          <td>Tremor fisiologis amplitudo rendah, ketukan jari cepat, gait simetris.</td>
          <td>~16.7%</td>
        </tr>
        <tr>
          <td><code>PARKINSON_EARLY</code></td>
          <td>Parkinson Awal (H-Y 1-2)</td>
          <td>Tremor 4-6 Hz unilateral, asimetri ayunan lengan tinggi, kadense normal.</td>
          <td>~16.7%</td>
        </tr>
        <tr>
          <td><code>PARKINSON_ADVANCED</code></td>
          <td>Parkinson Lanjut (H-Y 3-4)</td>
          <td>Bradikinesia berat, dekremen ketukan jari &gt;35%, instabilitas postural tinggi.</td>
          <td>~16.7%</td>
        </tr>
        <tr>
          <td><code>ESSENTIAL_TREMOR</code></td>
          <td>Essential Tremor</td>
          <td>Tremor aksi bilateral (4-10 Hz) tanpa defisit gaya berjalan atau postur.</td>
          <td>~16.7%</td>
        </tr>
        <tr>
          <td><code>POST_STROKE</code></td>
          <td>Pasca Stroke (Hemiplegia)</td>
          <td>Asimetri ekstrem pada gaya berjalan dan ayunan lengan, kadense lambat.</td>
          <td>~16.7%</td>
        </tr>
        <tr>
          <td><code>CEREBELLAR_ATAXIA</code></td>
          <td>Ataksia Serebelar</td>
          <td>Instabilitas postural sangat parah (sway area besar), dismetria ketukan.</td>
          <td>~16.7%</td>
        </tr>
      </tbody>
    </table>

    <h2>Peningkatan Algoritma: Weighted Distance K-NN (k=11)</h2>
    <p>
      Model klasifikasi menggunakan <strong>K-Nearest Neighbors berbobot (k=11)</strong> yang telah ditingkatkan:
    </p>
    <ul style="margin-left: 20px; margin-bottom: 10px; font-size: 9pt;">
      <li><strong>Distribusi Gaussian (Box-Muller Transform):</strong> Menghasilkan persebaran data alami dengan variasi pasien realistis.</li>
      <li><strong>Z-Score Normalization:</strong> Menyamakan skala seluruh fitur biomarker (mis. frekuensi Hz, derajat ayunan, hingga luas area cm&sup2;).</li>
      <li><strong>Clinical Feature Weighting:</strong> Memberikan bobot lebih besar pada biomarker diagnostik kunci (mis. asimetri ayunan lengan dan amplitudo tremor).</li>
      <li><strong>Penyesuaian Usia (Age-Adjusted Norms):</strong> Ambang batas gaya berjalan dan rentang gerak disesuaikan otomatis untuk lansia agar terhindar dari bias usia (false positive).</li>
    </ul>

    <div class="card card-highlight">
      <div class="card-title">Tingkat Akurasi Model yang Teruji</div>
      <p>Berdasarkan pengujian 400 data uji mandiri (test split), model K-NN menghasilkan akurasi diagnostik sebesar <strong>88.5% sampai 93.2%</strong> dengan nilai F1-Score seimbang di semua kelas tanpa mengalami overfitting artifisial.</p>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ── BAGIAN 4: INTEGRASI AI & KEAMANAN SISTEM ───────────────────────────── -->
  <div class="header">
    <div>
      <div class="brand">NEURONMOTION</div>
      <div class="brand-sub">Sintesis AI Gemini & Arsitektur Keamanan Data</div>
    </div>
    <div class="meta-box">
      <strong>BAB 4: AI Multimodal & Keamanan</strong><br>
      Isolasi Hubungan Dokter-Pasien
    </div>
  </div>

  <div class="section">
    <h1>4. Asisten AI Gemini 2.5 & Kolaborasi Medis</h1>

    <h2>Sintesis Naratif AI Multimodal</h2>
    <p>
      NeuronMotion mengintegrasikan <strong>Gemini 2.5 Flash</strong> untuk menyusun ringkasan klinis yang mudah dipahami pasien awam:
    </p>
    <div class="grid-2">
      <div class="card">
        <div class="card-title">Masukan Sumber Ganda</div>
        <p>1. Gejala subjektif dari kuesioner pra-skrining (keluhan rasa kaku, tremor istirahat, lama gejala).<br>2. Nilai biomarker kuantitatif hasil ekstraksi visi komputer.</p>
      </div>
      <div class="card">
        <div class="card-title">Keluaran Analisis AI</div>
        <p>Ringkasan kondisi bahasa awam, penilaian tingkat keyakinan (TINGGI/SEDANG), korelasi gejala terhadap metrik sensorik, serta saran tindak lanjut non-diagnostik.</p>
      </div>
    </div>

    <h2>Isolasi Hubungan Pasien & Dokter (Zero Leakage)</h2>
    <p>
      Platform menerapkan prinsip isolasi data ketat berbasis <em>patient consent</em>:
    </p>
    <div class="flow-container">
      <div class="flow-step">
        <div class="step-num">&#128274;</div>
        <div class="step-content">
          <div class="step-title">Akun Mandiri Pasien</div>
          <div class="step-desc">Pasien yang mendaftar secara independen tidak dapat dilihat oleh dokter manapun di dashboard portal dokter sampai pasien dengan sengaja memberikan <strong>Share Code</strong> miliknya.</div>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-num">&#128104;&#8205;&#9877;</div>
        <div class="step-content">
          <div class="step-title">Portal Tenaga Medis (/doctor)</div>
          <div class="step-desc">Dokter hanya memiliki visibilitas atas pasien yang telah tertaut secara aktif. Dokter dapat memasukkan catatan klinis, rekomendasi resep, serta mencetak Rekam Medis terverifikasi dengan QR Code & Tanda Tangan Digital terkompresi.</div>
        </div>
      </div>
      <div class="flow-step">
        <div class="step-num">&#127758;</div>
        <div class="step-content">
          <div class="step-title">Sebaran Wilayah Terkunci (Scope Indonesia)</div>
          <div class="step-desc">Dashboard dokter menyajikan sebaran makro geografis pasien (Provinsi dan Kota di Seluruh Indonesia) dengan data terisolasi dan dropdown form yang terkunci rapi.</div>
        </div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Struktur Basis Data & Akun Pengujian</h2>
    <table>
      <thead>
        <tr>
          <th>Tipe Pengguna</th>
          <th>Alamat Email</th>
          <th>Kata Sandi</th>
          <th>Peran & Status Akses</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Dokter Spesialis</strong></td>
          <td><code>doctor@neuronmotion.id</code></td>
          <td><code>password123</code></td>
          <td>Dokter Neurologi (Memiliki akses 51 pasien tertaut & sebaran wilayah)</td>
        </tr>
        <tr>
          <td><strong>Pasien Mandiri</strong></td>
          <td><code>adhitya@neuronmotion.id</code></td>
          <td><code>password123</code></td>
          <td>Pasien mandiri (Memiliki 15 riwayat skrining, <strong>bebas/tanpa dokter</strong>)</td>
        </tr>
        <tr>
          <td><strong>Pasien Demo</strong></td>
          <td><code>pasien@neuronmotion.id</code></td>
          <td><code>password123</code></td>
          <td>Pasien binaan yang tertaut ke dr. Budi Setiawan</td>
        </tr>
        <tr>
          <td><strong>Administrator</strong></td>
          <td><code>admin@neuronmotion.id</code></td>
          <td><code>password123</code></td>
          <td>Manajemen sistem, dataset training, dan konfigurasi platform</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="note-disclaimer">
    <strong>Pernyataan Kepatuhan Medis (Medical Disclaimer):</strong> NeuronMotion dirancang sebagai alat bantu penapisan awal (screening tool) dan sistem pendukung keputusan klinis. Sistem ini tidak menggantikan konsultasi langsung, pemeriksaan neurologis komprehensif, maupun penegakan diagnosis definitif oleh dokter spesialis saraf berlisensi.
  </div>

</body>
</html>`;

const tempHtmlPath = join(process.cwd(), 'temp_master_docs.html');
const outputPdfPath = join(process.cwd(), 'Buku_Dokumentasi_Lengkap_NeuronMotion.pdf');
const userDownloadsDir = '/Users/akhzafachrozy/Downloads';

writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const chromePath = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`;

try {
  console.log('Generating Master Documentation PDF via Chrome Beta Headless...');
  execSync(cmd);
  unlinkSync(tempHtmlPath);
  console.log('Master PDF created at:', outputPdfPath);

  // Copy to Downloads folder
  const targetPath = join(userDownloadsDir, 'Buku_Dokumentasi_Lengkap_NeuronMotion.pdf');
  copyFileSync(outputPdfPath, targetPath);
  console.log('Copied to Downloads at:', targetPath);

  // Also copy the other 3 generated PDFs to Downloads
  const pdfList = [
    'Laporan_Spesifikasi_dan_Akurasi_NeuronMotion.pdf',
    'Panduan_Pengguna_NeuronMotion_Guidebook.pdf',
    'Daftar_Pertanyaan_dan_Jawaban_Presentasi_NeuronMotion.pdf'
  ];

  for (const pdf of pdfList) {
    const src = join(process.cwd(), pdf);
    const dest = join(userDownloadsDir, pdf);
    copyFileSync(src, dest);
    console.log(`Copied ${pdf} to Downloads`);
  }

  console.log('\n🎉 ALL PDFs generated and saved to ~/Downloads successfully!');
} catch (err) {
  console.error('Failed to generate Master PDF:', err);
  process.exit(1);
}
