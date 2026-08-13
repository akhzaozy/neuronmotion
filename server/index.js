import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import testRoutes from './routes/tests.js';
import patientRoutes from './routes/patients.js';
import doctorRoutes from './routes/doctor.js';
import adminRoutes from './routes/admin.js';
import chatRoutes from './routes/chat.js';
import geoRoutes from './routes/geo.js';
import translateRoutes from './routes/translate.js';
import { isGeminiConfigured } from './services/gemini.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── API Routes ────────────────────────────────────────────────────────────────
// Mount at /api (for local dev without prefix stripping)
app.use('/api/auth',     authRoutes);
app.use('/api/tests',    testRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctor',   doctorRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/geo',      geoRoutes);
app.use('/api/translate', translateRoutes);

// Mount at root (for production Nginx which strips /api)
app.use('/auth',     authRoutes);
app.use('/tests',    testRoutes);
app.use('/patients', patientRoutes);
app.use('/doctor',   doctorRoutes);
app.use('/admin',    adminRoutes);
app.use('/chat',     chatRoutes);
app.use('/geo',      geoRoutes);
app.use('/translate', translateRoutes);

// Health dipasang di kedua path, sama seperti route lain, karena nginx di produksi
// memotong awalan /api sehingga permintaan ke /api/health tiba di sini sebagai /health.
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok', service: 'neuronmotion-api', version: '1.0.0',
    timestamp: new Date().toISOString(),
    // Menandai apakah asisten AI siap dipakai, berguna saat memeriksa deployment
    aiConfigured: isGeminiConfigured(),
    endpoints: {
      auth:     ['/api/auth/register', '/api/auth/login'],
      tests:    ['/api/tests/tremor', '/api/tests/finger-tapping', '/api/tests/gait',
                 '/api/tests/arm-swing', '/api/tests/rom', '/api/tests/posture',
                 '/api/tests/full-screening', '/api/tests/history/:patientId'],
      patients: ['/api/patients', '/api/patients/:id', '/api/patients/:id/summary'],
      doctor:   ['/api/doctor/patients', '/api/doctor/dashboard/:doctorId',
                 '/api/doctor/sessions/:sessionId/note'],
      admin:    ['/api/admin/stats', '/api/admin/conditions', '/api/admin/training-data',
                 '/api/admin/doctors'],
      chat:     ['/api/chat', '/api/chat/status'],
      geo:      ['/api/geo/cities?country=Indonesia'],
      translate:['/api/translate', '/api/translate/status'],
    },
  });
});

// ── API Playground UI ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(PLAYGROUND_HTML(PORT));
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

/**
 * Memastikan struktur database sudah mengikuti skema terbaru saat server start.
 * Setelah git pull membawa kolom baru, database di server tidak ikut berubah
 * (berkas .db sengaja tidak masuk git), dan tanpa peringatan ini kondisi tersebut
 * baru ketahuan ketika pengguna gagal mendaftar dengan galat 500 tanpa petunjuk.
 */
async function checkDatabaseSchema() {
  const prisma = new PrismaClient();
  try {
    // Menyentuh kolom yang ditambahkan paling akhir; gagal berarti database tertinggal
    await prisma.user.findFirst({ select: { id: true, institution: true } });
    await prisma.session.findFirst({ select: { id: true, aiAnalysis: true } });
    return true;
  } catch (e) {
    console.error('\n⚠️  Struktur database belum sesuai skema terbaru.');
    console.error('   Penyebab: kolom baru sudah ada di schema.prisma tetapi belum dibuat di database.');
    console.error('   Perbaikan: jalankan "npx prisma db push" lalu restart layanan.');
    console.error(`   Detail: ${e.message.split('\n')[0]}\n`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

app.listen(PORT, async () => {
  console.log(`\n🚀 NeuronMotion Backend v1.0.0`);
  console.log(`   API: http://localhost:${PORT}/api/health`);
  console.log(`   Playground: http://localhost:${PORT}/\n`);
  await checkDatabaseSchema();
});

// ─────────────────────────────────────────────────────────────────────────────
function PLAYGROUND_HTML(port) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>NeuronMotion, API Playground</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0d1117;color:#e6edf3;padding:20px}
h1{font-size:1.5rem;color:#58a6ff}
.sub{color:#8b949e;font-size:.88rem;margin-bottom:18px}
.badge{background:#1f6feb;color:#fff;padding:2px 10px;border-radius:99px;font-size:.7rem;margin-left:8px}
.info-bar{background:#161b22;border:1px solid #30363d;border-radius:10px;padding:12px 18px;margin-bottom:18px;display:flex;gap:20px;flex-wrap:wrap;font-size:.83rem}
.label{color:#8b949e}.value{color:#3fb950;font-weight:600}
.tabs{display:flex;gap:2px;margin-bottom:16px;flex-wrap:wrap}
.tab{padding:8px 16px;background:#161b22;border:1px solid #30363d;border-radius:6px 6px 0 0;cursor:pointer;font-size:.82rem;color:#8b949e}
.tab.active{background:#21262d;color:#e6edf3;border-bottom:2px solid #58a6ff}
.tab-content{display:none}.tab-content.active{display:block}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:12px}
.card{background:#161b22;border:1px solid #30363d;border-radius:10px;overflow:hidden}
.ch{padding:11px 15px;background:#21262d;border-bottom:1px solid #30363d;display:flex;align-items:center;gap:7px}
.method{font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:4px}
.method.post{background:#388bfd22;color:#58a6ff;border:1px solid #388bfd44}
.method.get{background:#2ea04322;color:#3fb950;border:1px solid #2ea04344}
.method.put{background:#d2932122;color:#e3b341;border:1px solid #d2932144}
.ep{font-weight:600;font-size:.84rem}.desc{font-size:.72rem;color:#8b949e;margin-left:auto}
.cb{padding:13px 15px}
label{display:block;font-size:.73rem;color:#8b949e;margin-bottom:3px;margin-top:9px}
input,textarea,select{width:100%;background:#0d1117;border:1px solid #30363d;border-radius:5px;padding:6px 10px;color:#e6edf3;font-size:.8rem;outline:none}
input:focus,textarea:focus{border-color:#388bfd}
textarea{resize:vertical;min-height:85px;font-family:monospace}
button{margin-top:11px;width:100%;padding:8px;background:#1f6feb;color:#fff;border:none;border-radius:6px;font-size:.83rem;font-weight:600;cursor:pointer}
button:hover{background:#388bfd}
.result{margin-top:10px;background:#0d1117;border:1px solid #30363d;border-radius:6px;padding:9px;font-family:monospace;font-size:.76rem;white-space:pre-wrap;max-height:230px;overflow-y:auto;display:none}
.result.ok{border-color:#2ea043;color:#3fb950}
.result.err{border-color:#f85149;color:#f85149}
.token-box{margin-top:9px;background:#0d1117;border:1px solid #388bfd44;border-radius:6px;padding:8px;font-size:.7rem;color:#8b949e;display:none}
.token-box span{color:#58a6ff;word-break:break-all}
.stitle{font-size:.68rem;text-transform:uppercase;letter-spacing:1px;color:#8b949e;font-weight:700;margin-bottom:11px;padding-bottom:5px;border-bottom:1px solid #21262d}
</style>
</head>
<body>
<h1>🧠 NeuronMotion <span class="badge">API v1.0.0</span></h1>
<p class="sub">Sistem Skrining Gangguan Saraf, Backend Playground</p>
<div class="info-bar">
  <span><span class="label">Status: </span><span class="value" id="sv">Memeriksa...</span></span>
  <span><span class="label">Port: </span><span class="value">${port}</span></span>
  <span><span class="label">DB: </span><span class="value">SQLite + Prisma</span></span>
  <span><span class="label">ML: </span><span class="value">K-NN (lihat /api/admin/model-accuracy)</span></span>
  <span><span class="label">Waktu: </span><span class="value" id="clk"></span></span>
</div>
<div class="tabs">
  <div class="tab active" onclick="showTab('auth')">🔐 Auth</div>
  <div class="tab" onclick="showTab('tests')">🧪 Biomarker Tests</div>
  <div class="tab" onclick="showTab('patients')">👤 Pasien</div>
  <div class="tab" onclick="showTab('doctor')">👨‍⚕️ Dokter</div>
  <div class="tab" onclick="showTab('admin')">⚙️ Admin</div>
</div>

<!-- AUTH TAB -->
<div id="tab-auth" class="tab-content active">
<div class="stitle">🔐 Autentikasi</div>
<div class="grid">
  <div class="card">
    <div class="ch"><span class="method post">POST</span><span class="ep">/api/auth/register</span><span class="desc">Daftar Akun</span></div>
    <div class="cb">
      <label>Email</label><input id="re" value="pasien@neuronmotion.id"/>
      <label>Nama</label><input id="rn" value="Pasien Demo"/>
      <label>Password</label><input id="rp" type="password" value="password123"/>
      <label>Role</label><select id="rr"><option value="PATIENT">PATIENT</option><option value="DOCTOR">DOCTOR</option></select>
      <button onclick="doReg()">Daftar</button>
      <div class="result" id="r-reg"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method post">POST</span><span class="ep">/api/auth/login</span><span class="desc">Login</span></div>
    <div class="cb">
      <label>Email</label><input id="le" value="pasien@neuronmotion.id"/>
      <label>Password</label><input id="lp" type="password" value="password123"/>
      <button onclick="doLogin()">Login</button>
      <div class="result" id="r-login"></div>
      <div class="token-box" id="tkbox">🔑 Token: <span id="tkval"></span></div>
    </div>
  </div>
</div>
</div>

<!-- TESTS TAB -->
<div id="tab-tests" class="tab-content">
<div class="stitle">🧪 Tes Biomarker Individual</div>
<div class="grid">
  <div class="card">
    <div class="ch"><span class="method post">POST</span><span class="ep">/api/tests/tremor</span><span class="desc">Analisis Tremor</span></div>
    <div class="cb">
      <label>Body Part</label><input id="tp" value="WRIST_RIGHT"/>
      <label>Samples JSON [{timestamp,x,y,z}]</label>
      <textarea id="td">[{"timestamp":0,"x":0.502,"y":0.301,"z":0},{"timestamp":33,"x":0.519,"y":0.318,"z":0},{"timestamp":66,"x":0.485,"y":0.284,"z":0},{"timestamp":99,"x":0.523,"y":0.322,"z":0},{"timestamp":132,"x":0.481,"y":0.280,"z":0},{"timestamp":165,"x":0.527,"y":0.326,"z":0},{"timestamp":198,"x":0.477,"y":0.276,"z":0},{"timestamp":231,"x":0.531,"y":0.330,"z":0},{"timestamp":264,"x":0.473,"y":0.272,"z":0},{"timestamp":297,"x":0.535,"y":0.334,"z":0}]</textarea>
      <button onclick="doTremor()">Analisis Tremor</button>
      <div class="result" id="r-tremor"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method post">POST</span><span class="ep">/api/tests/finger-tapping</span><span class="desc">Finger Tapping</span></div>
    <div class="cb">
      <label>Taps JSON [{timestamp,distance}]</label>
      <textarea id="ftd">[{"timestamp":0,"distance":0.12},{"timestamp":250,"distance":0.02},{"timestamp":520,"distance":0.11},{"timestamp":800,"distance":0.02},{"timestamp":1100,"distance":0.10},{"timestamp":1450,"distance":0.02},{"timestamp":1850,"distance":0.09},{"timestamp":2300,"distance":0.01},{"timestamp":2800,"distance":0.07},{"timestamp":3400,"distance":0.01}]</textarea>
      <button onclick="doTapping()">Analisis Tapping</button>
      <div class="result" id="r-tap"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method post">POST</span><span class="ep">/api/tests/gait</span><span class="desc">Pola Jalan</span></div>
    <div class="cb">
      <label>Steps JSON [{timestamp,leftAnkleX,rightAnkleX,hipCenterY}]</label>
      <textarea id="gd">[{"timestamp":0,"leftAnkleX":0.35,"rightAnkleX":0.65,"hipCenterY":0.60},{"timestamp":100,"leftAnkleX":0.30,"rightAnkleX":0.70,"hipCenterY":0.60},{"timestamp":200,"leftAnkleX":0.40,"rightAnkleX":0.60,"hipCenterY":0.60},{"timestamp":300,"leftAnkleX":0.33,"rightAnkleX":0.67,"hipCenterY":0.60},{"timestamp":400,"leftAnkleX":0.42,"rightAnkleX":0.58,"hipCenterY":0.60},{"timestamp":500,"leftAnkleX":0.31,"rightAnkleX":0.69,"hipCenterY":0.60},{"timestamp":600,"leftAnkleX":0.44,"rightAnkleX":0.56,"hipCenterY":0.60},{"timestamp":700,"leftAnkleX":0.32,"rightAnkleX":0.68,"hipCenterY":0.60},{"timestamp":800,"leftAnkleX":0.41,"rightAnkleX":0.59,"hipCenterY":0.60},{"timestamp":900,"leftAnkleX":0.36,"rightAnkleX":0.64,"hipCenterY":0.60}]</textarea>
      <button onclick="doGait()">Analisis Gait</button>
      <div class="result" id="r-gait"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method post">POST</span><span class="ep">/api/tests/posture</span><span class="desc">Stabilitas Postur</span></div>
    <div class="cb">
      <label>Frames JSON (min 20 frame)</label>
      <textarea id="pd" style="min-height:70px">[{"timestamp":0,"hipX":0.50,"hipY":0.65,"shoulderX":0.51,"shoulderY":0.35},{"timestamp":50,"hipX":0.51,"hipY":0.65,"shoulderX":0.52,"shoulderY":0.34},{"timestamp":100,"hipX":0.49,"hipY":0.66,"shoulderX":0.50,"shoulderY":0.35},{"timestamp":150,"hipX":0.52,"hipY":0.64,"shoulderX":0.53,"shoulderY":0.34},{"timestamp":200,"hipX":0.48,"hipY":0.66,"shoulderX":0.49,"shoulderY":0.36},{"timestamp":250,"hipX":0.53,"hipY":0.65,"shoulderX":0.54,"shoulderY":0.35},{"timestamp":300,"hipX":0.47,"hipY":0.67,"shoulderX":0.48,"shoulderY":0.37},{"timestamp":350,"hipX":0.54,"hipY":0.64,"shoulderX":0.55,"shoulderY":0.34},{"timestamp":400,"hipX":0.46,"hipY":0.68,"shoulderX":0.47,"shoulderY":0.38},{"timestamp":450,"hipX":0.55,"hipY":0.64,"shoulderX":0.56,"shoulderY":0.34},{"timestamp":500,"hipX":0.50,"hipY":0.65,"shoulderX":0.51,"shoulderY":0.35},{"timestamp":550,"hipX":0.51,"hipY":0.65,"shoulderX":0.52,"shoulderY":0.35},{"timestamp":600,"hipX":0.49,"hipY":0.66,"shoulderX":0.50,"shoulderY":0.36},{"timestamp":650,"hipX":0.52,"hipY":0.65,"shoulderX":0.53,"shoulderY":0.35},{"timestamp":700,"hipX":0.48,"hipY":0.66,"shoulderX":0.49,"shoulderY":0.36},{"timestamp":750,"hipX":0.51,"hipY":0.65,"shoulderX":0.52,"shoulderY":0.35},{"timestamp":800,"hipX":0.50,"hipY":0.65,"shoulderX":0.51,"shoulderY":0.35},{"timestamp":850,"hipX":0.52,"hipY":0.64,"shoulderX":0.53,"shoulderY":0.34},{"timestamp":900,"hipX":0.49,"hipY":0.66,"shoulderX":0.50,"shoulderY":0.35},{"timestamp":950,"hipX":0.50,"hipY":0.65,"shoulderX":0.51,"shoulderY":0.35}]</textarea>
      <button onclick="doPosture()">Analisis Postur</button>
      <div class="result" id="r-posture"></div>
    </div>
  </div>
  <div class="card" style="grid-column:1/-1">
    <div class="ch"><span class="method post">POST</span><span class="ep">/api/tests/full-screening</span><span class="desc">🏥 Skrining Lengkap + ML Classification</span></div>
    <div class="cb">
      <label>Patient ID</label><input id="fsp" value="1" type="number"/>
      <p style="font-size:.77rem;color:#8b949e;margin-top:8px">Menggabungkan semua tes, menjalankan K-NN classifier (300 data training), dan menyimpan ke database.</p>
      <button onclick="doFullScreening()" style="background:#2ea043">🔬 Jalankan Skrining Lengkap + ML</button>
      <div class="result" id="r-full"></div>
    </div>
  </div>
</div>
</div>

<!-- PATIENTS TAB -->
<div id="tab-patients" class="tab-content">
<div class="stitle">👤 Manajemen Pasien</div>
<div class="grid">
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/patients</span><span class="desc">Daftar Pasien</span></div>
    <div class="cb">
      <label>Cari Nama</label><input id="ps" placeholder="Opsional"/>
      <label>Filter Risiko</label><select id="prf"><option value="">Semua</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select>
      <label>Page</label><input id="pp" value="1" type="number"/>
      <button onclick="doPatients()">Lihat Daftar Pasien</button>
      <div class="result" id="r-patients"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/patients/:id</span><span class="desc">Detail Pasien</span></div>
    <div class="cb">
      <label>Patient ID</label><input id="pid" value="1" type="number"/>
      <button onclick="doPatientDetail()">Lihat Detail</button>
      <div class="result" id="r-pdetail"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/patients/:id/summary</span><span class="desc">Tren Skor Risiko</span></div>
    <div class="cb">
      <label>Patient ID</label><input id="psid" value="1" type="number"/>
      <button onclick="doPatientSummary()">Lihat Tren</button>
      <div class="result" id="r-psummary"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/tests/history/:patientId</span><span class="desc">Riwayat Pemeriksaan</span></div>
    <div class="cb">
      <label>Patient ID</label><input id="hpid" value="1" type="number"/>
      <button onclick="doHistory()">Lihat Riwayat Skrining</button>
      <div class="result" id="r-history"></div>
    </div>
  </div>
</div>
</div>

<!-- DOCTOR TAB -->
<div id="tab-doctor" class="tab-content">
<div class="stitle">👨‍⚕️ Portal Dokter</div>
<div class="grid">
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/doctor/patients</span><span class="desc">Pasien Saya</span></div>
    <div class="cb">
      <label>Doctor ID</label><input id="did" value="2" type="number"/>
      <button onclick="doDoctorPatients()">Lihat Pasien Saya</button>
      <div class="result" id="r-dpts"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/doctor/dashboard/:doctorId</span><span class="desc">Dashboard Dokter</span></div>
    <div class="cb">
      <label>Doctor ID</label><input id="ddid" value="2" type="number"/>
      <button onclick="doDoctorDash()">Lihat Dashboard</button>
      <div class="result" id="r-ddash"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method put">PUT</span><span class="ep">/api/doctor/sessions/:id/note</span><span class="desc">Tulis Catatan Nakes</span></div>
    <div class="cb">
      <label>Session ID</label><input id="nsid" value="1" type="number"/>
      <label>Doctor ID</label><input id="ndid" value="2" type="number"/>
      <label>Catatan</label><textarea id="nnote">Pasien menunjukkan gejala awal Parkinson. MRI otak dan evaluasi neurolog dianjurkan.</textarea>
      <label>Follow-up Date</label><input id="nfup" type="date"/>
      <button onclick="doNote()">Simpan Catatan</button>
      <div class="result" id="r-note"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method post">POST</span><span class="ep">/api/doctor/link</span><span class="desc">Hubungkan Pasien</span></div>
    <div class="cb">
      <label>Doctor ID</label><input id="ldid" value="2" type="number"/>
      <label>Patient ID</label><input id="lpid" value="1" type="number"/>
      <button onclick="doLink()">Hubungkan</button>
      <div class="result" id="r-link"></div>
    </div>
  </div>
</div>
</div>

<!-- ADMIN TAB -->
<div id="tab-admin" class="tab-content">
<div class="stitle">⚙️ Panel Admin</div>
<div class="grid">
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/admin/stats</span><span class="desc">Statistik Sistem</span></div>
    <div class="cb">
      <button onclick="doStats()">Lihat Statistik Sistem</button>
      <div class="result" id="r-stats"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/admin/conditions</span><span class="desc">Kondisi Klinis</span></div>
    <div class="cb">
      <button onclick="doConditions()">Lihat Referensi Kondisi Klinis</button>
      <div class="result" id="r-cond"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/admin/training-data</span><span class="desc">Preview Data Training</span></div>
    <div class="cb">
      <label>Jumlah sampel (max 50)</label><input id="tdc" value="10" type="number"/>
      <button onclick="doTrainingData()">Lihat Data Training</button>
      <div class="result" id="r-td"></div>
    </div>
  </div>
  <div class="card">
    <div class="ch"><span class="method get">GET</span><span class="ep">/api/admin/doctors</span><span class="desc">Daftar Dokter</span></div>
    <div class="cb">
      <button onclick="doDoctors()">Lihat Semua Dokter</button>
      <div class="result" id="r-docs"></div>
    </div>
  </div>
</div>
</div>

<script>
let token='';
const B='http://localhost:${port}';
setInterval(()=>document.getElementById('clk').textContent=new Date().toLocaleTimeString('id-ID'),1000);
document.getElementById('clk').textContent=new Date().toLocaleTimeString('id-ID');
fetch(B+'/api/health').then(r=>r.json()).then(()=>document.getElementById('sv').textContent='✅ Online').catch(()=>document.getElementById('sv').textContent='❌ Offline');

function showTab(t){document.querySelectorAll('.tab,.tab-content').forEach(e=>e.classList.remove('active'));document.querySelector('[onclick="showTab(\\''+t+'\\')"]').classList.add('active');document.getElementById('tab-'+t).classList.add('active')}
function show(id,data,ok){const e=document.getElementById(id);e.style.display='block';e.textContent=JSON.stringify(data,null,2);e.className='result '+(ok?'ok':'err')}
async function api(m,p,b){const o={method:m,headers:{'Content-Type':'application/json'}};if(token)o.headers.Authorization='Bearer '+token;if(b)o.body=JSON.stringify(b);const r=await fetch(B+p,o);return{ok:r.ok,d:await r.json()}}
function j(id){return JSON.parse(document.getElementById(id).value)}

async function doReg(){const{ok,d}=await api('POST','/api/auth/register',{email:document.getElementById('re').value,name:document.getElementById('rn').value,password:document.getElementById('rp').value,role:document.getElementById('rr').value});show('r-reg',d,ok)}
async function doLogin(){const{ok,d}=await api('POST','/api/auth/login',{email:document.getElementById('le').value,password:document.getElementById('lp').value});show('r-login',d,ok);if(ok&&d.token){token=d.token;document.getElementById('tkval').textContent=d.token;document.getElementById('tkbox').style.display='block'}}
async function doTremor(){try{const{ok,d}=await api('POST','/api/tests/tremor',{bodyPart:document.getElementById('tp').value,samples:j('td')});show('r-tremor',d,ok)}catch(e){show('r-tremor',{error:e.message},false)}}
async function doTapping(){try{const{ok,d}=await api('POST','/api/tests/finger-tapping',{taps:j('ftd')});show('r-tap',d,ok)}catch(e){show('r-tap',{error:e.message},false)}}
async function doGait(){try{const{ok,d}=await api('POST','/api/tests/gait',{steps:j('gd')});show('r-gait',d,ok)}catch(e){show('r-gait',{error:e.message},false)}}
async function doPosture(){try{const{ok,d}=await api('POST','/api/tests/posture',{frames:j('pd')});show('r-posture',d,ok)}catch(e){show('r-posture',{error:e.message},false)}}
async function doFullScreening(){
  const pid=document.getElementById('fsp').value;
  const body={patientId:pid,tremor:{bodyPart:'WRIST_RIGHT',samples:[{"timestamp":0,"x":0.502,"y":0.301,"z":0},{"timestamp":33,"x":0.519,"y":0.318,"z":0},{"timestamp":66,"x":0.485,"y":0.284,"z":0},{"timestamp":99,"x":0.523,"y":0.322,"z":0},{"timestamp":132,"x":0.481,"y":0.280,"z":0},{"timestamp":165,"x":0.527,"y":0.326,"z":0},{"timestamp":198,"x":0.477,"y":0.276,"z":0},{"timestamp":231,"x":0.531,"y":0.330,"z":0},{"timestamp":264,"x":0.473,"y":0.272,"z":0},{"timestamp":297,"x":0.535,"y":0.334,"z":0}]},fingerTapping:{taps:[{"timestamp":0,"distance":0.12},{"timestamp":250,"distance":0.02},{"timestamp":520,"distance":0.11},{"timestamp":800,"distance":0.02},{"timestamp":1100,"distance":0.10},{"timestamp":1450,"distance":0.02},{"timestamp":1850,"distance":0.09},{"timestamp":2300,"distance":0.01},{"timestamp":2800,"distance":0.07},{"timestamp":3400,"distance":0.01}]},gait:{steps:[{"timestamp":0,"leftAnkleX":0.35,"rightAnkleX":0.65,"hipCenterY":0.60},{"timestamp":100,"leftAnkleX":0.30,"rightAnkleX":0.70,"hipCenterY":0.60},{"timestamp":200,"leftAnkleX":0.40,"rightAnkleX":0.60,"hipCenterY":0.60},{"timestamp":300,"leftAnkleX":0.33,"rightAnkleX":0.67,"hipCenterY":0.60},{"timestamp":400,"leftAnkleX":0.42,"rightAnkleX":0.58,"hipCenterY":0.60},{"timestamp":500,"leftAnkleX":0.31,"rightAnkleX":0.69,"hipCenterY":0.60},{"timestamp":600,"leftAnkleX":0.44,"rightAnkleX":0.56,"hipCenterY":0.60},{"timestamp":700,"leftAnkleX":0.32,"rightAnkleX":0.68,"hipCenterY":0.60},{"timestamp":800,"leftAnkleX":0.41,"rightAnkleX":0.59,"hipCenterY":0.60},{"timestamp":900,"leftAnkleX":0.36,"rightAnkleX":0.64,"hipCenterY":0.60}]},posturalStability:{frames:[{"timestamp":0,"hipX":0.50,"hipY":0.65,"shoulderX":0.51,"shoulderY":0.35},{"timestamp":50,"hipX":0.51,"hipY":0.65,"shoulderX":0.52,"shoulderY":0.34},{"timestamp":100,"hipX":0.49,"hipY":0.66,"shoulderX":0.50,"shoulderY":0.35},{"timestamp":150,"hipX":0.52,"hipY":0.64,"shoulderX":0.53,"shoulderY":0.34},{"timestamp":200,"hipX":0.48,"hipY":0.66,"shoulderX":0.49,"shoulderY":0.36},{"timestamp":250,"hipX":0.53,"hipY":0.65,"shoulderX":0.54,"shoulderY":0.35},{"timestamp":300,"hipX":0.47,"hipY":0.67,"shoulderX":0.48,"shoulderY":0.37},{"timestamp":350,"hipX":0.54,"hipY":0.64,"shoulderX":0.55,"shoulderY":0.34},{"timestamp":400,"hipX":0.46,"hipY":0.68,"shoulderX":0.47,"shoulderY":0.38},{"timestamp":450,"hipX":0.55,"hipY":0.64,"shoulderX":0.56,"shoulderY":0.34},{"timestamp":500,"hipX":0.50,"hipY":0.65,"shoulderX":0.51,"shoulderY":0.35},{"timestamp":550,"hipX":0.51,"hipY":0.65,"shoulderX":0.52,"shoulderY":0.35},{"timestamp":600,"hipX":0.49,"hipY":0.66,"shoulderX":0.50,"shoulderY":0.36},{"timestamp":650,"hipX":0.52,"hipY":0.65,"shoulderX":0.53,"shoulderY":0.35},{"timestamp":700,"hipX":0.48,"hipY":0.66,"shoulderX":0.49,"shoulderY":0.36},{"timestamp":750,"hipX":0.51,"hipY":0.65,"shoulderX":0.52,"shoulderY":0.35},{"timestamp":800,"hipX":0.50,"hipY":0.65,"shoulderX":0.51,"shoulderY":0.35},{"timestamp":850,"hipX":0.52,"hipY":0.64,"shoulderX":0.53,"shoulderY":0.34},{"timestamp":900,"hipX":0.49,"hipY":0.66,"shoulderX":0.50,"shoulderY":0.35},{"timestamp":950,"hipX":0.50,"hipY":0.65,"shoulderX":0.51,"shoulderY":0.35}]}};
  const{ok,d}=await api('POST','/api/tests/full-screening',body);show('r-full',d,ok);
}
async function doPatients(){const q=new URLSearchParams({search:document.getElementById('ps').value,risk:document.getElementById('prf').value,page:document.getElementById('pp').value}).toString();const{ok,d}=await api('GET','/api/patients?'+q);show('r-patients',d,ok)}
async function doPatientDetail(){const{ok,d}=await api('GET','/api/patients/'+document.getElementById('pid').value);show('r-pdetail',d,ok)}
async function doPatientSummary(){const{ok,d}=await api('GET','/api/patients/'+document.getElementById('psid').value+'/summary');show('r-psummary',d,ok)}
async function doHistory(){const{ok,d}=await api('GET','/api/tests/history/'+document.getElementById('hpid').value);show('r-history',d,ok)}
async function doDoctorPatients(){const{ok,d}=await api('GET','/api/doctor/patients?doctorId='+document.getElementById('did').value);show('r-dpts',d,ok)}
async function doDoctorDash(){const{ok,d}=await api('GET','/api/doctor/dashboard/'+document.getElementById('ddid').value);show('r-ddash',d,ok)}
async function doNote(){const{ok,d}=await api('PUT','/api/doctor/sessions/'+document.getElementById('nsid').value+'/note',{doctorId:document.getElementById('ndid').value,note:document.getElementById('nnote').value,followUpDate:document.getElementById('nfup').value||undefined});show('r-note',d,ok)}
async function doLink(){const{ok,d}=await api('POST','/api/doctor/link',{doctorId:document.getElementById('ldid').value,patientId:document.getElementById('lpid').value});show('r-link',d,ok)}
async function doStats(){const{ok,d}=await api('GET','/api/admin/stats');show('r-stats',d,ok)}
async function doConditions(){const{ok,d}=await api('GET','/api/admin/conditions');show('r-cond',d,ok)}
async function doTrainingData(){const{ok,d}=await api('GET','/api/admin/training-data?count='+document.getElementById('tdc').value);show('r-td',d,ok)}
async function doDoctors(){const{ok,d}=await api('GET','/api/admin/doctors');show('r-docs',d,ok)}
</script>
</body>
</html>`;
}
