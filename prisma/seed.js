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

  await prisma.doctorPatient.create({
    data: {
      doctorId: doctor.id,
      patientId: patient.id,
    }
  });

  console.log('✅ Akun demo dokter, pasien, dan admin dibuat');

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

  console.log(`✅ Berhasil menulis ${sessionsToCreate.length} sesi skrining`);

  console.log('\n========================================');
  console.log('🎉 Seeding database NeuronMotion selesai (Scope: Indonesia)!');
  console.log('========================================');
  console.log('Akun untuk pengujian:');
  console.log('  Dokter : doctor@neuronmotion.id / password123');
  console.log('  Pasien : pasien@neuronmotion.id / password123');
  console.log('  Admin  : admin@neuronmotion.id  / password123');
  console.log(`  Total pasien demo : ${allPatients.length}`);
  console.log(`  Total sesi data   : ${sessionsToCreate.length}`);
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
