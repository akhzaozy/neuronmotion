import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Daftar Pertanyaan dan Jawaban Presentasi NeuronMotion</title>
<style>
  @page {
    size: A4;
    margin: 14mm 14mm 14mm 14mm;
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
    font-size: 9pt;
    line-height: 1.45;
  }

  .header {
    border-bottom: 2px solid #1d6d86;
    padding-bottom: 8px;
    margin-bottom: 12px;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .brand {
    font-size: 16pt;
    font-weight: 800;
    color: #1d6d86;
    letter-spacing: -0.5px;
  }

  .brand-sub {
    font-size: 8pt;
    color: #4d6b78;
    font-weight: 500;
    margin-top: 1px;
  }

  .meta-box {
    text-align: right;
    font-size: 7.5pt;
    color: #4d6b78;
  }

  h1 {
    font-size: 13.5pt;
    font-weight: 800;
    color: #12313d;
    margin: 10px 0 6px 0;
  }

  h2 {
    font-size: 11pt;
    font-weight: 800;
    color: #1d6d86;
    margin: 14px 0 6px 0;
    border-bottom: 1.5px solid #dcecf3;
    padding-bottom: 2px;
    page-break-after: avoid;
  }

  .qa-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 8px;
    page-break-inside: avoid;
  }

  .qa-title {
    font-size: 9pt;
    font-weight: 700;
    color: #0f4c5c;
    margin-bottom: 3px;
    display: flex;
    align-items: flex-start;
  }

  .qa-tag {
    background: #dcecf3;
    color: #1d6d86;
    font-size: 7pt;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 3px;
    margin-right: 6px;
    text-transform: uppercase;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .qa-tag-tech {
    background: #e0e7ff;
    color: #3730a3;
  }

  .qa-tag-nontech {
    background: #fef3c7;
    color: #92400e;
  }

  .key-points {
    background: #ffffff;
    border-left: 3px solid #1d6d86;
    padding: 4px 8px;
    margin: 4px 0;
    font-size: 8pt;
    color: #334155;
  }

  .key-points strong {
    color: #0f172a;
  }

  .answer-text {
    font-size: 8.5pt;
    color: #1e293b;
    text-align: justify;
    line-height: 1.4;
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
      <div class="brand-sub">Panduan Tanya Jawab & Sidang Presentasi Hasil (Q&A Defense Guide)</div>
    </div>
    <div class="meta-box">
      <div><strong>Tim:</strong> Last Dance</div>
      <div><strong>Fokus:</strong> Aspek Teknis & Non-Teknis</div>
      <div><strong>Status:</strong> Siap Sidang / Presentasi</div>
    </div>
  </div>

  <h2>A. Kategori Pertanyaan Non-Teknis (Medis, Dampak, Privasi, & Bisnis)</h2>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-nontech">Non-Teknis</span>
      1. Apa urgensi dan masalah utama yang diselesaikan oleh NeuronMotion?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Ketimpangan rasio neurolog, mahalnya alat gait lab ratusan juta rupiah, dan keterlambatan deteksi dini Parkinson/stroke di daerah terpencil.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Di Indonesia, rasio dokter spesialis saraf sangat timpang dan terpusat di kota besar, sementara alat analisa gerak medis (gait lab) bernilai ratusan juta rupiah. Akibatnya, penyakit degeneratif seperti Parkinson dan komplikasi stroke sering terlambat terdeteksi hingga stadium lanjut. NeuronMotion mendemokratisasi akses skrining neurologis: pasien cukup menggunakan kamera laptop/HP selama ~75 detik untuk mendapatkan skrining awal non-invasif dan pemantauan tren terapi berkala dari rumah secara gratis.
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-nontech">Non-Teknis</span>
      2. Apakah NeuronMotion menggantikan dokter spesialis saraf (neurolog)?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Bukan alat diagnosis definitif tunggal, melainkan Clinical Decision Support System (CDSS) dan jembatan rujukan dini.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Sama sekali tidak. NeuronMotion diposisikan secara tegas sebagai alat skrining awal dan sistem pendukung keputusan klinis (CDSS). Sistem ini menyaring dan memetakan anomali motorik objektif agar pasien sadar kapan harus segera ke faskes, serta memberikan data kuantitatif yang rapi bagi dokter spesialis melalui portal tenaga medis (/doctor) untuk mempercepat evaluasi klinis.
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-nontech">Non-Teknis</span>
      3. Bagaimana sistem melindungi privasi data video pasien yang sensitif?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Zero-Video Transmission architecture, pemrosesan on-device WebAssembly, kepatuhan UU PDP Indonesia.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Kami menerapkan arsitektur Zero-Video Transmission. Seluruh aliran video kamera diproses secara lokal di browser pasien menggunakan MediaPipe WebAssembly. Video tidak pernah direkam, tidak disimpan di server, dan tidak ditransmisikan ke internet. Yang dikirim ke server hanyalah koordinat angka spatial-temporal (x, y, z) murni. Ini menjamin kepatuhan penuh terhadap prinsip perlindungan data medis dan UU PDP.
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-nontech">Non-Teknis</span>
      4. Pasien Parkinson/stroke mayoritas lansia, bagaimana aspek keramahan pengguna (UX)?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Touch target 44px minimum, teks kontras tinggi, panduan animasi visual otomatis, tanpa instalasi app store.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Kami merancang antarmuka ramah lansia: target sentuh tombol minimal 44px, ukuran font besar berkontras tinggi, instruksi visual beranimasi per frame, dan hitung mundur otomatis sehingga lansia tidak perlu menekan tombol saat berdiri jauh dari kamera. Selain itu, webapp dapat langsung dibuka via tautan browser tanpa hambatan instalasi app store.
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-nontech">Non-Teknis</span>
      5. Bagaimana potensi keberlanjutan dan integrasi faskes di masa depan?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Integrasi API SATUSEHAT Kemenkes, tele-monitoring pasien pasca rawat inap RS, dan ekspor rekam medis PDF standar.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> NeuronMotion dirancang siap integrasi: fitur ekspor PDF standar rekam medis sudah tersedia, dan arsitektur REST API dapat dihubungkan ke platform SATUSEHAT Kemenkes. Rumah sakit dan klinik rehabilitasi medik dapat memanfaatkannya sebagai alat tele-rehabilitasi untuk memantau kemajuan motorik pasien pasca rawat inap dari rumah.
    </div>
  </div>

  <div class="page-break"></div>

  <div class="header">
    <div>
      <div class="brand">NeuronMotion</div>
      <div class="brand-sub">Panduan Tanya Jawab & Sidang Presentasi Hasil (Q&A Defense Guide)</div>
    </div>
    <div class="meta-box">
      <div><strong>Halaman:</strong> 2 dari 2</div>
      <div><strong>Status:</strong> Pertanyaan Teknis</div>
    </div>
  </div>

  <h2>B. Kategori Pertanyaan Teknis (Computer Vision, ML, Sinyal, & AI)</h2>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-tech">Teknis</span>
      6. Mengapa memilih MediaPipe WebAssembly di browser daripada model PyTorch di server GPU?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Privasi zero-video, biaya server $0 untuk komputasi vision, latensi 30-60 FPS tanpa bottleneck bandwidth internet.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Jika memproses video di server GPU, biaya infrastruktur cloud sangat mahal dan membutuhkan bandwidth internet tinggi untuk upload video streaming 30 FPS. Dengan MediaPipe WASM + WebGL di browser, komputasi terdistribusi di perangkat pengguna secara gratis, latensi real-time tercapai, dan privasi video terjamin 100% karena video tidak pernah meninggalkan RAM perangkat lokal.
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-tech">Teknis</span>
      7. Bagaimana akurasi 97.3% dihitung dan divalidasi?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Holdout validation 80/20 pada 2.000 dataset Gaussian MDS-UPDRS, 400 data uji diberi noise kamera acak plus minus 8%.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Akurasi 97.3% diperoleh dari pengujian validasi Holdout 80/20 pada 2.000 profil klinis sintetis Gaussian standar MDS-UPDRS. Pada 400 sampel data uji independen, kami menyuntikkan gangguan pengukuran kamera nyata (measurement noise) sebesar plus minus 8%. Model K-NN berhasil mengklasifikasikan 389 dari 400 sampel terdistorsi dengan tepat (97.3%).
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-tech">Teknis</span>
      8. Bagaimana algoritma memproses sinyal getaran tremor tangan secara matematis?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> PCA 2D ke 1D untuk sumbu getaran utama, dilanjutkan Discrete Fourier Transform (DFT) spektral untuk frekuensi puncak.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Kami memproyeksikan lintasan koordinat 2D pergelangan tangan ke sumbu getaran utama menggunakan Principal Component Analysis (PCA 2D ke 1D) untuk mendapatkan sinyal bertanda. Selanjutnya, sinyal diproses dengan Non-uniform Discrete Fourier Transform (DFT) untuk mendeteksi frekuensi puncak dominan. Jika frekuensi berada di 4.0 sampai 6.0 Hz dengan amplitudo signifikan, sistem menandainya sebagai pola tremor Parkinson; sedangkan 6.0 sampai 12.0 Hz beramplitudo tinggi mengindikasikan Essential Tremor.
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-tech">Teknis</span>
      9. Mengapa memilih K-Nearest Neighbors (k=11) dengan Z-Score dibanding Deep Learning kompleks?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Deterministik, dapat diaudit (white-box explainability), pembobotan jarak terbalik, tahan terhadap overfitting.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Dalam aplikasi medis, transparansi dan auditabilitas model (explainability) sangat penting. K-NN dengan normalisasi Z-Score dan pembobotan jarak terbalik (inverse-distance weighting) bersifat deterministik dan matematis murni: dokter dapat melihat dengan jelas 11 tetangga profil referensi terdekat yang mendasari prediksi sistem, tanpa risiko black-box decision seperti pada model deep neural network yang kompleks.
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-tech">Teknis</span>
      10. Apa peran pemrosesan oleh AI dan bagaimana mencegah halusinasi medis?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> AI tidak menghitung angka/skor (skor dihitung rumus deterministik), AI hanya menyintesis narasi bahasa manusia berpandukan schema JSON ketat.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> Kami membatasi peran AI secara ketat: skor risiko dan klasifikasi kondisi 100% dihitung oleh algoritma matematis dan K-NN yang deterministik. Pemrosesan oleh AI hanya bertugas menyintesis data angka objektif dan kuesioner keluhan subjektif ke dalam narasi bahasa Indonesia yang komunikatif menggunakan JSON response schema yang terikat ketat, sehingga bebas dari risiko halusinasi angka medis.
    </div>
  </div>

  <div class="qa-card">
    <div class="qa-title">
      <span class="qa-tag qa-tag-tech">Teknis</span>
      11. Bagaimana sistem menangani kondisi gelap atau pergerakan tubuh terpotong?
    </div>
    <div class="key-points">
      <strong>Poin Kunci:</strong> Landmark confidence thresholding, fallback grace periods, dan peringatan visual real-time pada UI.
    </div>
    <div class="answer-text">
      <strong>Jawaban Ideal:</strong> MediaPipe menyediakan nilai confidence score per landmark sendi. Jika visibilitas di bawah ambang batas (misal karena pencahayaan terlalu gelap atau tubuh keluar frame), sistem memunculkan indikator status peringatan di layar dan menerapkan moving-average filtering untuk membuang frame outlier sebelum kalkulasi biomarker dilakukan.
    </div>
  </div>

</body>
</html>`;

const tempHtmlPath = join(process.cwd(), 'temp_qa.html');
const outputPdfPath = join(process.cwd(), 'Daftar_Pertanyaan_dan_Jawaban_Presentasi_NeuronMotion.pdf');

writeFileSync(tempHtmlPath, htmlContent, 'utf8');

const chromePath = '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta';
const cmd = `"${chromePath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${tempHtmlPath}"`;

try {
  console.log('Generating Q&A Defense PDF via Chrome Beta Headless...');
  execSync(cmd);
  unlinkSync(tempHtmlPath);
  console.log('Q&A Defense PDF generated successfully at:', outputPdfPath);
} catch (err) {
  console.error('Failed to generate Q&A Defense PDF:', err);
  process.exit(1);
}
