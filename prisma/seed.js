/**
 * NeuronMotion — Database Seeder
 * Mengisi database dengan data pasien sintetis berbasis klinis
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTrainingDataset, CONDITION_PROFILES, CLINICAL_REFERENCE } from '../server/data/clinicalData.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding database NeuronMotion...\n');

  // 1. Bersihkan data lama
  await prisma.session.deleteMany();
  await prisma.doctorPatient.deleteMany();
  await prisma.condition.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database dibersihkan');

  // 2. Seed Conditions (referensi klinis)
  const conditions = await Promise.all(
    Object.entries(CONDITION_PROFILES).map(([key, profile]) =>
      prisma.condition.create({
        data: {
          key,
          label: profile.label,
          description: profile.description,
          biomarkerThresholds: JSON.stringify(profile.biomarkerProfile),
        },
      })
    )
  );
  console.log(`✅ ${conditions.length} kondisi klinis ditambahkan`);

  // 3. Buat akun Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: { email: 'admin@neuronmotion.id', password: adminPassword, name: 'Admin NeuronMotion', role: 'ADMIN' },
  });

  // 4. Buat 5 Dokter Spesialis Saraf
  const doctorPassword = await bcrypt.hash('doctor123', 10);
  const doctorData = [
    { name: 'dr. Andi Wijaya, Sp.S', email: 'dr.andi@neuronmotion.id', spec: 'Neurologi', license: 'SIP-2021-001' },
    { name: 'dr. Sari Kusuma, Sp.S', email: 'dr.sari@neuronmotion.id', spec: 'Neurologi', license: 'SIP-2021-002' },
    { name: 'dr. Budi Santoso, Sp.KFR', email: 'dr.budi@neuronmotion.id', spec: 'Kedokteran Fisik & Rehabilitasi', license: 'SIP-2020-015' },
    { name: 'dr. Dewi Rahayu, Sp.S', email: 'dr.dewi@neuronmotion.id', spec: 'Neurologi', license: 'SIP-2022-008' },
    { name: 'dr. Hendra Pratama, Sp.KFR', email: 'dr.hendra@neuronmotion.id', spec: 'Kedokteran Fisik & Rehabilitasi', license: 'SIP-2019-030' },
  ];
  const doctors = await Promise.all(
    doctorData.map(d => prisma.user.create({
      data: {
        email: d.email, password: doctorPassword, name: d.name,
        role: 'DOCTOR', specialization: d.spec, licenseNumber: d.license,
      },
    }))
  );
  console.log(`✅ ${doctors.length} akun dokter dibuat`);

  // 5. Generate dan seed pasien sintetis
  const patientPassword = await bcrypt.hash('patient123', 10);
  const syntheticDataset = generateTrainingDataset(1500); // 1500 pasien

  let sessionCount = 0;
  const createdPatients = [];

  for (const patientData of syntheticDataset) {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - patientData.age);

    const patient = await prisma.user.create({
      data: {
        email: patientData.email,
        password: patientPassword,
        name: patientData.name,
        role: 'PATIENT',
        gender: patientData.gender,
        dateOfBirth: dob,
      },
    });
    createdPatients.push({ ...patient, condition: patientData.condition });

    // Link ke dokter acak
    const assignedDoctor = doctors[Math.floor(Math.random() * doctors.length)];
    await prisma.doctorPatient.create({
      data: { doctorId: assignedDoctor.id, patientId: patient.id },
    });

    // Buat 1-3 sesi pemeriksaan per pasien
    const sessionCount_ = Math.floor(Math.random() * 3) + 1;
    for (let s = 0; s < sessionCount_; s++) {
      const bm = patientData.biomarkers;

      // Buat sesi dengan data biomarker sintetis
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - (s * 30)); // setiap 30 hari

      await prisma.session.create({
        data: {
          patientId: patient.id,
          doctorId: assignedDoctor.id,
          tremorResult: JSON.stringify({
            dominantFrequencyHz: bm.tremor.dominantFrequencyHz,
            amplitude: bm.tremor.amplitude,
            category: categorizeTremor(bm.tremor),
            score: scoreTremor(bm.tremor),
          }),
          fingerTappingResult: JSON.stringify({
            tapRatePerSecond: bm.fingerTapping.tapRatePerSecond,
            decrementPercent: bm.fingerTapping.decrementPercent,
            category: categorizeTapping(bm.fingerTapping),
            score: scoreTapping(bm.fingerTapping),
          }),
          gaitResult: JSON.stringify({
            symmetryIndex: bm.gait.symmetryIndex,
            cadencePerMin: bm.gait.cadencePerMin,
            category: categorizeGait(bm.gait),
            score: scoreGait(bm.gait),
          }),
          posturalResult: JSON.stringify({
            swayAreaNorm: bm.posturalStability.swayArea,
            swayLengthNorm: bm.posturalStability.swayLength,
            category: categorizePosture(bm.posturalStability),
            score: scorePosture(bm.posturalStability),
          }),
          compositeScore: patientData.updrsApprox.severityPercent,
          riskCategory: patientData.updrsApprox.severityPercent >= 65 ? 'HIGH'
            : patientData.updrsApprox.severityPercent >= 35 ? 'MEDIUM' : 'LOW',
          mlPrediction: JSON.stringify({ predictedCondition: patientData.condition, predictedLabel: patientData.conditionLabel }),
          updrsEstimate: JSON.stringify(patientData.updrsApprox),
          recommendations: JSON.stringify(generateBasicRecs(patientData.condition)),
          doctorNote: s === 0 && Math.random() > 0.5
            ? `Pasien datang dengan keluhan ${patientData.conditionLabel}. Perlu tindak lanjut.`
            : null,
          timestamp: sessionDate,
        },
      });
      sessionCount++;
    }
  }

  console.log(`✅ ${createdPatients.length} pasien sintetis dibuat`);
  console.log(`✅ ${sessionCount} sesi pemeriksaan dibuat`);

  // Buat akun pasien demo yang bisa login
  const demoPatient = await prisma.user.create({
    data: {
      email: 'pasien@neuronmotion.id',
      password: await bcrypt.hash('password123', 10),
      name: 'Pasien Demo',
      role: 'PATIENT',
      gender: 'M',
    },
  });
  await prisma.doctorPatient.create({ data: { doctorId: doctors[0].id, patientId: demoPatient.id } });
  console.log(`\n✅ Akun demo dibuat:`);
  console.log(`   Pasien: pasien@neuronmotion.id / password123`);
  console.log(`   Dokter: dr.andi@neuronmotion.id / doctor123`);
  console.log(`   Admin:  admin@neuronmotion.id / admin123`);
  console.log('\n🌿 Seeding selesai!');
}

// Helper functions untuk seeder
function categorizeTremor(t) {
  if (t.amplitude < 0.005) return 'NORMAL';
  if (t.dominantFrequencyHz >= 4 && t.dominantFrequencyHz <= 6) return 'PARKINSON_TREMOR';
  if (t.dominantFrequencyHz > 6) return 'ESSENTIAL_TREMOR';
  return 'ABNORMAL';
}
function scoreTremor(t) {
  if (t.amplitude < 0.005) return 0;
  if (t.dominantFrequencyHz >= 4 && t.dominantFrequencyHz <= 6) return 85;
  if (t.dominantFrequencyHz > 6) return 55;
  return 40;
}
function categorizeTapping(ft) {
  if (ft.tapRatePerSecond >= 3.5) return 'NORMAL';
  if (ft.tapRatePerSecond < 1.5) return 'SEVERE_BRADYKINESIA';
  if (ft.tapRatePerSecond < 2.5) return 'MODERATE_BRADYKINESIA';
  return 'MILD_BRADYKINESIA';
}
function scoreTapping(ft) {
  if (ft.tapRatePerSecond >= 3.5) return 0;
  if (ft.tapRatePerSecond < 1.5) return 90;
  if (ft.tapRatePerSecond < 2.5) return 65;
  return 35;
}
function categorizeGait(g) {
  if (g.symmetryIndex >= 0.90) return 'NORMAL';
  if (g.symmetryIndex < 0.75) return 'SEVERE_ASYMMETRY';
  if (g.symmetryIndex < 0.85) return 'MODERATE_ASYMMETRY';
  return 'MILD_ASYMMETRY';
}
function scoreGait(g) {
  if (g.symmetryIndex >= 0.90) return 0;
  if (g.symmetryIndex < 0.75) return 88;
  if (g.symmetryIndex < 0.85) return 60;
  return 35;
}
function categorizePosture(p) {
  if (p.swayArea < 0.003) return 'STABLE';
  if (p.swayArea > 0.015) return 'SEVERELY_UNSTABLE';
  if (p.swayArea > 0.008) return 'MODERATELY_UNSTABLE';
  return 'MILDLY_UNSTABLE';
}
function scorePosture(p) {
  if (p.swayArea < 0.003) return 0;
  if (p.swayArea > 0.015) return 85;
  if (p.swayArea > 0.008) return 50;
  return 25;
}
function generateBasicRecs(condition) {
  const recs = {
    HEALTHY: ['Tetap aktif berolahraga.', 'Skrining ulang tiap 6 bulan.'],
    PARKINSON_EARLY: ['Konsultasi neurolog segera.', 'Mulai program fisioterapi.', 'Evaluasi kebutuhan terapi farmakologi.'],
    PARKINSON_ADVANCED: ['Rawat inap atau pengawasan intensif dianjurkan.', 'Evaluasi terapi levodopa.'],
    POST_STROKE: ['Rehabilitasi intensif dengan fisioterapis.', 'Latihan ROM dan penguatan otot.'],
    ESSENTIAL_TREMOR: ['Evaluasi kebutuhan terapi beta-blocker.', 'Hindari kafein dan alkohol.'],
    CEREBELLAR_ATAXIA: ['Latihan koordinasi dan keseimbangan.', 'Evaluasi etiologi dengan MRI otak.'],
  };
  return recs[condition] || ['Konsultasikan dengan dokter.'];
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
