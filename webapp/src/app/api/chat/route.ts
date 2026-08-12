import { NextRequest, NextResponse } from 'next/server';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
// Gunakan model yang sama dengan server
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const FALLBACK_MODEL = process.env.GEMINI_MODEL_FALLBACK || 'gemini-1.5-flash';

const SYSTEM_INSTRUCTION = `Anda adalah asisten kesehatan virtual NeuronMotion bernama "NeuroBot". 
Anda membantu pengguna memahami hasil skrining gangguan motorik saraf (seperti Parkinson dan tremor).

ATURAN PENTING:
1. Anda BUKAN dokter dan TIDAK BOLEH memberikan diagnosis medis. Selalu ingatkan pengguna untuk berkonsultasi dengan dokter ahli saraf.
2. Gunakan bahasa Indonesia yang hangat, ramah, dan mudah dipahami awam.
3. Jelaskan istilah medis dengan bahasa sederhana jika diperlukan.
4. Fokus pada: membantu memahami skor skrining, memberikan edukasi umum tentang kesehatan motorik, dan mendorong gaya hidup sehat.
5. Jika ditanya tentang darurat medis, segera sarankan untuk menghubungi layanan darurat atau pergi ke IGD.
6. Jawab dengan singkat, padat, dan informatif. Maksimal 3-4 paragraf per jawaban.
7. Anda beroperasi dalam platform NeuronMotion, sebuah sistem skrining gangguan saraf motorik berbasis kamera dan AI.

Mulai percakapan dengan ramah dan perkenalkan diri Anda secara singkat.`;

interface Message {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

async function callGemini(model: string, messages: Message[], apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }],
        },
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Respons Gemini kosong');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Layanan chat AI belum dikonfigurasi.' },
      { status: 503 }
    );
  }

  let body: { messages: Message[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 });
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 });
  }

  try {
    const reply = await callGemini(MODEL, messages, apiKey);
    return NextResponse.json({ reply });
  } catch (primaryError) {
    console.warn(`Chat Gemini primary (${MODEL}) gagal:`, primaryError);
    try {
      const reply = await callGemini(FALLBACK_MODEL, messages, apiKey);
      return NextResponse.json({ reply });
    } catch (fallbackError) {
      console.error('Chat Gemini fallback juga gagal:', fallbackError);
      return NextResponse.json(
        { error: 'Layanan AI sementara tidak tersedia. Silakan coba lagi nanti.' },
        { status: 503 }
      );
    }
  }
}
