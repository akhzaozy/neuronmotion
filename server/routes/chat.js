import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/access.js';
import {
  chatWithAssistant,
  isGeminiConfigured,
  getGeminiConfigInfo,
  verifyGeminiSetup,
} from '../services/gemini.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'neuronmotion-secret-key';

function safeJsonParse(val, fallback = null) {
  if (!val) return fallback;
  try {
    return typeof val === 'string' ? JSON.parse(val) : val;
  } catch {
    return fallback;
  }
}

/**
 * Mengekstrak konteks profil dan sesi skrining terakhir pengguna
 * bila request membawa header Authorization Bearer token yang valid.
 */
async function extractPatientContext(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientSessions: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) return null;

    let age = null;
    if (user.dateOfBirth) {
      age = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
    }

    const lastSession = user.patientSessions?.[0];
    if (!lastSession) {
      return {
        isLoggedIn: true,
        hasSessions: false,
        name: user.name,
        role: user.role,
        age,
        gender: user.gender === 'M' ? 'Laki-laki' : user.gender === 'F' ? 'Perempuan' : 'Tidak disebutkan',
      };
    }

    // Parse biomarker dari sesi terakhir
    const tremor = safeJsonParse(lastSession.tremorResult);
    const fingerTapping = safeJsonParse(lastSession.fingerTappingResult);
    const gait = safeJsonParse(lastSession.gaitResult);
    const armSwing = safeJsonParse(lastSession.armSwingResult);
    const postural = safeJsonParse(lastSession.posturalResult);
    const rom = safeJsonParse(lastSession.romResult);
    const ml = safeJsonParse(lastSession.mlPrediction);
    const aiAnalysis = safeJsonParse(lastSession.aiAnalysis);

    const biomarkerSummary = [];
    if (tremor && !tremor.error) {
      biomarkerSummary.push(
        `- Tremor Tangan: Kategori ${tremor.category || '-'}, Skor ${tremor.score ?? 0}/100, Frekuensi ${tremor.dominantFrequencyHz ?? '-'} Hz, Amplitudo ${tremor.amplitudeMillimeter ?? '-'} mm`
      );
    }
    if (fingerTapping && !fingerTapping.error) {
      biomarkerSummary.push(
        `- Finger Tapping (Ketukan Jari): Kategori ${fingerTapping.category || '-'}, Skor ${fingerTapping.score ?? 0}/100, Kecepatan ${fingerTapping.tapRatePerSecond ?? '-'} ketukan/dtk, Penurunan Amplitudo ${fingerTapping.decrementPercent ?? '-'}%`
      );
    }
    if (gait && !gait.error) {
      biomarkerSummary.push(
        `- Pola Berjalan (Gait): Kategori ${gait.category || '-'}, Skor ${gait.score ?? 0}/100, Kadense ${gait.cadencePerMin ?? '-'} langkah/mnt, Asimetri ${gait.asymmetryPercent ?? '-'}%`
      );
    }
    if (armSwing && !armSwing.error) {
      biomarkerSummary.push(
        `- Ayunan Lengan (Arm Swing): Kategori ${armSwing.category || '-'}, Skor ${armSwing.score ?? 0}/100, Asimetri ${armSwing.asymmetryPercent ?? '-'}%`
      );
    }
    if (postural && !postural.error) {
      biomarkerSummary.push(
        `- Stabilitas Postural: Kategori ${postural.category || '-'}, Skor ${postural.score ?? 0}/100, Sway Area ${postural.swayAreaCm2 ?? '-'} cm2`
      );
    }
    if (rom && !rom.error) {
      biomarkerSummary.push(
        `- Rentang Gerak (ROM): Kategori ${rom.category || '-'}, Skor ${rom.score ?? 0}/100, Sudut ${rom.romDeg ?? '-'} derajat`
      );
    }

    return {
      isLoggedIn: true,
      hasSessions: true,
      name: user.name,
      role: user.role,
      age,
      gender: user.gender === 'M' ? 'Laki-laki' : user.gender === 'F' ? 'Perempuan' : 'Tidak disebutkan',
      dateFormatted: new Date(lastSession.timestamp).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      compositeScore: Math.round(lastSession.compositeScore || 0),
      riskCategory:
        lastSession.riskCategory === 'HIGH'
          ? 'Tinggi (High Risk)'
          : lastSession.riskCategory === 'MEDIUM'
            ? 'Sedang (Medium Risk)'
            : 'Rendah (Low Risk)',
      conditionPattern: ml?.predictedLabel || 'Normal / Pola motorik stabil',
      conditionConfidence: ml?.confidence ? `${Math.round(ml.confidence * 100)}%` : undefined,
      biomarkersList:
        biomarkerSummary.length > 0
          ? biomarkerSummary.join('\n')
          : '- Tidak ada rincian biomarker yang tercatat',
      aiSummary: aiAnalysis?.ringkasan || null,
      doctorNote: lastSession.doctorNote || null,
    };
  } catch (e) {
    return null;
  }
}

/** GET /api/chat/status, cek apakah asisten AI aktif di server ini */
router.get('/status', (req, res) => {
  res.json({ available: isGeminiConfigured() });
});

/**
 * GET /api/chat/diagnose
 * Memeriksa konfigurasi dan mencoba satu permintaan nyata ke Gemini
 */
router.get('/diagnose', requireAuth, requireRole('ADMIN'), async (req, res) => {
  const config = getGeminiConfigInfo();
  const modelCheck = await verifyGeminiSetup();

  let liveTest;
  try {
    const result = await chatWithAssistant([
      { role: 'user', parts: [{ text: 'Balas dengan satu kata: halo' }] },
    ]);
    liveTest = result.error
      ? { ok: false, error: result.error, lastError: result.lastError }
      : { ok: true, replyPreview: result.reply.slice(0, 80) };
  } catch (e) {
    liveTest = { ok: false, error: e.message };
  }

  res.json({ config, modelCheck, liveTest });
});

/**
 * POST /api/chat
 * Body: { messages: [{ role: 'user' | 'model', parts: [{ text }] }] }
 * Menerima token opsional via Authorization header untuk menyertakan data skrining pasien.
 */
router.post('/', async (req, res) => {
  const lang = req.body?.lang === 'en' ? 'en' : 'id';
  const patientContext = await extractPatientContext(req);
  const result = await chatWithAssistant(req.body?.messages, lang, patientContext);
  if (result.error) {
    return res.status(result.status || 503).json({ error: result.error });
  }
  res.json({ reply: result.reply });
});

export default router;
