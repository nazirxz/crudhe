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
  nip: string;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  username_display: string;
  age: number;
  diagnosis: string;
  chemo_cycle: string;
  phone: string;
  start_date: string;
  current_day: number;
  nurse_id: string;
  created_at: string;
  updated_at: string;
  plain_password?: string;
}

export interface SessionRecord {
  id: string;
  patient_id: string;
  day: number;
  status: SessionStatus;
  approval_status: ApprovalStatus;
  approval_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  completed_at: string | null;
  duration_minutes: number | null;
  mood: number | null;
  modules_completed: string[] | null;
  affirmation_note: string;
  affirmation_audio_path: string | null;
  created_at: string;
  updated_at: string;
  module_approvals: Record<string, unknown>;
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
  demo_respondent_note: string;
  demo_initials: string;
  demo_age: string;
  demo_sex: string;
  demo_education: string;
  demo_occupation: string;
  demo_religion: string;
  demo_ethnicity: string;
  scores: number[];
  submitted_at: string;
}

export interface ProgramSession {
  day: number;
  title: string;
  theme: string;
  color_from: string;
  color_to: string;
  edukasi_title: string;
  edukasi_content: string[];
  edukasi_key_points: string[];
  musik_title: string;
  musik_description: string;
  musik_duration: number;
  musik_type: string;
  afirmasi_title: string;
  afirmasi_main_text: string;
  afirmasi_support_text: string;
  afirmasi_instructions: string;
  afirmasi_positive_phrases: string[] | null;
  refleksi_title: string;
  created_at: string;
  updated_at: string;
}

export interface ProgramReflectionQuestion {
  id: string;
  day: number;
  question_id: string;
  label: string;
  placeholder: string;
  sort_order: number;
  created_at: string;
}

export interface QuestionnaireQuestion {
  id: string;
  item_no: number;
  prompt: string;
  is_active: boolean;
  created_at: string;
}

export interface RelaxationTrack {
  id: string;
  title: string;
  description: string;
  category: RelaxationCategory;
  duration_sec: number;
  license: string;
  source_ref: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  youtube_video_id: string;
}
