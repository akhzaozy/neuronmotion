/**
 * NeuronMotion, Database Seeder
 * Mengisi database dengan data pasien sintetis berbasis klinis
 * Scope: Wilayah Indonesia (Provinsi dan Kota/Kabupaten di Seluruh Indonesia)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTrainingDataset, CONDITION_PROFILES } from '../server/data/clinicalData.js';

const prisma = new PrismaClient();

/**
 * Daftar lokasi provinsi dan kota/kabupaten di seluruh wilayah Indonesia.
 * Mencakup Pulau Jawa, Sumatera, Bali & Nusa Tenggara, Sulawesi, Kalimantan, dan Indonesia Timur.
 */
const INDONESIA_LOCATIONS = [
  // ── DKI Jakarta ────────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'DKI Jakarta', region: 'Jawa', city: 'Jakarta Pusat',     address: 'Jl. M.H. Thamrin No. 1' },
  { country: 'ID', countryName: 'Indonesia', state: 'DKI Jakarta', region: 'Jawa', city: 'Jakarta Selatan',   address: 'Jl. Senopati No. 24' },
  { country: 'ID', countryName: 'Indonesia', state: 'DKI Jakarta', region: 'Jawa', city: 'Jakarta Barat',     address: 'Jl. Daan Mogot No. 88' },
  { country: 'ID', countryName: 'Indonesia', state: 'DKI Jakarta', region: 'Jawa', city: 'Jakarta Timur',     address: 'Jl. Pemuda No. 31' },
  { country: 'ID', countryName: 'Indonesia', state: 'DKI Jakarta', region: 'Jawa', city: 'Jakarta Utara',     address: 'Jl. Danau Sunter No. 12' },

  // ── Jawa Barat ─────────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Barat',  region: 'Jawa', city: 'Bandung',           address: 'Jl. Braga No. 10' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Barat',  region: 'Jawa', city: 'Bekasi',            address: 'Jl. Ahmad Yani No. 55' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Barat',  region: 'Jawa', city: 'Depok',             address: 'Jl. Margonda Raya No. 100' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Barat',  region: 'Jawa', city: 'Bogor',             address: 'Jl. Pajajaran No. 42' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Barat',  region: 'Jawa', city: 'Cimahi',            address: 'Jl. Gandawijaya No. 18' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Barat',  region: 'Jawa', city: 'Cirebon',           address: 'Jl. Kartini No. 7' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Barat',  region: 'Jawa', city: 'Tasikmalaya',       address: 'Jl. HZ. Mustofa No. 80' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Barat',  region: 'Jawa', city: 'Sukabumi',          address: 'Jl. Suryakencana No. 25' },

  // ── Jawa Timur ─────────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Timur',  region: 'Jawa', city: 'Surabaya',          address: 'Jl. Basuki Rahmat No. 60' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Timur',  region: 'Jawa', city: 'Malang',            address: 'Jl. Ijen No. 15' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Timur',  region: 'Jawa', city: 'Sidoarjo',          address: 'Jl. Pahlawan No. 33' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Timur',  region: 'Jawa', city: 'Kediri',            address: 'Jl. Dhoho No. 90' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Timur',  region: 'Jawa', city: 'Jember',            address: 'Jl. Gajah Mada No. 45' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Timur',  region: 'Jawa', city: 'Banyuwangi',        address: 'Jl. Ahmad Yani No. 12' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Timur',  region: 'Jawa', city: 'Madiun',            address: 'Jl. Pahlawan No. 5' },

  // ── Jawa Tengah ────────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Tengah', region: 'Jawa', city: 'Semarang',          address: 'Jl. Pandanaran No. 42' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Tengah', region: 'Jawa', city: 'Surakarta (Solo)', address: 'Jl. Slamet Riyadi No. 120' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Tengah', region: 'Jawa', city: 'Magelang',          address: 'Jl. Pemuda No. 70' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Tengah', region: 'Jawa', city: 'Salatiga',         address: 'Jl. Jend. Sudirman No. 14' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Tengah', region: 'Jawa', city: 'Pekalongan',       address: 'Jl. Hayam Wuruk No. 8' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Tengah', region: 'Jawa', city: 'Tegal',            address: 'Jl. Ahmad Yani No. 22' },
  { country: 'ID', countryName: 'Indonesia', state: 'Jawa Tengah', region: 'Jawa', city: 'Purwokerto',       address: 'Jl. Jend. Soedirman No. 88' },

  // ── Banten ─────────────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Banten',       region: 'Jawa', city: 'Tangerang',         address: 'Jl. Daan Mogot No. 50' },
  { country: 'ID', countryName: 'Indonesia', state: 'Banten',       region: 'Jawa', city: 'Tangerang Selatan', address: 'Jl. Pahlawan Seribu No. 9' },
  { country: 'ID', countryName: 'Indonesia', state: 'Banten',       region: 'Jawa', city: 'Serang',            address: 'Jl. Veteran No. 3' },
  { country: 'ID', countryName: 'Indonesia', state: 'Banten',       region: 'Jawa', city: 'Cilegon',           address: 'Jl. Jend. Sudirman No. 16' },

  // ── DI Yogyakarta ──────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'DI Yogyakarta', region: 'Jawa', city: 'Yogyakarta',       address: 'Jl. Malioboro No. 52' },
  { country: 'ID', countryName: 'Indonesia', state: 'DI Yogyakarta', region: 'Jawa', city: 'Sleman',           address: 'Jl. Kaliurang Km 5 No. 20' },
  { country: 'ID', countryName: 'Indonesia', state: 'DI Yogyakarta', region: 'Jawa', city: 'Bantul',           address: 'Jl. Bantul No. 30' },

  // ── Sumatera Utara ─────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Sumatera Utara', region: 'Sumatera', city: 'Medan',      address: 'Jl. Gatot Subroto No. 88' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sumatera Utara', region: 'Sumatera', city: 'Pematangsiantar', address: 'Jl. Merdeka No. 12' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sumatera Utara', region: 'Sumatera', city: 'Binjai',     address: 'Jl. Soekarno-Hatta No. 40' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sumatera Utara', region: 'Sumatera', city: 'Deli Serdang', address: 'Jl. Lintas Sumatera No. 18' },

  // ── Sumatera Barat ─────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Sumatera Barat', region: 'Sumatera', city: 'Padang',     address: 'Jl. Khatib Sulaiman No. 25' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sumatera Barat', region: 'Sumatera', city: 'Bukittinggi', address: 'Jl. Sudirman No. 10' },

  // ── Sumatera Selatan ───────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Sumatera Selatan', region: 'Sumatera', city: 'Palembang', address: 'Jl. Jend. Sudirman No. 150' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sumatera Selatan', region: 'Sumatera', city: 'Prabumulih', address: 'Jl. Jend. Sudirman No. 45' },

  // ── Riau & Kepulauan Riau ──────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Riau',          region: 'Sumatera', city: 'Pekanbaru',    address: 'Jl. Jend. Sudirman No. 200' },
  { country: 'ID', countryName: 'Indonesia', state: 'Riau',          region: 'Sumatera', city: 'Dumai',        address: 'Jl. Sultan Syarif Kasim No. 33' },
  { country: 'ID', countryName: 'Indonesia', state: 'Kepulauan Riau', region: 'Sumatera', city: 'Batam',      address: 'Jl. Engku Putri No. 1' },
  { country: 'ID', countryName: 'Indonesia', state: 'Kepulauan Riau', region: 'Sumatera', city: 'Tanjungpinang', address: 'Jl. Merdeka No. 7' },

  // ── Lampung & Aceh ─────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Lampung',       region: 'Sumatera', city: 'Bandar Lampung', address: 'Jl. Raden Intan No. 65' },
  { country: 'ID', countryName: 'Indonesia', state: 'Aceh',          region: 'Sumatera', city: 'Banda Aceh',   address: 'Jl. Teuku Umar No. 14' },

  // ── Bali & Nusa Tenggara ───────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Bali',          region: 'Bali & Nusa Tenggara', city: 'Denpasar',   address: 'Jl. Teuku Umar No. 20' },
  { country: 'ID', countryName: 'Indonesia', state: 'Bali',          region: 'Bali & Nusa Tenggara', city: 'Badung',     address: 'Jl. Sunset Road No. 88' },
  { country: 'ID', countryName: 'Indonesia', state: 'Bali',          region: 'Bali & Nusa Tenggara', city: 'Gianyar',    address: 'Jl. Raya Ubud No. 15' },
  { country: 'ID', countryName: 'Indonesia', state: 'Nusa Tenggara Barat', region: 'Bali & Nusa Tenggara', city: 'Mataram', address: 'Jl. Pejanggik No. 50' },
  { country: 'ID', countryName: 'Indonesia', state: 'Nusa Tenggara Timur', region: 'Bali & Nusa Tenggara', city: 'Kupang',  address: 'Jl. El Tari No. 10' },

  // ── Sulawesi Selatan & Utara ───────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Sulawesi Selatan', region: 'Sulawesi', city: 'Makassar', address: 'Jl. Penghibur No. 11' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sulawesi Selatan', region: 'Sulawesi', city: 'Parepare',  address: 'Jl. Bau Massepe No. 28' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sulawesi Selatan', region: 'Sulawesi', city: 'Palopo',    address: 'Jl. Andi Djemma No. 15' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sulawesi Utara',   region: 'Sulawesi', city: 'Manado',    address: 'Jl. Sam Ratulangi No. 70' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sulawesi Tengah',  region: 'Sulawesi', city: 'Palu',      address: 'Jl. Moh. Hatta No. 20' },
  { country: 'ID', countryName: 'Indonesia', state: 'Sulawesi Tenggara', region: 'Sulawesi', city: 'Kendari', address: 'Jl. Dr. Sam Ratulangi No. 18' },

  // ── Kalimantan Timur, Barat & Selatan ──────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Kalimantan Timur', region: 'Kalimantan', city: 'Samarinda', address: 'Jl. Pahlawan No. 40' },
  { country: 'ID', countryName: 'Indonesia', state: 'Kalimantan Timur', region: 'Kalimantan', city: 'Balikpapan', address: 'Jl. Jend. Sudirman No. 80' },
  { country: 'ID', countryName: 'Indonesia', state: 'Kalimantan Timur', region: 'Kalimantan', city: 'IKN Nusantara', address: 'Kawasan Inti Pusat Pemerintahan' },
  { country: 'ID', countryName: 'Indonesia', state: 'Kalimantan Barat', region: 'Kalimantan', city: 'Pontianak', address: 'Jl. Gajah Mada No. 100' },
  { country: 'ID', countryName: 'Indonesia', state: 'Kalimantan Selatan', region: 'Kalimantan', city: 'Banjarmasin', address: 'Jl. Lambung Mangkurat No. 25' },
  { country: 'ID', countryName: 'Indonesia', state: 'Kalimantan Tengah', region: 'Kalimantan', city: 'Palangka Raya', address: 'Jl. Tjilik Riwut No. 5' },

  // ── Maluku & Papua ─────────────────────────────────────────────────────────
  { country: 'ID', countryName: 'Indonesia', state: 'Maluku',        region: 'Indonesia Timur', city: 'Ambon',    address: 'Jl. Pattimura No. 12' },
  { country: 'ID', countryName: 'Indonesia', state: 'Papua',         region: 'Indonesia Timur', city: 'Jayapura', address: 'Jl. Percetakan Negara No. 10' },
];

async function main() {
  console.log('🌱 Memulai seeding database NeuronMotion (Scope: Indonesia)...\n');

  // 1. Bersihkan data lama
  await prisma.session.deleteMany();
  await prisma.doctorPatient.deleteMany();
  await prisma.condition.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database dibersihkan');

  // 2. Buat data referensi kondisi medis secara berurutan agar aman di SQLite/STB
  const conditions = Object.entries(CONDITION_PROFILES);
  for (const [key, profile] of conditions) {
    await prisma.condition.create({
      data: {
        key,
        label: profile.label,
        description: profile.description,
        biomarkerThresholds: JSON.stringify(profile.biomarkerProfile),
      }
    });
  }
  console.log(`✅ ${conditions.length} profil kondisi klinis dibuat`);

  // 3. Buat akun demo (Dokter, Pasien, Admin)
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('password123', salt);

  const locDoctor = INDONESIA_LOCATIONS[0];
  const doctor = await prisma.user.create({
    data: {
      email: 'doctor@neuronmotion.id',
      password: hash,
      name: 'dr. Budi Setiawan, Sp.S',
      role: 'DOCTOR',
      specialization: 'Spesialis Saraf (Neurologi)',
      licenseNumber: 'SIP.440/1234/DS-01/2022',
      institution: 'RSUP Dr. Cipto Mangunkusumo',
      country: locDoctor.country,
      countryName: locDoctor.countryName,
      state: locDoctor.state,
      region: locDoctor.region,
      city: locDoctor.city,
      address: locDoctor.address,
    }
  });

  const locPatient = INDONESIA_LOCATIONS[1];
  const demoDob = new Date();
  demoDob.setFullYear(demoDob.getFullYear() - 64);

  const patient = await prisma.user.create({
    data: {
      email: 'pasien@neuronmotion.id',
      password: hash,
      name: 'Pasien Demo',
      role: 'PATIENT',
      dateOfBirth: demoDob,
      gender: 'M',
      country: locPatient.country,
      countryName: locPatient.countryName,
      state: locPatient.state,
      region: locPatient.region,
      city: locPatient.city,
      address: locPatient.address,
    }
  });

  await prisma.user.create({
    data: {
      email: 'admin@neuronmotion.id',
      password: hash,
      name: 'Administrator',
      role: 'ADMIN',
      country: 'ID',
      countryName: 'Indonesia',
      state: 'DKI Jakarta',
      region: 'Jawa',
      city: 'Jakarta Pusat',
      address: 'Jl. Merdeka Barat No. 1',
    }
  });

  const adhitDob = new Date();
  adhitDob.setFullYear(adhitDob.getFullYear() - 36);

  // Akun Pasien Mandiri: Adhitya (Tidak tertaut ke dokter manapun)
  const adhitya = await prisma.user.create({
    data: {
      email: 'adhitya@neuronmotion.id',
      password: hash,
      name: 'Adhitya',
      role: 'PATIENT',
      dateOfBirth: adhitDob,
      gender: 'M',
      phone: '081298765432',
      country: 'ID',
      countryName: 'Indonesia',
      state: 'DKI Jakarta',
      region: 'Jawa',
      city: 'Jakarta Selatan',
      address: 'Jl. Senopati No. 88, Kebayoran Baru',
      shareCode: 'NM-ADHIT',
    }
  });

  await prisma.doctorPatient.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
    }
  });

  console.log('✅ Akun demo dokter, pasien demo, admin, dan pasien mandiri (Adhitya) dibuat');

  // 4. Generate dataset pasien sintetis
  console.log('🧠 Menghasilkan dataset klinis sintetis...');
  const dataset = generateTrainingDataset(300);
  console.log(`📊 Total ${dataset.length} sesi data klinis dihasilkan`);

  // 5. Buat 50 pasien dummy dan tautkan ke dokter secara batch
  console.log('👥 Menyimpan pasien sintetis ke database...');
  const FIRST_NAMES = ['Ahmad', 'Budi', 'Siti', 'Dewi', 'Hendra', 'Rina', 'Agus', 'Sri', 'Eko', 'Nur', 'Bambang', 'Wayan', 'Made', 'Nyoman', 'Ketut', 'Andi', 'Ilham', 'Faisal', 'Putri', 'Mega'];
  const LAST_NAMES = ['Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Hidayat', 'Lestari', 'Sari', 'Wibowo', 'Nugroho', 'Putra', 'Siregar', 'Nasution', 'Batubara', 'Ginting', 'Sitorus'];

  const DUMMY_COUNT = 50;
  const createdPatients = [];

  for (let i = 0; i < DUMMY_COUNT; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 3 + 7) % LAST_NAMES.length];
    const gender = i % 2 === 0 ? 'M' : 'F';
    const ageYears = 45 + ((i * 7) % 40);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - ageYears);
    const loc = INDONESIA_LOCATIONS[i % INDONESIA_LOCATIONS.length];

    const p = await prisma.user.create({
      data: {
        email: `patient${i + 100}@neuronmotion.id`,
        password: hash,
        name: `${fn} ${ln}`,
        role: 'PATIENT',
        dateOfBirth: dob,
        gender,
        country: loc.country,
        countryName: loc.countryName,
        state: loc.state,
        region: loc.region,
        city: loc.city,
        address: loc.address,
      }
    });
    createdPatients.push(p);
  }

  // Tautkan seluruh pasien dummy ke akun dokter dalam satu transaksi
  await prisma.$transaction(
    createdPatients.map(p => prisma.doctorPatient.create({
      data: { doctorId: doctor.id, patientId: p.id }
    }))
  );
  console.log(`✅ ${createdPatients.length} pasien tertaut ke dr. Budi Setiawan`);

  // 6. Buat sesi skrining untuk pasien demo & dummy
  console.log('📈 Menyimpan sesi skrining dan metrik biomarker...');
  
  const allPatients = [patient, ...createdPatients];
  const BATCH_SIZE = 100;
  const sessionsToCreate = [];

  for (let idx = 0; idx < dataset.length; idx++) {
    const sample = dataset[idx];
    const targetPatient = allPatients[idx % allPatients.length];

    const daysAgo = Math.floor(Math.random() * 90);
    const ts = new Date(Date.now() - daysAgo * 86400 * 1000);

    const b = sample.biomarkers;
    const cond = sample.condition;
    const isHigh = cond === 'PARKINSON_ADVANCED' || cond === 'POST_STROKE' || cond === 'CEREBELLAR_ATAXIA';
    const isMid = cond === 'PARKINSON_EARLY' || cond === 'ESSENTIAL_TREMOR';
    const riskCategory = isHigh ? 'HIGH' : isMid ? 'MEDIUM' : 'LOW';
    const compositeScore = isHigh ? 65 + Math.random() * 25 : isMid ? 38 + Math.random() * 24 : 10 + Math.random() * 20;

    const tremorResult = {
      dominantFrequencyHz: b.tremor.dominantFrequencyHz,
      amplitude: b.tremor.amplitude,
      category: b.tremor.dominantFrequencyHz >= 4 && b.tremor.dominantFrequencyHz <= 6 ? 'PARKINSON_TREMOR' : 'NORMAL',
      score: Math.round(b.tremor.dominantFrequencyHz * 12),
    };

    const fingerTappingResult = {
      tapRatePerSecond: b.fingerTapping.tapRatePerSecond,
      decrementPercent: b.fingerTapping.decrementPercent,
      category: b.fingerTapping.decrementPercent > 15 ? 'MODERATE_BRADYKINESIA' : 'NORMAL',
      score: Math.round(b.fingerTapping.decrementPercent * 2),
    };

    const gaitResult = {
      cadencePerMin: b.gait.cadencePerMin,
      strideSymmetryIndex: b.gait.symmetryIndex,
      symmetryPercent: Math.round(b.gait.symmetryIndex * 100),
      stepCount: 25,
      category: b.gait.symmetryIndex < 0.85 ? 'MODERATE_ASYMMETRY' : 'NORMAL',
      score: Math.round((1 - b.gait.symmetryIndex) * 100),
    };

    const armSwingResult = {
      leftAmplitudeDeg: b.armSwing.leftAmplitudeDeg,
      rightAmplitudeDeg: b.armSwing.rightAmplitudeDeg,
      asymmetryPercent: b.armSwing.asymmetryPercent,
      weakerSide: 'kanan',
      category: b.armSwing.asymmetryPercent > 15 ? 'MILD_ASYMMETRY' : 'NORMAL',
      score: Math.round(b.armSwing.asymmetryPercent * 1.5),
    };

    const romResult = {
      joint: 'knee',
      maxAngleDeg: b.rom.knee,
      minAngleDeg: 5,
      romDeg: b.rom.knee - 5,
      category: 'NORMAL',
      score: 10,
    };

    const posturalResult = {
      swayLengthNorm: b.posturalStability.swayLength,
      swayAreaNorm: b.posturalStability.swayArea,
      swayAreaCm2: parseFloat((b.posturalStability.swayArea * 1000).toFixed(2)),
      frameCount: 300,
      category: b.posturalStability.swayArea > 0.008 ? 'UNSTABLE' : 'STABLE',
      score: Math.round(b.posturalStability.swayArea * 5000),
    };

    sessionsToCreate.push({
      patientId: targetPatient.id,
      doctorId: doctor.id,
      timestamp: ts,
      createdAt: ts,
      tremorResult: JSON.stringify(tremorResult),
      fingerTappingResult: JSON.stringify(fingerTappingResult),
      gaitResult: JSON.stringify(gaitResult),
      armSwingResult: JSON.stringify(armSwingResult),
      romResult: JSON.stringify(romResult),
      posturalResult: JSON.stringify(posturalResult),
      compositeScore,
      riskCategory,
      mlPrediction: JSON.stringify({
        predictedLabel: sample.conditionLabel,
        predictedCondition: sample.condition,
        probabilities: {
          [sample.condition]: 0.70 + Math.random() * 0.25,
          HEALTHY: sample.condition === 'HEALTHY' ? 0.85 : 0.05,
        },
        modelType: 'K_NEAREST_NEIGHBORS',
        confidence: Math.round((0.70 + Math.random() * 0.25) * 100),
      }),
      recommendations: JSON.stringify([
        riskCategory === 'HIGH' ? 'Konsultasikan segera dengan dokter spesialis saraf.' : 'Pertahankan pola hidup sehat dan olahraga rutin.',
        'Lakukan pemantauan motorik berkala setiap 30 hari.',
      ]),
      doctorNote: riskCategory === 'HIGH'
        ? `Perhatian: Nilai komposit ${compositeScore.toFixed(1)} menunjukkan risiko tinggi. Terindikasi gejala ${sample.conditionLabel}. Jadwalkan pemeriksaan lanjutan.`
        : null,
    });
  }

  // Tulis sesi dalam batch transaksi agar cepat dan tidak kena timeout
  for (let i = 0; i < sessionsToCreate.length; i += BATCH_SIZE) {
    const chunk = sessionsToCreate.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      chunk.map(sessionData => prisma.session.create({ data: sessionData }))
    );
    console.log(`  -> Sesi terisi ${Math.min(i + BATCH_SIZE, sessionsToCreate.length)} / ${sessionsToCreate.length}`);
  }

  console.log(`✅ Berhasil menulis ${sessionsToCreate.length} sesi skrining untuk pasien demo & dummy`);

  // 7. Buat 15 sesi skrining mandiri untuk Adhitya (Riwayat panjang, tanpa tertaut dokter)
  console.log('📱 Membuat riwayat skrining mandiri Adhitya (15 sesi)...');
  const adhitTimelines = [
    { daysAgo: 165, cond: 'HEALTHY', condLabel: 'Normal / Pola motorik stabil', risk: 'LOW', score: 12.5, tremorFreq: 7.8, tremorAmp: 0.003, tapRate: 4.8, tapDec: 6, cadence: 108, sym: 0.96, armAsym: 8, swayArea: 0.0025, qScore: 0 },
    { daysAgo: 150, cond: 'HEALTHY', condLabel: 'Normal / Pola motorik stabil', risk: 'LOW', score: 14.0, tremorFreq: 8.2, tremorAmp: 0.004, tapRate: 4.6, tapDec: 8, cadence: 106, sym: 0.95, armAsym: 9, swayArea: 0.0028, qScore: 5 },
    { daysAgo: 138, cond: 'HEALTHY', condLabel: 'Normal / Pola motorik stabil', risk: 'LOW', score: 15.8, tremorFreq: 8.0, tremorAmp: 0.004, tapRate: 4.5, tapDec: 9, cadence: 104, sym: 0.94, armAsym: 11, swayArea: 0.0031, qScore: 5 },
    { daysAgo: 125, cond: 'HEALTHY', condLabel: 'Normal / Pola motorik stabil', risk: 'LOW', score: 19.2, tremorFreq: 6.8, tremorAmp: 0.006, tapRate: 4.3, tapDec: 11, cadence: 102, sym: 0.92, armAsym: 13, swayArea: 0.0035, qScore: 10 },
    { daysAgo: 110, cond: 'ESSENTIAL_TREMOR', condLabel: 'Tremor Esensial Ringan', risk: 'MEDIUM', score: 39.5, tremorFreq: 5.8, tremorAmp: 0.014, tapRate: 3.9, tapDec: 15, cadence: 98, sym: 0.89, armAsym: 17, swayArea: 0.0048, qScore: 35 },
    { daysAgo: 98, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 44.8, tremorFreq: 5.2, tremorAmp: 0.018, tapRate: 3.7, tapDec: 18, cadence: 96, sym: 0.87, armAsym: 21, swayArea: 0.0055, qScore: 45 },
    { daysAgo: 85, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 47.0, tremorFreq: 4.9, tremorAmp: 0.019, tapRate: 3.5, tapDec: 20, cadence: 94, sym: 0.86, armAsym: 23, swayArea: 0.0060, qScore: 50 },
    { daysAgo: 72, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 51.5, tremorFreq: 4.8, tremorAmp: 0.022, tapRate: 3.4, tapDec: 22, cadence: 92, sym: 0.84, armAsym: 25, swayArea: 0.0068, qScore: 55 },
    { daysAgo: 60, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 48.2, tremorFreq: 5.0, tremorAmp: 0.020, tapRate: 3.6, tapDec: 19, cadence: 95, sym: 0.86, armAsym: 22, swayArea: 0.0062, qScore: 45 },
    { daysAgo: 48, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 53.0, tremorFreq: 4.7, tremorAmp: 0.024, tapRate: 3.3, tapDec: 24, cadence: 91, sym: 0.83, armAsym: 27, swayArea: 0.0072, qScore: 60 },
    { daysAgo: 35, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 49.6, tremorFreq: 5.1, tremorAmp: 0.021, tapRate: 3.5, tapDec: 20, cadence: 93, sym: 0.85, armAsym: 24, swayArea: 0.0065, qScore: 50 },
    { daysAgo: 22, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 52.4, tremorFreq: 4.8, tremorAmp: 0.023, tapRate: 3.4, tapDec: 23, cadence: 92, sym: 0.84, armAsym: 26, swayArea: 0.0070, qScore: 55 },
    { daysAgo: 14, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 50.1, tremorFreq: 4.9, tremorAmp: 0.022, tapRate: 3.5, tapDec: 21, cadence: 94, sym: 0.85, armAsym: 23, swayArea: 0.0066, qScore: 50 },
    { daysAgo: 7, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 54.2, tremorFreq: 4.6, tremorAmp: 0.025, tapRate: 3.2, tapDec: 25, cadence: 90, sym: 0.82, armAsym: 28, swayArea: 0.0075, qScore: 60 },
    { daysAgo: 1, cond: 'PARKINSON_EARLY', condLabel: 'Indikasi Parkinson Awal', risk: 'MEDIUM', score: 51.8, tremorFreq: 4.8, tremorAmp: 0.022, tapRate: 3.4, tapDec: 22, cadence: 93, sym: 0.84, armAsym: 25, swayArea: 0.0069, qScore: 55 },
  ];

  for (const s of adhitTimelines) {
    const ts = new Date(Date.now() - s.daysAgo * 86400 * 1000);
    const isMedium = s.risk === 'MEDIUM';

    const tremorResult = {
      dominantFrequencyHz: s.tremorFreq,
      amplitude: s.tremorAmp,
      category: isMedium ? 'PARKINSON_TREMOR' : 'NORMAL',
      score: Math.round(s.tremorFreq * 10),
    };

    const fingerTappingResult = {
      tapRatePerSecond: s.tapRate,
      decrementPercent: s.tapDec,
      category: s.tapDec > 15 ? 'MODERATE_BRADYKINESIA' : 'NORMAL',
      score: Math.round(s.tapDec * 2),
    };

    const gaitResult = {
      cadencePerMin: s.cadence,
      strideSymmetryIndex: s.sym,
      symmetryPercent: Math.round(s.sym * 100),
      stepCount: 28,
      category: s.sym < 0.85 ? 'MODERATE_ASYMMETRY' : 'NORMAL',
      score: Math.round((1 - s.sym) * 100),
    };

    const armSwingResult = {
      leftAmplitudeDeg: 32,
      rightAmplitudeDeg: Math.round(32 * (1 - s.armAsym / 100)),
      asymmetryPercent: s.armAsym,
      weakerSide: 'kanan',
      category: s.armAsym > 15 ? 'MILD_ASYMMETRY' : 'NORMAL',
      score: Math.round(s.armAsym * 1.5),
    };

    const romResult = {
      joint: 'knee',
      maxAngleDeg: isMedium ? 122 : 135,
      minAngleDeg: 5,
      romDeg: isMedium ? 117 : 130,
      category: 'NORMAL',
      score: 10,
    };

    const posturalResult = {
      swayLengthNorm: s.swayArea * 15,
      swayAreaNorm: s.swayArea,
      swayAreaCm2: parseFloat((s.swayArea * 1000).toFixed(2)),
      frameCount: 300,
      category: s.swayArea > 0.008 ? 'UNSTABLE' : 'STABLE',
      score: Math.round(s.swayArea * 5000),
    };

    const questionnaire = {
      tremorSaatIstirahat: isMedium,
      kekakuanOtot: s.score > 50,
      gerakanMelambat: s.score > 45,
      gangguanKeseimbangan: false,
      kesulitanMenulis: s.score > 45,
      langkahMenyeret: false,
      durasiGejalaBulan: s.daysAgo > 100 ? 1 : 4,
    };

    const aiAnalysis = {
      available: true,
      ringkasan: isMedium
        ? `Hasil skrining mandiri menunjukkan indikasi tremor istirahat (${s.tremorFreq} Hz) pada tangan kanan dan perlambatan laju ketukan jari (${s.tapRate} ketukan/dtk, penurunan ${s.tapDec}%). Keseimbangan postural dan stabilitas tubuh masih tergolong baik.`
        : 'Hasil skrining mandiri menunjukkan seluruh biomarker motorik (tremor, ketukan jari, gaya berjalan, dan postur) berada dalam rentang normal dan stabil.',
      tingkatKeyakinan: isMedium ? 'SEDANG' : 'TINGGI',
      korelasiGejala: [
        {
          gejala: 'Tremor saat tangan istirahat',
          biomarkerTerkait: 'Frekuensi Tremor Tangan',
          penjelasan: isMedium
            ? `Frekuensi tremor terukur ${s.tremorFreq} Hz dengan amplitudo ${s.tremorAmp}, sesuai dengan karakteristik tremor istirahat frekuensi 4-6 Hz.`
            : 'Frekuensi dan amplitudo tremor berada dalam batas fisiologis normal.',
          tingkatKesesuaian: isMedium ? 'SESUAI' : 'TIDAK_SESUAI',
        },
        {
          gejala: 'Kecepatan ketukan jari berkurang',
          biomarkerTerkait: 'Finger Tapping Rate & Decrement',
          penjelasan: isMedium
            ? `Penurunan ritme ketukan jari sebesar ${s.tapDec}% selama pengujian berulang.`
            : 'Ketukan jari konsisten stabil tanpa penurunan ritme signifikan.',
          tingkatKesesuaian: isMedium ? 'SESUAI' : 'TIDAK_SESUAI',
        },
      ],
      saranTindakLanjut: [
        'Lakukan skrining mandiri berkala setiap 2-4 minggu untuk memantau perkembangan tren motorik.',
        isMedium
          ? 'Gunakan fitur bagikan kode akses (Share Code) bila ingin berkonsultasi langsung dengan dokter spesialis neurologi.'
          : 'Pertahankan aktivitas fisik teratur, latihan peregangan, dan pola istirahat yang cukup.',
      ],
      perluPerhatianSegera: false,
    };

    await prisma.session.create({
      data: {
        patientId: adhitya.id,
        doctorId: null, // Pasien mandiri, tidak tertaut ke dokter
        timestamp: ts,
        createdAt: ts,
        tremorResult: JSON.stringify(tremorResult),
        fingerTappingResult: JSON.stringify(fingerTappingResult),
        gaitResult: JSON.stringify(gaitResult),
        armSwingResult: JSON.stringify(armSwingResult),
        romResult: JSON.stringify(romResult),
        posturalResult: JSON.stringify(posturalResult),
        compositeScore: s.score,
        riskCategory: s.risk,
        mlPrediction: JSON.stringify({
          predictedLabel: s.condLabel,
          predictedCondition: s.cond,
          probabilities: {
            [s.cond]: isMedium ? 0.76 : 0.90,
            HEALTHY: isMedium ? 0.20 : 0.90,
          },
          modelType: 'K_NEAREST_NEIGHBORS',
          confidence: isMedium ? 76 : 90,
        }),
        recommendations: JSON.stringify([
          isMedium
            ? 'Pertimbangkan konsultasi dengan dokter spesialis saraf untuk evaluasi lanjutan jika gejala memberat.'
            : 'Pola motorik normal. Pertahankan gaya hidup sehat.',
          'Lakukan pemantauan berkala setiap bulan.',
        ]),
        questionnaire: JSON.stringify(questionnaire),
        questionnaireScore: s.qScore,
        aiAnalysis: JSON.stringify(aiAnalysis),
        doctorNote: null,
      },
    });
  }
  console.log(`✅ Berhasil menulis ${adhitTimelines.length} sesi skrining mandiri untuk Adhitya`);

  console.log('\n========================================');
  console.log('🎉 Seeding database NeuronMotion selesai (Scope: Indonesia)!');
  console.log('========================================');
  console.log('Akun untuk pengujian:');
  console.log('  Dokter         : doctor@neuronmotion.id  / password123 (Tertaut 51 pasien)');
  console.log('  Pasien Demo    : pasien@neuronmotion.id  / password123 (Tertaut dokter)');
  console.log('  Pasien Mandiri : adhitya@neuronmotion.id / password123 (15 Sesi, Bebas/Tanpa Dokter)');
  console.log('  Admin          : admin@neuronmotion.id   / password123');
  console.log(`  Total pasien dummy tertaut dokter : ${createdPatients.length}`);
  console.log(`  Total sesi data dokter/demo       : ${sessionsToCreate.length}`);
  console.log(`  Total sesi mandiri Adhitya        : ${adhitTimelines.length}`);
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
