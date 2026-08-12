const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(method: string, path: string, body?: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
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

  getSession: (sessionId: number) =>
    request('GET', `/api/tests/session/${sessionId}`),

  // Patients
  getPatients: (params?: { search?: string; risk?: string; page?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request('GET', `/api/patients?${q}`);
  },

  getPatient: (id: number, token?: string) =>
    request<PatientDetail>('GET', `/api/patients/${id}`, undefined, token),

  getPatientSummary: (id: number) =>
    request('GET', `/api/patients/${id}/summary`),

  // Doctor
  getDoctorPatients: (doctorId: number, token?: string) =>
    request<{ patients: any[] }>('GET', `/api/doctor/patients?doctorId=${doctorId}`, undefined, token),

  getDoctorDashboard: (doctorId: number, token?: string) =>
    request('GET', `/api/doctor/dashboard/${doctorId}`, undefined, token),

  saveNote: (sessionId: number, data: object, token?: string) =>
    request('PUT', `/api/doctor/sessions/${sessionId}/note`, data, token),

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
  rawBiomarkers?: {
    tremor?: { dominantFrequencyHz?: number } | null;
    fingerTapping?: { tapRatePerSecond?: number } | null;
    gait?: { symmetryPercent?: number; cadencePerMin?: number } | null;
    armSwing?: { asymmetryPercent?: number } | null;
    rom?: { romDeg?: number } | null;
    posturalStability?: { swayAreaCm2?: number } | null;
  };
}

export interface PatientDetail {
  id: number;
  name: string;
  email: string;
  gender?: string;
  age?: number;
  sessions: Session[];
  trend: Array<{ date: string; score: number; risk: string }>;
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
