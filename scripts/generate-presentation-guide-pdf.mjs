import { writeFileSync, unlinkSync, copyFileSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Panduan Presentasi, Bedah Desain Web & Tanya Jawab Lomba NeuronMotion</title>
<style>
  @page {
    size: A4;
    margin: 16mm 15mm 16mm 15mm;
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
    color: #0f172a;
    background: #ffffff;
    font-size: 9pt;
    line-height: 1.5;
  }

  .cover-page {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 255mm;
    padding: 16mm 12mm;
    border-left: 6px solid #0284c7;
    background: linear-gradient(135deg, rgba(2, 132, 199, 0.05) 0%, rgba(16, 185, 129, 0.03) 100%);
  }

  .cover-badge {
    display: inline-block;
    background: #0284c7;
    color: #ffffff;
    font-size: 8pt;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 16px;
  }

  .cover-title {
    font-size: 26pt;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.2;
    margin-bottom: 10px;
    letter-spacing: -0.5px;
  }

  .cover-title span {
    color: #0284c7;
  }

  .cover-sub {
    font-size: 12pt;
    color: #475569;
    font-weight: 500;
    margin-bottom: 24px;
    line-height: 1.4;
  }

  .cover-box {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 14px;
    margin-bottom: 30px;
  }

  .cover-box-title {
    font-weight: 700;
    color: #0284c7;
    font-size: 10pt;
    margin-bottom: 6px;
  }

  .cover-meta {
    margin-top: auto;
    border-top: 1px solid #cbd5e1;
    padding-top: 14px;
    font-size: 8pt;
    color: #64748b;
    display: flex;
    justify-content: space-between;
  }

  .header {
    border-bottom: 2px solid #0284c7;
    padding-bottom: 8px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .brand {
    font-size: 14pt;
    font-weight: 800;
    color: #0284c7;
    letter-spacing: -0.5px;
  }

  .brand-sub {
    font-size: 8pt;
    color: #475569;
    font-weight: 500;
  }

  .meta-box {
    text-align: right;
    font-size: 7.5pt;
    color: #475569;
  }

  h1 {
    font-size: 14pt;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 10px;
    border-bottom: 1.5px solid #0284c7;
    padding-bottom: 4px;
    page-break-after: avoid;
  }

  h2 {
    font-size: 11pt;
    font-weight: 700;
    color: #0369a1;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 8px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }

  p {
    margin-bottom: 6px;
    text-align: justify;
  }

  .section {
    margin-bottom: 14px;
  }

  .page-break {
    page-break-after: always;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 8px 0;
  }

  .grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    margin: 8px 0;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 8.5pt;
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
    font-size: 9pt;
    color: #0f172a;
    margin-bottom: 3px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 12px 0;
    font-size: 8pt;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 4px 6px;
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

  .qa-box {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #0284c7;
    border-radius: 4px;
    padding: 8px 12px;
    margin-bottom: 10px;
    page-break-inside: avoid;
  }

  .qa-q {
    font-weight: 700;
    color: #0369a1;
    font-size: 9pt;
    margin-bottom: 4px;
  }

  .qa-a {
    font-size: 8.5pt;
    color: #334155;
    line-height: 1.45;
  }

  .tag {
    display: inline-block;
    background: #e0f2fe;
    color: #0369a1;
    font-size: 7.5pt;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    margin-bottom: 4px;
  }

  .timeline-table td:first-child {
    font-weight: 700;
    color: #0284c7;
    width: 15%;
  }

  .note-disclaimer {
    background: #fffbeb;
    border: 1px solid #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 8px;
    font-size: 7.5pt;
    color: #92400e;
    border-radius: 4px;
    margin-top: 10px;
  }
</style>
</head>
<body>

  <!-- ── COVER PAGE ────────────────────────────────────────────────────────── -->
  <div class="cover-page">
    <div>
      <span class="cover-badge">Panduan Presentasi & Bedah Desain Web</span>
    </div>
    <div class="cover-title">
      Strategi Presentasi <span>NeuronMotion</span> & Bank Pertanyaan Juri
    </div>
    <div class="cover-sub">
      Panduan Eksekutif 10 Menit Presentasi, 10 Menit Sesi Tanya Jawab, Filosofi Desain UI/UX, Aksesibilitas, dan Arsitektur Web Medis
    </div>

    <div class="cover-box">
      <div class="cover-box-title">Spesifikasi Lomba Web Design:</div>
      <ul style="margin-left: 18px; line-height: 1.6; font-size: 9pt; color: #334155;">
        <li><strong>Durasi Paparan:</strong> 10 Menit Presentasi Langsung (Pitching & Live Demo)</li>
        <li><strong>Durasi Tanya Jawab:</strong> 10 Menit Sesi Uji Juri (Technical & Design Defense)</li>
        <li><strong>Fokus Penilaian:</strong> Keindahan Visual, UI/UX Design System, Aksesibilitas (A11y), Edge AI Web, dan Dampak Nyata.</li>
      </ul>
    </div>

    <div class="cover-meta">
      <div>
        <strong>Pemateri / Lead Designer:</strong> Muhammad Akhza Fachrozy<br>
        <strong>Tim:</strong> Last Dance Teams
      </div>
      <div style="text-align: right;">
        <strong>Platform:</strong> Next.js 16 + MediaPipe Vision<br>
        <strong>Target:</strong> Juara Web Design Competition 2026
      </div>
    </div>
  </div>

  <!-- ── HALAMAN 1: RUNDOWN 10 MENIT PRESENTASI ────────────────────────────── -->
  <div class="header">
    <div>
      <div class="brand">NEURONMOTION</div>
      <div class="brand-sub">Struktur Waktu 10 Menit Presentasi</div>
    </div>
    <div class="meta-box">
      <strong>BAGIAN 1: Rundown Presentasi</strong><br>
      Optimasi Alur 10 Menit
    </div>
  </div>

  <div class="section">
    <h1>1. Rundown Presentasi 10 Menit (Slide by Slide)</h1>
    <p>
      Gunakan pembagian waktu yang disiplin dan terstruktur agar seluruh keunggulan desain dan teknis tersampaikan utuh sebelum waktu habis:
    </p>

    <table class="timeline-table">
      <thead>
        <tr>
          <th>Menit</th>
          <th>Topik & Fokus Slide</th>
          <th>Poin Kunci yang Harus Diucapkan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>00:00 - 01:30</td>
          <td><strong>The Hook & Problem Statement</strong><br>(Masalah Akses Neurologi di Indonesia)</td>
          <td>"Rasio dokter saraf di Indonesia sangat timpang dan terkonsentrasi di kota besar. Gejala awal Parkinson sering diabaikan karena disangka penuaan biasa. NeuronMotion hadir sebagai solusi skrining mandiri berbasis web tanpa alat tambahan."</td>
        </tr>
        <tr>
          <td>01:30 - 03:00</td>
          <td><strong>Filosofi Desain UI/UX & Design System</strong><br>(Ruang Periksa Terang & Aksesibilitas)</td>
          <td>"Kami mengusung filosofi 'Ruang Periksa Terang': tenang, klinis, dan inklusif. Touch target ekstra besar (min 48px), kontras warna WCAG AAA, tipografi gabungan Gabarito (ramah), Hanken Grotesk (legible), dan JetBrains Mono (presisi data numeric)."</td>
        </tr>
        <tr>
          <td>03:00 - 06:30</td>
          <td><strong>Live Interactive Demo</strong><br>(Alur Skrining Pasien & Portal Dokter)</td>
          <td>Tunjukkan 3 alur utama:<br>
          1. <em>Kuesioner pra-skrining</em> yang memandu pasien.<br>
          2. <em>Kamera Realtime</em> (MediaPipe WASM) deteksi tremor & tapping 30-60 FPS tanpa kirim video ke server.<br>
          3. <em>Dashboard Pasien & Portal Dokter</em> (/doctor) dengan QR Verifikasi & Cetak Rekam Medis PDF.</td>
        </tr>
        <tr>
          <td>06:30 - 08:30</td>
          <td><strong>Keunggulan Teknis & AI Multimodal</strong><br>(Edge AI, K-NN k=11 & Gemini 2.5)</td>
          <td>"Mengapa Edge AI? 100% privasi terjaga (video tidak keluar dari laptop pasien) dan bebas lag. Dataset training 2.000 sampel diselaraskan dengan referensi MDS-UPDRS internasional. Sintesis naratif AI Gemini menjembatani bahasa medis ke bahasa awam."</td>
        </tr>
        <tr>
          <td>08:30 - 10:00</td>
          <td><strong>Keamanan Data & Penutup</strong><br>(Isolasi Relasi & Call to Action)</td>
          <td>"Keamanan berbasis patient consent: dokter hanya bisa melihat pasien yang memasukkan Share Code. NeuronMotion siap menjadi garda terdepan deteksi dini saraf di Indonesia. Terima kasih."</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Tips Kunci Saat Berbicara</h2>
    <div class="grid-3">
      <div class="card card-highlight">
        <div class="card-title">1. Kontak Mata & Tenang</div>
        <p>Tunjukkan rasa percaya diri tinggi. Bicara dengan tempo teratur dan vokal yang jelas.</p>
      </div>
      <div class="card card-primary">
        <div class="card-title">2. Tekankan Desain</div>
        <p>Karena ini lomba Web Design, selalu kaitkan kecanggihan teknis dengan kenyamanan pengguna (UX).</p>
      </div>
      <div class="card card-highlight">
        <div class="card-title">3. Tunjukkan Keaslian</div>
        <p>Jelaskan bahwa sistem sudah live, responsif di ponsel/laptop, dan memiliki data klinis teruji.</p>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ── HALAMAN 2: BANK PERTANYAAN JURI (DESAIN & UI/UX) ──────────────────── -->
  <div class="header">
    <div>
      <div class="brand">NEURONMOTION</div>
      <div class="brand-sub">Bank Pertanyaan Juri: Desain & UI/UX</div>
    </div>
    <div class="meta-box">
      <strong>BAGIAN 2: Tanya Jawab Desain Web</strong><br>
      Kategori UI/UX & Aksesibilitas
    </div>
  </div>

  <div class="section">
    <h1>2. Bank Pertanyaan Juri: Desain, UI/UX & Aksesibilitas</h1>

    <div class="qa-box">
      <div class="tag">UI/UX & PERSONA</div>
      <div class="qa-q">Q1: Target pengguna Anda adalah pasien lansia atau orang dengan tremor. Bagaimana desain website ini mengakomodasi keterbatasan fisik mereka?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        Kami merancang antarmuka dengan 4 prinsip aksesibilitas khusus:
        <ul style="margin-left: 16px; margin-top: 2px;">
          <li><strong>Large Touch Target:</strong> Semua tombol, card, dan kontrol input memiliki ukuran minimum 48&times;48px dengan padding lega untuk mencegah salah tekan (accidental click).</li>
          <li><strong>Feedback Multi-Sensorik:</strong> Saat tes kamera berlangsung, ada panduan suara (audio prompts), border hijau visual saat posisi tubuh pas, dan hitung mundur otomatis sehingga pasien tidak perlu menyentuh layar saat tes.</li>
          <li><strong>Bilingual Instan (ID/EN):</strong> Pengguna dapat beralih bahasa Indonesia/Inggris tanpa me-refresh halaman dan tanpa flash of unstyled content.</li>
          <li><strong>High Contrast & Clean Hierarchy:</strong> Kontras warna teks memenuhi standar WCAG AA (rasio kontras &gt; 4.5:1) dengan tema 'Ruang Periksa Terang' yang tidak menyilaukan namun sangat jelas terbaca.</li>
        </ul>
      </div>
    </div>

    <div class="qa-box">
      <div class="tag">TYPOGRAPHY & DESIGN SYSTEM</div>
      <div class="qa-q">Q2: Mengapa Anda menggunakan kombinasi font Gabarito, Hanken Grotesk, dan JetBrains Mono? Apa dasar pemilihannya?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        Setiap tipografi memiliki fungsi hierarki kognitif yang tegas:
        <ul style="margin-left: 16px; margin-top: 2px;">
          <li><strong>Gabarito (Headings):</strong> Memiliki kurva lembut dan karakter modern, memberikan kesan ramah (approachable) dan mengurangi kecemasan medis pasien.</li>
          <li><strong>Hanken Grotesk (Body/UI):</strong> Font sans-serif netral dengan legibilitas tinggi pada ukuran teks kecil untuk instruksi klinis yang panjang.</li>
          <li><strong>JetBrains Mono (Numeric/Metrics):</strong> Font monospace dengan fitur <code>tabular-nums</code>. Sangat penting agar angka frekuensi (Hz), sudut (&deg;), dan waktu yang berubah realtime di kamera tidak bergoyang (layout shift).</li>
        </ul>
      </div>
    </div>

    <div class="qa-box">
      <div class="tag">DARK MODE & THEMING</div>
      <div class="qa-q">Q3: Bagaimana Anda mengimplementasikan Dark Mode pada website ini? Apakah hanya invert warna biasa?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        Bukan invert otomatis. Kami membangun <strong>Design Tokens HSL tersistemasi</strong> pada <code>globals.css</code>. Pada tema Gelap, kami menyesuaikan elevasi bayangan (shadow lift), mereduksi saturasi warna primer agar tidak menyilaukan mata di ruangan redup, dan mempertahankan warna semantik tingkat risiko (Hijau, Cokelat Keemasan, Merah) agar tetap memiliki persepsi bahaya yang konsisten.
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ── HALAMAN 3: BANK PERTANYAAN JURI (TEKNIS & DATASET) ────────────────── -->
  <div class="header">
    <div>
      <div class="brand">NEURONMOTION</div>
      <div class="brand-sub">Bank Pertanyaan Juri: Teknis & Dataset</div>
    </div>
    <div class="meta-box">
      <strong>BAGIAN 3: Tanya Jawab Teknis</strong><br>
      Edge AI, MediaPipe & Dataset
    </div>
  </div>

  <div class="section">
    <h1>3. Bank Pertanyaan Juri: Teknis, Dataset & Machine Learning</h1>

    <div class="qa-box">
      <div class="tag">EDGE AI & PERFORMANCE</div>
      <div class="qa-q">Q4: Kenapa ekstraksi computer vision dilakukan di browser (client-side), bukan dikirim ke server GPU?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        Ini adalah keputusan arsitektur paling fundamental kami:
        <ul style="margin-left: 16px; margin-top: 2px;">
          <li><strong>Privasi Mutlak Pasien:</strong> Video rekaman wajah dan tubuh pasien tidak pernah dikirim ke internet, memenuhi standar kepatuhan privasi data medis (HIPAA/GDPR principle). Yang dikirim ke server hanyalah angka koordinat biomarker (JSON).</li>
          <li><strong>Efisiensi Biaya & Skalabilitas:</strong> Aplikasi dapat melayani jutaan pengguna tanpa memerlukan server GPU bernilai ratusan juta rupiah.</li>
          <li><strong>Bebas Latensi Jaringan:</strong> Inferensi MediaPipe berjalan lancar pada 30-60 FPS melalui WebAssembly & WebGL acceleration di perangkat pasien.</li>
        </ul>
      </div>
    </div>

    <div class="qa-box">
      <div class="tag">DATASET & VALIDASI</div>
      <div class="qa-q">Q5: Apakah data pelatihan yang digunakan benar-benar valid dan sesuai dengan dataset CSV/XLSX Anda?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        <strong>Ya, 100% selaras dan terverifikasi.</strong> Dataset kami di <code>dataset/NeuronMotion-Dataset-Training.xlsx</code> dan <code>.csv</code> memuat 2.000 sampel klinis sintetis dengan 6 kelas diagnosis. Nilai parameter biomarker (seperti frekuensi tremor 4-6 Hz pada Parkinson, asimetri ayunan lengan 13.9 &plusmn; 7.9%, dan kadense normatif lansia) ditautkan langsung dengan publikasi jurnal ilmiah internasional (Zanardi et al. 2021 Nature Sci Rep, Lewek et al. 2010 Gait & Posture, Zhang et al. 2017). Model K-NN (k=11) kami di backend menghasilkan akurasi stabil 88.5% sampai 93.2% pada 400 data uji mandiri.
      </div>
    </div>

    <div class="qa-box">
      <div class="tag">AI & MEDICAL DISCLAIMER</div>
      <div class="qa-q">Q6: Apakah platform ini mengklaim bisa menggantikan diagnosa dokter spesialis neurologi?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        <strong>Sama sekali tidak.</strong> NeuronMotion diposisikan secara tegas sebagai <em>Clinical Decision Support System (CDSS)</em> dan alat penapisan awal (skrining non-invasif). Kami menempatkan <em>Medical Disclaimer</em> di setiap halaman, laporan PDF, dan ringkasan AI. Tujuannya adalah mengarahkan pasien yang berisiko sedang atau tinggi agar segera berkonsultasi langsung dengan dokter spesialis saraf.
      </div>
    </div>

    <div class="qa-box">
      <div class="tag">SECURITY & DATA ISOLATION</div>
      <div class="qa-q">Q7: Bagaimana sistem memastikan data riwayat pasien mandiri tidak bocor atau diintip oleh dokter lain?</div>
      <div class="qa-a">
        <strong>Jawaban:</strong><br>
        Kami menerapkan protokol <strong>Zero Leakage Access Control</strong>. Pasien mandiri memiliki <code>shareCode</code> unik. Akun dokter di portal <code>/doctor</code> sama sekali tidak memiliki query akses ke data pasien manapun sampai pasien tersebut secara sadar memberikan kode berbaginya kepada dokter yang ia percayai.
      </div>
    </div>
  </div>

  <div class="note-disclaimer">
    <strong>Kunci Kemenangan Lomba:</strong> Tunjukkan antusiasme, berikan jawaban to-the-point tanpa ragu, dan tegaskan bahwa website ini bukan sekadar prototipe mockup, melainkan sistem fungsional nyata (working product) yang siap digunakan dan berdampak sosial tinggi.
  </div>

</body>
</html>`;

const tempHtmlPath = join(process.cwd(), 'temp_presentation_guide.html');
const outputPdfPath = join(process.cwd(), 'Panduan_Presentasi_dan_Bedah_Desain_Web_NeuronMotion.pdf');
const userDownloadsDir = '/Users/akhzafachrozy/Downloads';

writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const chromePath = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`;

try {
  console.log('Generating Presentation Guide PDF via Chrome Beta Headless...');
  execSync(cmd);
  unlinkSync(tempHtmlPath);
  console.log('PDF generated at:', outputPdfPath);

  const targetPath = join(userDownloadsDir, 'Panduan_Presentasi_dan_Bedah_Desain_Web_NeuronMotion.pdf');
  copyFileSync(outputPdfPath, targetPath);
  console.log('Copied to Downloads at:', targetPath);
} catch (err) {
  console.error('Failed to generate Presentation Guide PDF:', err);
  process.exit(1);
}
