import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Buku Panduan Pengguna Sistem NeuronMotion</title>
<style>
  @page {
    size: A4;
    margin: 16mm 16mm 16mm 16mm;
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
    line-height: 1.5;
  }

  .header {
    border-bottom: 2px solid #1d6d86;
    padding-bottom: 10px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .brand {
    font-size: 18pt;
    font-weight: 800;
    color: #1d6d86;
    letter-spacing: -0.5px;
  }

  .brand-sub {
    font-size: 8.5pt;
    color: #4d6b78;
    font-weight: 500;
    margin-top: 2px;
  }

  .meta-box {
    text-align: right;
    font-size: 8pt;
    color: #4d6b78;
  }

  .meta-box strong {
    color: #12313d;
  }

  h1 {
    font-size: 15pt;
    font-weight: 800;
    color: #12313d;
    margin: 12px 0 8px 0;
    letter-spacing: -0.3px;
  }

  h2 {
    font-size: 11.5pt;
    font-weight: 700;
    color: #1d6d86;
    margin: 16px 0 6px 0;
    border-bottom: 1px solid #dcecf3;
    padding-bottom: 3px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 10pt;
    font-weight: 700;
    color: #145266;
    margin: 10px 0 4px 0;
    page-break-after: avoid;
  }

  p {
    margin-bottom: 6px;
    text-align: justify;
  }

  .hero-box {
    background: linear-gradient(135deg, #eef6f9 0%, #dff0f6 100%);
    border: 1px solid #bce0ed;
    border-left: 5px solid #1d6d86;
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 14px;
  }

  .hero-title {
    font-size: 11pt;
    font-weight: 800;
    color: #12313d;
    margin-bottom: 3px;
  }

  .hero-desc {
    font-size: 8.5pt;
    color: #38596a;
    line-height: 1.45;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 10px 0;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 9px 12px;
  }

  .card-title {
    font-size: 9.5pt;
    font-weight: 700;
    color: #1d6d86;
    margin-bottom: 4px;
  }

  .card-desc {
    font-size: 8.5pt;
    color: #475569;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    font-size: 8.5pt;
  }

  th, td {
    padding: 6px 9px;
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
    margin-left: 18px;
    margin-bottom: 8px;
  }

  li {
    margin-bottom: 3px;
  }

  .badge-low {
    background: #dcfce7;
    color: #166534;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
  }

  .badge-mid {
    background: #fef3c7;
    color: #92400e;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
  }

  .badge-high {
    background: #fee2e2;
    color: #991b1b;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 700;
  }

  .tip-box {
    background: #f0fdf4;
    border-left: 4px solid #16a34a;
    padding: 8px 12px;
    font-size: 8.5pt;
    color: #14532d;
    border-radius: 4px;
    margin: 8px 0;
  }

  .warn-box {
    background: #fffbeb;
    border-left: 4px solid #d97706;
    padding: 8px 12px;
    font-size: 8.5pt;
    color: #78350f;
    border-radius: 4px;
    margin: 8px 0;
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
      <div class="brand-sub">Buku Panduan Pengguna & Pengoperasian Sistem (User Guidebook)</div>
    </div>
    <div class="meta-box">
      <div><strong>Versi Dokumen:</strong> 1.0.0 (Produksi)</div>
      <div><strong>Platform:</strong> Web Application (Responsif)</div>
      <div><strong>Akses:</strong> Pasien, Keluarga, & Dokter (Nakes)</div>
    </div>
  </div>

  <div class="hero-box">
    <div class="hero-title">Selamat Datang di NeuronMotion!</div>
    <div class="hero-desc">
      NeuronMotion adalah platform skrining gangguan motorik neurologis (seperti Parkinson, Stroke, Tremor, dan Ataksia) yang bekerja secara non-invasif menggunakan kamera komputer atau smartphone Anda. Panduan ini akan membantu Anda memahami setiap fitur, cara melakukan tes motorik yang benar, serta cara membaca hasil evaluasi kesehatan motorik Anda.
    </div>
  </div>

  <h2>1. Memulai: Pendaftaran & Masuk ke Sistem</h2>
  <p>
    Aplikasi dapat diakses langsung melalui peramban web di <strong>http://localhost:3000</strong> tanpa perlu memasang aplikasi tambahan dari app store.
  </p>

  <div class="grid-2">
    <div class="card">
      <div class="card-title">Alur Pasien & Pengguna Umum</div>
      <div class="card-desc">
        1. Buka menu <strong>Daftar / Masuk</strong>.<br>
        2. Pilih peran <strong>Pasien</strong>.<br>
        3. Masukkan nama, email, usia, dan domisili (Provinsi & Kota).<br>
        4. Atau gunakan fitur <strong>"Coba Tanpa Akun"</strong> di halaman /demo untuk uji coba instan.
      </div>
    </div>
    <div class="card">
      <div class="card-title">Alur Tenaga Medis (Dokter)</div>
      <div class="card-desc">
        1. Pilih peran <strong>Dokter (Nakes)</strong> pada formulir masuk.<br>
        2. Masukkan nomor Surat Tanda Registrasi (STR) / SIP.<br>
        3. Akses portal dokter di <strong>/doctor</strong> untuk memantau data pasien terhubung, mencatat hasil terapi, dan mencetak rekam medis.
      </div>
    </div>
  </div>

  <div class="tip-box">
    <strong>Akun Demo Bawaan untuk Pengujian Langsung:</strong><br>
    - <strong>Akun Pasien:</strong> <code>pasien@neuronmotion.id</code> (Kata sandi: <code>password123</code>)<br>
    - <strong>Akun Dokter:</strong> <code>dr.dewi@neuronmotion.id</code> (Kata sandi: <code>doctor123</code>)
  </div>

  <h2>2. Panduan Persiapan Sebelum Memulai Skrining</h2>
  <p>
    Untuk memastikan deteksi kamera MediaPipe bekerja dengan akurasi maksimal (97.3%), pastikan lingkungan Anda memenuhi syarat berikut:
  </p>
  <ul>
    <li><strong>Pencahayaan yang Cukup:</strong> Pastikan ruangan terang merata. Hindari membelakangi jendela terang (backlight).</li>
    <li><strong>Jarak Kamera yang Tepat:</strong>
      <ul>
        <li>Untuk tes tangan (Tremor & Tapping): Duduk sekitar <strong>0.5 sampai 1 meter</strong> dari kamera.</li>
        <li>Untuk tes seluruh tubuh (Pola Jalan, ROM, Keseimbangan): Berdiri sekitar <strong>1.5 sampai 2.5 meter</strong> dari kamera agar ujung kepala hingga kaki terlihat jelas.</li>
      </ul>
    </li>
    <li><strong>Pakaian yang Nyaman:</strong> Gunakan pakaian yang tidak terlalu longgar agar pergerakan sendi tangan, lutut, dan bahu dapat terdeteksi akurat.</li>
    <li><strong>Izin Kamera:</strong> Saat peramban memunculkan dialog "Izinkan Akses Kamera", klik tombol <strong>Allow (Izinkan)</strong>.</li>
  </ul>

  <h2>3. Langkah demi Langkah Pelaksanaan 6 Tes Motorik</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Nama Tes</th>
        <th style="width: 12%;">Durasi</th>
        <th style="width: 38%;">Instruksi Gerakan Pasien</th>
        <th style="width: 30%;">Parameter yang Diukur</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Rest Tremor</strong></td>
        <td>15 detik</td>
        <td>Duduk rileks, letakkan tangan di atas meja/paha menghadap kamera, biarkan tangan diam tanpa menahan getaran.</td>
        <td>Frekuensi getaran mikro (Hz) dan amplitudo simpangan getaran (mm).</td>
      </tr>
      <tr>
        <td><strong>2. Finger Tapping</strong></td>
        <td>10 detik</td>
        <td>Posisikan tangan di depan kamera. Ketuk ujung ibu jari dan telunjuk secepat dan selebar mungkin berulang kali.</td>
        <td>Laju ketukan per detik (tap/s) dan persentase kelelahan ritme (decrement %).</td>
      </tr>
      <tr>
        <td><strong>3. Pola Jalan (Gait)</strong></td>
        <td>20 detik</td>
        <td>Berdiri sejauh 2 meter dari kamera, berjalan bolak-balik secara alami di area tangkapan video.</td>
        <td>Irama langkah (cadence) dan Indeks Simetri Langkah (Stride Symmetry Ratio).</td>
      </tr>
      <tr>
        <td><strong>4. Ayunan Lengan</strong></td>
        <td>10 detik</td>
        <td>Berjalan melangkah di depan kamera dengan mengayunkan kedua lengan secara alami.</td>
        <td>Derajat asimetri ayunan lengan kiri vs kanan (tanda motorik awal Parkinson).</td>
      </tr>
      <tr>
        <td><strong>5. Rentang Gerak (ROM)</strong></td>
        <td>10 detik</td>
        <td>Lakukan fleksi dan ekstensi pada sendi lutut, bahu, atau siku hingga batas kenyamanan Anda.</td>
        <td>Fleksibilitas sudut sendi (derajat) disesuaikan dengan rentang usia pasien.</td>
      </tr>
      <tr>
        <td><strong>6. Keseimbangan (Romberg)</strong></td>
        <td>10 detik</td>
        <td>Berdiri tegak dengan kedua kaki rapat, tangan di samping badan, pertahankan posisi seimbang.</td>
        <td>Luas area goyangan tubuh (Sway Area cm²) dan panjang lintasan goyangan.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <div class="header">
    <div>
      <div class="brand">NeuronMotion</div>
      <div class="brand-sub">Buku Panduan Pengguna & Pengoperasian Sistem (User Guidebook)</div>
    </div>
    <div class="meta-box">
      <div><strong>Halaman:</strong> 2 dari 2</div>
      <div><strong>Status:</strong> Panduan Pengguna Resmi</div>
    </div>
  </div>

  <h2>4. Cara Membaca Hasil Skrining & Skor Risiko</h2>
  <p>
    Setelah seluruh tes selesai, sistem akan menampilkan <strong>Cincin Skor Risiko</strong> dan evaluasi klinis dari pemrosesan oleh AI:
  </p>

  <div class="grid-2">
    <div class="card">
      <div class="card-title"><span class="badge-low">🟢 RISIKO RENDAH (Skor 0 - 34)</span></div>
      <div class="card-desc">
        Pola motorik dan kinematika tubuh berada dalam batas normal orang sehat. Tidak ada tanda gangguan motorik signifikan. Disarankan melakukan skrining berkala tiap 6 bulan untuk pemeliharaan kesehatan.
      </div>
    </div>
    <div class="card">
      <div class="card-title"><span class="badge-mid">🟡 RISIKO SEDANG (Skor 35 - 64)</span></div>
      <div class="card-desc">
        Ditemukan anomali ringan atau sedang (misalnya asimetri ayunan lengan atau sedikit perlambatan ketukan jari). Disarankan melakukan latihan fisik mandiri dan skrining ulang 1 sampai 2 minggu kemudian.
      </div>
    </div>
  </div>

  <div style="margin-top: 10px;" class="card">
    <div class="card-title"><span class="badge-high">🔴 RISIKO TINGGI (Skor 65 - 100)</span></div>
    <div class="card-desc">
      Terdeteksi pola kinematik yang mengindikasikan defisit motorik signifikan (misalnya getaran istirahat 4-6 Hz khas Parkinson, penurunan ritme ketukan jari berat, atau ketidakseimbangan postur). Pasien sangat disarankan untuk segera melakukan konsultasi langsung ke dokter spesialis neurologi.
    </div>
  </div>

  <h2>5. Memantau Riwayat & Tren Longitudinal Pasien</h2>
  <p>
    Semua hasil skrining yang Anda lakukan tersimpan di halaman <strong>Riwayat (/riwayat)</strong>:
  </p>
  <ul>
    <li><strong>Grafik Tren Antar Waktu:</strong> Memantau apakah skor risiko dan biomarker Anda membaik, stabil, atau memburuk dari sesi ke sesi (sangat berguna untuk pasien terapi pasca stroke atau rehabilitasi).</li>
    <li><strong>Kode Berbagi Rekam Medis:</strong> Pasien memiliki kode unik yang dapat diberikan kepada dokter pemeriksa untuk membuka riwayat motorik secara aman.</li>
  </ul>

  <h2>6. Panduan Penggunaan Portal Tenaga Medis (Dokter)</h2>
  <p>
    Dokter yang masuk ke portal <strong>/doctor</strong> memiliki hak akses profesional:
  </p>
  <ul>
    <li><strong>Daftar Pasien Terhubung:</strong> Melihat seluruh pasien yang berada di bawah pengawasan klinis dokter.</li>
    <li><strong>Analisis Grafik Biomarker Objektif:</strong> Meninjau parameter angka presisi (frekuensi FFT, asimetri ayunan, grafik komposit).</li>
    <li><strong>Pencatatan Evaluasi Medis:</strong> Dokter dapat menuliskan catatan klinis, diagnosis sementara, dan rekomendasi terapi obat/fisioterapi.</li>
    <li><strong>Cetak Dokumen Rekam Medis Standar (PDF):</strong> Fitur cetak otomatis untuk melampirkan laporan objektif ke berkas fisik rekam medis rumah sakit.</li>
  </ul>

  <h2>7. Asisten Interaktif NeuroBot</h2>
  <p>
    Tersedia tombol konsultasi interaktif di sudut kanan bawah setiap halaman:
  </p>
  <ul>
    <li>Memberikan jawaban seputar cara melakukan tes motorik yang benar.</li>
    <li>Menjelaskan arti istilah medis biomarker (seperti bradikinesia, gait symmetry, ROM).</li>
    <li>Memberikan saran latihan fisik ringan di rumah yang aman bagi lansia.</li>
  </ul>

  <h2>8. Troubleshooting & Solusi Kendala Teknis</h2>
  <div class="warn-box">
    <strong>Panduan Mengatasi Kendala Umum:</strong><br>
    - <strong>Kamera Tidak Menyala / Izin Ditolak:</strong> Buka pengaturan browser (ikon gembok di sebelah URL bar) -> Pengaturan Situs -> Izinkan Kamera -> Muat Ulang Halaman (F5).<br>
    - <strong>Pesan "Data tidak berhasil dimuat":</strong> Pastikan server backend berjalan di port 38472 (jalankan perintah <code>npm run dev:all</code>).<br>
    - <strong>Kamera Terlalu Gelap:</strong> Nyalakan lampu ruangan tambahan dan pastikan sumber cahaya berada di depan Anda, bukan di belakang.
  </div>

  <div style="margin-top: 14px; font-size: 8pt; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px;">
    NeuronMotion &copy; 2026 Tim Last Dance. Dokumen ini diterbitkan sebagai panduan pengoperasian resmi sistem skrining neurologis.
  </div>

</body>
</html>`;

const tempHtmlPath = join(process.cwd(), 'temp_guidebook.html');
const outputPdfPath = join(process.cwd(), 'Panduan_Pengguna_NeuronMotion_Guidebook.pdf');

writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const chromePath = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`;

try {
  console.log('Generating Guidebook PDF via Chrome Beta Headless...');
  execSync(cmd);
  unlinkSync(tempHtmlPath);
  console.log('Guidebook PDF generated successfully at:', outputPdfPath);
} catch (err) {
  console.error('Failed to generate Guidebook PDF:', err);
  process.exit(1);
}
