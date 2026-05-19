export type Role = "pasien" | "perawat";
export type SessionStatus = "belum" | "berlangsung" | "selesai";
export type ApprovalStatus = "menunggu" | "disetujui" | "ditolak";
export type QuestionnairePhase = "pre" | "post";
export type RelaxationCategory =
  | "ombak"
  | "hujan"
  | "hutan"
  | "sungai"
  | "air-terjun"
  | "burung"
  | "angin"
  | "musik"
  | "campuran";

export interface Profile {
  id: string;
  role: Role;
  name: string;
}

export interface Nurse {
  id: string;
  profile_id: string;
  nip: string;
  department: string;
}

export interface Patient {
  id: string;
  profile_id: string;
  username_display: string;
  age: number;
  diagnosis: string;
  chemo_cycle: number;
  phone: string;
  start_date: string;
  current_day: number;
  nurse_id: string;
}

export interface SessionRecord {
  id: string;
  patient_id: string;
  day: number;
  status: SessionStatus;
  approval_status: ApprovalStatus;
  mood: string | null;
  modules_completed: string[] | null;
  created_at: string;
}

export interface ReflectionAnswer {
  id: string;
  session_record_id: string;
  question_id: string;
  answer: string;
}

export interface QuestionnaireSubmission {
  id: string;
  patient_id: string;
  phase: QuestionnairePhase;
  answers: Record<string, number>;
  total_score: number;
  submitted_at: string;
}

export interface ProgramSession {
  id: string;
  day: number;
  title: string;
  education_content: string;
  music_url: string;
  affirmation: string;
  reflection_intro: string;
}

export interface ProgramReflectionQuestion {
  id: string;
  day: number;
  question: string;
  order: number;
}

export interface QuestionnaireQuestion {
  id: string;
  number: number;
  question: string;
}

export interface RelaxationTrack {
  id: string;
  title: string;
  category: RelaxationCategory;
  youtube_url: string;
}
