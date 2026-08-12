import express from 'express';
import { chatWithAssistant, isGeminiConfigured } from '../services/gemini.js';

const router = express.Router();

/** GET /api/chat/status, cek apakah asisten AI aktif di server ini */
router.get('/status', (req, res) => {
  res.json({ available: isGeminiConfigured() });
});

/**
 * POST /api/chat
 * Body: { messages: [{ role: 'user' | 'model', parts: [{ text }] }] }
 *
 * Endpoint ini berada di backend Express, bukan sebagai route Next.js, karena
 * di produksi nginx meneruskan seluruh /api/* ke Express (dan memotong awalan
 * /api). Ketika chat masih berupa route Next.js, permintaan ke /api/chat justru
 * mendarat di Express sebagai POST /chat dan berakhir 404. Menempatkannya di
 * sini juga membuat GEMINI_API_KEY cukup disimpan di satu tempat.
 */
router.post('/', async (req, res) => {
  const result = await chatWithAssistant(req.body?.messages);
  if (result.error) {
    return res.status(result.status || 503).json({ error: result.error });
  }
  res.json({ reply: result.reply });
});

export default router;
