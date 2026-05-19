"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { SessionRecord, ProgramSession, ProgramReflectionQuestion } from "@/types/database";

export default function MySessionsPage() {
  const [patient, setPatient] = useState<{ id: string; current_day: number } | null>(null);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [activeSession, setActiveSession] = useState<ProgramSession | null>(null);
  const [questions, setQuestions] = useState<ProgramReflectionQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: p } = await supabase.from("patients").select("id, current_day").eq("profile_id", session.user.id).single();
      if (!p) return;
      setPatient(p);

      const { data: recs } = await supabase.from("session_records").select("*").eq("patient_id", p.id).order("day");
      setRecords(recs || []);

      // Load program session for current day
      const { data: ps } = await supabase.from("program_sessions").select("*").eq("day", p.current_day).single();
      setActiveSession(ps);

      const { data: qs } = await supabase.from("program_reflection_questions").select("*").eq("day", p.current_day).order("order");
      setQuestions(qs || []);
    }
    load();
  }, []);

  async function handleComplete() {
    if (!patient || !activeSession) return;
    setSaving(true);

    // Insert session record
    const { data: record } = await supabase.from("session_records").insert({
      patient_id: patient.id,
      day: patient.current_day,
      status: "selesai",
      approval_status: "menunggu",
      mood,
      modules_completed: ["edukasi", "musik", "afirmasi", "refleksi"],
    }).select().single();

    // Insert reflection answers
    if (record && questions.length > 0) {
      const answerRows = questions.map((q) => ({
        session_record_id: record.id,
        question_id: q.id,
        answer: answers[q.id] || "",
      }));
      await supabase.from("reflection_answers").insert(answerRows);
    }

    // Update current_day
    await supabase.from("patients").update({ current_day: patient.current_day + 1 }).eq("id", patient.id);

    // Reload
    setPatient({ ...patient, current_day: patient.current_day + 1 });
    setRecords([...records, record!]);
    setSaving(false);
    setMood("");
    setAnswers({});
  }

  if (!patient) return <Shell><p className="text-gray-500">Memuat...</p></Shell>;

  const todayDone = records.some((r) => r.day === patient.current_day);

  return (
    <Shell>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Sesi Harian Saya</h1>

      {/* Progress */}
      <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">Progress: Hari <strong>{Math.min(patient.current_day, 15)}</strong> / 15</p>
        <div className="mt-2 h-2 rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: `${(Math.min(patient.current_day - 1, 15) / 15) * 100}%` }} />
        </div>
      </div>

      {patient.current_day > 15 ? (
        <p className="rounded-xl border bg-green-50 p-6 text-center font-semibold text-green-700">🎉 Selamat! Anda telah menyelesaikan semua 15 sesi.</p>
      ) : todayDone ? (
        <p className="rounded-xl border bg-blue-50 p-6 text-center text-blue-700">Sesi hari ini sudah selesai. Menunggu persetujuan perawat.</p>
      ) : activeSession ? (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <span className="inline-block rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-700">Hari {activeSession.day}</span>
            <h2 className="mt-2 text-xl font-bold text-gray-900">{activeSession.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{activeSession.education_content}</p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">Afirmasi</h3>
            <p className="mt-1 text-sm italic text-gray-700">{activeSession.affirmation}</p>
          </div>

          {activeSession.music_url && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900">Musik Relaksasi</h3>
              <a href={activeSession.music_url} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-teal-600 underline">Dengarkan →</a>
            </div>
          )}

          {/* Mood */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-2 font-semibold text-gray-900">Bagaimana perasaan Anda hari ini?</h3>
            <div className="flex gap-2">
              {["😊", "😐", "😢", "😤", "😴"].map((m) => (
                <button key={m} onClick={() => setMood(m)} className={`rounded-lg border px-3 py-2 text-xl ${mood === m ? "border-teal-500 bg-teal-50" : "border-gray-200"}`}>{m}</button>
              ))}
            </div>
          </div>

          {/* Refleksi */}
          {questions.length > 0 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-1 font-semibold text-gray-900">Refleksi</h3>
              <p className="mb-4 text-sm text-gray-500">{activeSession.reflection_intro}</p>
              <div className="space-y-3">
                {questions.map((q) => (
                  <div key={q.id}>
                    <label className="block text-sm font-medium text-gray-700">{q.question}</label>
                    <textarea
                      rows={2}
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleComplete}
            disabled={saving || !mood}
            className="w-full rounded-lg bg-teal-600 px-5 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Menyimpan..." : "Selesaikan Sesi Hari Ini"}
          </button>
        </div>
      ) : (
        <p className="text-gray-500">Konten sesi belum tersedia untuk hari ini.</p>
      )}

      {/* Riwayat */}
      {records.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Riwayat Sesi</h2>
          <div className="space-y-2">
            {records.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
                <span className="text-sm font-medium text-gray-700">Hari {r.day}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.approval_status === "disetujui" ? "bg-green-100 text-green-700" : r.approval_status === "ditolak" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {r.approval_status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <a href="/dashboard" className="text-xl font-bold text-teal-700">SNEfi Care</a>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600">Sesi Harian</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-6">{children}</main>
    </div>
  );
}
