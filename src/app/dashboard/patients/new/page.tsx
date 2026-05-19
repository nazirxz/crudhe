"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, createEphemeralAuthClient } from "@/lib/supabase";
import type { ProgramReflectionQuestion } from "@/types/database";

interface SessionSim {
  day: number;
  mood: number;
  affirmation_note: string;
  duration_minutes: number;
  reflections: Record<string, string>;
}

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<SessionSim[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [allQuestions, setAllQuestions] = useState<ProgramReflectionQuestion[]>([]);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  async function loadQuestions() {
    if (questionsLoaded) return;
    const { data } = await supabase.from("program_reflection_questions").select("*").order("day,sort_order");
    setAllQuestions(data || []);
    setQuestionsLoaded(true);
  }

  function toggleSession(day: number) {
    const exists = sessions.find(s => s.day === day);
    if (exists) {
      setSessions(sessions.filter(s => s.day !== day));
      if (expandedDay === day) setExpandedDay(null);
    } else {
      setSessions([...sessions, { day, mood: 3, affirmation_note: "", duration_minutes: 30, reflections: {} }].sort((a, b) => a.day - b.day));
      loadQuestions();
    }
  }

  function bulkSet(upTo: number) {
    const newSessions = Array.from({ length: upTo }, (_, i) => ({
      day: i + 1, mood: 3, affirmation_note: "", duration_minutes: 30, reflections: {},
    }));
    setSessions(newSessions);
    if (upTo > 0) loadQuestions();
  }

  function updateSession(day: number, field: string, value: unknown) {
    setSessions(sessions.map(s => s.day === day ? { ...s, [field]: value } : s));
  }

  function updateReflection(day: number, questionId: string, text: string) {
    setSessions(sessions.map(s => s.day === day ? { ...s, reflections: { ...s.reflections, [questionId]: text } } : s));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const name = form.get("name") as string;

    const ephemeral = createEphemeralAuthClient();
    const { data: signUpData, error: signUpError } = await ephemeral.auth.signUp({ email, password });

    if (signUpError || !signUpData.user) {
      setError(signUpError?.message || "Gagal membuat akun");
      setLoading(false);
      return;
    }

    const userId = signUpData.user.id;
    await supabase.from("profiles").upsert({ id: userId, role: "pasien", name });

    const { data: { session } } = await supabase.auth.getSession();
    const currentDay = sessions.length > 0 ? Math.max(...sessions.map(s => s.day)) + 1 : 1;

    const { error: patientError } = await supabase.from("patients").insert({
      id: userId,
      username_display: name,
      age: Number(form.get("age")),
      diagnosis: form.get("diagnosis") as string,
      chemo_cycle: form.get("chemo_cycle") as string,
      phone: form.get("phone") as string,
      start_date: form.get("start_date") as string,
      current_day: currentDay,
      nurse_id: session!.user.id,
      plain_password: password,
    });

    if (patientError) { setError(patientError.message); setLoading(false); return; }

    // Insert session records with details
    if (sessions.length > 0) {
      const { data: insertedRecords } = await supabase.from("session_records").insert(
        sessions.map(s => ({
          patient_id: userId, day: s.day, status: "selesai" as const, approval_status: "disetujui" as const,
          mood: s.mood, affirmation_note: s.affirmation_note, duration_minutes: s.duration_minutes,
          completed_at: new Date().toISOString(), approved_at: new Date().toISOString(),
        }))
      ).select();

      // Insert reflection answers
      if (insertedRecords) {
        const reflectionRows: { session_id: string; question_id: string; answer_text: string }[] = [];
        for (const rec of insertedRecords) {
          const sim = sessions.find(s => s.day === rec.day);
          if (sim) {
            for (const [qId, text] of Object.entries(sim.reflections)) {
              if (text) reflectionRows.push({ session_id: rec.id, question_id: qId, answer_text: text });
            }
          }
        }
        if (reflectionRows.length > 0) {
          await supabase.from("reflection_answers").insert(reflectionRows);
        }
      }
    }

    router.push(`/dashboard/patients/${userId}/edit`);
  }

  const completedDays = sessions.map(s => s.day);
  const moods = ["😢", "😟", "😐", "🙂", "😊"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/patients" className="text-sm text-gray-600 hover:text-teal-600 transition-colors">Pasien</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Tambah & Simulasi</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Pasien */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-lg font-bold text-gray-900">📋 Data Pasien Baru</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Nama Lengkap" name="name" required />
              <FormField label="Email (untuk login)" name="email" type="email" required />
              <FormField label="Password" name="password" type="password" required />
              <FormField label="Usia" name="age" type="number" required />
              <FormField label="Diagnosis" name="diagnosis" required />
              <FormField label="Siklus Kemoterapi" name="chemo_cycle" required />
              <FormField label="No. Telepon" name="phone" required />
              <FormField label="Tanggal Mulai" name="start_date" type="date" required />
            </div>
          </div>

          {/* Session Simulation */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">✅ Simulasi Sesi Harian</h2>
              <p className="text-sm text-gray-500">Centang sesi yang sudah dikerjakan, klik lagi untuk isi detail ({completedDays.length}/15)</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={() => bulkSet(0)} className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors">Reset Semua</button>
              <button type="button" onClick={() => bulkSet(5)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">Set s/d Hari 5</button>
              <button type="button" onClick={() => bulkSet(10)} className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">Set s/d Hari 10</button>
              <button type="button" onClick={() => bulkSet(15)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">Set Semua Selesai</button>
            </div>

            <div className="mb-4 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-300" style={{ width: `${(completedDays.length / 15) * 100}%` }} />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => {
                const done = completedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      if (!done) { toggleSession(day); setExpandedDay(day); }
                      else { setExpandedDay(expandedDay === day ? null : day); }
                    }}
                    className={`relative rounded-xl p-3 text-center transition-all border-2 ${done ? (expandedDay === day ? "border-teal-600 bg-teal-100 shadow-md" : "border-teal-500 bg-teal-50") : "border-gray-200 bg-white hover:border-gray-300"}`}
                  >
                    <span className={`text-lg font-bold ${done ? "text-teal-700" : "text-gray-400"}`}>{day}</span>
                    <p className="text-[10px] mt-0.5 text-gray-500">{done ? "✓ Selesai" : "Belum"}</p>
                    {done && <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] text-white">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Expanded Detail */}
            {expandedDay && (() => {
              const sim = sessions.find(s => s.day === expandedDay);
              if (!sim) return null;
              const dayQuestions = allQuestions.filter(q => q.day === expandedDay);

              return (
                <div className="rounded-xl border-2 border-teal-200 bg-teal-50/30 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">📝 Detail Hari {expandedDay}</h3>
                    <button type="button" onClick={() => toggleSession(expandedDay)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100">
                      🗑️ Hapus
                    </button>
                  </div>

                  {/* Mood */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mood Pasien</label>
                    <div className="flex gap-2">
                      {moods.map((emoji, i) => (
                        <button key={i} type="button" onClick={() => updateSession(expandedDay, "mood", i)}
                          className={`rounded-xl border-2 px-3 py-2 text-xl transition-all ${sim.mood === i ? "border-teal-500 bg-teal-50 scale-110 shadow-sm" : "border-gray-200 hover:border-gray-300"}`}>
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Affirmation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Afirmasi</label>
                    <textarea rows={2} value={sim.affirmation_note}
                      onChange={(e) => updateSession(expandedDay, "affirmation_note", e.target.value)}
                      placeholder="Tuliskan afirmasi atau catatan pasien..."
                      className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all" />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (menit)</label>
                    <input type="number" value={sim.duration_minutes}
                      onChange={(e) => updateSession(expandedDay, "duration_minutes", Number(e.target.value))}
                      className="block w-32 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all" />
                  </div>

                  {/* Reflections */}
                  {dayQuestions.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jawaban Refleksi</label>
                      <div className="space-y-3">
                        {dayQuestions.map((q) => (
                          <div key={q.id}>
                            <p className="text-xs font-medium text-gray-600 mb-1">{q.label}</p>
                            <textarea rows={2} value={sim.reflections[q.question_id] || ""}
                              onChange={(e) => updateReflection(expandedDay, q.question_id, e.target.value)}
                              placeholder={q.placeholder}
                              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Submit */}
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {error}</div>}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 shadow-md shadow-teal-200 transition-all">
              {loading ? "⏳ Menyimpan..." : "💾 Simpan Pasien & Simulasi"}
            </button>
            <Link href="/dashboard/patients" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Batal</Link>
          </div>
        </form>
      </main>
    </div>
  );
}

function FormField({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input id={name} name={name} type={type} required={required} className="block w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100 transition-all" />
    </div>
  );
}
