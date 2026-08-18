const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Nama peristiwa yang ditembakkan ketika server menolak token.
 *
 * Lapisan ini sengaja tidak memanggil konteks autentikasi secara langsung:
 * berkas ini bukan komponen React dan tidak boleh menjadi komponen React
 * hanya demi keperluan ini. Yang mendengarkan adalah AuthProvider, yang
 * memang sudah memegang wewenang mengeluarkan pengguna.
 */
export const SESSION_EXPIRED_EVENT = 'nm:session-expired';

/** Ditandai supaya pemanggil bisa membedakannya dari galat biasa. */
export class SessionExpiredError extends Error {
  readonly sessionExpired = true;
  constructor(message: string) {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

async function request<T>(method: string, path: string, body?: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  /* Token ditolak. Sebelumnya keadaan ini jatuh ke Error generik yang sama
     dengan kegagalan jaringan, sehingga halaman menampilkan "gagal memuat"
     beserta tombol Coba lagi yang tidak akan pernah berhasil, sementara
     portal nakes menelannya diam-diam dan terus menjajak tiap 30 detik.

     Permintaan tanpa token dikecualikan: masuk dengan kata sandi keliru juga
     menjawab 401, dan mengeluarkan pengguna yang memang belum masuk hanya
     akan menampilkan pemberitahuan sesi berakhir di halaman masuk itu
     sendiri. */
  if (res.status === 401 && token) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    throw new SessionExpiredError(data.error || 'Sesi berakhir');
  }

  if (!res.ok) throw new Error(data.error || 'API error');
  return data as T;
}

export const api = {
  // Auth
  register: (data: RegisterInput) =>
    request('POST', '/api/auth/register', data),

  login: (email: string, password: string) =>
    request<{ token: string; user: UserProfile }>('POST', '/api/auth/login', { email, password }),

  getMe: (token?: string) =>
    request<UserProfile>('GET', '/api/auth/me', undefined, token),

  updateProfile: (data: Partial<RegisterInput>, token?: string) =>
    request<UserProfile>('PUT', '/api/auth/profile', data, token),

  changePassword: (currentPassword: string, newPassword: string, token?: string) =>
    request('PUT', '/api/auth/password', { currentPassword, newPassword }, token),

  deleteAccount: (token?: string) =>
    request('DELETE', '/api/auth/account', undefined, token),

  deleteHistory: (token?: string) =>
    request<{ deletedCount: number }>('DELETE', '/api/tests/history', undefined, token),

  // Tests
  analyzeTremor: (data: object) =>
    request('POST', '/api/tests/tremor', data),

  analyzeFingerTapping: (data: object) =>
    request('POST', '/api/tests/finger-tapping', data),

  analyzeGait: (data: object) =>
    request('POST', '/api/tests/gait', data),

  analyzeArmSwing: (data: object) =>
    request('POST', '/api/tests/arm-swing', data),

  analyzePosture: (data: object) =>
    request('POST', '/api/tests/posture', data),

  analyzeROM: (data: object) =>
    request('POST', '/api/tests/rom', data),

  getQuestionnaire: () =>
    request<{ questions: QuestionnaireQuestion[]; aiEnabled: boolean }>('GET', '/api/tests/questionnaire'),

  fullScreening: (patientId: number, biomarkerData: object, token?: string) =>
    request<ScreeningResult>('POST', '/api/tests/full-screening', { patientId, ...biomarkerData }, token),

  getHistory: (patientId: number, token?: string) =>
    request<{ sessions: Session[] }>('GET', `/api/tests/history/${patientId}`, undefined, token),

  getSession: (sessionId: number, token?: string) =>
    request('GET', `/api/tests/session/${sessionId}`, undefined, token),

  // Patients
  getPatients: (params?: { search?: string; risk?: string; page?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request('GET', `/api/patients?${q}`);
  },

  getPatient: (id: number, token?: string) =>
    request<PatientDetail>('GET', `/api/patients/${id}`, undefined, token),

  getPatientSummary: (id: number, token?: string) =>
    request('GET', `/api/patients/${id}/summary`, undefined, token),

  // Doctor
  getDoctorPatients: (doctorId: number, token?: string) =>
    request<{ patients: any[] }>('GET', `/api/doctor/patients?doctorId=${doctorId}`, undefined, token),

  getDoctorDashboard: (doctorId: number, token?: string) =>
    request('GET', `/api/doctor/dashboard/${doctorId}`, undefined, token),

  saveNote: (sessionId: number, data: object, token?: string) =>
    request('PUT', `/api/doctor/sessions/${sessionId}/note`, data, token),

  // Penautan pasien lewat kode berbagi yang ditunjukkan pasien sendiri
  getShareCode: (patientId: number, token?: string) =>
    request<{ shareCode: string }>('GET', `/api/patients/${patientId}/share-code`, undefined, token),

  resetShareCode: (patientId: number, token?: string) =>
    request<{ shareCode: string }>('POST', `/api/patients/${patientId}/share-code/reset`, undefined, token),

  linkPatientByCode: (code: string, token?: string) =>
    request<{ message: string; patient: { id: number; name: string } }>(
      'POST', '/api/doctor/link-by-code', { code }, token
    ),

  unlinkPatient: (patientId: number, token?: string) =>
    request<{ message: string }>('DELETE', `/api/doctor/patients/${patientId}`, undefined, token),

  // Chat asisten (NeuroBot)
  chat: (messages: ChatApiMessage[], lang: 'id' | 'en' = 'id', token?: string) =>
    request<{ reply: string }>('POST', '/api/chat', { messages, lang }, token),

  // Admin
  getStats: () => request('GET', '/api/admin/stats'),
  getConditions: () => request('GET', '/api/admin/conditions'),
  getModelAccuracy: () => request<ModelAccuracy>('GET', '/api/admin/model-accuracy'),
};

export interface ModelAccuracy {
  accuracy: number;
  trainSize: number;
  testSize: number;
  correct: number;
  method: string;
}

// Types
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  gender?: string;
  dateOfBirth?: string;
  specialization?: string;
  institution?: string;
  licenseNumber?: string;
  signature?: string | null;
  country?: string;
  countryName?: string;
  region?: string;
  state?: string;
  city?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: string;
  gender?: string;
  dateOfBirth?: string;
  specialization?: string;
  institution?: string;
  licenseNumber?: string;
  signature?: string | null;
  country?: string;
  countryName?: string;
  region?: string;
  state?: string;
  city?: string;
}

export interface Session {
  id: number;
  compositeScore: number;
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH';
  timestamp: string;
  mlPrediction?: { predictedCondition: string; predictedLabel: string; confidence?: number };
  recommendations?: string[];
  tremorResult?: Record<string, unknown>;
  fingerTappingResult?: Record<string, unknown>;
  gaitResult?: Record<string, unknown>;
  posturalResult?: Record<string, unknown>;
  doctorNote?: string;
  questionnaireScore?: number | null;
  aiAnalysis?: AiAnalysis | null;
  /* Biomarker mentah, dalam DUA bentuk yang sama-sama sah.
     ─────────────────────────────────────────────────────────────────────────
     Ada dua penulis ke kolom-kolom ini dan keduanya memakai nama berbeda:

       analisator live (server/services/biomarkers.js)
         gait     -> symmetryPercent, strideSymmetryIndex, cadencePerMin
         postural -> swayAreaCm2, swayAreaNorm, swayLengthNorm
       data seed (prisma/seed.js)
         gait     -> symmetryIndex, cadencePerMin
         postural -> swayAreaNorm, swayLengthNorm

     Karena semuanya opsional, TypeScript tidak pernah mengeluh, sehingga
     halaman yang hanya membaca bentuk pertama diam-diam menampilkan kosong
     untuk seluruh pasien seed. Itu terjadi di riwayat, di laporan cetak, dan
     di portal nakes sekaligus.

     Tipe di sini memuat kedua bentuk supaya keduanya terbaca, dan
     `lib/biomarkers.ts` yang bertugas menyatukannya menjadi satu satuan.
     Jangan membaca field ini langsung dari komponen; pakai penormal itu. */
  rawBiomarkers?: {
    tremor?: { dominantFrequencyHz?: number; amplitude?: number; category?: string; score?: number } | null;
    fingerTapping?: { tapRatePerSecond?: number; decrementPercent?: number; category?: string; score?: number } | null;
    gait?: {
      symmetryPercent?: number;
      strideSymmetryIndex?: number;
      symmetryIndex?: number;
      cadencePerMin?: number;
      category?: string;
      score?: number;
    } | null;
    armSwing?: {
      asymmetryPercent?: number;
      leftAmplitudeDeg?: number;
      rightAmplitudeDeg?: number;
      category?: string;
      score?: number;
    } | null;
    rom?: { romDeg?: number; maxAngleDeg?: number; minAngleDeg?: number; category?: string; score?: number } | null;
    posturalStability?: {
      swayAreaCm2?: number;
      swayAreaNorm?: number;
      swayLengthNorm?: number;
      category?: string;
      score?: number;
    } | null;
  };
}

export interface PatientDetail {
  id: number;
  name: string;
  email: string;
  gender?: string;
  age?: number;
  dateOfBirth?: string | null;
  country?: string;
  countryName?: string;
  region?: string;
  state?: string;
  city?: string;
  isAnonymous?: boolean;
  isLinked?: boolean;
  sessions: Session[];
  trend: Array<{ date: string; score: number; risk: string }>;
}

export interface ChatApiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface QuestionnaireQuestion {
  id: string;
  category: string;
  question: string;
  help?: string;
  type: 'choice' | 'multi' | 'text';
  options?: Array<{ value: string; label: string }>;
}

export interface QuestionnaireResult {
  score: number;
  category: 'LOW' | 'MEDIUM' | 'HIGH';
  flaggedSymptoms: Array<{ id: string; question: string; answer: string }>;
  freeText: string;
  answeredCount: number;
}

export interface AiAnalysis {
  available: boolean;
  error?: string;
  model?: string;
  usedFallback?: boolean;
  ringkasan?: string;
  korelasiGejala?: Array<{ gejala: string; temuanPengukuran: string; konsisten: boolean }>;
  tingkatKeyakinan?: 'RENDAH' | 'SEDANG' | 'TINGGI';
  alasanKeyakinan?: string;
  saranTindakLanjut?: string[];
  perluPerhatianSegera?: boolean;
}

export interface ScreeningResult {
  sessionId: number;
  questionnaireResult?: QuestionnaireResult | null;
  aiAnalysis?: AiAnalysis | null;
  composite: {
    compositeScore: number;
    riskCategory: string;
    riskLabel: string;
    mlClassification?: {
      predictedCondition: string;
      predictedLabel: string;
      confidence: number;
      conditionDescription: string;
      voteDistribution: Record<string, { label: string; votes: number; percent: number }>;
    };
    breakdown: Record<string, { score: number; category: string; interpretation: string }>;
    recommendations: string[];
  };
  testResults: Record<string, unknown>;
  summary: string;
}
